"""Build the Aurora and Slipstream faces of The Wind from the shipped pacer.

Source: breath-pacer at the commit named in SRC_REF (the claude/breath-pacer-audit-zeodi9
head, PR #1). Every line of logic is carried over unchanged; only the visual layer,
the fonts, the icons and the offline shell's file list differ.
"""
import json, re, os, shutil, sys

SRC_DIR = sys.argv[1] if len(sys.argv) > 1 else '/home/user/wind-src'
SRC_REF = 'f1b2e63'
SRC = open(os.path.join(SRC_DIR, 'index.html')).read()
SW  = open(os.path.join(SRC_DIR, 'sw.js')).read()

# ---------- markup that changes ----------
BRAND_OLD = '  <div class="brand"><i></i>The Wind</div>'
MODES_OLD_RE = re.compile(r'  <div class="modes">\n.*?\n  </div>\n</section>', re.S)

AURORA_BRAND = ('  <div class="brand"><div class="bm">the<br><b>wind</b></div>'
                '<div class="bs">breathe with the bar. breathe to sleep.</div></div>')
AURORA_MODES = '''  <div class="modes">
    <button class="mode lift" data-mode="lift"><span class="tx"><span class="t">Lift</span><span class="s">sets · reps · rest</span></span><i class="chev"></i></button>
    <button class="mode breathe" data-mode="breathe"><span class="tx"><span class="t">Breathe</span><span class="s">cycles</span></span><i class="chev"></i></button>
  </div>
</section>'''
SLIP_BRAND = ('  <div class="brand"><div class="bm">The<br>Wind</div>'
              '<div class="bs">Every rep on the exhale. Every night on the long out-breath.</div></div>')
SLIP_MODES = '''  <div class="modes">
    <button class="mode lift" data-mode="lift"><span class="n">01</span><span class="t">Lift</span><span class="s">sets · reps · rest</span><i class="chev"></i></button>
    <button class="mode breathe" data-mode="breathe"><span class="n">02</span><span class="t">Breathe</span><span class="s">cycles</span><i class="chev"></i></button>
  </div>
</section>'''

RINGWRAP_OLD = '''    <div id="ringwrap">
      <div id="halo"></div>
      <svg id="ring" viewBox="-9 -9 118 118" aria-hidden="true">'''
AURORA_RINGWRAP = '''    <div id="ringwrap">
      <div id="halo"></div>
      <div id="orb"></div>
      <svg id="ring" viewBox="-9 -9 118 118" aria-hidden="true">'''
RINGIN_END_OLD = '''      <div id="ringin">
        <div id="word"><span></span></div>
        <div id="num"></div>
      </div>
    </div>
    <div id="below">'''
SLIP_RINGIN_END = '''      <div id="ringin">
        <div id="word"><span></span></div>
        <div id="num"></div>
      </div>
      <div id="wbar"><span></span></div>
    </div>
    <div id="below">'''

WIND_SVG = '''<svg id="wind" viewBox="0 0 390 844" preserveAspectRatio="none" aria-hidden="true">
  <g class="wa">
    <path d="M-40 128 C 80 98, 160 198, 260 148 S 420 88, 460 138" stroke-width="1.2" stroke-opacity=".55" style="animation-delay:-1s"/>
    <path d="M-40 196 C 100 176, 180 266, 280 216 S 420 166, 460 206" stroke-width=".9" stroke-opacity=".32" style="animation-delay:-3.2s"/>
    <path d="M-40 262 C 60 242, 200 322, 300 272 S 420 232, 460 262" stroke-width="1.6" stroke-opacity=".6" style="animation-delay:-2.1s"/>
    <path d="M-40 640 C 120 620, 200 700, 320 650 S 420 610, 460 640" stroke-width=".9" stroke-opacity=".3" style="animation-delay:-4.4s"/>
    <path d="M-40 706 C 80 686, 220 756, 320 716 S 420 676, 460 706" stroke-width="1.3" stroke-opacity=".45" style="animation-delay:-.6s"/>
    <path d="M-40 772 C 100 752, 180 822, 300 782 S 420 742, 460 772" stroke-width="1" stroke-opacity=".3" style="animation-delay:-3.7s"/>
  </g>
  <g class="wb">
    <path d="M-40 160 C 100 190, 180 100, 280 150 S 420 210, 460 160" stroke-width="1.1" stroke-opacity=".5" style="animation-delay:-2s"/>
    <path d="M-40 230 C 60 250, 200 170, 300 220 S 420 260, 460 230" stroke-width="1.4" stroke-opacity=".55" style="animation-delay:-5.1s"/>
    <path d="M-40 672 C 120 692, 200 612, 320 662 S 420 702, 460 672" stroke-width="1" stroke-opacity=".35" style="animation-delay:-1.4s"/>
    <path d="M-40 740 C 80 760, 220 690, 320 730 S 420 770, 460 740" stroke-width="1.3" stroke-opacity=".45" style="animation-delay:-6.3s"/>
  </g>
</svg>'''

