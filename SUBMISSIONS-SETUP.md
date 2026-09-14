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


## Where an upload actually goes

`functions/api/upload.js` streams the request body straight into the **R2
bucket** bound as `MEDIA` — never into the page, never through Drive — under
the key `objectKey(id, filename)`. The row describing it (title, author,
status, `object_key`) goes into **D1**. Approved media is read back out by
`functions/api/media/[[path]].js` with `env.MEDIA.get(key)`, behind the same
Cloudflare Access that guards the rest of `/members`.

So a submitted file is private by default and stays private until it is
approved, and even then it is only served to someone who got through Access.

## The shared archive

`members/archive.html` browses the same R2 bucket under one prefix, **`library/`**,
and every signed-in member can read all of it. Nothing else to switch on: it
uses the `MEDIA` binding that already exists.

### Why an upload does not appear anywhere public

Every row is inserted `'pending'` — the status is hard-coded in the INSERT —
and the archive lists approved material. **An upload is invisible to everyone
but its owner and the admins until someone approves it** in
`members/review.html`. That is the system working; it is also the single most
confusing thing about it, so the archive lists the caller's own pending and
rejected uploads with a status chip rather than showing them nothing.

If a file is in neither `members/submit.html` nor the review queue, the bytes
reached R2 but the second call did not land — the browser POSTs `/api/upload`
for the file and then `/api/submissions` for the title, and only the second
creates the row. The object is then an orphan under `pending/<id>/` with
nothing describing it. Look in the bucket under that prefix; `DELETE
/api/submissions/<id>` cleans one up.

**Member uploads do not appear in the `library/` tree, and never will.** An upload is
keyed `pending/<id>/<file>` when it arrives and approval does not move it —
approving only flips a column in D1 — so the key stays under `pending/` for
life. The archive page lists them from the database instead, in their own
"Invii dei membri" section under the folder tree, and only at the root. Every
member sees every approved upload, and their own still waiting for review,
carrying a chip that says so.

Rejected uploads are not listed there. A refusal is a decision, and a file
left sitting in the archive under a label reads as though it is still in play.
It stays on `members/submit.html`, where its owner can withdraw or replace it.

To put files in the `library/` tree, open the bucket in the Cloudflare dashboard
and upload into a `library/` folder — `library/2026 The Great LAN/foto/…` and so on. Folder names
can contain spaces and accents. R2 has no real folders; a key is a flat string
and the slashes are what the browser renders as a tree, so creating a folder
means uploading something into it.

Authorisation is a property of the key, not of a database row, which is what
lets files that never went through the upload form be readable without
inventing rows for them:

| prefix | who can read |
|---|---|
| `library/…` | every signed-in member |
| everything else | the owner and admins, plus anyone once it is approved |

`functions/api/library/[[path]].js` lists a folder and can only ever look under
`library/` — it prepends the prefix itself and refuses a path containing `..`,
so a crafted URL asking for `pending/secret` resolves to `library/pending/secret/`
and finds nothing. `functions/api/media/[[path]].js` applies the same split when
serving bytes. The two share the constant deliberately; if you move the archive,
move it in both.

The **Drive archive** tile on the member page is a different thing again: a link
to a folder someone keeps by hand. Nothing in the submission flow writes to it. Moving uploads there instead would mean giving
the Worker a Google service account — its private key as a Cloudflare secret,
the folder shared with the service account, a signed JWT exchanged for an
access token on each upload — and it would trade Access-gated delivery for
Drive's own sharing rules.


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

**Abandoned uploads.** The browser sends the file first and the title second,
so anything that fails in between leaves bytes in R2 with no row pointing at
them. When the second step fails the page cleans up after itself, and the
member can only ever clear their own. What it cannot cover is someone closing
the tab mid-upload — those objects stay. It is a slow drip rather than a leak,
but if you want it airtight, add an R2 **lifecycle rule** in the dashboard that
deletes objects under `pending/` older than, say, 30 days: an approved
submission keeps its row, so anything that old with no row is abandoned.
