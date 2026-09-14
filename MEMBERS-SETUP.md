# Member area — setup guide

**This is done.** boxalmatch.com is served by Cloudflare Pages, `/members/` is
behind Cloudflare Access, and members log in with an emailed code. The steps
below are kept as the record of how it was set up and what to change if any of
it needs redoing.

Live configuration:

| Thing | Value |
|---|---|
| Domain | `boxalmatch.com` (+ `www`), registered at Squarespace, DNS on Cloudflare |
| Hosting | Cloudflare Pages project `boxalmatch-preview`, deploying from `main` |
| Test address | `boxalmatch-preview.pages.dev` — still live, also behind Access |
| Access team | `boxalmatch.cloudflareaccess.com` |
| Access app | `BOXALMATCH - Area Membri`, destinations on both hosts, paths `members` and `api` |
| Login method | One-time PIN (emailed code) |
| Session | 1 month per browser; "Esci / Sign out" in the member nav ends it |
| GitHub Pages | unpublished — it was a copy of `/members/` with no login in front of it |

Everything below was done from a browser; no terminal needed.

---

## Read this first: why the hosting has to change

The member pages are protected by **Cloudflare Access**, which sits in front of
your site and checks who someone is before letting the page load.

There's a catch worth understanding. If the site stays on GitHub Pages, the
files also remain reachable at `boxalmatch.github.io/members/` — and Cloudflare
can't protect that address. Anyone who knows the github.io URL walks straight
past the login.

**The fix is to deploy through Cloudflare Pages instead of GitHub Pages.** You
keep the same GitHub repo and the same `git push` workflow — Cloudflare just
builds from it, and there's no public back door. It's free.

If you'd rather stay on GitHub Pages, that's fine too, but then treat the member
area as a soft gate: nothing genuinely private behind it.

---

## Step 1 — Deploy with Cloudflare Pages

No domain needed for this. You get a free `*.pages.dev` address to test on.

