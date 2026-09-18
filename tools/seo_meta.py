"""Give every page its link preview and its canonical URL.

Before this, pasting any boxalmatch.com link into WhatsApp, Discord or
Telegram produced a bare blue link: no picture, no title, no description. For
a group whose reach runs through chat apps that is the whole shop window.

Three fixes travel together because they are the same data:

  * og: and twitter: tags, pointing at the cards in img/og/
  * a canonical URL, absolute, so the same page under two addresses
    (boxalmatch.com and www.) is not counted twice
  * titles and descriptions on the event sub-pages, which had none — and
    several of which had MARKUP inside <title>, so a tab read "Gilda AdeAde
    Guild". A title element cannot hold elements; the spans were being
    rendered as text.

Descriptions are Italian: it is the primary audience, and a preview can only
carry one language.
"""
import io, os, re, sys

ROOT = "/home/user/boxalmatch-preview"
BASE = "https://boxalmatch.com"
os.chdir(ROOT)

# page -> (og card, description). Title comes from the page unless overridden.
EVENTS = {
    "thegreatlan":            ("thegreatlan",  "The Great LAN"),
    "noblepartygranparadiso": ("granparadiso", "Noble Party Gran Paradiso"),
    "noblepartyguildswar":    ("guildswar",    "Noble Party Guilds War"),
    "boxstone":               ("boxstone",     "BoxStone"),
}

ROOT_PAGES = {
    "index.html":       ("default",    None,
        "BOXALMATCH — tornei, eventi e storie da un gruppo di amici con la passione per l'intrattenimento collettivo."),
    "storia.html":      ("storia",     None, None),
    "eventi.html":      ("eventi",     None, None),
    "contenuti.html":   ("contenuti",  None, None),
    "supportaci.html":  ("supportaci", None, None),
    "contatti.html":    ("contatti",   None, None),
    "accedi.html":      ("default",    None, None),
    "registrati.html":  ("default",    None, None),
    "404.html":         ("default",    None, None),
}

# Short Italian lines for the sub-pages, which shipped with none at all.
SUB_DESC = {
    "awards":       "I premi e i riconoscimenti assegnati a fine evento.",
    "backlog":      "Mappe, modalità e opzioni: tutto quello che si può giocare.",
    "setup":        "Come abbiamo montato la LAN: postazioni, rete e attrezzatura.",
    "scores":       "Classifiche e punteggi, gilda per gilda.",
    "chronicles":   "Le cronache dell'evento, puntata per puntata.",
    "regolamento":  "Il regolamento completo dell'evento.",
    "storia":       "La lore dell'evento e come è nata.",
    "agora":        "L'Agorà: il punto d'incontro delle gilde.",
    "mappa":        "La mappa dell'evento.",
    "teams":        "Le squadre in gara.",
    "viaggiatore":  "La storia del Viaggiatore.",
    "home":         None,   # the event's own description, set below
}

def strip_tags(s):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", s)).strip()

def italian_of(title_html):
    """A <title> that carried two language spans keeps the Italian one."""
    m = re.search(r'<span lang="it">(.*?)</span>', title_html, re.S)
    return strip_tags(m.group(1)) if m else strip_tags(title_html)

def bare(name, event):
    """The page's own name, with any suffix this script has already added
    taken back off. Without this a second run reads its own output as the
    page name and writes "Gilda Ade - Guilds War - BOXALMATCH - Guilds War
    - BOXALMATCH" — which is exactly what it did."""
    for suffix in (f" — {event} — BOXALMATCH", " — BOXALMATCH"):
        while name.endswith(suffix):
            name = name[: -len(suffix)]
    return name.strip()

# Explicit delimiters, so re-running this removes exactly its own block and
# nothing around it. Matching on the first and last tag instead ate the
# newline after the block, and each run pulled another unrelated line up.
START, END = "<!-- seo:start -->", "<!-- seo:end -->"

def head_block(url, title, desc, card):
    img = f"{BASE}/img/og/{card}.jpg"
    return f"""{START}
<link rel="canonical" href="{url}">

<!-- Link preview. og:image is absolute because a crawler has no page to
     resolve a relative path against. 1200x630 is what every platform crops. -->
<meta property="og:site_name" content="BOXALMATCH">
<meta property="og:type" content="website">
<meta property="og:locale" content="it_IT">
<meta property="og:locale:alternate" content="en_GB">
<meta property="og:url" content="{url}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="{img}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="{title}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{title}">
<meta name="twitter:description" content="{desc}">
<meta name="twitter:image" content="{img}">
{END}
"""

