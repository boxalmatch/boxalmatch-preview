"""Point every reference at the .jpg that optimise_images.py produced.

Run after optimise_images.py, from the repository root.
"""
import json, os, re, sys

SKIP_DIRS = {'.git', 'tools'}
TEXT_EXTS = {'.html', '.htm', '.css', '.js', '.json', '.md'}


def main():
    renames = json.load(open('tools/image-renames.json'))
    if not renames:
        print('nothing to rewrite')
        return

    # longest first, so "foto_11.PNG" is never half-matched by "foto_1.PNG"
    keys = sorted(renames, key=len, reverse=True)
    pattern = re.compile('|'.join(re.escape(k) for k in keys))

    changed = hits = 0
    for dirpath, dirnames, filenames in os.walk('.'):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for f in filenames:
            if os.path.splitext(f)[1].lower() not in TEXT_EXTS:
                continue
            p = os.path.join(dirpath, f)
            src = open(p, encoding='utf-8', newline='', errors='surrogateescape').read()
            out, n = pattern.subn(lambda m: renames[m.group(0)], src)
            if n:
                open(p, 'w', encoding='utf-8', newline='', errors='surrogateescape').write(out)
                changed += 1
                hits += n
    print(f'rewrote {hits} references across {changed} files')


if __name__ == '__main__':
    main()
