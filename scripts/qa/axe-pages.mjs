import { readFileSync } from 'node:fs';
import { browser, sleep } from './lib.mjs';
const AXE = readFileSync('axe3.js', 'utf8');
const b = await browser(9395, '/tmp/tell-qa/axep-' + Date.now());
const t = await b.tab('/', 1280, 800);
for (const [u, w, h] of [['/', 1280, 800], ['/', 390, 844], ['/host', 1280, 800], ['/host', 390, 844], ['/demo', 1440, 900], ['/play', 390, 844], ['/play', 1440, 900]]) {
  await t.size(w, h, w < 800); await t.nav(u); await sleep(2500);
  console.log(`${u} ${w}`.padEnd(14), JSON.stringify(await t.ev(`return (${AXE.trim().replace(/;$/, '')})`)).slice(0, 400));
}
console.log(b.logs.slice(0, 5).join('\n') || 'no errors'); b.close();
