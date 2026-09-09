"""Build 4:5 portrait versions of the 16:9 event artwork for the hero fan.

Each poster has its title set across the middle, so a cover-crop into a
portrait frame beheads it. These keep the artwork whole at full width and grow
the frame around it out of the artwork itself: a heavily blurred, slightly
darkened cover-scale of the same image fills the card, and the poster is
dissolved into it over a long cosine feather, so the colours run continuously
and there is no letterbox edge.
"""
from PIL import Image, ImageFilter, ImageEnhance
import math, os

W, H = 900, 1125          # 4:5
FEATHER = 120             # px over which the poster dissolves into the field
OUT = 'img/events/portrait'


def build(src, dst):
    im = Image.open(src).convert('RGB')

    # field: cover-scaled past the frame, blurred flat, pulled down just enough
    # that the poster reads as the brighter subject
    s = max(W / im.width, H / im.height) * 1.35
    bg = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    bg = bg.crop(((bg.width - W) // 2, (bg.height - H) // 2,
                  (bg.width - W) // 2 + W, (bg.height - H) // 2 + H))
    bg = bg.filter(ImageFilter.GaussianBlur(64))
    # Normalise the field to a common tone instead of a fixed multiplier: the
    # posters range from a near-white BoxStone to a dark Halo key art, and a
    # flat 0.6 leaves the light ones glowing on a black page.
    mean = sum(bg.convert('L').resize((1, 1), Image.LANCZOS).get_flattened_data()) or 1
    bg = ImageEnhance.Brightness(bg).enhance(min(0.85, max(0.28, 44 / mean)))
    bg = ImageEnhance.Color(bg).enhance(1.18)

    art = im.resize((W, round(W * im.height / im.width)), Image.LANCZOS)
    top = (H - art.height) // 2

    # cosine ramp: zero gradient at both ends, so neither the seam nor the
    # fully-opaque middle shows a boundary
    mask = Image.new('L', art.size, 255)
    px = mask.load()
    for y in range(FEATHER):
        v = int(255 * (0.5 - 0.5 * math.cos(math.pi * y / FEATHER)))
        for x in range(art.width):
            px[x, y] = v
            px[x, art.height - 1 - y] = v

    bg.paste(art, (0, top), mask)
    bg.save(dst, 'JPEG', quality=90, optimize=True, progressive=True)


os.makedirs(OUT, exist_ok=True)
for name in ['thegreatlan', 'granparadiso', 'guildswar', 'boxstone', 'boxcraft']:
    build(f'img/events/{name}.jpg', f'{OUT}/{name}.jpg')
    print(name, os.path.getsize(f'{OUT}/{name}.jpg') // 1024, 'KB')
