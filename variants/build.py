import json, math, re, os
from PIL import Image, ImageDraw, ImageFilter

SRC = open('/home/user/breath-pacer/index.html').read()

AURORA_BRAND = '  <div class="brand"><div class="bm">the<br><b>wind</b></div>' \
               '<div class="bs">breathe with the bar. breathe to sleep.</div></div>'
SLIP_BRAND   = '  <div class="brand"><div class="bm">The<br>Wind</div>' \
               '<div class="bs">Every rep on the exhale. Every night on the long out-breath.</div></div>'

RINGWRAP_OLD = '''    <div id="ringwrap">
      <svg id="ring" viewBox="0 0 100 100">
        <circle class="track" cx="50" cy="50" r="46"/>
        <circle class="fill" cx="50" cy="50" r="46"/>
      </svg>
      <div id="ringin">
        <div id="word"><span></span></div>
        <div id="num"></div>
      </div>
    </div>'''

AURORA_RINGWRAP = '''    <div id="ringwrap">
      <div id="orb"></div>
      <svg id="ring" viewBox="0 0 100 100">
        <circle class="track" cx="50" cy="50" r="46"/>
        <circle class="fill" cx="50" cy="50" r="46"/>
      </svg>
      <div id="ringin">
        <div id="word"><span></span></div>
        <div id="num"></div>
      </div>
    </div>'''

SLIP_RINGWRAP = '''    <div id="ringwrap">
      <svg id="ring" viewBox="0 0 100 100">
        <circle class="track" cx="50" cy="50" r="46"/>
        <circle class="fill" cx="50" cy="50" r="46"/>
      </svg>
      <div id="ringin">
        <div id="word"><span></span></div>
        <div id="num"></div>
      </div>
      <div id="wbar"><span></span></div>
    </div>'''

WIND_SVG = '''<svg id="wind" viewBox="0 0 390 844" preserveAspectRatio="none" aria-hidden="true">
  <path d="M-40 180 C 80 150, 160 250, 260 200 S 420 140, 460 190" stroke-width="1.2" stroke-opacity=".5" style="animation-delay:-1s"/>
  <path d="M-40 262 C 100 242, 180 332, 280 282 S 420 232, 460 272" stroke-width="1" stroke-opacity=".3" style="animation-delay:-4s"/>
  <path d="M-40 372 C 60 352, 200 432, 300 382 S 420 342, 460 372" stroke-width="1.6" stroke-opacity=".62" style="animation-delay:-2.4s"/>
  <path d="M-40 486 C 120 466, 200 546, 320 496 S 420 456, 460 486" stroke-width=".9" stroke-opacity=".26" style="animation-delay:-6.2s"/>
  <path d="M-40 604 C 80 584, 220 654, 320 614 S 420 574, 460 604" stroke-width="1.2" stroke-opacity=".4" style="animation-delay:-7.6s"/>
</svg>'''

SETRING_OLD = '''function setRing(p){                       /* p: 0 empty .. 1 full */
  p = Math.max(0, Math.min(1, p));
  elRingFill.style.strokeDashoffset = CIRC * (1 - p);
}'''
SETRING_NEW = '''function setRing(p){                       /* p: 0 empty .. 1 full */
  p = Math.max(0, Math.min(1, p));
  elRingFill.style.strokeDashoffset = CIRC * (1 - p);
  if(elOrb) elOrb.style.transform = "scale(" + (0.52 + 0.48*p).toFixed(4) + ")";
  if(elWbar) elWbar.style.width = (p*100).toFixed(2) + "%";
}'''

VARS_OLD = '    elRingFill = document.querySelector("#ring .fill");'
VARS_NEW = '''    elRingFill = document.querySelector("#ring .fill"),
    elOrb = document.getElementById("orb"),
    elWbar = document.querySelector("#wbar span");'''

FIT_OLD = '''function fitWord(w){
  var avail = elRingWrap.clientWidth * 0.64;
  if(!w || avail < 60) return;
  var size = Math.min(window.innerWidth*0.30, window.innerHeight*0.20);'''
FIT_NEW = '''function fitWord(w){
  var avail = elRingWrap.clientWidth * WORDFIT.avail;
  if(!w || avail < 60) return;
  var size = Math.min(window.innerWidth*WORDFIT.w, window.innerHeight*WORDFIT.h);'''

SHOW_OLD = '''  for(var i=0;i<ids.length;i++) document.getElementById("s-"+ids[i]).classList.toggle("on", ids[i] === id);'''
SHOW_NEW = '''  for(var i=0;i<ids.length;i++) document.getElementById("s-"+ids[i]).classList.toggle("on", ids[i] === id);
  document.body.classList.toggle("run", id === "run");'''

def pal(d):
    def row(m):
        return ('{"in":%s, hold:%s,\n      out:%s, empty:%s,\n      getset:%s, done:%s}'
                % tuple(json.dumps(m[k]) for k in ["in","hold","out","empty","getset","done"]))
    return 'var PAL = {\n  0: %s,\n  1: %s\n};' % (row(d[0]), row(d[1]))

