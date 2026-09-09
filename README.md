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

Layout and typography take their cues from apple.com — sticky translucent nav,
large centred headlines, generous whitespace, rounded cards, restrained motion.
The accent colour is **your own brand green**, not Apple's blue, so the site
reads as Boxalmatch rather than an Apple clone. Two shades are used so text
stays legible on either background:

| | light | dark |
|---|---|---|
| accent | `#00871f` | `#2fd94f` |

The page follows the visitor's system light/dark preference automatically.

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
| 4 | https://www.instagram.com/reel/DbtJdszMyKD/ |

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
  will read as white cards on black.

`<script async src="https://www.instagram.com/embed.js"></script>` at the foot
of `index.html` is what renders them; it needs to stay.

---

## The sign-up form

Currently shows a "not connected yet" message and points people to Instagram.
To make it live, use a form service such as [Formspree](https://formspree.io) —
create a form, then in `index.html`:

```html
<form class="jform" data-ready="true" action="https://formspree.io/f/YOUR_ID" method="POST">
```

Setting `data-ready="true"` is what stops the placeholder message.

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
