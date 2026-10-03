import { browser, seedHost, sleep } from './lib.mjs';
const b = await browser(9361, '/tmp/tell-qa/ovf');
const R = 'CDEF';
const LONG = ['Maximiliana-Bartholomew-Fitzgera', 'Alexandria Wilhelmina Montgomery', 'Christopher Featherstonehaugh Jr', 'Bea Lindqvist', 'Gus Moreau', 'Pip Calloway'];
const STORY = 'I once spent an entire afternoon trying to pronounce Llanfairpwllgwyngyllgogerychwyrndrobwllllantysiliogogogoch correctly for a pub quiz and still lost.';
const rows = JSON.stringify(LONG.map((name, i) => ({ name, text: i === 0 ? STORY : `Story number ${i} with a fairly ordinary sentence in it.` })));
const roster = `const rows = ${rows}; run({ type: 'setRoster', rows, ids: rows.map((_, i) => 'p_' + i) });`;
const others = `for (const id of ['p_1','p_2','p_3']) run({ type: 'join', playerId: id, name: '' });`;
const me = `run({ type: 'join', playerId: 'u_me', name: 'Maximiliana-Bartholomew-Fitzgera', claimId: 'p_0' });`;
const startAt = (seed) => `run({ type: 'start', seed: ${seed} }, { type: 'beginGuessing', now: Date.now() + 40000 });`;
const guess = `{ const e = g.currentEntry(s); run({ type: 'guess', playerId: 'u_me', entryId: e.id, ownerId: e.ownerId === 'p_1' ? 'p_2' : 'p_1' }); }`;
const finale = roster + others + me + `run({ type: 'start', seed: 4 }); for (let i = 0; i < s.order.length; i++) { run({ type: 'beginGuessing', now: 0 }); const e = g.currentEntry(s); s.players.filter(p => p.id !== e.ownerId).forEach((p, j) => run({ type: 'guess', playerId: p.id, entryId: e.id, ownerId: (j + i) % 2 === 0 ? e.ownerId : s.players.find(q => q.id !== p.id && q.id !== e.ownerId).id })); run({ type: 'reveal', now: 0 }, { type: 'next' }); }`;

const PROBE = `
  const W = innerWidth, out = [];
  const doc = document.documentElement.scrollWidth;
  if (doc > W + 1) out.push('DOCUMENT scrollWidth ' + doc + ' > ' + W);
  const name = (el) => el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ').filter(Boolean).map(c => c.replace(/^_?([a-zA-Z]+)_.*/, '$1')).join('.') : '') + ' "' + (el.textContent || '').trim().slice(0, 30) + '"';
  for (const el of document.querySelectorAll('body *')) {
    if (el.closest('.visually-hidden, canvas, svg, [class*=backdrop]')) continue;
    const cs = getComputedStyle(el);
    if (['auto','scroll'].includes(cs.overflowX) && el.scrollWidth > el.clientWidth + 1) out.push('SCROLLER ' + name(el) + ' ' + el.scrollWidth + '>' + el.clientWidth);
    const r = el.getBoundingClientRect();
    if (r.width && (r.right > W + 1 || r.left < -1) && cs.position !== 'fixed') out.push('PAST EDGE ' + name(el) + ' ' + Math.round(r.left) + '..' + Math.round(r.right));
  }
  return [...new Set(out)].slice(0, 12);`;

const host = await b.tab('/', 360, 740, true);
const phone = await b.tab('/', 360, 740, true);
const report = (label, res) => console.log((res?.length ? '✗ ' : '✓ ') + label + (res?.length ? '\n    ' + res.join('\n    ') : ''));
const SIZES = [[320, 640], [360, 740], [740, 360]];

async function hostState(name, body, url = `/host?transport=local&room=${R}`) {
  await host.size(1280, 720); await host.nav('/play?seed=1'); await sleep(400);
  await host.ev(seedHost(R, body));
  for (const [w, h] of SIZES) { await host.size(w, h, true); await host.nav(url); await sleep(2500); report(`host ${name} ${w}x${h}`, await host.ev(PROBE)); }
}
async function phoneState(name, body, pid = 'u_me') {
  await host.size(1280, 720); await host.nav('/play?seed=1'); await sleep(400);
  await host.ev(seedHost(R, body)); await host.nav(`/host?transport=local&room=${R}`); await sleep(2000);
  for (const [w, h] of SIZES.slice(0, 2)) {
    await phone.size(w, h, true); await phone.nav('/play?seed=1'); await sleep(200);
    await phone.ev(`localStorage.setItem('tell:playerme', JSON.stringify({ playerId: '${pid}', room: '${R}', name: 'Maximiliana-Bartholomew-Fitzgera', key: 'k-t-${pid}', joinedRoom: '${pid}' === 'u_new' ? null : '${R}' })); return 1`);
    await phone.nav(`/play?transport=local&room=${R}&seat=me`); await sleep(2500);
    report(`phone ${name} ${w}x${h}`, await phone.ev(PROBE));
  }
}
// static pages
for (const u of ['/', '/play', '/demo', '/host']) for (const [w, h] of SIZES) { await host.size(w, h, true); await host.nav(u); await sleep(1500); report(`page ${u} ${w}x${h}`, await host.ev(PROBE)); }
// setup studio with people (sample + one very long entry) at phone widths
for (const [w, h] of SIZES.slice(0, 2)) {
  await host.size(w, h, true); await host.nav('/play?seed=1'); await sleep(300); await host.ev(`localStorage.clear(); return 1`);
  await host.nav('/host'); await sleep(1800);
  await host.ev(`[...document.querySelectorAll('button')].find(b=>b.textContent.includes('sample'))?.click(); await wait(500); const ta=[...document.querySelectorAll('textarea')][2]; Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(ta, 'Supercalifragilisticexpialidocious'.repeat(8)); ta.dispatchEvent(new Event('input',{bubbles:true})); return 1`);
  await sleep(600); report(`setup people ${w}x${h}`, await host.ev(PROBE));
}
// setup with long rows
await host.size(360, 740, true); await host.nav('/host'); await sleep(1200);
await host.ev(`localStorage.setItem('tell:setup-draft', JSON.stringify({})); return 1`);
await hostState('lobby', roster + others + me);
await hostState('lobby-live', roster + `run({ type: 'updateSettings', settings: { intake: 'live' } });` + others + me);
await hostState('guessing', roster + others + me + startAt(1) + guess);
await hostState('reveal', roster + others + me + startAt(1) + guess + `run({ type: 'reveal', now: Date.now() - 8000 });`);
await hostState('finale', finale);
await phoneState('join', roster, 'u_new');
await phoneState('lobby', roster + others + me);
await phoneState('lobby-live', roster + `run({ type: 'updateSettings', settings: { intake: 'live' } });` + others + me);
await phoneState('pick', roster + others + `run({ type: 'join', playerId: 'u_me', name: 'Maximiliana-Bartholomew-Fitzgera', claimId: 'p_5' });` + `run({ type: 'start', seed: 2 });` + `while (g.currentEntry(s).ownerId !== 'p_0') { run({ type: 'beginGuessing', now: 0 }, { type: 'reveal', now: 0 }, { type: 'next' }); }` + `run({ type: 'beginGuessing', now: Date.now() + 40000 });`);
await phoneState('waiting', roster + others + me + startAt(1) + guess);
await phoneState('result', roster + others + me + startAt(1) + guess + `run({ type: 'reveal', now: Date.now() - 8000 });`);
await phoneState('final', finale);
console.log(b.logs.slice(0, 10).join('\n') || 'no errors');
b.close();
