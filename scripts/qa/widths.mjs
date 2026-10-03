import { browser, sleep } from './lib.mjs';
const b = await browser(9397, '/tmp/tell-qa/w-' + Date.now());
const t = await b.tab('/', 1440, 900);
for (const w of [1920, 1440, 1024, 390]) for (const u of ['/', '/host', '/demo', '/play']) {
  await t.size(w, 900, w < 800); await t.nav(u); await sleep(1800);
  const r = await t.ev(`const m=document.querySelector('.page'); if(!m) return 'no .page'; const cs=getComputedStyle(m); const b=m.getBoundingClientRect(); return [Math.round(b.left + parseFloat(cs.paddingLeft)), Math.round(b.right - parseFloat(cs.paddingRight)), document.documentElement.scrollWidth > innerWidth ? 'HSCROLL' : '']`);
  console.log(String(w).padEnd(5), u.padEnd(6), JSON.stringify(r));
}
b.close();
