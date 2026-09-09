# BOXALMATCH — website

Static site. No framework, no build step — plain HTML, CSS and JS.
Open `index.html` in a browser and it just works.

```
index.html            public page
members/index.html    member profile area
members/card.html     full-screen membership card
members/members.json  approved member registry
css/style.css         site styling
css/members.css       member-area styling
js/main.js            language toggle, mobile nav, carousels, video player
js/members.js         member identity + card rendering
js/qr.js              QR code generator (self-contained)
img/events/           event artwork (optimised, ~150–280 KB each)
img/group.jpg         hero photo
img/icons/            wordmark + favicon
```

**Member area:** see [MEMBERS-SETUP.md](MEMBERS-SETUP.md) for the login setup.
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

## The contact form

The box at the foot of the home page takes a name, an email and a message,
addressed to **boxalmatch@gmail.com**. It has two modes.

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

Already done; these are the steps if the form ever has to be recreated. It
needs access to the boxalmatch@gmail.com inbox — a sign-up and an email
confirmation.

1. Go to <https://formspree.io> and create an account. Use
   **boxalmatch@gmail.com**, so the form's mail arrives where you already
   read it. Confirm the address from the email they send.
2. Create a form (New project → New form). Name it something recognisable —
   "Sito BOXALMATCH" — and set the recipient to boxalmatch@gmail.com.
3. Copy the form's endpoint. It looks like `https://formspree.io/f/abcdwxyz`.
4. In `index.html`, put it on the form:

   ```html
   <form class="jform" data-endpoint="https://formspree.io/f/abcdwxyz" method="POST" novalidate>
   ```

5. Commit, push, wait for Pages to redeploy, then send yourself a test
   message from the live site.
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

Four event cards link to deeper pages carried over from the old site:

- `boxstone/home.html`
- `noblepartyguildswar/home.html`
- `noblepartygranparadiso/home.html`
- `thegreatlan/home.html`

Those folders are **not** included here. Either copy them across from the old
repo, or remove those "Scopri / Explore" links until the pages are rebuilt.

⚠️ Worth knowing: the old repo is about **1.1 GB**, nearly all of it photos and
video committed straight into git — `noblepartyguildswar` and `thegreatlan`
alone are roughly 1 GB. Don't carry that over wholesale. Host large media on
YouTube or Google Drive and link to it; keep the repo to code and small images.
For reference, this entire site is around 2 MB.

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