def esc(s):
    return s.replace("&", "&amp;").replace('"', "&quot;").replace("<", "&lt;")

def process(path):
    s = io.open(path, encoding="utf-8").read()
    rel = path.replace("\\", "/").lstrip("./")
    url = f"{BASE}/" + ("" if rel == "index.html" else rel)

    tm = re.search(r"<title>(.*?)</title>", s, re.S)
    if not tm:
        return None
    raw_title = tm.group(1)

    top = rel.split("/")[0]
    if top in EVENTS:
        card, event = EVENTS[top]
        page = os.path.splitext(os.path.basename(rel))[0]
        name = bare(italian_of(raw_title), event)
        if page == "home":
            title = f"{event} — BOXALMATCH"
            # A description already on the page wins: BoxStone's says the page
            # is still in lavorazione, and a preview that leaves that out sells
            # something that is not there yet.
            dm = re.search(r'<meta name="description" content="(.*?)">', s, re.S)
            desc = dm.group(1) if dm else {
                "thegreatlan": "Dopo 10 anni, di nuovo insieme per un'epica LAN su Halo Infinite.",
                "noblepartygranparadiso": "Il campionato BOXALMATCH su Halo Infinite: squadre, mappa e cronache.",
                "noblepartyguildswar": "Gilde, armate, classifiche e una lore tutta sua, su Halo Infinite.",
                "boxstone": "Il torneo di carte di BOXALMATCH."}[top]
        else:
            title = f"{name} — {event} — BOXALMATCH"
            desc = SUB_DESC.get(page) or f"{name}, da {event}."
    elif rel in ROOT_PAGES:
        card, override, desc_override = ROOT_PAGES[rel]
        title = override or strip_tags(raw_title)
        dm = re.search(r'<meta name="description" content="(.*?)">', s, re.S)
        desc = desc_override or (dm.group(1) if dm else "")
    else:
        return None            # members/* stay noindex and unpreviewed

    # A <title> may not contain elements; collapse any that do to the Italian.
    if "<" in raw_title:
        s = s.replace(f"<title>{raw_title}</title>", f"<title>{esc(title)}</title>")
    elif strip_tags(raw_title) != title:
        s = s.replace(f"<title>{raw_title}</title>", f"<title>{esc(title)}</title>")

    if '<meta name="description"' in s:
        s = re.sub(r'<meta name="description" content=".*?">',
                   f'<meta name="description" content="{esc(desc)}">', s, count=1, flags=re.S)
    else:
        s = s.replace("</title>", f'</title>\n<meta name="description" content="{esc(desc)}">', 1)

    # Replace an existing block rather than stacking a second one.
    s = re.sub(re.escape(START) + r".*?" + re.escape(END) + r"\n?", "", s, flags=re.S)

    block = head_block(url, esc(title), esc(desc), card)
    anchor = re.search(r'(<meta name="description" content=".*?">\n)', s, re.S)
    s = s[:anchor.end()] + "\n" + block + s[anchor.end():]

    # Normalise the whitespace around the block on every run, rather than
    # hoping insertion and removal are exact mirrors of each other. They were
    # not: a page that had no description started life one blank line short of
    # a page that did, so run 1 and run 2 disagreed. Exactly one blank line
    # before the block, none after.
    s = re.sub(r"\n+" + re.escape(START), "\n\n" + START, s)
    s = re.sub(re.escape(END) + r"\n+", END + "\n", s)
    s = re.sub(r"\n{3,}", "\n\n", s)

    io.open(path, "w", encoding="utf-8").write(s)
    return rel, title, card

if __name__ == "__main__":
    done = []
    for dp, dn, fs in os.walk("."):
        dn[:] = [d for d in dn if d not in (".git", "node_modules", "members", "tools")]
        for f in sorted(fs):
            if f.endswith(".html"):
                r = process(os.path.join(dp, f))
                if r: done.append(r)
    for rel, title, card in sorted(done):
        print(f"{card:13} {rel:44} {title}")
    print(f"\n{len(done)} pages given a link preview")
