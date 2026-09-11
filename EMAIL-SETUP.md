# Email — @boxalmatch.com setup guide

Free, and mail still lives inside Gmail. Two pieces, because receiving and
sending are genuinely separate problems:

- **Receiving**: Cloudflare Email Routing forwards `boxalmatch@boxalmatch.com`
  straight into your existing Gmail inbox. Instant, no second inbox to check.
- **Sending**: Gmail's own "Send mail as" can reply *as* that address, but
  routed through Gmail's own servers it can't sign the message as your
  domain — only Google Workspace can do that natively. **Brevo** (a free
  transactional email service) authenticates boxalmatch.com for you, and
  Gmail relays through it instead. That's what gets rid of the "via
  gmail.com" tag and makes the mail pass DMARC properly.

Do it in this order. About 30–40 minutes, all from a browser.

---

## Step 1 — Pick your address(es)

Default, unless you want something different: **`boxalmatch@boxalmatch.com`**,
plus a **catch-all** so anything else sent to `@boxalmatch.com` (a typo, an
address you never explicitly created) also lands in the same inbox rather
than bouncing. Cheap insurance, no extra setup.

---

## Step 2 — Cloudflare Email Routing (receiving)

1. Cloudflare dashboard → your domain → **Email → Email Routing**.
2. **Enable Email Routing.** Cloudflare adds the MX records and a
   verification TXT record for you — nothing to type in by hand here.
3. **Destination addresses** → add `boxalmatch@gmail.com` (or whichever
   Gmail inbox should receive it) → Cloudflare emails a confirmation link to
   that address → click it.
4. **Routing rules** → add a rule: `boxalmatch@boxalmatch.com` → the
   destination you just verified.
5. Also set the **Catch-all address** to the same destination, action
   "Send to an email", so nothing silently bounces.

Send yourself a test email to `boxalmatch@boxalmatch.com` from any other
account and confirm it lands in Gmail before moving on.

---

## Step 3 — Brevo (authenticates boxalmatch.com for sending)

1. Create a free account at [brevo.com](https://www.brevo.com).
2. **Settings → Senders, Domains & Dedicated IPs → Domains → Add a domain** →
   enter `boxalmatch.com`.
3. Brevo shows you DNS records to add — typically an SPF piece, one or two
   DKIM records, and a domain-ownership TXT record. **Copy them exactly as
   Brevo displays them** rather than from any example here — the exact
   hostnames Brevo uses can change, and a copy-paste error is the single
   most common way this breaks.
4. Add those records in **Cloudflare → DNS → Records**.

**One thing to get right:** a domain can only have **one** `v=spf1` TXT
record. If you already have an SPF record (you shouldn't yet, since this
domain had none before now), don't add a second `v=spf1` line — merge
Brevo's `include:` into the existing record instead. Two separate SPF
records make SPF fail outright rather than just not helping.

5. Back in Brevo, click **Authenticate** / **Verify** on the domain. DNS
   changes can take a few minutes to a few hours to propagate — if it fails
   immediately, wait and retry before assuming something's wrong.
6. Once verified, go to **SMTP & API → SMTP** and note the SMTP host
   (`smtp-relay.brevo.com`), port (587), your login, and generate an **SMTP
   key** (not your account password — a separate key made for this).

---

## Step 4 — Gmail: Send mail as boxalmatch@boxalmatch.com

1. In the Gmail inbox that receives the forwarded mail: **Settings → See all
   settings → Accounts and Import → Send mail as → Add another email
   address**.
2. Name: `BOXALMATCH`. Email: `boxalmatch@boxalmatch.com`. Leave "Treat as
   an alias" as offered (it may not even appear for a non-Google domain).
3. **Next Step → "Send through SMTP server"** (not "Send through Gmail" —
   that's the path that keeps the via-gmail.com tag). Enter:
   - SMTP Server: `smtp-relay.brevo.com`
   - Port: `587`
   - Username / Password: the SMTP login and key from Step 3
   - Secured connection: TLS
4. **Add Account.** Gmail sends a verification code to
   `boxalmatch@boxalmatch.com` — which, thanks to Step 2, forwards straight
   into this same Gmail inbox. Copy the code back into Gmail's verification
   box.
5. Done. Composing a new message now shows a **From** dropdown with
   `boxalmatch@boxalmatch.com` as an option. Set it as the default for
   replies to that address, or leave it as a manual choice.

---

## Step 5 — DMARC (do this after Step 3 is verified, not before)

Add a TXT record at `_dmarc.boxalmatch.com`:

```
v=DMARC1; p=none; rua=mailto:boxalmatch@gmail.com
```

Start at `p=none` — monitoring only, nothing gets blocked — for a week or
two while you confirm mail from Brevo authenticates cleanly. Only then
consider moving to `p=quarantine`. Setting a strict policy before verifying
alignment actually works is how you accidentally get your own mail rejected.

---

## Step 6 — Test checklist

- [ ] Email to `boxalmatch@boxalmatch.com` arrives in Gmail (Step 2)
- [ ] Email to a made-up address (`xyz@boxalmatch.com`) also arrives, via the
      catch-all
- [ ] A reply sent **as** `boxalmatch@boxalmatch.com` shows no "via
      gmail.com" in the recipient's Gmail
- [ ] View the sent message's original ("Show original" in Gmail) — SPF and
      DKIM should both show **PASS**, aligned to boxalmatch.com

---

## Later: migrating to Google Workspace

Nothing here is a dead end. Moving to Workspace later is mostly DNS swaps,
not a rebuild:

1. Sign up for Workspace, verify domain ownership (a TXT record, separate
   from anything above).
2. Change the **MX records** from Cloudflare's routing targets to Google's
   (`ASPMX.L.GOOGLE.COM` and friends — Workspace's setup wizard gives you
   the current list).
3. Add Workspace's own DKIM TXT record (`google._domainkey`), generated in
   the Workspace admin console.
4. Your SPF record already includes Google (`include:_spf.google.com` is
   commonly required either way) — check whether Brevo's include is still
   needed once you're fully on Workspace, and drop it if not.
5. Want the old Gmail history inside the new Workspace mailbox? Workspace's
   built-in **Data Migration Service** pulls it in over IMAP — no manual
   export/import.

DMARC and the catch-all habit both carry over unchanged.

---

## Alternative considered: Zoho Mail (free tier)

If running a second service (Brevo) feels like one moving part too many:
**Zoho Mail's free tier** (up to 5 mailboxes) can be the domain's actual mail
host — MX points to Zoho, and it signs DKIM correctly for boxalmatch.com
natively, no relay needed. The trade-off is it's a separate mailbox with its
own login rather than living inside Gmail; you'd either check Zoho's own
webmail, or pull it into Gmail via **Settings → Accounts → Check mail from
other accounts (POP)**, which polls every hour or so rather than arriving
instantly like Cloudflare's forwarding does.

Went with Cloudflare + Brevo instead because it keeps everything inside
Gmail with no delay on receiving. Worth knowing this exists if the Brevo
step turns out to be more friction than it's worth.
