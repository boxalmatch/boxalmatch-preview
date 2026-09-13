"""Trim the event wordmarks for use as hero mastheads on the sub-pages.

The three logos were drawn on very different canvases: The Great LAN's fills
28% of its frame, Gran Paradiso's 45%, Guilds War's 81%. That did not matter
while they sat in the header at a fixed 28px and mostly read as a smudge, but
as a masthead over the artwork it matters a lot — sized by CSS to the same
box, the padded ones would render half the size of the tight one and the
three sites would look inconsistent for no visible reason.

So each is cropped to its own alpha bounding box and written out at a common
width. After this, one CSS width means the same apparent size on all three.

The source files stay where they are; the header no longer uses them, but
they are the artwork of record and the favicons still point at their .jpg
siblings.

    python3 tools/hero_logo.py
"""
from PIL import Image
import os

WIDTH = 900          # enough for a ~420px masthead on a 2x display
SITES = {
    'thegreatlan':            'img/icons/TGL_b.png',
    'noblepartygranparadiso': 'img/icons/NPGP_b.png',
    'noblepartyguildswar':    'img/icons/logo.png',
}


def build(site, src):
    path = os.path.join(site, src)
    im = Image.open(path).convert('RGBA')

    box = im.split()[3].getbbox()
    if box is None:
        raise SystemExit('no visible pixels in ' + path)
    im = im.crop(box)

    if im.width > WIDTH:
        im = im.resize((WIDTH, round(im.height * WIDTH / im.width)), Image.LANCZOS)

    dst = os.path.join(site, 'img/icons/hero-logo.png')
    im.save(dst, optimize=True)
    print('%-24s %4dx%-4d  %3d KB' %
          (site, im.width, im.height, os.path.getsize(dst) // 1024))


for site, src in SITES.items():
    build(site, src)
