# BOXALMATCH — website

Static site. No framework, no build step — plain HTML, CSS and JS.
Open `index.html` in a browser and it just works.

```
index.html            public page
members/index.html    member profile area
members/card.html     full-screen membership card
members/members.json  approved member registry
members/submit.html   member upload form
members/review.html   admin approval queue
functions/api/        Cloudflare Pages Functions (submissions API)
db/schema.sql         D1 table for submissions
css/style.css         site styling
css/members.css       member-area styling
js/main.js            language toggle, mobile nav, carousels, video player
js/members.js         member identity + card rendering
js/qr.js              QR code generator (self-contained)
img/events/           event artwork (optimised, ~150–280 KB each)
img/group.jpg         hero photo
img/icons/            wordmark + favicon
```

**Live at [boxalmatch.com](https://boxalmatch.com)**, served by Cloudflare Pages
from `main`. Every push deploys. GitHub Pages is no longer used — it served a
second copy of the site that Cloudflare Access could not protect.

**Member area:** see [MEMBERS-SETUP.md](MEMBERS-SETUP.md) for the login setup, and
[SUBMISSIONS-SETUP.md](SUBMISSIONS-SETUP.md) for member uploads and the review
queue. The `/api/*` Functions only exist on Cloudflare Pages; opened any other way,
the pages that use them say so rather than breaking.

**Email:** see [EMAIL-SETUP.md](EMAIL-SETUP.md) for `@boxalmatch.com` addresses —
free, receives instantly into Gmail, sends properly authenticated as the domain
(no "via gmail.com"), and migrates cleanly to Google Workspace later if needed.
Note that it recommends deploying via Cloudflare Pages rather than GitHub Pages —
otherwise the member pages stay reachable at the public `github.io` address and
the login can be bypassed.

---

## Design

The site is black, always — there is no light theme and it does not follow the
system preference. Layout and typography borrow from apple.com and Bending
Spoons: sticky translucent nav, large centred headlines, frosted tiles,
restrained motion.

### The green

The accent is the wordmark's own green, sampled from `img/icons/wordmark.png`.
The logo runs a subtle gradient from `#00AD17` to `#00B81C`; the flat fill is
what the site uses.

| token | value | where |
|---|---|---|
| `--accent` | `#00B81C` | links, buttons, eyebrows, the hero italic, active dots, focus rings |
| `--accent-hov` | `#00E623` | hover on the above |
| `--primary-color` | `#00B81C` | the same green in the event sub-pages (`*/css/main.css`) |

Hover goes **lighter, not darker**. A filled button carries dark ink, and
darkening the fill drops that ink below the 4.5:1 minimum.

The per-guild files (`noblepartyguildswar/css/main_*.css`) override
`--primary-color` with each guild's own colour and are deliberately left
alone — those are identity, not brand.

### Contrast

Everything on the page has been measured against WCAG AA with a checker that
walks the real composited background stack, across all pages in both
languages. If you change a colour, keep to it:

- text 4.5:1 against what is actually behind it (3:1 for large display text)
- 3:1 for the edge of anything clickable or typable — that is what
  `--hair-strong` is for; the decorative `--hair` is too faint to delineate a
  control
- gradients can't be sampled from computed style, so the channel tiles and
  the member card were checked by eye and carry their own scrim

---

## Italian / English

Every bilingual string is written twice, side by side:

```html
<h2 lang="it">Eventi</h2>
<h2 lang="en">Events</h2>
```

CSS hides whichever doesn't match `<html data-lang="…">`. The IT/EN switch in
the header flips that attribute and remembers the choice. **To edit copy, edit
the text directly** — no JSON files, no build step. Italian is the default.

---

## The video carousel

Cards use a click-to-play facade: the event artwork is shown with a play button,
and the YouTube player is only loaded once someone clicks. This keeps the page
fast (no embeds loading upfront) while still playing in place.

To add a card, copy an existing `<article class="vcard">` and change:

- `data-yt` — for a playlist: `videoseries?list=PLAYLIST_ID`; for a single video
  just the video ID
- the `<img src>` thumbnail
- the title, year and description

---

## The Instagram carousel

The four cards in the Instagram rail are live embeds, wired to these posts:

| # | Post |
|---|------|
| 1 | https://www.instagram.com/p/DaSju9UgC-P/ |
| 2 | https://www.instagram.com/p/DSE85yDAMJT/ |
| 3 | https://www.instagram.com/p/DEMkfnUg_3a/ |
| 4 | https://www.instagram.com/p/Dacg1Jsjlls/ |

To swap one out, replace the two URLs in its card — `data-instgrm-permalink`
on the `<blockquote>` and the `href` on the `<a>` inside it, which are the
same link:

```html
<div class="igcard">
  <blockquote class="instagram-media" data-instgrm-permalink="POST_URL"
              data-instgrm-version="14">
    <a href="POST_URL" target="_blank" rel="noopener">
      <span lang="it">Guarda il post su Instagram</span><span lang="en">View this post on Instagram</span>
    </a>
  </blockquote>
</div>
```

Use the bare permalink. Instagram's share menu appends `?utm_source=…&stkn=…`
— the `stkn` is a share token tied to your account, so strip it rather than
publishing it.

Two things to know:

- **They only render on a real domain.** Opening the file locally shows the
  `<a>` fallback instead — a plain "View this post on Instagram" tile. That is
  also what visitors with a tracker blocker see, which is why the fallback is
  styled rather than left blank.
- **The embeds are Instagram's own light-themed cards**, served in an iframe
  from instagram.com, so they cannot be restyled to match the dark page. They
  will read as white cards on black. The card you see *is* the embed — the
  page draws no tile behind it, since a tile of its own only ever showed as a
  mismatched frame around the edges.
- Keep the four posts the same shape. A reel embed is much taller than a
  photo one, and the row goes ragged.

`<script async src="https://www.instagram.com/embed.js"></script>` at the foot
of `index.html` is what renders them; it needs to stay.

---

## Partners

The section between Channels and Contact. **One partner is just a centred
card**; from two upwards `initPartners()` in `js/main.js` turns the row into a
rail and adds the same arrows and dots the other carousels use. Nothing to
switch on — add the markup and it happens.

```html
<div class="partner">
  <img src="img/partners/NAME.png" alt="NAME — what they do" loading="lazy" decoding="async"
       onerror="this.closest('.partner').classList.add('no-logo')">
  <span class="partner-name">NAME</span>
  <span class="partner-kind">what they do</span>
</div>
```

To make a card link out, swap the `<div>` for
`<a class="partner" href="..." target="_blank" rel="noopener">` — PANDA is one,
pointing at its Google Maps listing.
A linked card keeps the site's ink rather than the accent link colour, drops the
underline, and lifts its logo slightly on hover so it reads as clickable.

Logos live in `img/partners/`. Upload one as it comes — black artwork on a
white canvas is fine — then convert it:

```
python3 tools/partner_logo.py img/partners/NAME.jpg
```

That writes a `.png` beside it with the mark white, the canvas transparent and
the margin trimmed. Point the card at that `.png` and give it `plain-logo`,
which skips the CSS inversion. Doing this in the file rather than in CSS is
deliberate: inverting in CSS leaves a black rectangle on the card, and screen
blending does not drop it out, because `.partner` has a `backdrop-filter` and
that isolates the blend.

If a card has no logo file, `onerror` falls it back to the partner's name as
text, so nothing ever renders as a broken image. When a logo does load, that
name is hidden — it would only repeat what the logo already says, and the
`alt` carries the same words.

---

## The contact form

The box at the foot of the home page takes a name, an email and a message,
addressed to **info@boxalmatch.com** (see [EMAIL-SETUP.md](EMAIL-SETUP.md) for
how that address itself works). It has two modes.

**As shipped**, with `data-endpoint` empty, it hands the finished message to
the visitor's own mail client — pre-addressed, with a subject and the body
already filled in. No setup, no third party, works offline of any service,
but the visitor still has to press send in their mail app, and it does
nothing for someone on a machine with no mail client configured. That is why
the address is also printed as a link under the button and in the footer.

**With a form service wired up**, the message is posted in the background and
the visitor never leaves the page. **This is the live mode** — the form points
at Formspree (`https://formspree.io/f/xdeoydlz`), so the mail-client path is
only a fallback for when that post fails.

### Wiring up Formspree

Already done. The form's endpoint and its recipient are two separate settings
— the endpoint lives in `index.html` (below), the recipient lives in
Formspree's own dashboard for that form and **cannot be changed by editing
this repo**. If mail from the form ever needs to move to a different address
again, it's Formspree's site you go to, not this file.

**To change who the form's mail goes to** (already done, pointing at
info@boxalmatch.com):

