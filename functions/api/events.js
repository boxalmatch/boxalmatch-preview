/* ============================================================
   GET /api/events — upcoming events, from Luma
   ------------------------------------------------------------
   Reads the calendar's iCal feed and hands back normalised JSON,
   so an event created in Luma shows up here without anyone
   editing this repository.

   The feed URL is configuration (LUMA_ICS_URL), never a literal in
   this file. Luma owns the shape of that URL and can change it;
   copying it out of their UI into an environment variable means
   this code does not care what it looks like, and the same route
   works for any other calendar that can emit iCal.

   iCal rather than Luma's REST API on purpose: the API needs a key
   that comes with a paid plan, while every calendar can emit a
   feed. If a key ever exists, the API path belongs here beside the
   feed rather than in place of it — the feed is what works for
   free and should stay the fallback.
   ============================================================ */
import { ApiError } from "./_access.js";
import { json } from "./_middleware.js";

const MAX_EVENTS = 12;
const CACHE_SECONDS = 300;

/* ---------- iCal ---------- */

/* Long values are folded across lines with a leading space or tab, and a
   property split mid-word is meaningless until they are joined back up. */
function unfold(text) {
    return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/\n[ \t]/g, "");
}

/* TEXT values escape these four; a title with a comma in it arrives as
   "Torneo\, finale" and has to come back out as typed. */
function unescapeText(v) {
    return v.replace(/\\n/gi, "\n").replace(/\\,/g, ",")
            .replace(/\\;/g, ";").replace(/\\\\/g, "\\");
}

/* DTSTART comes in three shapes and they do not mean the same thing:
     20260315T180000Z          an exact instant, UTC
     ;TZID=Europe/Rome:...     a wall clock in a named zone
     ;VALUE=DATE:20260315      a whole day, no time at all
   Only the first is unambiguous without a timezone database. For the
   second the wall clock *is* what a reader wants to see, so it is passed
   through without an offset and rendered as local — right for a calendar
   whose audience shares its timezone, and the reason allDay is reported
   separately rather than faked as midnight. */
function parseDate(value, params) {
    const v = (value || "").trim();
    const m = v.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/);
    if (!m) return null;

    const [, y, mo, d, hh, mm, ss, z] = m;
    if (!hh) return { iso: `${y}-${mo}-${d}`, allDay: true };

    const stamp = `${y}-${mo}-${d}T${hh}:${mm}:${ss}`;
    if (z) return { iso: new Date(stamp + "Z").toISOString(), allDay: false };
    return { iso: stamp, allDay: false, tz: (params.TZID || null) };
}

function parseICS(text) {
    const out = [];
    let cur = null;

    for (const line of unfold(text).split("\n")) {
        if (line === "BEGIN:VEVENT") { cur = {}; continue; }
        if (line === "END:VEVENT") { if (cur) out.push(cur); cur = null; continue; }
        if (!cur) continue;

        const colon = line.indexOf(":");
        if (colon === -1) continue;

        const rawName = line.slice(0, colon);
        const value = line.slice(colon + 1);
        const parts = rawName.split(";");
        const name = parts[0].toUpperCase();

        const params = {};
        for (let i = 1; i < parts.length; i++) {
            const eq = parts[i].indexOf("=");
            if (eq !== -1) params[parts[i].slice(0, eq).toUpperCase()] = parts[i].slice(eq + 1);
        }

        if (name === "DTSTART") cur.start = parseDate(value, params);
        else if (name === "DTEND") cur.end = parseDate(value, params);
        else if (name === "SUMMARY") cur.title = unescapeText(value);
        else if (name === "DESCRIPTION") cur.description = unescapeText(value);
        else if (name === "LOCATION") cur.location = unescapeText(value);
        else if (name === "URL") cur.url = value.trim();
        else if (name === "UID") cur.uid = value.trim();
        else if (name === "STATUS") cur.status = value.trim().toUpperCase();
    }
    return out;
}

/* ---------- shaping ---------- */

