"""Generate stand-in portraits for the founders grid on storia.html.

The fourteen photographs do not exist yet, and the grid should not wait for
them. These are placeholders rather than an empty state so the page can ship
finished: real layout, real proportions, real weight on screen.

They are deliberately quiet — a near-black field the same value as the tiles
around them, with the member's initials sunk into it at low contrast. A
placeholder that shouts is one you stop noticing; this one reads as a portrait
that has not arrived, which is what it is.

Replacing one is a file swap, not a markup edit: drop a real photo over
img/crew/<slug>.jpg at any size and it will cover-crop into the same 4:5 tile.
Delete the placeholder first so this tool does not regenerate over it — it
skips slugs it did not make, tracked by a marker byte in the JPEG comment.

    python3 tools/crew_placeholder.py
"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os, re

W, H = 600, 750            # 4:5, matching .crew-card
OUT = 'img/crew'
MARK = b'boxalmatch-placeholder'
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'

NAMES = [
    'AeroStokes', 'NobleBrassMan', 'KarmicScroll', 'Hernicopter',
    'Rambaudo', 'SlickColt', 'SensibleSwine', 'Ifrid',
    'xVcRx Drius', 'Flying WC', 'Glimpse Of Nature', 'Clavuss',
    'Bibobio', 'Joe Moo',
]

SKIP = {'of', 'the', 'di', 'da'}


def slug(name):
    return re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')


def initials(name):
    """Two letters: one per word, or the first two if the name is one word.

    Splitting on camel case as well as spaces is what makes NobleBrassMan
    read as NB rather than NO — most of these names carry their word breaks
    in capitals rather than whitespace.
    """
    parts = [p for p in re.split(r'[\s_-]+|(?<=[a-z])(?=[A-Z])', name) if p]
    parts = [p for p in parts if p.lower() not in SKIP] or parts
    if len(parts) >= 2:
        return (parts[0][0] + parts[1][0]).upper()
    return parts[0][:2].upper()


def build(name):
    dst = '%s/%s.jpg' % (OUT, slug(name))
    if os.path.exists(dst):
        with open(dst, 'rb') as fh:
            if MARK not in fh.read(4096):
                print('%-18s kept (real photo)' % name)
                return
    # A vertical fade rather than a flat fill, so a row of them does not read
    # as a wall of identical rectangles.
    card = Image.new('RGB', (W, H), (13, 13, 16))
    grad = Image.new('L', (1, H))
    for y in range(H):
        grad.putpixel((0, y), int(26 - 14 * (y / H)))
    card = Image.composite(Image.new('RGB', (W, H), (22, 22, 27)),
                           card, grad.resize((W, H)))

    glow = Image.new('RGB', (W, H), (0, 0, 0))
    ImageDraw.Draw(glow).ellipse((W * .18, H * .10, W * .82, H * .62),
                                 fill=(0, 46, 10))
    card = Image.blend(card, glow.filter(ImageFilter.GaussianBlur(90)), .55)

    d = ImageDraw.Draw(card)
    text = initials(name)
    font = ImageFont.truetype(FONT, 190)
    box = d.textbbox((0, 0), text, font=font)
    d.text(((W - (box[2] - box[0])) / 2 - box[0],
            (H - (box[3] - box[1])) / 2 - box[1] - H * .04),
           text, font=font, fill=(0, 122, 22))

    card.save(dst, 'JPEG', quality=86, optimize=True, comment=MARK)
    print('%-18s %-22s %s' % (name, slug(name) + '.jpg', text))


os.makedirs(OUT, exist_ok=True)
for n in NAMES:
    build(n)
