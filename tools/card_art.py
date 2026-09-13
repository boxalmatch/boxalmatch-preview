"""Light-grey wordmark and mark for the membership card.

The card is a dark green slab, so it needs pale artwork rather than the
site's accent green. Two files come out of here:

img/icons/wordmark-light.png — the wordmark, keyed off its green ink. The
source is drawn as green glyphs inside a heavy black outline, and that outline
is what has to go: a plain "make everything grey" would flatten glyph and
outline into one blob. Taking alpha from the brightest channel drops the black
away and keeps the letterforms, the same trick tools/mark_logo.py uses on the
mark, and for the same reason — the ink is saturated, the outline is not.

img/icons/mark-light.png — the mark, whose alpha is already a clean mask, so
only its colour changes.

The card previously used wordmark-white.png, a different and much heavier
lockup than the one the rest of the site uses. These two match the nav.

    python3 tools/card_art.py
"""
from PIL import Image, ImageChops
import os

INK = (230, 230, 230)     # pale grey: reads on the dark card without glaring
PAD = 0.02                # a little air around the trimmed wordmark


def keyed_alpha(rgba):
    """Alpha from the brightest channel, bounded by the file's own alpha.

    Brightest rather than luminance because luminance weights green at 0.587
    and would leave this particular ink at about 40% — the same trap
    mark_logo.py documents. Bounded by the existing alpha so the transparent
    background around the artwork stays transparent.
    """
    r, g, b = rgba.convert('RGB').split()
    a = ImageChops.lighter(ImageChops.lighter(r, g), b)
    peak = a.getextrema()[1] or 255
    a = a.point(lambda v: min(255, int(v * 255 / peak)))
    return ImageChops.darker(a, rgba.split()[3])


def flat(mask, size=None):
    """Lay INK behind a mask, resizing the mask alone.

    Resizing a finished RGBA blends the colour channels against the
    transparent pixels around every edge and drifts the ink — the usual
    non-premultiplied artifact. Doing it in this order keeps every visible
    pixel exactly INK.
    """
    if size:
        mask = mask.resize(size, Image.LANCZOS)
    out = Image.new('RGBA', mask.size, INK + (0,))
    out.putalpha(mask)
    return out


def build_wordmark(src='img/icons/wordmark.png', dst='img/icons/wordmark-light.png',
                   width=900):
    a = keyed_alpha(Image.open(src).convert('RGBA'))
    box = a.getbbox()
    if box is None:
        raise SystemExit('nothing visible in ' + src)
    a = a.crop(box)

    pad = int(max(a.size) * PAD)
    canvas = Image.new('L', (a.width + pad * 2, a.height + pad * 2), 0)
    canvas.paste(a, (pad, pad))

    h = round(canvas.height * width / canvas.width)
    flat(canvas, (width, h)).save(dst, optimize=True)
    return dst, width, h


def build_mark(src='img/icons/mark.png', dst='img/icons/mark-light.png', size=256):
    # Already a clean mask on transparent — only the colour changes.
    flat(Image.open(src).convert('RGBA').split()[3], (size, size)).save(dst, optimize=True)
    return dst, size, size


for path, w, h in (build_wordmark(), build_mark()):
    print('%-34s %dx%-4d %3d KB' % (path, w, h, os.path.getsize(path) // 1024))