/* These feeds carry no URL property. The event's public page appears only
   inside DESCRIPTION, so that is where it has to be read from. */
const EVENT_LINK = /https?:\/\/(?:[\w-]+\.)*(?:lu\.ma|luma\.com)\/[^\s<>"']+/i;

/* DESCRIPTION opens with a sentence addressed to whoever owns the feed —
   "You are hosting this event. View the public page at ..." — which is
   true of them and of nobody reading the site. It is not a description,
   it is the calendar talking to its owner, and it has to go. */
const OWNER_LINE = /^(you are (hosting|registered|going|invited)|view the (public|event) page|manage your registration|rsvp)\b/i;

/* A postal address is not a place. Drop the CAP, and drop the country when
   it is the one everyone reading is standing in — anywhere else keeps its
   country, which is exactly when it is worth saying. */
function tidyLocation(loc) {
    if (!loc) return null;
    const parts = String(loc).split(",").map(s => s.trim()).filter(Boolean);
    if (parts.length > 1 && /^(italy|italia)$/i.test(parts[parts.length - 1])) parts.pop();
    if (parts.length) parts[0] = parts[0].replace(/^\d{5}\s+/, "");
    return parts.join(", ") || null;
}

function toEvent(e) {
    const desc = e.description || "";
    const link = desc.match(EVENT_LINK);

    /* What the organiser actually wrote: whatever survives once the owner's
       sentence and any bare link are out of the way. One paragraph is all a
       listing row can show. */
    const body = desc.split("\n").map(s => s.trim()).filter(Boolean)
        .filter(l => !OWNER_LINE.test(l) && !/^https?:\/\/\S+$/i.test(l));

    return {
        uid: e.uid || null,
        title: e.title || "",
        summary: body[0] || null,
        location: tidyLocation(e.location),
        /* Trailing punctuation belongs to the sentence, not to the link. */
        url: e.url || (link ? link[0].replace(/[.,;:)\]]+$/, "") : null),
        start: e.start ? e.start.iso : null,
        end: e.end ? e.end.iso : null,
        allDay: !!(e.start && e.start.allDay)
    };
}

/* An event is upcoming until it has finished, not until it has started —
   otherwise a LAN party disappears from the page halfway through itself. */
function upcoming(events, now) {
    return events
        .filter(e => e.start && e.status !== "CANCELLED")
        .filter(e => {
            const ends = new Date(e.end ? e.end.iso : e.start.iso);
            if (isNaN(ends)) return false;
            if (e.start.allDay && !e.end) ends.setHours(23, 59, 59, 999);
            return ends >= now;
        })
        .sort((a, b) => new Date(a.start.iso) - new Date(b.start.iso))
        .slice(0, MAX_EVENTS)
        .map(toEvent);
}

export async function onRequestGet(context) {
    const { env } = context;

    const url = env.LUMA_ICS_URL;
    if (!url) {
        /* Not an error: the page keeps whatever it was showing and says
           nothing, exactly as it does before any of this is switched on. */
        return json({ configured: false, events: [] });
    }

    /* webcal:// is the same feed; browsers use the scheme to trigger a
       calendar app, and fetch() will not touch it. */
    const httpURL = String(url).replace(/^webcal:\/\//i, "https://");

    let res;
    try {
        res = await fetch(httpURL, {
            headers: { accept: "text/calendar, text/plain, */*" },
            cf: { cacheTtl: CACHE_SECONDS, cacheEverything: true }
        });
    } catch (e) {
        throw new ApiError(502, "Could not reach the events calendar.");
    }
    if (!res.ok) throw new ApiError(502, "The events calendar answered " + res.status + ".");

    const body = await res.text();
    if (body.indexOf("BEGIN:VCALENDAR") === -1) {
        /* A login page or an HTML error, served with 200. Saying so beats
           returning an empty list that looks like "no events planned". */
        throw new ApiError(502, "That URL did not return a calendar feed.");
    }

    return json({
        configured: true,
        events: upcoming(parseICS(body), new Date())
    });
}
