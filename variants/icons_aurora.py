import math
from PIL import Image, ImageDraw, ImageFilter, ImageChops

S = 2048
def lerp(a,b,t): return tuple(int(round(a[i]+(b[i]-a[i])*t)) for i in range(3))
def hx(h): h=h.lstrip('#'); return tuple(int(h[i:i+2],16) for i in (0,2,4))

def diag_gradient(c1, c2, n=256):
    g = Image.new('RGB', (n, n)); px = g.load()
    for y in range(n):
        for x in range(n):
            px[x, y] = lerp(c1, c2, min(1.0, max(0.0, (x*0.40 + y*0.60)/(n-1))))
    return g

cx = cy = S//2
r  = int(S*0.30)

base = Image.new('RGB', (S, S), hx('#0a0918'))

# outer glow: cyan halo top-left, violet halo bottom-right, added (not blended)
halo = Image.new('RGB', (S, S), (0,0,0))
hd = ImageDraw.Draw(halo)
hd.ellipse([cx-int(r*1.35)-int(r*0.30), cy-int(r*1.35)-int(r*0.34),
            cx+int(r*1.35)-int(r*0.30), cy+int(r*1.35)-int(r*0.34)], fill=(28, 92, 116))
hd.ellipse([cx-int(r*1.30)+int(r*0.32), cy-int(r*1.30)+int(r*0.36),
            cx+int(r*1.30)+int(r*0.32), cy+int(r*1.30)+int(r*0.36)], fill=(70, 44, 128))
halo = halo.filter(ImageFilter.GaussianBlur(S*0.075))
base = ImageChops.add(base, halo)

# the orb
orb  = diag_gradient(hx('#3fd4ff'), hx('#7a35ff')).resize((S, S), Image.BICUBIC)
mask = Image.new('L', (S, S), 0)
ImageDraw.Draw(mask).ellipse([cx-r, cy-r, cx+r, cy+r], fill=255)
mask = mask.filter(ImageFilter.GaussianBlur(S*0.0035))
base.paste(orb, (0, 0), mask)

# inner shading: deepen the lower-right so it reads as a sphere, clipped to the orb
sh = Image.new('L', (S, S), 0)
ImageDraw.Draw(sh).ellipse([cx-int(r*0.5), cy+int(r*0.05), cx+int(r*1.9), cy+int(r*1.9)], fill=175)
sh = sh.filter(ImageFilter.GaussianBlur(S*0.06))
sh = ImageChops.multiply(sh, mask)
base.paste(Image.new('RGB', (S, S), hx('#140c2e')), (0, 0), sh)

# specular highlight, small and tight
hi = Image.new('L', (S, S), 0)
hr = int(r*0.24)
hxp, hyp = cx-int(r*0.40), cy-int(r*0.46)
ImageDraw.Draw(hi).ellipse([hxp-hr, hyp-hr, hxp+hr, hyp+hr], fill=95)
hi = ImageChops.multiply(hi.filter(ImageFilter.GaussianBlur(S*0.035)), mask)
base.paste(Image.new('RGB', (S, S), (255, 255, 255)), (0, 0), hi)

# crisp rim light along the top-left edge
rim = Image.new('L', (S, S), 0)
ImageDraw.Draw(rim).ellipse([cx-r, cy-r, cx+r, cy+r], outline=150, width=int(S*0.006))
cut = Image.new('L', (S, S), 0)
ImageDraw.Draw(cut).ellipse([cx-r+int(r*0.13), cy-r+int(r*0.15), cx+r+int(r*0.13), cy+r+int(r*0.15)], fill=255)
rim = ImageChops.subtract(rim, cut)
rim = rim.filter(ImageFilter.GaussianBlur(S*0.006))
base.paste(Image.new('RGB', (S, S), (233, 250, 255)), (0, 0), rim)

for size, fn in ((512,'icon-512.png'), (192,'icon-192.png'), (180,'icon-180.png')):
    base.resize((size, size), Image.LANCZOS).save('aurora/' + fn)
print('aurora icons rebuilt')
