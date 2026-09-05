import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const v = process.argv[2];
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const errs = [];
p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
p.on('console', m => { if (m.type() === 'error' && !/serviceWorker|sw\.js/i.test(m.text())) errs.push('CONSOLE ' + m.text()); });
const shot = n => p.screenshot({ path: `v-${v}-${n}.png` });
await p.goto('file://' + process.cwd() + '/' + v + '/index.html'); await p.waitForTimeout(1200);
await shot('1-mode');
await p.click('[data-mode="lift"]'); await p.waitForTimeout(400); await shot('2-lift');
await p.click('#b-tune'); await p.waitForTimeout(300); await shot('3-adjust');
await p.click('[data-go="mode"]'); await p.waitForTimeout(300);
await p.click('[data-mode="breathe"]'); await p.waitForTimeout(400); await shot('4-breathe');
await p.click('[data-go="mode"]'); await p.waitForTimeout(200);
await p.click('[data-mode="lift"]'); await p.waitForTimeout(200);
await p.click('[data-start]');
await p.waitForTimeout(1500); await shot('5-getset');          // GET SET 3s
await p.waitForTimeout(3300); await shot('6-in');              // IN 4s  (t≈4.8)
await p.waitForTimeout(3400); await shot('7-hold');            // HOLD 2s (t≈8.2)
await p.waitForTimeout(2500); await shot('8-out');             // OUT 6s (t≈10.7)
const fit = await p.evaluate(() => { const w=document.getElementById('word'), s=w.firstElementChild, r=s.getBoundingClientRect();
  return {word:s.textContent, px:Math.round(parseFloat(getComputedStyle(w).fontSize)), spanW:Math.round(r.width), inView: r.left>=0 && r.right<=390}; });
await p.click('#b-rest'); await p.waitForTimeout(3000); await shot('9-rest');
// jump to READY by draining the rest: fast-forward the session clock
await p.evaluate(() => { const S = window.BP.S; for (let i=S.idx; i<S.steps.length; i++){ if (S.steps[i].k==='ready'){ S.steps.splice(S.idx, i-S.idx); break; } } S.stepStart = window.BP.now() - 12; });
await p.waitForTimeout(600); await shot('10-ready');
await p.click('#endbtn'); await p.waitForTimeout(300); await shot('11-endarm');
await p.click('#endbtn'); await p.waitForTimeout(400);
console.log(v, JSON.stringify(fit), 'errors:', errs.length ? errs.join(' | ') : 'none');
await b.close();
