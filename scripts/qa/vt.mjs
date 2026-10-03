import { browser, seedHost, sleep } from './lib.mjs';
const b = await browser(9402, '/tmp/tell-qa/vt-' + Date.now());
const t = await b.tab('/', 1280, 720);
const names = `const m = {}; for (const el of document.querySelectorAll('*')) { const n = getComputedStyle(el).viewTransitionName; if (n && n !== 'none') m[n] = (m[n] || 0) + 1; } return m;`;
for (const u of ['/', '/host', '/demo', '/play']) { await t.nav(u); await sleep(1800); console.log(u.padEnd(6), JSON.stringify(await t.ev(names))); }
// lobby, then press Start inside a real transition and watch for the room-code morph
await t.nav('/play?seed=1'); await sleep(400);
await t.ev(seedHost('VTVT', `run({ type: 'setRoster', rows: sample, ids: sample.map((_, i) => 'p_' + i) });`));
await t.nav('/host?transport=local&room=VTVT'); await sleep(2500);
console.log('lobby ', JSON.stringify(await t.ev(names)));
console.log('start ', await t.ev(`const seen = new Set(); const orig = document.startViewTransition.bind(document); let result = 'no transition';
  document.startViewTransition = (cb) => { const vt = orig(cb); vt.ready.then(() => { result = 'ready: ' + [...document.getAnimations()].map(a => a.effect?.pseudoElement).filter(Boolean).filter(p => !seen.has(p) && seen.add(p)).join(' '); }).catch(e => result = 'failed: ' + e.message); return vt; };
  [...document.querySelectorAll('button')].find(b => b.textContent.includes('Start game')).click(); await wait(400); return result;`));
await sleep(2000);
console.log('game  ', JSON.stringify(await t.ev(names)));
console.log(b.logs.slice(0, 5).join('\n') || 'no errors'); b.close();