# ---------- the three small logic touches ----------
VARS_OLD = '''    elRingGlow2 = document.querySelector("#ring .glow2"), elRingGlow3 = document.querySelector("#ring .glow3"), elHalo = document.getElementById("halo");'''
VARS_NEW = '''    elRingGlow2 = document.querySelector("#ring .glow2"), elRingGlow3 = document.querySelector("#ring .glow3"), elHalo = document.getElementById("halo"),
    elOrb = document.getElementById("orb"), elWbar = document.querySelector("#wbar span");'''
SETRING_OLD = '''  elRingFill.style.strokeDashoffset = elRingGlow.style.strokeDashoffset = elRingGlow2.style.strokeDashoffset = elRingGlow3.style.strokeDashoffset = CIRC * (1 - p);
'''
SETRING_NEW = '''  elRingFill.style.strokeDashoffset = elRingGlow.style.strokeDashoffset = elRingGlow2.style.strokeDashoffset = elRingGlow3.style.strokeDashoffset = CIRC * (1 - p);
  if(elOrb) elOrb.style.transform = "scale(" + (0.42 + 0.36*p).toFixed(4) + ")";
  if(elWbar) elWbar.style.width = (p*100).toFixed(2) + "%";
'''
FIT_OLD_RE = re.compile(r'function fitWord\(w\)\{\n.*?\n\}\n', re.S)
FIT_NEW = '''function fitTo(txt, size, avail){
  elWordI.textContent = txt;
  elWord.style.fontSize = size + "px";
  var wd = elWordI.offsetWidth, pass = 0;
  while(wd > avail && wd > 0 && pass++ < 3){
    size = size * (avail / wd);
    elWord.style.fontSize = size + "px";
    wd = elWordI.offsetWidth;
  }
  return size;
}
/* One size for IN, HOLD and OUT, fitted to the widest of them, so the word never
   changes size between phases; the line box is fixed to it so nothing below moves.
   Longer transitional words (GET SET, READY) shrink to fit inside that same box. */
function fitWord(w){
  var avail = elRingWrap.clientWidth * WORDFIT.avail;
  if(!w || avail < 60) return;
  var base = Math.min(window.innerWidth*WORDFIT.w, window.innerHeight*WORDFIT.h);
  var ref = fitTo(WORDFIT.ref, base, avail);
  elWord.style.lineHeight = (ref * WORDFIT.lh).toFixed(2) + "px";
  fitTo(w, ref, avail);
}
'''
PAINT_OLD = '''function paint(kind){
  var p = PAL[kind] || PAL.done;'''
PAINT_NEW = '''var lastPhase = null;
function paint(kind){
  if(kind !== lastPhase){ document.body.setAttribute("data-phase", kind); lastPhase = kind; }   /* the faces animate against this */
  var p = PAL[kind] || PAL.done;'''

SHOW_OLD = '''  for(var i=0;i<ids.length;i++) document.getElementById("s-"+ids[i]).classList.toggle("on", ids[i] === id);
  if(id !== "run"){'''
SHOW_NEW = '''  for(var i=0;i<ids.length;i++) document.getElementById("s-"+ids[i]).classList.toggle("on", ids[i] === id);
  document.body.classList.toggle("run", id === "run");
  if(id !== "run"){'''

def pal(d):
    keys = ["in","hold","out","empty","getset","ready","pause","done"]
    rows = ['%s:%s' % ('"in"' if k == "in" else k, json.dumps(d[k])) for k in keys]
    return ('var PAL = {' + rows[0] + ', ' + rows[1] + ',\n           ' + rows[2] + ', ' + rows[3] + ',\n           '
            + rows[4] + ', ' + rows[5] + ',\n           ' + rows[6] + ', ' + rows[7] + '};')

