import { readFileSync } from 'node:fs';
import { browser, sleep } from './lib.mjs';
const AXE = readFileSync('axe3.js', 'utf8').trim().replace(/;$/, '');
const b = await browser(9406, '/tmp/tell-qa/as-' + Date.now());
const t = await b.tab('/', 1440, 900);
for (const [w, h] of [[1440, 900], [390, 844]]) {
  await t.size(w, h, w < 800); await t.nav('/play?seed=1'); await sleep(300); await t.ev(`localStorage.clear(); return 1`);
  await t.nav('/host'); await sleep(2000);
  console.log(`empty ${w}`.padEnd(14), JSON.stringify(await t.ev(`return (${AXE})`)).slice(0, 300));
  await t.ev(`[...document.querySelectorAll('button')].find(b=>b.textContent.includes('sample'))?.click(); await wait(500); const ta=[...document.querySelectorAll('textarea')][2]; Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(ta, 'x'.repeat(300)); ta.dispatchEvent(new Event('input',{bubbles:true})); return 1`); await sleep(600);
  console.log(`people ${w}`.padEnd(14), JSON.stringify(await t.ev(`return (${AXE})`)).slice(0, 300));
  await t.ev(`[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Paste a list')?.click(); return 1`); await sleep(600);
  console.log(`paste ${w}`.padEnd(14), JSON.stringify(await t.ev(`return (${AXE})`)).slice(0, 300));
}
console.log(b.logs.slice(0, 5).join('\n') || 'no errors'); b.close();
