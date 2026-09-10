# Member submissions — setup guide

Members upload photos and video; nothing appears publicly until an admin
approves it. The code is written and tested — this is the wiring.

**Do [MEMBERS-SETUP.md](MEMBERS-SETUP.md) first.** Submissions run on Cloudflare
Pages Functions and identify the uploader from the Cloudflare Access token, so
neither works until the site is deployed through Cloudflare Pages with Access
in front of it. On GitHub Pages `/api/*` simply does not exist, and both pages
show a quiet "not switched on yet" panel instead of breaking.

Budget about twenty minutes.

---

## What each piece does

| Piece | Role |
|---|---|
| Cloudflare Access | Says who the caller is. No passwords anywhere. |
| Pages Functions (`functions/api/*`) | The API. Verifies the Access token, writes to D1 and R2. |
| D1 (`DB`) | Submission metadata — title, who, when, pending/approved/rejected. |
| R2 (`MEDIA`) | The files themselves. Private; served through `/api/media/*`. |
| `members/submit.html` | The member's upload form and their own submission list. |
| `members/review.html` | The admin queue: preview, approve, reject. |

---

## Step 1 — Create the database

In the Cloudflare dashboard: **Storage & Databases → D1 → Create database**.

- Name: `boxalmatch`

Open it, go to the **Console** tab, and paste the three statements from
[`db/schema-console.sql`](db/schema-console.sql) — **one at a time**, pressing
Execute after each. That creates the `submissions` table and its two indexes.

Use that file, not `db/schema.sql`, even though they build the same thing. The
console's input is a single line, so pasting the commented version collapses it
onto one line and the first `--` comments out the entire rest of the script; the
console then reports "The request is malformed: Requests without any query are
not supported." `schema-console.sql` has no comments and one statement per line
for exactly that reason. `db/schema.sql` stays the readable, canonical copy for
the CLI.

*(With a terminal you could instead run `npx wrangler d1 create boxalmatch` and
`npx wrangler d1 execute boxalmatch --remote --file=db/schema.sql`. The
dashboard route above does the same thing and needs nothing installed.)*

---

## Step 2 — Create the bucket

**R2 → Create bucket**.

- Name: `boxalmatch-media`
- Location: whichever is nearest you

**Leave it private.** Do not connect a public domain to it, and do not enable
public access. Files are served through `/api/media/*`, which checks who is
asking — a public bucket would make every pending upload readable by anyone who
guessed the URL, reviewed or not.

---

## Step 3 — Bind them to the Pages project

In the Cloudflare dashboard: **Workers & Pages → your project → Settings →
Bindings**.

- D1 database binding — variable name `DB`, database `boxalmatch`
- R2 bucket binding — variable name `MEDIA`, bucket `boxalmatch-media`

The names must match exactly; the code looks for `env.DB` and `env.MEDIA`.

**There is deliberately no `wrangler.toml` in this repo.** If one exists, Pages
takes its configuration from the file and disables the dashboard's Bindings and
Environment variables UI — it reports "bindings for this project have been
managed through wrangler.toml" and there is nothing to click. Since this project
is configured from the dashboard, the file has to be absent. Add it back only if
you switch to deploying with the wrangler CLI, and then keep every binding and
variable in it, because the dashboard will no longer be an option.

---

## Step 4 — Environment variables

Same Settings page, **Environment variables**:

| Name | Value | Where to find it |
|---|---|---|
| `ACCESS_TEAM_DOMAIN` | `yourteam.cloudflareaccess.com` | Zero Trust → Settings → Custom Pages, or the URL you log in at |
| `ACCESS_AUD` | the Application Audience tag | Zero Trust → Access → Applications → your app → Overview |
| `ADMIN_EMAILS` | `you@example.com,someone@example.com` | whoever may approve submissions |

`ACCESS_AUD` matters more than it looks. It pins the token to *this* Access
application — without it, a token minted for any other application on your team
would be accepted here.

If `ACCESS_TEAM_DOMAIN` and `ACCESS_AUD` are missing, the API returns 503 rather
than letting anyone through. A misconfiguration fails closed, not open.

---

## Step 5 — Protect the API path too

Access protects paths. When you add the Access application, cover both:

- `boxalmatch.it/members/*`
- `boxalmatch.it/api/*`

Miss the second and the pages are locked while the API that writes to them is
open to the world.

---

## Step 6 — Try it

1. Visit `/members/submit.html`, upload a photo, give it a title.
2. Visit `/members/review.html` as an address in `ADMIN_EMAILS`.
3. Approve it. The member's own list flips to "Published", with your note.

---

## Working on it locally

This part does need a terminal, and is entirely optional — skip it if you work
in the browser.

```sh
cp .dev.vars.example .dev.vars     # gitignored, never deployed
npx wrangler pages dev .
```

With no `ACCESS_TEAM_DOMAIN` set, the API treats you as `DEV_EMAIL` so the pages
work offline. In production the real Access check takes precedence and
`DEV_EMAIL` is ignored — the ordering in `functions/api/_access.js` makes sure a
stray value cannot become a bypass.

Without a terminal, the equivalent is simply to push and let Cloudflare Pages
deploy: each push gets its own preview URL, so you can try a change before it
reaches the live address.

---

## Things worth knowing

**The 100 MB ceiling.** Uploads stream through a Function, and a Worker request
body tops out around 100 MB on the free plan. Fine for photos and short clips.
For longer video the upgrade is presigned R2 URLs so the browser uploads
straight to the bucket — a contained change to `functions/api/upload.js` and
`js/api.js`, worth doing only when someone actually hits the wall.

**Who is a member** still comes from `members/members.json`, the same file the
membership card uses, so there is one list rather than two. Moving it into D1
later is easy; keeping two copies in sync is not.

**Approved is not published.** Approval marks a row `approved`; it does not yet
place the file anywhere on the public site. Wiring approved submissions into a
gallery is the natural next step, and deliberately left open — where they should
appear is a design decision, not a plumbing one.

**Storage costs.** R2 charges for what you store; event video adds up faster
than photos. Worth a look at the bucket every few months.
