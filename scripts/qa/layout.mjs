import { browser, seedHost, sleep } from './lib.mjs';
const b = await browser(9371, '/tmp/tell-qa/lay');
const R = 'THHH';
const LONG = ['Maximiliana-Bartholomew-Fitzgera', 'Alexandria Wilhelmina Montgomery', 'Christopher Featherstonehaugh Jr', 'Bea Lindqvist', 'Gus Moreau', 'Pip Calloway'];
const rows = JSON.stringify(LONG.map((name, i) => ({ name, text: `Story number ${i} with a fairly ordinary sentence in it, long enough to wrap twice.` })));
const roster = `const rows = ${rows}; run({ type: 'setRoster', rows, ids: rows.map((_, i) => 'p_' + i) });`;
const others = `for (const id of ['p_1','p_2','p_3','p_4']) run({ type: 'join', playerId: id, name: '' });`;
const start = `run({ type: 'start', seed: 1 }, { type: 'beginGuessing', now: Date.now() + 40000 });`;
const guesses = `{ const e = g.currentEntry(s); for (const id of ['p_1','p_2','p_3']) if (id !== e.ownerId) run({ type: 'guess', playerId: id, entryId: e.id, ownerId: id === 'p_1' ? e.ownerId : 'p_4' }); }`;
const finale = roster + others + `run({ type: 'start', seed: 4 }); for (let i = 0; i < s.order.length; i++) { run({ type: 'beginGuessing', now: 0 }); const e = g.currentEntry(s); s.players.filter(p => p.id !== e.ownerId).forEach((p, j) => run({ type: 'guess', playerId: p.id, entryId: e.id, ownerId: (j + i) % 2 === 0 ? e.ownerId : s.players.find(q => q.id !== p.id && q.id !== e.ownerId).id })); run({ type: 'reveal', now: 0 }, { type: 'next' }); }`;
const STATES = {
  lobby: roster + others,
  guessing: roster + others + start + guesses,
  hostonly: `run({ type: 'updateSettings', settings: { hostOnly: true, intake: 'host' } });` + roster + start,
  drumroll: roster + others + start + guesses + `run({ type: 'reveal', now: Date.now() - 1500 });`,
  reveal: roster + others + start + guesses + `run({ type: 'reveal', now: Date.now() - 9000 });`,
  finale,
};
const SIZES = [[1920, 1080], [1440, 900], [1280, 720], [1024, 768], [910, 520], [800, 600], [768, 1024], [1200, 500], [740, 360], [390, 844], [360, 640]];
const PROBE = `
  const W = innerWidth, H = innerHeight, out = [];
  const vis = (el) => { const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); return cs.visibility !== 'hidden' && cs.display !== 'none' && r.width > 0 && r.height > 0 && !el.closest('.visually-hidden, dialog:not([open]), svg, canvas, [class*=leaving], [class*=backdrop]'); };
  const label = (el) => el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className ? '.' + el.className.split(' ').filter(Boolean).map(c => c.replace(/^_?([a-zA-Z]+)_.*/, '$1')).join('.') : '') + ' "' + (el.textContent || '').trim().replace(/\\s+/g,' ').slice(0, 24) + '"';
  // Leaves: elements with own text, plus buttons and tiles.
  const leaves = [...document.querySelectorAll('main *')].filter((el) => vis(el) && (el.matches('button, kbd, img, [role=img]') || [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) && !el.closest('button') || el.matches('button'));
  const boxes = leaves.filter(vis).map((el) => ({ el, r: el.getBoundingClientRect() }));
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    const a = boxes[i], c = boxes[j];
    if (a.el.contains(c.el) || c.el.contains(a.el)) continue;
    // The lobby's sticky bar intentionally covers roster rows scrolling beneath it.
    if (!!a.el.closest('nav') !== !!c.el.closest('nav') && (a.el.closest('[class*=lobby]') || c.el.closest('[class*=lobby]'))) continue;
    const ix = Math.min(a.r.right, c.r.right) - Math.max(a.r.left, c.r.left), iy = Math.min(a.r.bottom, c.r.bottom) - Math.max(a.r.top, c.r.top);
    if (ix > 2 && iy > 2) out.push('OVERLAP ' + label(a.el) + ' × ' + label(c.el));
  }
  for (const { el, r } of boxes) {
    if (r.right > W + 1 || r.left < -1) out.push('PAST X ' + label(el));
    if (r.bottom > H + 1 && !el.closest('[class*=lobby]')) out.push('PAST Y ' + label(el));
  }
  for (const btn of document.querySelectorAll('main button')) {
    if (!vis(btn)) continue;
    const rg = document.createRange(); rg.selectNodeContents(btn);
    const tops = new Set([...rg.getClientRects()].filter(r => r.width > 1).map((r) => Math.round(r.top / 4)));
    if (tops.size > 2) out.push('WRAPPED ' + label(btn));
  }
  return [...new Set(out)].slice(0, 10);`;
const host = await b.tab('/', 1280, 720);
let fails = 0, total = 0;
for (const [name, body] of Object.entries(STATES)) {
  await host.size(1280, 720); await host.nav('/play?seed=1'); await sleep(400);
  await host.ev(seedHost(R, body));
  for (const [w, h] of SIZES) {
    await host.size(w, h, w < 800); await host.nav(`/host?transport=local&room=${R}`); await sleep(name === 'drumroll' ? 1200 : name === 'finale' ? 4500 : 3500);
    const res = await host.ev(PROBE); total++;
    if (res?.length) { fails++; console.log(`✗ ${name} ${w}x${h}\n    ` + res.join('\n    ')); await host.shot(`lay-${name}-${w}x${h}.png`); }
  }
}
console.log(`${total - fails}/${total} clean`); console.log(b.logs.slice(0, 5).join('\n') || 'no errors'); b.close();
