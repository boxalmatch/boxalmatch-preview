"""Downscale and re-encode the event photography for the web.

The sub-pages were shipping camera originals: 7008x4672 JPEGs at 12 MB and
4K screen-grabs saved as PNG at 8-11 MB, all of it displayed in rails about
780px wide. That is 1 GB of images for a handful of pages.

This caps every image at MAX_EDGE on the long side — still generous for the
full-size lightbox on a retina screen, and far more than the inline size —
and moves photographic PNGs to JPEG, which is where most of the weight is.
PNGs that actually use transparency (the logos) stay PNG.

Renaming .png to .jpg means every reference has to move with it, so the
script returns the map and rewrite_refs.py applies it. Originals remain in
git history.

Run from the repository root:  python3 tools/optimise_images.py [--dry-run]
"""
from PIL import Image
import json, os, sys

Image.MAX_IMAGE_PIXELS = None

MAX_EDGE = 1920
JPEG_Q = 82
SKIP_DIRS = {'.git', 'tools'}
EXTS = {'.png', '.jpg', '.jpeg'}


def images(root='.'):
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for f in filenames:
            if os.path.splitext(f)[1].lower() in EXTS:
                yield os.path.join(dirpath, f)


def has_alpha(im):
    if im.mode not in ('RGBA', 'LA', 'P'):
        return False
    return im.convert('RGBA').getchannel('A').getextrema()[0] < 250


def main():
    dry = '--dry-run' in sys.argv
    renames, before, after = {}, 0, 0

    for path in sorted(images()):
        size_in = os.path.getsize(path)
        before += size_in
        im = Image.open(path)

        if max(im.size) > MAX_EDGE:
            scale = MAX_EDGE / max(im.size)
            im = im.resize((max(1, round(im.width * scale)),
                            max(1, round(im.height * scale))), Image.LANCZOS)

        ext = os.path.splitext(path)[1].lower()
        keep_png = ext == '.png' and has_alpha(Image.open(path))

        if keep_png:
            out = path
            if not dry:
                im.save(out, 'PNG', optimize=True)
        elif ext == '.png':
            out = os.path.splitext(path)[0] + '.jpg'
            if out != path:
                renames[os.path.basename(path)] = os.path.basename(out)
            if not dry:
                im.convert('RGB').save(out, 'JPEG', quality=JPEG_Q,
                                       optimize=True, progressive=True)
                os.remove(path)
        else:
            out = path                      # keep the exact filename, case included
            if not dry:
                im.convert('RGB').save(out, 'JPEG', quality=JPEG_Q,
                                       optimize=True, progressive=True)

        after += os.path.getsize(out) if os.path.exists(out) else size_in

    if not dry:
        with open('tools/image-renames.json', 'w') as fh:
            json.dump(renames, fh, indent=1, sort_keys=True)

    print(f'{before/1048576:.0f} MB -> {after/1048576:.0f} MB '
          f'({100 - after/before*100:.0f}% smaller), {len(renames)} renamed')


if __name__ == '__main__':
    main()