THEMES = {
 'aurora': dict(
   bg='#0a0918', brand=AURORA_BRAND, modes=AURORA_MODES, wind=False,
   ringwrap=(RINGWRAP_OLD, AURORA_RINGWRAP), ringin=None,
   fit='var WORDFIT = {ref:"HOLD", lh:1.15, avail:0.66, w:0.21, h:0.145};',
   pal=pal({"in":["#0d1130","#ffffff","#7ff0ff"], "hold":["#171043","#ffffff","#9f70ff"],
            "out":["#23101c","#fff0e6","#ffb38a"], "empty":["#07060f","#8d86a8","#3a3352"],
            "getset":["#0a0918","#f3efff","#7ff0ff"], "ready":["#0a0918","#f3efff","#7ff0ff"],
            "pause":["#07060f","#8d86a8","#3a3352"], "done":["#0a0918","#f3efff","#7ff0ff"]}),
   fonts=[('fontsrc/unbounded-200-900.woff2','fonts/unbounded.woff2'), ('fontsrc/manrope-200-800.woff2','fonts/manrope.woff2'),
          ('fontsrc/OFL-unbounded.txt','fonts/OFL-Unbounded.txt'), ('fontsrc/OFL-manrope.txt','fonts/OFL-Manrope.txt')],
   cache='wind-aurora-v1'),
 'slipstream': dict(
   bg='#0b1016', brand=SLIP_BRAND, modes=SLIP_MODES, wind=True,
   ringwrap=None, ringin=(RINGIN_END_OLD, SLIP_RINGIN_END),
   fit='var WORDFIT = {ref:"HOLD", lh:1.04, avail:0.98, w:0.30, h:0.19};',
   pal=pal({"in":["#101a24","#eef0e9","#e8c872"], "hold":["#16202a","#eef0e9","#f0dca0"],
            "out":["#1a1410","#f4ece0","#d99b5a"], "empty":["#070b10","#6d7a85","#2c3742"],
            "getset":["#0b1016","#eef0e9","#e8c872"], "ready":["#0b1016","#eef0e9","#e8c872"],
            "pause":["#070b10","#6d7a85","#2c3742"], "done":["#0b1016","#eef0e9","#e8c872"]}),
   fonts=[('fontsrc/syne-400-800.woff2','fonts/syne.woff2'), ('fontsrc/plexmono-400.woff2','fonts/plexmono-400.woff2'),
          ('fontsrc/plexmono-500.woff2','fonts/plexmono-500.woff2'),
          ('fontsrc/OFL-syne.txt','fonts/OFL-Syne.txt'), ('fontsrc/OFL-plexmono.txt','fonts/OFL-IBMPlexMono.txt')],
   cache='wind-slipstream-v1'),
}

def build(name, t):
    s = SRC
    def sub(old, new):
        nonlocal s
        assert s.count(old) == 1, "expected exactly one match in %s for: %s" % (name, old[:80])
        s = s.replace(old, new)
    sub('<meta name="theme-color" content="#0d0c0d">', '<meta name="theme-color" content="%s">' % t['bg'])
    css = open('%s/theme.css' % name).read().rstrip('\n')
    s, n = re.subn(r'<style>\n.*?\n</style>', lambda m: '<style>\n' + css + '\n</style>', s, count=1, flags=re.S)
    assert n == 1
    sub(BRAND_OLD, t['brand'])
    s, n = MODES_OLD_RE.subn(lambda m: t['modes'], s, count=1); assert n == 1
    if t['ringwrap']: sub(*t['ringwrap'])
    if t['ringin']:   sub(*t['ringin'])
    if t['wind']:     sub('<div id="bg"></div>', '<div id="bg"></div>\n' + WIND_SVG)
    sub(VARS_OLD, VARS_NEW)
    sub(SETRING_OLD, SETRING_NEW)
    s, n = FIT_OLD_RE.subn(lambda m: t['fit'] + '\n' + FIT_NEW, s, count=1); assert n == 1
    sub(SHOW_OLD, SHOW_NEW)
    sub(PAINT_OLD, PAINT_NEW)
    s, n = re.subn(r'var PAL = \{.*?\};', lambda m: t['pal'], s, count=1, flags=re.S); assert n == 1
    for bad in ('#0d0c0d', 'Rajdhani', 'Space Grotesk', 'class="mark"', 'class="bez"'):
        assert bad not in s, 'leftover from the source theme: ' + bad
    out = name
    open(os.path.join(out, 'index.html'), 'w').write(s)
    # fonts
    os.makedirs(os.path.join(out, 'fonts'), exist_ok=True)
    for src, dst in t['fonts']: shutil.copyfile(src, os.path.join(out, dst))
    # offline shell: same worker, this face's cache name and font files
    sw = SW.replace('var CACHE = "wind-v1";', 'var CACHE = "%s";' % t['cache'])
    shell_fonts = ', '.join('"./%s"' % dst for _, dst in t['fonts'] if dst.endswith('.woff2'))
    sw, n = re.subn(r'  "\./fonts/rajdhani-600\.woff2", "\./fonts/rajdhani-700\.woff2", "\./fonts/space-grotesk\.woff2"\n',
                    '  ' + shell_fonts + '\n', sw); assert n == 1
    assert 'rajdhani' not in sw
    open(os.path.join(out, 'sw.js'), 'w').write(sw)
    man = {"name":"The Wind","short_name":"The Wind","id":"./","scope":"./","start_url":"./index.html","display":"standalone",
           "orientation":"portrait","background_color":t['bg'],"theme_color":t['bg'],
           "icons":[{"src":"icon-192.png","sizes":"192x192","type":"image/png"},
                    {"src":"icon-512.png","sizes":"512x512","type":"image/png"},
                    {"src":"icon-512.png","sizes":"512x512","type":"image/png","purpose":"maskable"}]}
    open(os.path.join(out, 'manifest.webmanifest'), 'w').write(json.dumps(man, indent=2) + '\n')
    print(name, 'index.html', len(s), 'bytes; fonts:', [d for _, d in t['fonts'] if d.endswith('.woff2')])

for n, t in THEMES.items(): build(n, t)
