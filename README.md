# BOXALMATCH — website

Static site. No framework, no build step — plain HTML, CSS and JS.
Open `index.html` in a browser and it just works.

```
index.html            public page
storia.html           "La nostra storia" — the founding story and the fourteen
members/index.html    member profile area
members/card.html     full-screen membership card
members/members.json  approved member registry
members/submit.html   member upload form
members/review.html   admin approval queue
members/archive.html  shared R2 archive browser (library/ prefix)
functions/api/        Cloudflare Pages Functions (submissions API)
db/schema.sql         D1 table for submissions
css/style.css         site styling
css/members.css       member-area styling
js/main.js            language toggle, mobile nav, carousels, video player
js/members.js         member identity + card rendering
js/archive.js         the archive browser
js/events.js          upcoming events, from the Luma calendar
img/events/           event artwork (optimised, ~150–280 KB each)
img/group.webp         the fourteen, on storia.html
img/crew/             founder portraits (placeholders — see tools/crew_placeholder.py)
img/icons/            wordmark, mark (header icon + favicon), mark-source,
                      and their pale -light variants for the member card
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

The accent is the wordmark's own green, sampled from `img/icons/wordmark.webp`.
The logo runs a subtle gradient from `#00AD17` to `#00B81C`; the flat fill is
what the site uses.

The round mark beside the wordmark in the header, and in the browser tab, is
`img/icons/mark.png`, built from `img/icons/mark-source.png` by
`tools/mark_logo.py`. The source arrives as flat green on a black square, and
the tool does two things to it: cuts away the canvas (including the almond of
background between the two crescents, which is meant to show the page through)
and repaints every remaining pixel in `--accent`. That recolour is deliberate —
the export is #01EE0E, close enough to the wordmark's #00B81C that the two side
by side read as a mistake rather than a choice. Re-run the tool if the source
artwork changes; nothing else needs touching.

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

### The hero posters

The five cards under the headline are 4:5, and every piece of event key art is
16:9, so nine sixteenths of a card cannot come from the picture. `tools/portrait.py`
builds them, and the thing to know before changing it is that the two obvious
answers were both tried and both look wrong.

Padding the art into the frame — scale it to the card width, grow a blurred
copy of itself around it — leaves more than half the card as soft mush, worst
where the art is lightest. Cover-cropping a 4:5 window slices the title lockup
in half on the three Halo posters, because there the lockup and the Spartans
sit at opposite ends of the frame.

What ships instead composes each card from two crops of its own artwork: the
subject, cover-cropped full-bleed from a region of the source carrying no
type, and the title lockup, lifted from wherever it sits and re-placed across
a scrimmed top with a lighten blend, so the ground it was cut from disappears
instead of arriving as a rectangle. The regions are hand-set per poster in
`CFG` — they have to be, since "where is the type" is not something to guess.

If you can find portrait originals, use them: drop one in
`img/events/portrait-src/<name>.jpg` and the tool fits it directly and skips
all of the above. Several of the 16:9 files are themselves crops of taller
artwork, so the originals exist somewhere.

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

## La nostra storia

`storia.html` — the founding story, the group photograph and a grid of the
fourteen founders. Reached from the button under the values on the home page
and from the footer; it carries the home page's own nav, with every section
link pointing back at `index.html#...` rather than jumping in-page.

The portraits are placeholders. `tools/crew_placeholder.py` generates them —
a near-black tile with the member's initials sunk into it, quiet enough to
read as "photo not here yet" rather than as a design. **To put a real photo
in, drop it over `img/crew/<slug>.jpg`.** Any size and any shape works: the
tile cover-crops to 4:5. The tool will not overwrite it — it marks its own
output and skips anything it did not make — so re-running it after adding
real photographs is safe.

Adding or renaming a founder means editing both the `NAMES` list in the tool
and the tiles in `storia.html`; there are fourteen and they are unlikely to
change, so they are written out rather than generated.

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
`boxstone/` are the event sites, restyled to match. `boxstone/home.html` is a
placeholder — the event has no content yet, but the home page links to it in
two places, so it is a real page in the site's own clothes rather than a 404.
Their
`css/main.css` and `js/main.js` are kept identical across the three restyled
folders — **edit `thegreatlan/` and copy the file to the other two**, or they
drift.