1. <https://formspree.io> → the `xdeoydlz` form → **Settings** (or
   "Recipients," depending on Formspree's current layout).
2. Add or change the recipient email. Formspree emails a confirmation link to
   the new address before it takes effect — since info@boxalmatch.com forwards
   into Gmail, that confirmation just shows up there like any other mail.
3. Send a test message from the live site's contact form and confirm it
   arrives at the new address.

**If the form itself ever has to be recreated from scratch** (a new
Formspree account, a deleted form):

1. Go to <https://formspree.io>, sign up, confirm the account email.
2. Create a form (New project → New form) and set its recipient to
   info@boxalmatch.com.
3. Copy the form's endpoint — looks like `https://formspree.io/f/abcdwxyz`.
4. In `index.html`, put it on the form:

   ```html
   <form class="jform" data-endpoint="https://formspree.io/f/abcdwxyz" method="POST" novalidate>
   ```

5. Commit, push, wait for Pages to redeploy, then send a test message from
   the live site.
6. **The first submission from a new domain has to be confirmed.** Formspree
   emails you a "confirm this form" link the first time; until you click it,
   messages are held rather than delivered. Send one test, click the link,
   send a second to check it arrives clean.

Notes:

- The free plan allows 50 submissions a month. Past that, Formspree holds
  them until the next month or an upgrade.
