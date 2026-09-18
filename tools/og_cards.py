"""Render the Open Graph cards.

Rendered in Chromium against the site's own webfont rather than drawn with
PIL: these cards carry the same wordmark and the same Inter cut as the pages
they represent, and approximating that with a system font would show.

Inter is served from tools/fonts/ rather than from Google: Chromium does not
trust this environment's proxy CA, so the remote stylesheet failed and the
first run came out in a fallback face. Downloading the woff2 subsets once
also makes the cards reproducible without a network.

Two layouts.

An event card is its key art and nothing else but the wordmark. The art
already carries the event's name, in its own lettering, far better than an
overlay could — the first cut set "Noble Party Guilds War" in Inter directly
on top of the same words in gold, which looked like a mistake because it was
one. Chat apps and social networks render og:title and og:description as text
beside the picture, so the words are not lost by leaving them off it.

Every other page gets a brand card, where there is no art to do that job and
the words are the content: wordmark, title, one line under it.

Both are 1200x630, which is what every platform crops from, so nothing
important sits near an edge.
"""
import json, os, tempfile

ROOT = "/home/user/boxalmatch-preview"
OUT = os.path.join(ROOT, "img/og")
# The HTML the cards are rendered from is a build artifact, not something the
# site serves: keeping it in img/og/ published ten stray pages with no title
# and no preview of their own.
WORK = os.path.join(tempfile.gettempdir(), "boxalmatch-og")

CARDS = [
    # name,          art (or None for a brand card),         eyebrow,      title,                  subtitle
    ("default",      None,                                    "Dal 2019",   "Giochiamo.\nRaccontiamo.",
     "Un gruppo di amici con la passione per l'intrattenimento collettivo."),
    ("eventi",       None,                                    "Archivio",   "Eventi",
     "Tutto quello che abbiamo organizzato, dal 2024 a oggi."),
    ("contenuti",    None,                                    "Cosa facciamo", "Le nostre\nproduzioni",
     "Tornei, serie e serate a tema. Premi play e guarda da qui."),
    ("supportaci",   None,                                    "Sostienici", "Supportaci",
     "Tre livelli per starci dentro. Si parte da gratis."),
    ("contatti",     None,                                    "Parliamone", "Contatti",
     "Informazioni, eventi e collaborazioni. Rispondiamo sempre."),
    ("storia",       "img/group.webp",                        "Dal 2019",   "La nostra storia",
     "Quattordici amici, un gruppo WhatsApp e un'idea che non si è più fermata."),
    ("thegreatlan",  "img/events/thegreatlan.webp",           "Evento",     "The Great LAN",
     "Dopo 10 anni, di nuovo insieme per un'epica LAN su Halo Infinite."),
    ("granparadiso", "img/events/granparadiso.webp",          "Evento",     "Noble Party\nGran Paradiso",
     "Il campionato BOXALMATCH su Halo Infinite."),
    ("guildswar",    "img/events/guildswar.webp",             "Evento",     "Noble Party\nGuilds War",
     "Gilde, armate e una lore tutta sua."),
    ("boxstone",     "img/events/boxstone.webp",              "Evento",     "BoxStone",
     "Il torneo di carte di BOXALMATCH."),
]

TPL = """<!DOCTYPE html><html><head><meta charset="utf-8">
<link href="%(fontcss)s" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:1200px;height:630px;background:#000;color:#fff;
       font-family:"Inter",sans-serif;letter-spacing:-0.012em;overflow:hidden}
  .card{position:relative;width:1200px;height:630px;display:flex;flex-direction:column;
        justify-content:flex-end;padding:66px 72px}
  /* Brand card: a single soft green light, off to one side, so a flat black
     frame does not read as a failed image. */
  .glow{position:absolute;inset:0;background:
        radial-gradient(900px 620px at 100%% 0%%, rgba(0,184,28,.16), transparent 62%%),
        radial-gradient(420px 320px at 8%% 104%%, rgba(0,184,28,.07), transparent 70%%)}
  .art{position:absolute;inset:0;background-size:cover;background-position:center}
  /* The scrim is what keeps the title legible whatever the art does under it. */
  .scrim{position:absolute;inset:0;background:
         linear-gradient(180deg, rgba(0,0,0,.62) 0%%, rgba(0,0,0,.20) 22%%, rgba(0,0,0,0) 42%%)}
  .mark{position:absolute;top:60px;left:72px;display:flex;align-items:center;gap:13px}
  .mark img.m{height:38px;width:auto}
  .mark img.w{height:26px;width:auto}
  .eyebrow{position:relative;color:#00B81C;font-size:22px;font-weight:600;
           letter-spacing:.085em;text-transform:uppercase;margin-bottom:20px}
  h1{position:relative;font-size:%(size)spx;font-weight:600;letter-spacing:-0.032em;
     line-height:1.03;white-space:pre-line}
  p{position:relative;margin-top:22px;font-size:27px;color:#c9c9cf;line-height:1.38;
    max-width:940px}
</style></head><body>
<div class="card">
  %(bg)s
  <div class="mark">
    <img class="m" src="%(mark)s"><img class="w" src="%(word)s">
  </div>
  %(text)s
</div></body></html>"""


def build():
    os.makedirs(OUT, exist_ok=True)
    os.makedirs(WORK, exist_ok=True)
    jobs = []
    for name, art, eyebrow, title, sub in CARDS:
        lines = title.count("\n") + 1
        size = 92 if lines == 1 else 78
        if len(max(title.split("\n"), key=len)) > 16:
            size = min(size, 74)
        if art:
            bg = ('<div class="art" style="background-image:url(\'file://%s/%s\')"></div>'
                  '<div class="scrim"></div>' % (ROOT, art))
            text = ""                       # the artwork is the message
        else:
            bg = '<div class="glow"></div>'
            text = ('<div class="eyebrow">%s</div><h1>%s</h1><p>%s</p>'
                    % (eyebrow, title, sub))
        html = TPL % dict(size=size, bg=bg, text=text,
                          fontcss="file://%s/tools/fonts/inter.css" % ROOT,
                          mark="file://%s/img/icons/mark.png" % ROOT,
                          word="file://%s/img/icons/wordmark.webp" % ROOT)
        p = os.path.join(WORK, name + ".html")
        open(p, "w", encoding="utf-8").write(html)
        jobs.append((name, p))
    return jobs


if __name__ == "__main__":
    jobs = build()
    json.dump([[n, p] for n, p in jobs], open(os.path.join(WORK, "_jobs.json"), "w"))
    print("wrote %d templates to %s" % (len(jobs), WORK))