AURORA_PAL = pal({
 0:{"in":["#0d1130","#ffffff","#7ff0ff"], "hold":["#171043","#ffffff","#9f70ff"],
    "out":["#23101c","#fff0e6","#ffb38a"], "empty":["#07060f","#8d86a8","#3a3352"],
    "getset":["#0a0918","#ffffff","#7ff0ff"], "done":["#0a0918","#f3efff","#7ff0ff"]},
 1:{"in":["#080a18","#b9c6dd","#4a8fa8"], "hold":["#0d0a20","#b6a8cf","#5d4c8a"],
    "out":["#170b12","#d8b8a4","#9a6a4e"], "empty":["#04040a","#5c5570","#241f33"],
    "getset":["#0a0918","#b9c6dd","#4a8fa8"], "done":["#05040c","#b9c6dd","#4a8fa8"]}})

SLIP_PAL = pal({
 0:{"in":["#101a24","#eef0e9","#e8c872"], "hold":["#16202a","#eef0e9","#f0dca0"],
    "out":["#1a1410","#f4ece0","#d99b5a"], "empty":["#070b10","#6d7a85","#2c3742"],
    "getset":["#0b1016","#eef0e9","#e8c872"], "done":["#0b1016","#eef0e9","#e8c872"]},
 1:{"in":["#080d12","#98a5ae","#8a7642"], "hold":["#0b1117","#9aa4ad","#94814f"],
    "out":["#120d09","#ab9683","#7d5a34"], "empty":["#04070a","#4d5860","#1b232b"],
    "getset":["#0b1016","#98a5ae","#8a7642"], "done":["#05080c","#98a5ae","#8a7642"]}})

THEMES = {
 'aurora': dict(
   bg='#0a0918',
   fonts='<link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@300;500;700&family=Manrope:wght@400;500;600&display=swap" rel="stylesheet">',
   brand=AURORA_BRAND, ringwrap=AURORA_RINGWRAP, extra='', pal=AURORA_PAL, titlecase=False,
   fit='var WORDFIT = {avail:0.72, w:0.22, h:0.16};'),
 'slipstream': dict(
   bg='#0b1016',
   fonts='<link href="https://fonts.googleapis.com/css2?family=Syne:wght@500;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">',
   brand=SLIP_BRAND, ringwrap=SLIP_RINGWRAP, extra=WIND_SVG, pal=SLIP_PAL, titlecase=True,
   fit='var WORDFIT = {avail:0.70, w:0.24, h:0.17};'),
}

def build(name, t):
    s = SRC
    def sub(old, new, count=1):
        nonlocal s
        assert s.count(old) >= 1, "missing: " + old[:70]
        s = s.replace(old, new, count)
    sub('<title>Breath</title>', '<title>The Wind</title>')
    sub('<meta name="theme-color" content="#04060c">', '<meta name="theme-color" content="%s">' % t['bg'])
    sub('<link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Space+Grotesk:wght@400;500;600&display=swap" rel="stylesheet">', t['fonts'])
    css = open('%s/theme.css' % name).read().rstrip('\n')
    s = re.sub(r'<style>\n.*?\n</style>', lambda m: '<style>\n' + css + '\n</style>', s, count=1, flags=re.S)
    sub('<section id="s-mode" class="screen on">\n  <div class="spacer"></div>',
        '<section id="s-mode" class="screen on">\n' + t['brand'] + '\n  <div class="spacer"></div>')
    # row-pattern: the two pattern chips need a full-width row in both faces
    sub('<div class="row"><span class="lbl">Pattern</span>',
        '<div class="row stack"><span class="lbl">Pattern</span>')
    sub(RINGWRAP_OLD, t['ringwrap'])
    if t['extra']:
        sub('<div id="bg"></div>', '<div id="bg"></div>\n' + t['extra'])
    if t['titlecase']:
        sub('<div class="t">LIFT</div>', '<div class="t">Lift</div>')
        sub('<div class="t">BREATHE</div>', '<div class="t">Breathe</div>')
    sub(VARS_OLD, VARS_NEW)
    sub(SETRING_OLD, SETRING_NEW)
    sub(FIT_OLD, t['fit'] + '\n' + FIT_NEW)
    sub(SHOW_OLD, SHOW_NEW)
    s = s.replace('"#04060c"', '"%s"' % t['bg'])
    s = re.sub(r'var PAL = \{.*?\n\};', lambda m: t['pal'], s, count=1, flags=re.S)
    assert '#04060c' not in s and 'Rajdhani' not in s, 'leftover old theme'
    open('%s/index.html' % name, 'w').write(s)
    man = {"name":"The Wind","short_name":"Wind","start_url":"./index.html","display":"standalone",
           "orientation":"portrait","background_color":t['bg'],"theme_color":t['bg'],
           "icons":[{"src":"icon-192.png","sizes":"192x192","type":"image/png"},
                    {"src":"icon-512.png","sizes":"512x512","type":"image/png"},
                    {"src":"icon-512.png","sizes":"512x512","type":"image/png","purpose":"maskable"}]}
    open('%s/manifest.webmanifest' % name,'w').write(json.dumps(man, indent=2) + '\n')
    print(name, 'index.html', len(s), 'bytes')

for n, t in THEMES.items():
    build(n, t)
