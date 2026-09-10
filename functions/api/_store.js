/* Shared bits for the submission routes: the member registry, key
   naming, and the row shape the browser sees. */
import { ApiError } from "./_access.js";

export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;   /* Workers request-body ceiling */

export const ALLOWED_TYPES = [
    "image/jpeg", "image/png", "image/webp", "image/gif", "image/heic",
    "video/mp4", "video/quicktime", "video/webm",
    "application/pdf"
];

/* The registry that already drives the member card. Kept as the one
   list of who is a member so there are not two sources of truth.

   Read through env.ASSETS, not fetch(). A plain fetch() to our own
   origin leaves the Worker and comes back through Access, which has
   no token on a server-to-server call and answers with the login
   page — so this returned HTML and every upload 500'd. ASSETS reads
   the deployed file directly. */
export async function lookupMember(env, request, email) {
    if (!env.ASSETS) return null;

    const url = new URL("/members/members.json", request.url);
    const res = await env.ASSETS.fetch(new Request(url.toString(), { method: "GET" }));
    if (!res.ok) return null;

    let body;
    try {
        body = await res.json();
    } catch (e) {
        return null;
    }

    const list = (body && body.members) || [];
    return list.find(m => String(m.email).toLowerCase() === email) || null;
}

export function requireMember(member, email) {
    if (!member) {
        throw new ApiError(403, "You are signed in, but " + email + " is not on the member list yet.");
    }
    return member;
}

/* Object keys carry the status so the bucket stays browsable by a
   human, and a random id so two people uploading DSC_0001.jpg do not
   collide. The original name is kept only as the last segment. */
export function objectKey(id, filename) {
    return "pending/" + id + "/" + safeName(filename);
}

export function safeName(filename) {
    let raw = String(filename || "file");
    /* The browser percent-encodes the name so it survives as a header;
       decode first or "foto%20estate.jpg" keeps the escape in the key. */
    try { raw = decodeURIComponent(raw); } catch (e) { /* leave as sent */ }

    const cleaned = raw
        .split(/[\\/]/).pop()
        .replace(/[^A-Za-z0-9._-]/g, "_")
        .slice(-120);
    return cleaned || "file";
}

export function newId() {
    return crypto.randomUUID();
}

/* objectKey is included for everyone: it is only a path, and
   /api/media re-checks who is asking before serving any bytes. */
export function rowToJSON(row, viewerIsAdmin) {
    const out = {
        id: row.id,
        title: row.title,
        note: row.note,
        event: row.event,
        objectKey: row.object_key,
        filename: safeName(row.object_key),
        contentType: row.content_type,
        sizeBytes: row.size_bytes,
        status: row.status,
        createdAt: row.created_at,
        reviewNote: row.review_note,
        reviewedAt: row.reviewed_at
    };
    /* Who submitted what is moderation data, not member-visible data. */
    if (viewerIsAdmin) {
        out.memberEmail = row.member_email;
        out.memberName = row.member_name;
        out.reviewedBy = row.reviewed_by;
    }
    return out;
}
