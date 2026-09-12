"""Recompose the 16:9 event artwork into 4:5 posters for the hero fan.

The fan wants portrait cards and every piece of key art is 16:9, so a poster
has to be rebuilt rather than fitted. Two approaches were tried and dropped
before this one:

Padding the artwork into the frame — scale it to the card width and grow a
blurred, darkened copy of itself around it — leaves 55% of the card as soft
mush, and it is worst exactly where the art is lightest: BoxStone became a
small cutout floating in cream fog.

Cover-cropping a 4:5 window keeps nine sixteenths of the width, and on the
three Halo posters the title lockup and the Spartans sit at opposite ends. Any
window holding one slices the other, and a half-cut logo reads as broken.

So each card is composed from two crops of its own artwork: the *subject*,
cover-cropped full-bleed from a region of the source that carries no type,
and the *lockup*, lifted from wherever the title actually sits and re-placed
across the top. Nothing is blurred and nothing is invented.

Three things make the join work:

The subject region is chosen to be text-free. Framing Gran Paradiso on its
Spartans while the source title still ran through the crop left the old type
ghosting behind the new ("RTY", "DISO"), which is worse than either problem
alone. Where that forces a tighter window the upscale is compensated with an
unsharp pass, sized from the scale factor.

The top is scrimmed to near-black before the lockup lands, on a curve that
holds the dark well past the halfway point. A linear or smoothstep fade is
already back to 90% brightness where the lockup's last line falls, which left
HALO INFINITE washed out over a lit helmet.

The lockup is composited with a lighten blend, so the dark ground it was cut
from disappears into the scrim and only the glyphs survive — no cut-out
rectangle, no matting, and metallic gradients keep their sheen.

BoxStone is the exception: it is a cutout on a pale studio gradient, so
instead of a scrim its background is pulled to black by a soft mask keyed on
bright-and-unsaturated. Blurring that mask leaves a faint halo, which reads
as backlight rather than a bad key.

None of this beats real portrait artwork. If a poster was drawn portrait in
the first place, drop it in img/events/portrait-src/<name>.jpg and the tool
will simply fit that instead — no crops, no scrim, no lockup pass. The 16:9
files in img/events are in several cases crops of a taller original, so those
originals are worth digging out.

Output is 720x900 — the card is at most 296 CSS px wide, so this still has
room to spare at 2x.

    python3 tools/portrait.py
"""
from PIL import Image, ImageFilter, ImageEnhance, ImageChops, ImageDraw
import os

W, H = 720, 900
OUT = 'img/events/portrait'
SRC = 'img/events/portrait-src'   # real portrait artwork, used as-is when present

# bodybox: text-free region of the source to fill the card with, as fractions.
# lock:    where the title lockup actually sits in the source.
# lw/ly:   the lockup's width and top edge on the card, as fractions.
# scrim:   how far down the card the top is faded to black.
CFG = {
    'thegreatlan':  dict(bodybox=(.55, 0, 1.0, 1.0),    lock=(.04, .17, .56, .98),
                         lw=.74, ly=.05, scrim=.60),
    'granparadiso': dict(bodybox=(.70, .08, 1.0, .76),  lock=(.02, .28, .70, 1.0),
                         lw=.90, ly=.05, scrim=.60),
    'guildswar':    dict(bodybox=(.70, .34, 1.0, 1.0),  lock=(.02, .12, .78, .97),
                         lw=.92, ly=.05, scrim=.62),
    # Its title is already inside the frame, top-centre, so a centred crop
    # keeps the plaque whole and needs no lockup pass.
    'boxcraft':     dict(bodybox=(.28, .01, .72, .99),  lock=None, scrim=0),
    'boxstone':     dict(bodybox=(.24, 0, .76, 1.0),    lock=None, scrim=0,
                         killpale=True),
}


def cover(crop):
    s = max(W / crop.width, H / crop.height)
    r = crop.resize((round(crop.width * s), round(crop.height * s)), Image.LANCZOS)
    r = r.crop(((r.width - W) // 2, (r.height - H) // 2,
                (r.width - W) // 2 + W, (r.height - H) // 2 + H))
    if s > 1.25:
        r = r.filter(ImageFilter.UnsharpMask(2.2, int(min(120, (s - 1) * 110)), 3))
    return r


def kill_pale(img):
    """Pull a pale studio background to black without a hard key."""
    _, sat, val = img.convert('HSV').split()
    sv, vv = sat.load(), val.load()
    m = Image.new('L', img.size, 0)
    mv = m.load()
    for y in range(img.height):
        for x in range(img.width):
            mv[x, y] = int(255 * min(1, max(0, (vv[x, y] - 150) / 70.0))
                               * min(1, max(0, (105 - sv[x, y]) / 55.0)))
    m = m.filter(ImageFilter.GaussianBlur(7))
    return Image.composite(ImageEnhance.Brightness(img).enhance(.06), img, m)


def scrim(img, frac):
    if not frac:
        return img
    m = Image.new('L', (W, H), 255)
    px = m.load()
    n = int(H * frac)
    for y in range(n):
        v = int(255 * (0.06 + 0.94 * (y / n) ** 2.0))
        for x in range(W):
            px[x, y] = v
    return Image.composite(img, Image.new('RGB', (W, H), (0, 0, 0)), m)


def feather(size, pad):
    m = Image.new('L', size, 0)
    ImageDraw.Draw(m).rectangle((pad, pad, size[0] - pad, size[1] - pad), fill=255)
    return m.filter(ImageFilter.GaussianBlur(pad * .55))


def box(im, b):
    a, t, c, d = b
    return im.crop((int(a * im.width), int(t * im.height),
                    int(c * im.width), int(d * im.height)))


def portrait_original(name):
    for ext in ('jpg', 'jpeg', 'png', 'webp'):
        path = '%s/%s.%s' % (SRC, name, ext)
        if os.path.exists(path):
            return path
    return None


def build(name, c):
    original = portrait_original(name)
    if original:
        card = cover(Image.open(original).convert('RGB'))
        dst = '%s/%s.jpg' % (OUT, name)
        card.save(dst, 'JPEG', quality=88, optimize=True, progressive=True)
        print('%-14s %dx%d  %3d KB  (from %s)'
              % (name, W, H, os.path.getsize(dst) // 1024, original))
        return

    im = Image.open('img/events/%s.jpg' % name).convert('RGB')

    card = cover(box(im, c['bodybox']))
    if c.get('killpale'):
        card = kill_pale(card)
    card = scrim(card, c['scrim'])

    if c['lock']:
        lk = box(im, c['lock'])
        lw = int(W * c['lw'])
        lh = round(lw * lk.height / lk.width)
        lk = ImageEnhance.Brightness(lk.resize((lw, lh), Image.LANCZOS)).enhance(1.08)
        pos = ((W - lw) // 2, int(H * c['ly']))
        under = card.crop((pos[0], pos[1], pos[0] + lw, pos[1] + lh))
        card.paste(ImageChops.lighter(under, lk), pos, feather((lw, lh), 40))

    dst = '%s/%s.jpg' % (OUT, name)
    card.save(dst, 'JPEG', quality=88, optimize=True, progressive=True)
    print('%-14s %dx%d  %3d KB' % (name, W, H, os.path.getsize(dst) // 1024))


os.makedirs(OUT, exist_ok=True)
for n, c in CFG.items():
    build(n, c)
