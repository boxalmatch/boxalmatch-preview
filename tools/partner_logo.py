"""Turn a partner's black-on-white logo into a white, transparent-background PNG.

Shop logos arrive as black artwork on a white canvas. Two CSS-only tricks were
tried first and neither is reliable: inverting alone leaves a black rectangle
on the card, and following it with screen blending does not drop that
rectangle out, because .partner carries a backdrop-filter and that isolates
the blend. JPEG compression also means the "white" is 254, not 255, so there
is nothing for a blend mode to key on cleanly.

Baking the transparency into the file removes the whole problem: the mark is
white, everything else is transparent, and the card needs no filter at all.

    python3 tools/partner_logo.py img/partners/panda.jpg
"""
from PIL import Image
import os, sys

PAD = 0.04          # breathing room around the trimmed mark, as a fraction
INK_MAX = 245       # luminance at or below this is treated as ink


def convert(src, dst=None):
    dst = dst or os.path.splitext(src)[0] + '.png'
    grey = Image.open(src).convert('L')

    # alpha from darkness: black ink opaque, white canvas transparent, and the
    # antialiased edges keep their partial coverage
    alpha = grey.point(lambda v: 0 if v > INK_MAX else 255 - v)

    box = alpha.getbbox()
    if box:
        px = round(max(alpha.width, alpha.height) * PAD)
        box = (max(0, box[0] - px), max(0, box[1] - px),
               min(alpha.width, box[2] + px), min(alpha.height, box[3] + px))
        alpha = alpha.crop(box)

    out = Image.new('RGBA', alpha.size, (255, 255, 255, 0))
    out.putalpha(alpha)
    out.save(dst, 'PNG', optimize=True)
    print(f'{src} {grey.size} -> {dst} {out.size} '
          f'({os.path.getsize(dst)//1024} KB, transparent)')


if __name__ == '__main__':
    for path in sys.argv[1:] or ['img/partners/panda.jpg']:
        convert(path)