The header, the section bar and the language toggle are the home page's:
sticky glass from the top, links left, IT/EN pill right.

### The hero, and where the wordmark went

There is no event logo in the header. It used to sit there at 28px under
`brightness(0) invert(1)`, which threw away the colour it was drawn with and
left a white smudge nobody could read. It is now the masthead on the hero
artwork instead, in its own colours and at a size worth looking at.

`tools/hero_logo.py` prepares it. The three logos were drawn on very
different canvases — The Great LAN's artwork fills 28% of its frame, Gran
Paradiso's 45%, Guilds War's 81% — so sizing them by CSS alone would have
rendered them at wildly different scales. The tool crops each to its own
alpha box and writes `<site>/img/icons/hero-logo.png` at a common width, after
which one CSS rule means the same apparent size on all three. Re-run it if a
logo is redrawn.

On the three `home.html` pages the wordmark *is* the `<h1>`, since a text
heading beside it would say the same thing twice. On the other twenty-one it
is a decorative mark above the page's own title.

The hero itself is a band — `clamp(300px, 52vh, 520px)` — not a screen. It ran
to `max-height: 100vh` before, which put the first line of content 909px down
on a laptop and a full screen down on a phone. It also ends by dissolving:
a gradient over the image darkens the top for the nav, holds a scrim behind
the caption, and takes the foot all the way to the page colour, so there is no
cut edge between artwork and page.

Two things worth knowing before editing it. The figure and the caption are
stacked in one grid cell rather than absolutely positioned, because the
caption's entrance animation ends on `transform: none` and would have wiped
out the translate that centring it any other way needs. And the phone had its
own hero — `height: 100vh`, the image blown to 250% width and dragged up by a
third — which had to be deleted from `responsive.css` at the same time, or the
phone kept the full-screen hero regardless of the base rule.

### The way back

Every sub-page carries the way back up in the header, as the first item in the
bar: an event's `home.html` goes to BOXALMATCH, everything else goes to the
event's own home. It used to be a `[Torna alla Home]` at the end of the hero
paragraph — easy to miss, and gone the moment you scrolled past the hero.

### Guild colours

Each of the nine `noblepartyguildswar/css/main_<guild>.css` files sets a
colour. It used to reach only inline links, so a page could be Ade purple or
Sciabola orange and you would never notice. It now also carries the hero
title, the section titles and a wash over the hero artwork.

Those files set the colour **three times on purpose**, and the names are not
interchangeable:

- `--primary-color` — the legacy accent, used by buttons, focus rings and
  links in the shared stylesheet.
- `--guild-color` — the same value, but its real job is to be *absent*. The
  shared stylesheet writes `var(--guild-color, var(--ink))`, so one rule can
  colour a guild's headings without turning every other event's headings
  green. Only the nine guild files define it.
- `--guild-rgb` — the same colour as bare `r, g, b` channels, because `rgba()`
  needs channels rather than a colour. Unset it resolves to `0, 0, 0`, which
  is transparent at the alphas the hero wash uses, so non-guild pages get the
  plain black ramp.

All nine colours already clear 4.5:1 on black, so none of them needed
lightening for text — worth re-checking if a new guild colour is ever added.

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

### Legacy table colours

The event HTML hard-codes its table fills inline — `background-color: #228B22`
on a winners' row, `#f2f2f2` for zebra striping, `#d3d3d3` on guild-name cells,
`#e6ccff` on a category of row, plus orange player chips and gold/silver/bronze
podium rows. They were picked for a white page, so on this theme they range
from ugly to unreadable, and `css/main.css` re-maps every one of them with
`!important` (inline styles beat stylesheet rules, so nothing else would).

The mapping keeps the hue rather than flattening it, and that is the point.
An earlier version sent all four light fills to transparent and lumped the
greens in with `table thead tr` — which meant a winners' row and a table header
came out the same grey, and the zebra striping vanished. Colour was the only
thing carrying that information, so it has to survive the theme change: each
fill now becomes a dark tint of its original hue, stepped so the original
ordering is still readable.

