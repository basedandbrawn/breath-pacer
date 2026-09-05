import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'fs';
const v = process.argv[2];
// iPhone 17: 402x874 pt, Dynamic Island top inset 59, home indicator 34
let html = fs.readFileSync(`${v}/index.html`, 'utf8')
  .replaceAll('env(safe-area-inset-top)', '59px').replaceAll('env(safe-area-inset-bottom)', '34px')
  .replaceAll('env(safe-area-inset-left)', '0px').replaceAll('env(safe-area-inset-right)', '0px');
fs.writeFileSync(`${v}/preview17.html`, html);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 3 });
const errs = []; p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
p.on('console', m => { if (m.type()==='error' && !/sw\.js|serviceWorker/i.test(m.text())) errs.push('CONSOLE ' + m.text()); });
const shot = n => p.screenshot({ path: `i17-${v}-${n}.png` });
const geo = async () => p.evaluate(() => {
  const r = id => { const e = document.getElementById(id); const b = e.getBoundingClientRect(); return {y:Math.round(b.top), h:Math.round(b.height)}; };
  const w = document.getElementById('word');
  return { word: w.firstElementChild.textContent, px: Math.round(parseFloat(getComputedStyle(w).fontSize)), lh: getComputedStyle(w).lineHeight,
           wordBox: r('word'), num: r('num'), ringin: r('ringin'), below: r('below') };
});
await p.goto('file://' + process.cwd() + `/${v}/preview17.html`); await p.waitForTimeout(1200);
await shot('1-mode');
await p.click('[data-mode="lift"]'); await p.waitForTimeout(400); await shot('2-lift');
await p.click('#b-tune'); await p.waitForTimeout(300); await shot('3-adjust');
const scrollH = await p.evaluate(() => { const s = document.querySelector('#s-setup .scroll'); return {scroll: s.scrollHeight, client: s.clientHeight}; });
await p.click('[data-go="mode"]'); await p.waitForTimeout(300);
await p.click('[data-mode="breathe"]'); await p.waitForTimeout(400); await shot('4-breathe');
await p.click('[data-go="mode"]'); await p.waitForTimeout(200); await p.click('[data-mode="lift"]'); await p.waitForTimeout(200);
await p.click('[data-start]');
await p.waitForTimeout(1500); await shot('5-getset'); const gGet = await geo();
await p.waitForTimeout(3300); await shot('6-in');     const gIn = await geo();
await p.waitForTimeout(3400); await shot('7-hold');   const gHold = await geo();
await p.waitForTimeout(2500); await shot('8-out');    const gOut = await geo();
await p.click('#b-rest'); await p.waitForTimeout(3000); await shot('9-rest');
await p.evaluate(() => { const S = window.BP.S; for (let i=S.idx; i<S.steps.length; i++){ if (S.steps[i].k==='ready'){ S.steps.splice(S.idx, i-S.idx); break; } } S.stepStart = window.BP.now() - 12; });
await p.waitForTimeout(700); await shot('10-ready'); const gReady = await geo();
await p.click('#endbtn'); await p.waitForTimeout(300); await shot('11-endarm');
console.log(v, 'errors:', errs.length ? errs.join(' | ') : 'none');
console.log('  lift+adjust scroll:', JSON.stringify(scrollH));
for (const [k,g] of Object.entries({getset:gGet, in:gIn, hold:gHold, out:gOut, ready:gReady})) console.log('  ', k.padEnd(6), JSON.stringify(g));
await b.close();
