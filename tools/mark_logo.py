"""Turn the BOXALMATCH mark from green-on-black into a transparent PNG.

The mark arrives as flat green artwork on a solid black square. That black is
not part of the design — it is just the canvas it was exported on — and it has
to go, because the mark sits on the nav's glass and in a browser tab, neither
of which is black. Left baked in, it shows as a visible tile.

Two details make this more than a background removal:

The black is not only *around* the mark. The design is two crescents forming a
ring, and the almond shape between them is background showing through, not
paint. Keying on darkness drops both at once, which is what we want — the mark
reads as green strokes with the page behind them.

The green is recoloured rather than preserved. The export is #01EE0E; the
wordmark it sits beside is #00B81C, which is where the site's accent came
from. Two greens that close together, side by side in the same header, read as
a mistake rather than a choice. Writing the accent into every pixel also kills
the dark fringe that antialiased edges would otherwise keep from the black
canvas.

    python3 tools/mark_logo.py img/icons/mark.png
"""
from PIL import Image, ImageChops
import os, sys

ACCENT = (0, 184, 28)   # #00B81C — the wordmark's green, so they match
PAD = 0.05              # breathing room around the trimmed mark, as a fraction
SIZE = 256              # plenty for a 20px header mark on a 3x display


def convert(src, dst=None, size=SIZE):
    dst = dst or src
    rgb = Image.open(src).convert('RGB')

    # Alpha from the brightest channel, not from luminance. Converting to 'L'
    # weights green at 0.587, so this green's luminance is ~142 where its
    # green channel is 238 — scaling that to full opacity silently topped the
    # mark out at 42% alpha. Taking the per-pixel maximum keeps a saturated
    # ink of any hue at full strength, and antialiased edges keep their
    # partial coverage instead of going ragged.
    r, g, b = rgb.split()
    alpha = ImageChops.lighter(ImageChops.lighter(r, g), b)
    peak = alpha.getextrema()[1] or 255
    alpha = alpha.point(lambda v: min(255, int(v * 255 / peak)))

    box = alpha.getbbox()
    if box is None:
        raise SystemExit('nothing but background in ' + src)
    alpha = alpha.crop(box)

    # Square it off with a little padding so the mark is not flush to the edge
    # in a browser tab.
    side = int(max(alpha.size) * (1 + PAD * 2))
    square = Image.new('L', (side, side), 0)
    square.paste(alpha, ((side - alpha.width) // 2, (side - alpha.height) // 2))

    # Resize the mask alone, then lay the flat accent behind it. Resizing a
    # finished RGBA instead blends the colour channels against the transparent
    # pixels around each edge, which dragged the green from #00B81C to #00AC1A
    # — the usual non-premultiplied resize artifact. Doing it in this order
    # means every visible pixel is exactly the accent, and the black canvas
    # leaves no dark fringe behind either.
    square = square.resize((size, size), Image.LANCZOS)
    out = Image.new('RGBA', (size, size), ACCENT + (0,))
    out.putalpha(square)
    out.save(dst, optimize=True)

    print('%s  %dx%d  %.1f KB' % (dst, size, size, os.path.getsize(dst) / 1024))


if __name__ == '__main__':
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    convert(sys.argv[1], *sys.argv[2:3])