1. Create a free account at [cloudflare.com](https://cloudflare.com).
2. **Workers & Pages → Create → Pages → Connect to Git**.
3. Authorise GitHub and pick the `boxalmatch-preview` repo.
4. Build settings — this is a plain static site, so:
   - Framework preset: **None**
   - Build command: *leave empty*
   - Output directory: `/`
5. Deploy. You get a URL like `boxalmatch.pages.dev` within a minute.

Every `git push` now redeploys automatically, exactly like GitHub Pages did.

Open `boxalmatch.pages.dev` and check the site looks right before going on.

---

## Step 2 — Turn on the login

Protect the `pages.dev` address first. It costs nothing to try, and if the login
misbehaves you have not touched your real domain.

1. In Cloudflare: **Zero Trust → Access → Applications → Add an application →
   Self-hosted**.
2. Configure:
   - Application name: `Boxalmatch — Area Membri`
   - Session duration: `1 month` (so members don't log in constantly)
   - Domain: `boxalmatch.pages.dev`, path `members`
3. Add a second domain entry for path `api` as well — that is the submissions
   API, and leaving it open would mean the pages are locked while the endpoints
   that write to them are not. (See SUBMISSIONS-SETUP.md.)
4. Add a policy:
   - Policy name: `Membri approvati`
   - Action: **Allow**
   - Include → **Emails** → paste the member email addresses
5. On the login-methods step, enable **One-time PIN**. Members enter their
   email, receive a code, and they're in — no passwords for you to manage,
   store, reset or leak.

Visit `boxalmatch.pages.dev/members/` in a private window. You should get
Cloudflare's login screen, a code by email, and then the member area with your
name on the card.

**If the dashboard will not accept a `pages.dev` hostname**, skip to Step 4, move
the domain first, and then come back and use your own domain here instead. I was
not able to reach Cloudflare's documentation from this session to confirm which
of the two it is, so treat the `pages.dev` route as worth trying rather than
guaranteed.

---

## Step 3 — Add your members

Two lists have to agree:

| Where | What it controls |
|---|---|
| Cloudflare Access policy | **who can open the page at all** |
| `members/members.json` | **their name, number, role and join year** |

Edit `members/members.json`:

```json
{
  "members": [
    {
      "email": "someone@gmail.com",
      "name": "Nome Cognome",
      "number": "0003",
      "since": "2026",
      "role": "Member"
    }
  ]
}
```

The email must match what they log in with, exactly. Commit, push, done.

If someone gets past Access but isn't in `members.json`, they see a friendly
"you're not on the list yet" screen pointing them to Instagram — so a mismatch
fails gracefully rather than breaking.

---

## Step 4 — Move your domain (when you are ready)

Only once the login works on `pages.dev`. This is the step that changes DNS, so
do it with the rest already proven.

1. In Cloudflare: **Add a site**, entering your domain.
2. Cloudflare gives you two nameservers, something like `xxx.ns.cloudflare.com`.
3. In Squarespace: **Domains → your domain → Nameservers** → switch to custom
   nameservers and enter Cloudflare's two.
4. Wait for Cloudflare to confirm the domain is active (usually well under an
   hour). From now on you manage DNS in Cloudflare, not Squarespace — and you
   still don't need any Squarespace subscription beyond the domain itself.
5. In your Pages project: **Custom domains → Set up a custom domain** → enter
   your domain. Cloudflare adds the DNS records itself.
6. Back in **Zero Trust → Access → Applications**, edit the application from
   Step 2 and add your real domain alongside the `pages.dev` one (paths
   `members` and `api` again).

---

## Step 5 — Close the back door

Cloudflare is now serving the site, but GitHub Pages is still serving its own
copy at `boxalmatch.github.io` — including `/members/`, with no login in front
of it. Until you turn it off, the member area is not actually private.

**GitHub → the repo → Settings → Pages → Source → None.**

Do this only once your own domain is serving correctly from Cloudflare, so you
are never left with nothing live. Check `boxalmatch.github.io/members/` afterwards
and confirm it 404s.

---

## How the pages work

**`members/index.html`** — the profile page: membership card, member-only
content tiles, upcoming events, community links.

**`members/card.html`** — the card full-screen, sized to real bank-card
proportions. Members add it to their Home Screen and it opens without browser
chrome, like an app.

Identity comes from Cloudflare's `/cdn-cgi/access/get-identity` endpoint. Opened
locally, where that endpoint doesn't exist, the pages fall back to a clearly
labelled **demo member** so you can keep working on the design offline.

### What is on the card

The wordmark and the mark, both in a pale grey drawn for the dark slab by
`tools/card_art.py`; the member's tag, name, number and join year; and their
role. The mark sits bottom right, where a bank card puts its scheme logo.

A QR code used to occupy that corner, encoding a link back to the card. It was
generated in the browser by `js/qr.js` — no external service, worked offline —
but it pointed at a page you could only reach by already being signed in, so
it was decoration with a job title. Both it and the generator are gone; the
file is in git history if it is ever wanted back.

### The `nickname` field

Optional, and per member in `members/members.json`. The card shows it above
the name in the accent colour, and hides that line entirely when a member has
none — so adding tags for the rest of the roster is a data change, nothing
else.

---


## Events, from Luma

Events created in Luma appear on the member page on their own. One setting
switches it on.

1. In Luma, open the calendar → **Settings → Import / Subscribe** (wording
   moves around) and copy the calendar's **iCal / subscription URL**. It is
   the one that starts `webcal://` or ends `.ics`. Both work here — a
   `webcal://` URL is rewritten to `https://` before it is fetched, since
   that scheme exists to open a desktop calendar app and `fetch` will not
   touch it.
2. **Cloudflare Pages → your project → Settings → Environment variables**,
   add `LUMA_ICS_URL` with that value, for Production (and Preview if you
   use it).
3. Redeploy. `/api/events` starts answering and the page fills itself in.

The URL is a setting rather than a line of code on purpose: Luma owns that
URL's shape and can change it, and any other calendar that emits iCal works
here unchanged.

**Nothing is destructive about switching it on or off.** The events written
by hand in `members/index.html` stay in the markup and are what the page
shows whenever Luma has nothing to say — not configured, unreachable, or
simply nothing coming up. A section that empties itself because a feed
hiccuped is worse than one that is a little out of date, so the swap only
happens once real events are in hand.

What the page does with a feed:

- past events are dropped, and an event counts as upcoming until it **ends**,
  so an evening LAN does not vanish from the page halfway through itself
- `STATUS:CANCELLED` is dropped
- the soonest twelve are shown
- the Luma page becomes an **Iscriviti / Register** button; an event without
  a URL falls back to the plain "In arrivo" pill
- all-day events show no time, and a `TZID` wall clock is shown as written
  rather than converted, which is right for a calendar whose audience shares
  its timezone

If the page keeps showing the hand-written events after you set the variable,
call `/api/events` directly while signed in. `{"configured":false}` means the
variable did not reach the deployment; a 502 says what went wrong reaching
Luma, including the case where the URL returns an HTML login page with a 200.

---

## What still needs filling in

The Drive archive tile is linked. Note what that link is and is not: the member
page is behind Cloudflare Access, but a Google Drive folder is protected by
Drive's own sharing settings. Anyone who has the URL can open it if the folder
is set to "anyone with the link", whether or not they ever passed Access. If
the archive should stay members-only, set the folder to specific people and add
them in Drive — the tile being behind a login does not do it for you.

And the two placeholder events near the bottom of the same file.

---

## Later: real Apple/Google Wallet passes

The web card works everywhere today at zero cost. A native pass that lives in
the Wallet app is a bigger step:

- **Apple** requires a paid Apple Developer account (currently $99/year) —
  passes must be signed with a Pass Type ID certificate and there's no way
  around it.
- **Google Wallet** is free but needs an approved issuer account.
- Services like PassKit or Passcreator handle signing for both, for a fee.

Worth revisiting once the association is registered and there are dues-paying
members to issue numbers to. Until then the web card does the same job.
