import re, subprocess, sys, os
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
def get(url, binary=False):
    r = subprocess.run(["curl","-sS","-m","60","-L","-A",UA,url], capture_output=True)
    if r.returncode: sys.exit("curl failed %s: %s" % (url, r.stderr.decode()[:200]))
    return r.stdout if binary else r.stdout.decode()

def latin_faces(css):
    """yield (weight-range, url) for the latin subset of each face"""
    out = []
    for block in re.findall(r'@font-face\s*\{(.*?)\}', css, flags=re.S):
        ur = re.search(r'unicode-range:\s*([^;]+);', block)
        if not ur or not ur.group(1).strip().startswith('U+0000-00FF'): continue
        w = re.search(r'font-weight:\s*([^;]+);', block).group(1).strip()
        u = re.search(r'url\((https://fonts\.gstatic\.com/[^)]+)\)', block).group(1)
        out.append((w, u))
    return out

WANT = {
  "unbounded":  ("Unbounded:wght@200..900", None),
  "manrope":    ("Manrope:wght@200..800", None),
  "syne":       ("Syne:wght@400..800", None),
  "plexmono":   ("IBM+Plex+Mono:wght@400;500", None),
}
for key, (fam, _) in WANT.items():
    css = get("https://fonts.googleapis.com/css2?family=%s&display=swap" % fam)
    faces = latin_faces(css)
    if not faces: sys.exit("no latin faces for " + fam)
    for w, u in faces:
        tag = w.replace(' ', '-')
        fn = "fontsrc/%s-%s.woff2" % (key, tag)
        open(fn, "wb").write(get(u, binary=True))
        print(fn, os.path.getsize(fn), "bytes")

for key, gf in (("unbounded","unbounded"),("manrope","manrope"),("syne","syne"),("plexmono","ibmplexmono")):
    txt = get("https://raw.githubusercontent.com/google/fonts/main/ofl/%s/OFL.txt" % gf)
    if "SIL OPEN FONT LICENSE" not in txt: sys.exit("licence fetch failed for " + gf)
    open("fontsrc/OFL-%s.txt" % key, "w").write(txt)
    print("fontsrc/OFL-%s.txt" % key, txt.splitlines()[0][:80])
