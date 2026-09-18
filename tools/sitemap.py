"""Write sitemap.xml and robots.txt.

Neither existed, so a crawler had to find all 34 public pages by following
links from the home page — and the event sub-sites sit three clicks deep.

What goes in: every page a stranger is allowed to read. What stays out: the
member area, the API, the 404, and anything that declares noindex — listing a
page in a sitemap while telling robots not to index it is a contradiction a
crawler will report back at you.

lastmod comes from the file's own last commit, so a page that has not changed
does not claim it has.
"""
import io, os, re, subprocess, datetime

ROOT = "/home/user/boxalmatch-preview"
BASE = "https://boxalmatch.com"
os.chdir(ROOT)

SKIP_DIRS = {".git", "node_modules", "members", "tools", "functions", "db"}
SKIP_FILES = {"404.html"}

# The home page first, then the pages, then the event sub-sites. Priority is a
# hint at relative importance within one site — nothing more — so it stays
# coarse rather than pretending to a precision it does not have.
def priority(rel):
    if rel == "index.html": return "1.0"
    if "/" not in rel:      return "0.8"
    if rel.endswith("/home.html"): return "0.7"
    return "0.5"

def lastmod(path):
    try:
        out = subprocess.run(["git", "log", "-1", "--format=%cI", "--", path],
                             capture_output=True, text=True, timeout=20).stdout.strip()
        if out:
            return out[:10]
    except Exception:
        pass
    return datetime.date.today().isoformat()

def public_pages():
    pages = []
    for dp, dn, fs in os.walk("."):
        dn[:] = [d for d in dn if d not in SKIP_DIRS]
        for f in sorted(fs):
            if not f.endswith(".html") or f in SKIP_FILES:
                continue
            path = os.path.join(dp, f)
            html = io.open(path, encoding="utf-8", errors="ignore").read()
            if re.search(r'<meta name="robots"[^>]*noindex', html, re.I):
                continue
            pages.append(path.replace("\\", "/").lstrip("./"))
    # index.html first, then shallowest first, then alphabetical.
    return sorted(pages, key=lambda r: (r != "index.html", r.count("/"), r))

def loc(rel):
    return BASE + "/" + ("" if rel == "index.html" else rel)

if __name__ == "__main__":
    pages = public_pages()
    lines = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for rel in pages:
        lines += ["  <url>",
                  f"    <loc>{loc(rel)}</loc>",
                  f"    <lastmod>{lastmod(rel)}</lastmod>",
                  f"    <priority>{priority(rel)}</priority>",
                  "  </url>"]
    lines.append("</urlset>")
    io.open("sitemap.xml", "w", encoding="utf-8").write("\n".join(lines) + "\n")

    io.open("robots.txt", "w", encoding="utf-8").write(f"""# https://www.robotstxt.org/
User-agent: *
Allow: /

# Behind Cloudflare Access, so a crawler gets a login screen rather than a
# page. Listed anyway: asking politely costs nothing and keeps the login out
# of anyone's index.
Disallow: /members/
Disallow: /api/
Disallow: /cdn-cgi/

Sitemap: {BASE}/sitemap.xml
""")
    print(f"sitemap.xml: {len(pages)} pages")
    print("robots.txt written")
