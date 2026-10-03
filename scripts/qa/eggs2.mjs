import { readFileSync } from 'node:fs';
import { browser, seedHost, sleep } from './lib.mjs';
const AXE = readFileSync('axe3.js', 'utf8').trim().replace(/;$/, '');
const b = await browser(9409, '/tmp/tell-qa/eg2-' + Date.now());
const t = await b.tab('/', 1280, 720);
await t.nav('/play?seed=1'); await sleep(300);
await t.ev(seedHost('GAME', `run({ type: 'setRoster', rows: sample, ids: sample.map((_, i) => 'p_' + i) });`));
await t.nav('/host?transport=local&room=GAME'); await sleep(3000);
console.log('lucky tag', await t.ev(`return document.body.innerText.toLowerCase().includes('lucky code')`));
console.log('axe lobby+lucky', JSON.stringify(await t.ev(`return (${AXE})`)).slice(0, 200));
await t.ev(`window.dispatchEvent(new KeyboardEvent('keydown',{key:'?'})); return 1`); await sleep(400);
console.log('axe shortcuts  ', JSON.stringify(await t.ev(`return (${AXE})`)).slice(0, 200));
for (const [w, h] of [[1280, 720], [390, 844]]) { await t.size(w, h, w < 800); await t.nav('/nope'); await sleep(2500); console.log(`axe 404 ${w}`.padEnd(16), JSON.stringify(await t.ev(`return (${AXE})`)).slice(0, 200), await t.ev(`return document.documentElement.scrollWidth > innerWidth`)); }
console.log(b.logs.slice(0, 5).join('\n') || 'no errors'); b.close();
