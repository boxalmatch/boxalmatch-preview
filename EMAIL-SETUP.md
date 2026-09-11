# Email — @boxalmatch.com

**This is done.** `info@boxalmatch.com` receives instantly into Gmail via
Cloudflare Email Routing, and sends properly authenticated as the domain
through Brevo's SMTP relay wired into Gmail's "Send mail as" — no "via
gmail.com" tag. Confirmed on a real test message (11 Sept 2026):
`SPF: PASS`, `DKIM: 'PASS' with domain boxalmatch.com`, `DMARC: 'PASS'`.

Live configuration:

| Thing | Value |
|---|---|
| Address in use | `info@boxalmatch.com` (add more the same way — see Step 1) |
| Receiving | Cloudflare Email Routing → forwards into Gmail, instant |
| Catch-all | Set, same destination — anything else `@boxalmatch.com` still arrives rather than bouncing |
| Sending | Brevo (free tier), domain authenticated — no SPF record involved, DKIM CNAME delegation + a Brevo-hosted DMARC record do the work |
| Gmail wiring | Send mail as → `info@boxalmatch.com` via `smtp-relay.brevo.com:587`, set as default |
| DMARC policy | `p=none` (monitoring) — reports go to Brevo's own dashboard, not an inbox |

Everything below is the record of how it was built — useful if you add
another address, lose the SMTP key, or move to Workspace later.

---

## What's actually in DNS

Cloudflare Email Routing and Brevo each added their own records. Zero
overlap, zero conflict:

**Cloudflare (receiving — locked/managed, don't hand-edit these):**
- 3× MX records → `route1/2/3.mx.cloudflare.net`
- `v=spf1 include:_spf.mx.cloudflare.net ~all` — authorizes Cloudflare's
  *own* forwarding infrastructure. Unrelated to sending; leave it alone.
- `cf2024-1._domainkey` TXT — Cloudflare re-signs the forwarded copy with
  its own key so it lands cleanly in Gmail's spam filter.

**Brevo (sending):**
- `brevo-code:...` TXT at `@` — proves domain ownership.
- `brevo1._domainkey` / `brevo2._domainkey` CNAMEs → Brevo's DKIM keys.
  **These must be "DNS only", not proxied.** Cloudflare defaulted them
  correctly on this domain; if it doesn't on a future one, switch the
  cloud icon to grey before Brevo can verify.
- `_dmarc` TXT — `v=DMARC1; p=none; rua=mailto:rua@dmarc.brevo.com`.

**No SPF record was needed for Brevo, and none was given.** Its
authentication here runs entirely on DKIM alignment — don't add an SPF
include for it on a hunch; it isn't part of how this actually works.

Two records a domain can only carry one of, in practice: `v=spf1` and
`_dmarc`. If a future service asks you to add either, merge into the
existing one rather than creating a second — a duplicate breaks the
mechanism outright rather than just doing nothing.

---

## Step 1 — Add another address

1. **Cloudflare → Email → Email Routing → Routing rules → Create routing
   rule.** Email pattern: the local part (`boxalmatch`, `ciao`, …) @
   `boxalmatch.com`. Action: **Send to an email** → your Gmail address.
2. Test by emailing the new address from any other account — should land
   in Gmail within seconds.
3. To send *as* the new address too, repeat Step 3 below in Gmail. Brevo's
   domain authentication already covers any address `@boxalmatch.com` —
   no new DNS work needed per address.

The catch-all already forwards anything unrouted to the same inbox, so a
brand-new address works for *receiving* the moment you create the rule,
even before you set up sending for it.

---

## Step 2 — Brevo (domain already authenticated)

Already done for boxalmatch.com. If this ever needs redoing:

1. Free account at brevo.com → **Senders, Domains & Dedicated IPs →
   Domains → Add a domain**.
2. Choose **Manual**, not Automatic. Automatic hands Brevo an API token
   with write access to your Cloudflare DNS for a job that takes two
   minutes by hand. Manual also lets you check each record before it's
   live — which is how the "no SPF record, just DKIM + DMARC" shape of
   this setup got confirmed rather than assumed.
3. Add the records exactly as Brevo displays them — see "What's actually
   in DNS" above for the shape they took on this domain, but copy the
   live values from Brevo's own screen, not from memory of a past setup.
4. Click **Verify** in Brevo.
5. **SMTP & API → SMTP** → generate a key, Standard variant. **Brevo shows
   the key exactly once** — copy it immediately. It can't be retrieved
   again, only replaced with a new one.

If sending fails with no visible authentication error, check two things
in Brevo before assuming the SMTP config itself is wrong:
- **Dashboard home** — a banner about restricted or under-review sending
  (common on brand-new free accounts; sometimes lifted by adding a phone
  number).
- **Senders, Domains & Dedicated IPs → Senders** — a list separate from
  Domains. The specific sending address may need to be listed here too,
  not just the domain behind it.

---

## Step 3 — Gmail: Send mail as

1. **Settings → See all settings → Accounts and Import → Send mail as →
   Add another email address.**
2. Name + the `@boxalmatch.com` address. Leave "Treat as an alias" as
   offered.
3. **Next Step → "Send through [smtp-relay.brevo.com] SMTP servers"** —
   not "Send through Gmail." That second option is the path that produces
   the "via gmail.com" tag; the whole point of Brevo is to skip it.
4. Server `smtp-relay.brevo.com`, port `587`, your Brevo login as
   username, the SMTP key as password, TLS.
5. **Add Account.** Gmail emails a verification code to the new address —
   which, thanks to Cloudflare's forwarding, arrives right in this same
   inbox. Copy the code back in.
6. **If Send does nothing at all** — no error, no Outbox entry, the
   compose window just doesn't close — that's very likely stale page
   state from before the alias was added, not a real send failure.
   **Hard-refresh Gmail (or sign out and back in) and retry** before
   troubleshooting anything server-side. This was the actual cause the
   one time it happened here — Brevo, DNS and Gmail's own config were
   all already correct.
7. Once it sends cleanly, go back to **Send mail as** and click **make
   default** next to the address so new messages use it automatically.

---

## Step 4 — Confirm it actually authenticated

Send a real test message, then on the received copy: **⋮ → Show
original.** Look for all three:

```
SPF:   PASS  (may not be aligned to boxalmatch.com — doesn't matter, see below)
DKIM:  'PASS' with domain boxalmatch.com   <- this is the one that matters
DMARC: 'PASS'
```

DMARC only needs SPF **or** DKIM to pass *and* align with the visible
From address — not both. DKIM alignment via Brevo's CNAME delegation is
what actually carries it here; SPF passing or not is beside the point.

---

## Using it from the phone

Nothing to set up. The Gmail mobile apps can't add or edit send-as
addresses at all — that is a web-settings-only feature — but they inherit
whatever is configured there. `info@boxalmatch.com` shows up on its own.

- **Composing:** tap the **From** row at the top of the compose screen to
  pick the address. Because it is set as the default on web, new messages
  already open with it selected, and replies to mail sent *to* it pick it
  automatically.
- **If it isn't there yet:** it is a sync delay, not a configuration
  problem — the alias lives in the account, not on the device. Pull to
  refresh, or force-quit and reopen the app. (That was all it took here.)

Mail sent from the phone still goes out through Brevo. The custom SMTP
setting lives server-side on the Gmail account rather than in the client,
so Google applies it whichever app hits Send — same DKIM signing, same
absence of a "via gmail.com" tag, from any device.

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
4. Check whether Brevo's DKIM/DMARC records are still needed once fully on
   Workspace — drop them if you're no longer sending through Brevo at all.
5. Want the old Gmail history inside the new Workspace mailbox? Workspace's
   built-in **Data Migration Service** pulls it in over IMAP — no manual
   export/import.

The catch-all habit carries over unchanged; DMARC can move from `p=none`
to `p=quarantine` once you trust everything authenticates cleanly either
way.

---

## Alternative considered: Zoho Mail (free tier)

If running a second service (Brevo) ever feels like one moving part too
many: **Zoho Mail's free tier** (up to 5 mailboxes) can be the domain's
actual mail host — MX points to Zoho, and it signs DKIM correctly for
boxalmatch.com natively, no relay needed. The trade-off is it's a separate
mailbox with its own login rather than living inside Gmail; you'd either
check Zoho's own webmail, or pull it into Gmail via **Settings → Accounts
→ Check mail from other accounts (POP)**, which polls every hour or so
rather than arriving instantly like Cloudflare's forwarding does.

Went with Cloudflare + Brevo instead, and it's working as intended: mail
stays inside Gmail, receiving is instant, sending is properly
authenticated. Worth knowing Zoho exists as a one-service alternative if
that ever changes.
