import { browser, seedHost, sleep } from './lib.mjs';
// Host menu with the join info (not host-only), at several sizes: screenshots (audit/menu-*) and a sideways-overflow check.
const b = await browser(9464, '/tmp/tell-qa/menu');
const R = 'FDC7', H = `/host?transport=local&room=${R}&scene=flat`;
const t = await b.tab('/', 1920, 1080);
await t.nav('/play?seed=1'); await sleep(300);
await t.ev(seedHost(R, `run({ type: 'setRoster', rows: sample.slice(0, 3), ids: ['p_0','p_1','p_2'] }); run({ type: 'start', seed: 1 }, { type: 'beginGuessing', now: Date.now() + 60000 });`));
for (const [w, h, m] of [[1920, 1080], [1440, 900], [1280, 720], [910, 520], [390, 844, true]]) {
  await t.size(w, h, !!m); await t.nav(H); await sleep(3000);
  const r = await t.ev(`[...document.querySelectorAll('button')].find(b=>b.getAttribute('aria-label')==='Menu')?.click(); await wait(500); const d=document.querySelector('dialog[open]'); if(!d) return 'no dialog'; const over=[...d.querySelectorAll('*')].filter(e=>e.getBoundingClientRect().right > d.getBoundingClientRect().right - 1 + 0.5).map(e=>e.tagName+'.'+String(e.className).slice(0,20)); return { sideways: d.scrollWidth > d.clientWidth, pastEdge: over.slice(0,4), w: Math.round(d.getBoundingClientRect().width) }`);
  console.log(w, h, JSON.stringify(r));
  await t.shot(`menu-${w}x${h}.png`);
}
console.log(b.logs.slice(0, 5).join('\n') || 'no errors'); b.close();
