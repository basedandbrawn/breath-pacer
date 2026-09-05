import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const variant = process.argv[2];
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const errs = [];
p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
await p.goto('file://' + process.cwd() + '/' + variant + '/preview.html');
await p.waitForTimeout(1200);
await p.click('[data-go="lift"]'); await p.waitForTimeout(300);
await p.click('[data-start="lift"]');
// getset 3s, in 4s, hold 2s, out 6s
await p.waitForTimeout(8000);   // 8s -> HOLD
await p.screenshot({ path: `${variant}-p-hold.png` });
await p.waitForTimeout(2500);   // 10.5s -> OUT
await p.screenshot({ path: `${variant}-p-out.png` });
const box = await p.evaluate(() => {
  const w = document.getElementById('word'), s = w.firstElementChild, r = w.getBoundingClientRect();
  return { word: s.textContent, fontSize: getComputedStyle(w).fontSize,
           spanW: Math.round(s.getBoundingClientRect().width), boxW: Math.round(r.width),
           overflowsViewport: s.getBoundingClientRect().right > 390 || s.getBoundingClientRect().left < 0 };
});
console.log(variant, JSON.stringify(box), 'errors:', errs.length ? errs.join('|') : 'none');
await b.close();