- The hidden `_subject` field sets the subject line Formspree puts on the
  email. Edit it in `index.html` to change what you see in the inbox.
- The visitor's address goes through as the `email` field, so replying to the
  notification replies to them.
- If a submission fails, the form says so and falls back to showing the
  address — it does not silently swallow the message.

To change the destination address for both modes, edit `EMAIL` in
`js/main.js`.

---

## Event sub-pages

`thegreatlan/`, `noblepartygranparadiso/`, `noblepartyguildswar/` and
`boxstone/` are the original event sites, restyled to match. Their
`css/main.css` and `js/main.js` are kept identical across the three restyled
folders — **edit `thegreatlan/` and copy the file to the other two**, or they
drift.

The header, the section bar and the language toggle are the home page's:
sticky glass from the top, brand left, links centred, IT/EN pill right.

### On a phone

The sub-pages use the home page's mobile header, and switch to it at the same
820px. The bar is a 48px opaque strip — logo left, IT/EN pill and burger right
— and the menu drops a glass panel from under it with left-aligned,
hairline-separated links. It is opaque rather than glass on purpose: a
`backdrop-filter` on the bar would make it a backdrop root, and the panel
nested inside would have nothing left of the page to blur.

The markup keeps the IT/EN toggle inside `nav > ul`, where it belongs on
desktop, so `setupMobileNavBar()` in `js/main.js` moves the node into the bar
below 820px and back above it. CSS cannot: the open menu is a fixed-position
panel, and the pill would be trapped inside it.

Tables size themselves against the column: one that fits wraps its text
inside it, one that cannot — the 16- and 30-column score matrices — keeps its
natural width and scrolls inside `.table-scroll`, which bleeds to the screen
edge so it has the room and so the run-off is visible. The legacy inline
widths (`45%`, `80%`) are dropped below 820px; they used to be honoured
literally, which is why tables looked shrunk. Do not reach for
`overflow-wrap: anywhere` to make a table fit — it lowers every column's
min-content width, so the table collapses to its narrowest layout and words
snap mid-syllable. `initTableScroll()` handles the one case that needs it,
adding zero-width breaks after the commas in the run-together player lists.

Photo rails bleed `--rail-bleed` past the text column on both sides so the
next card peeks in at the edge. That bleed can never be wider than the gutter
between the column and the window or the whole page scrolls sideways, so it is
capped against the real gutter above 820px and set flush with the screen edge
below it.

### Photos

Every photo opens full size in a lightbox on the page — click, or tab to it
and press Enter. Escape, the close button, or a click on the backdrop closes
it. The lightbox is built at runtime by `initLightbox()` in `js/main.js`, so
photos added to a rail get it for free; nothing needs adding to the markup.

The images are **web copies, not the originals.** The event folders shipped
camera files — 7008x4672 JPEGs at 12 MB, 4K screen-grabs saved as PNG at
11 MB — about 1 GB in all, displayed in rails roughly 780px wide.
`tools/optimise_images.py` caps everything at 1920px on the long edge and
moves photographic PNGs to JPEG (1065 MB to 85 MB). The originals are in git
history if they are ever needed again.

If you add a photo, run the script from the repository root:

```
python3 tools/optimise_images.py     # resize + re-encode, records any renames
python3 tools/rewrite_refs.py        # point the pages at renamed files
```

New `<img>` tags want `loading="lazy" decoding="async"` — everything below
the first screen already has it.


---

## Deploying

### GitHub Pages

Push these files to the root of `boxalmatch/boxalmatch.github.io`. Pages serves
the `main` branch automatically — the site is live within a minute or so.

### Your Squarespace domain

1. Add a file named `CNAME` in the repo root containing only your domain:
   ```
   boxalmatch.it
   ```
2. In Squarespace → **Domains → DNS Settings**, add:

   | Type | Host | Value |
   |---|---|---|
   | A | @ | 185.199.108.153 |
   | A | @ | 185.199.109.153 |
   | A | @ | 185.199.110.153 |
   | A | @ | 185.199.111.153 |
   | CNAME | www | boxalmatch.github.io |

3. In the repo: **Settings → Pages**, set the custom domain and tick
   **Enforce HTTPS** once DNS has propagated (usually under an hour, but it can
   take up to 24).

Squarespace can keep managing the domain's DNS without hosting the site — you
don't need to move or cancel anything there.

Check GitHub's current IPs in their docs ("Managing a custom domain for your
GitHub Pages site") before relying on the table above, in case they change.