Green rows also get `font-weight: 600`, so "this row qualified" is not
conveyed by colour alone.

When adding a mapping, check the rendered result rather than the arithmetic.
These cells sit inside glass panels, so a translucent tint composites over its
ancestors, not over the page — sizing one against the page's black reads
several points high. The membership of every ramp here was set by measuring
the worst cell on all 25 legacy pages in the browser; it currently sits at
4.58:1.

### The scores tables

`noblepartyguildswar/scores.html` builds three tables in the browser from CSV
embedded in `js/tables_call.js`, and colours the cells by value. That script is
the event's own and is **not** to be rewritten to fit this theme — it is shared
with the upstream site.

What it needs from CSS is a set of class names, and the rebrand that replaced
`css/main.css` at the start of this repo dropped most of them. The symptom was
that the tables "stopped working" when the script was untouched and fine: it
was tagging 226 cells in the Accesso Awards matrix with names no rule matched,
and the Giocato Contro matrix was rendering 870 identical grey cells because
its heat-map rules named only `#giocatoTable`.

If a table goes flat again, check the class names before the script:

- `#new-guild-table` — `.value-green`, `.value-yellow`, the guild
  abbreviations `.ad .aq .b .c .p .s .vk .va`, one class per player name, and
  `.mercenario`.
- `#giocatoTable` and `#giocatoCONTROTable` — `.value-x`, `.value-0`,
  `.value-1-9`, `.value-5-10`, `.value-11plus`, `.value-21plus`,
  `.header-special`, `.header-normal`, `.vertical-text`. **Both** ids.

Two traps live in this corner of the stylesheet. The guild header rules carry
`!important` because `table thead th` pins every header's colour further up
the file — without it they apply and lose. And the script sets
`td.style.color = "black"` inline on the matrix cells; a `[style*="color"]`
rule overrides that back to `--ink`, which is the only reason the text is
readable, since black on those swatches is about 2.4:1. Leave that override
alone.

Colours here are not decorative: the guild abbreviations and the eight leader
names use the colour each guild already carries in `css/main_<guild>.css`.

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

## Link previews, sitemap and analytics

Three things that live in `tools/` and are regenerated rather than
hand-edited. All three are safe to re-run: each is idempotent, verified
byte-identical across repeated runs.

**`tools/og_cards.py` + `tools/seo_meta.py` — what a shared link looks like.**
Run the first to redraw the ten cards in `img/og/`, the second to write the
`og:`/`twitter:` tags, the canonical URL, and the titles and descriptions into
every public page. Run `seo_meta.py` after adding a page, or its links will
preview as a bare URL.

The cards are rendered in Chromium so they use the site's own Inter, which
ships in `tools/fonts/` — Google Fonts is fetched at build time by nothing, so
the cards build without a network. Event cards are the key art plus the
wordmark and no text: the art already carries the name, and every platform
renders `og:title` beside the picture anyway.

**`tools/sitemap.py` — `sitemap.xml` and `robots.txt`.**
Lists every public page, skipping the member area, the API, the 404 and
anything that declares `noindex`. `lastmod` comes from each file's last commit.
Re-run it after adding or removing a page.

**`js/analytics.js` — Cloudflare Web Analytics, off by default.**
Paste the token from *Cloudflare dashboard → Analytics & Logs → Web Analytics*
into `TOKEN` at the top of that file and it starts reporting on the next
deploy. Leave it empty and the file does nothing.

Cloudflare's beacon rather than a general-purpose analytics product on
purpose: no cookies, no identifiers, no cross-site tracking, so it needs no
consent banner — which matters while there is still no privacy policy. It also
sits out when the browser sends Do Not Track. The token is not a secret; it
ships in the page and only says which site a hit belongs to.

If the Cloudflare dashboard offers an automatic setup for this domain, prefer
it and delete `js/analytics.js` along with the `<script>` tag on each page —
that route needs no code at all. I could not check whether it is available for
this project from here.

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
