import base64, re, subprocess, sys, os
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
def get(url, binary=False):
    r = subprocess.run(["curl","-sS","-m","40","-A",UA,url], capture_output=True)
    if r.returncode: sys.exit("curl failed: " + r.stderr.decode()[:200])
    return r.stdout if binary else r.stdout.decode()

def pack(css_url):
    css = get(css_url)
    for u in sorted(set(re.findall(r'url\((https://fonts\.gstatic\.com/[^)]+)\)', css))):
        data = get(u, binary=True)
        css = css.replace(u, "data:font/woff2;base64," + base64.b64encode(data).decode())
    return css

packs = {
 "aurora": "https://fonts.googleapis.com/css2?family=Unbounded:wght@300;500;700&family=Manrope:wght@400;500;600&display=swap",
 "slipstream": "https://fonts.googleapis.com/css2?family=Syne:wght@500;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap",
}
for name, url in packs.items():
    css = pack(url)
    open("%s/fonts.inline.css" % name, "w").write(css)
    print(name, "fonts packed", len(css)//1024, "KB")
