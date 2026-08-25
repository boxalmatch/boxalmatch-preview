# Member area — setup guide

Everything is built and works. What's left is connecting real logins.
Budget about half an hour.

---

## Read this first: why the hosting has to change

The member pages are protected by **Cloudflare Access**, which sits in front of
your site and checks who someone is before letting the page load.

There's a catch worth understanding. If the site stays on GitHub Pages, the
files also remain reachable at `boxalmatch.github.io/members/` — and Cloudflare
can't protect that address, only your own domain. Anyone who knows the github.io
URL walks straight past the login.

**The fix is to deploy through Cloudflare Pages instead of GitHub Pages.** You
keep the same GitHub repo and the same `git push` workflow — Cloudflare just
builds from it, and there's no public back door. It's free.

If you'd rather stay on GitHub Pages, that's fine too, but then treat the member
area as a soft gate: nothing genuinely private behind it.

---

## Step 1 — Move the domain to Cloudflare

1. Create a free account at [cloudflare.com](https://cloudflare.com) and choose
   **Add a site**, entering your domain.
2. Cloudflare gives you two nameservers, something like
   `xxx.ns.cloudflare.com`.
3. In Squarespace: **Domains → your domain → Nameservers** → switch to custom
   nameservers and enter Cloudflare's two.
4. Wait for Cloudflare to confirm the domain is active (usually well under an
   hour). From now on you manage DNS in Cloudflare, not Squarespace — and you
   still don't need any Squarespace subscription beyond the domain itself.

---

## Step 2 — Deploy with Cloudflare Pages

1. In Cloudflare: **Workers & Pages → Create → Pages → Connect to Git**.
2. Authorise GitHub and pick the `boxalmatch.github.io` repo.
3. Build settings — this is a plain static site, so:
   - Framework preset: **None**
   - Build command: *leave empty*
   - Output directory: `/`
4. Deploy. You'll get a `*.pages.dev` URL immediately.
5. **Custom domains → Set up a custom domain** → enter your domain. Cloudflare
   adds the DNS records itself.

Every `git push` now redeploys automatically.

---

## Step 3 — Protect the member area

1. In Cloudflare: **Zero Trust → Access → Applications → Add an application →
   Self-hosted**.
2. Configure:
   - Application name: `Boxalmatch — Area Membri`
   - Session duration: `1 month` (so members don't log in constantly)
   - Domain: your domain, path `members`
3. Add a policy:
   - Policy name: `Membri approvati`
   - Action: **Allow**
   - Include → **Emails** → paste the member email addresses
     *(or use **Emails ending in** `@yourdomain.it` if you ever issue your own)*
4. On the login-methods step, enable **One-time PIN**. Members enter their email,
   receive a code, and they're in — no passwords for you to manage or leak.

Visiting `/members/` now shows Cloudflare's login screen first.

---

## Step 4 — Add your members

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

## How the pages work

**`members/index.html`** — the profile page: membership card, member-only
content tiles, upcoming events, community links.

**`members/card.html`** — the card full-screen, sized to real bank-card
proportions, with a QR code. Members add it to their Home Screen and it opens
without browser chrome, like an app.

Identity comes from Cloudflare's `/cdn-cgi/access/get-identity` endpoint. Opened
locally, where that endpoint doesn't exist, the pages fall back to a clearly
labelled **demo member** so you can keep working on the design offline.

### The QR code

Generated in the browser — no external service, nothing to sign up for, and it
works offline. It encodes `yourdomain/members/card.html?n=MEMBERNUMBER`, so
scanning it opens the site. Verified against a real decoder, not just eyeballed.

---

## What still needs filling in

Search `data-todo` in `members/index.html`:

- Drive archive link
- Behind-the-scenes link
- Community documents link
- Discord invite

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
