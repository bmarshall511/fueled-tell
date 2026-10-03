import { browser, seedHost, sleep } from './lib.mjs';
const b = await browser(9351, '/tmp/tell-qa/aud2');
const R = 'CDEF';
const H = `/host?transport=local&room=${R}`;
const P = `/play?transport=local&room=${R}&seat=me`;
const roster = `run({ type: 'setRoster', rows: sample, ids: sample.map((_, i) => 'p_' + i) });`;
const others = `for (const id of ['p_0','p_1','p_2','p_3']) run({ type: 'join', playerId: id, name: '' });`;
const me = `run({ type: 'join', playerId: 'u_me', name: 'Ben Marshall' });`;
const start = `run({ type: 'start', seed: 4 }, { type: 'beginGuessing', now: Date.now() + 40000 });`;
const myGuess = (right) => `{ const e = g.currentEntry(s); run({ type: 'guess', playerId: 'u_me', entryId: e.id, ownerId: ${right ? 'e.ownerId' : "s.players.find(q => q.id !== 'u_me' && q.id !== e.ownerId).id"} }); }`;
const finale = roster + others + me + `run({ type: 'start', seed: 4 }); for (let i = 0; i < s.order.length; i++) { run({ type: 'beginGuessing', now: 0 }); const e = g.currentEntry(s); s.players.filter(p => p.id !== e.ownerId).forEach((p, j) => run({ type: 'guess', playerId: p.id, entryId: e.id, ownerId: (j + i) % 3 === 0 ? e.ownerId : s.players.find(q => q.id !== p.id && q.id !== e.ownerId).id })); run({ type: 'reveal', now: 0 }, { type: 'next' }); }`;

const host = await b.tab('/', 1280, 720);
const phone = await b.tab('/', 390, 844, true);
const idFor = (pid) => `localStorage.setItem('tell:playerme', JSON.stringify({ playerId: '${pid}', room: '${R}', name: 'Ben Marshall', key: 'k-test-${pid}', joinedRoom: '${pid}' === 'u_new' ? null : '${R}' })); return 1`;

async function state(name, body, { pid = 'u_me', wait = 4000, desktop = true } = {}) {
  await host.nav('/play?seed=1'); await sleep(500);
  await host.ev(seedHost(R, body));
  await host.nav(H); await sleep(2500);
  await phone.size(390, 844, true);
  await phone.nav('/play?seed=1'); await sleep(300); await phone.ev(idFor(pid));
  await phone.nav(P); await sleep(wait);
  await phone.shot(`p-${name}-m.png`);
  if (desktop) { await phone.size(1440, 900); await sleep(700); await phone.shot(`p-${name}-d.png`); }
}
await state('join-claim', roster, { pid: 'u_new' });
await state('lobby', roster + others + me);
await state('lobby-live', `run({ type: 'updateSettings', settings: { intake: 'live' } });` + others.replace(/name: ''/g, "name: 'X'") + me + `run({ type: 'submit', playerId: 'u_me', text: 'I once fell asleep at my own surprise party.' });`);
await state('showing', roster + others + me + `run({ type: 'start', seed: 4 });`);
await state('pick', roster + others + me + start);
await state('waiting', roster + others + me + start + myGuess(true));
await state('locked', roster + others + me + start + myGuess(false) + `run({ type: 'lock' });`);
await state('yours', roster + others + me + `run({ type: 'start', seed: 4 }); { const e = g.currentEntry(s); run({ type: 'join', playerId: 'u_mine', name: '', claimId: e.ownerId }); }` + `run({ type: 'beginGuessing', now: Date.now() + 40000 });`, { pid: 'u_mine' });
await state('result-right', roster + others + me + start + myGuess(true) + `run({ type: 'reveal', now: Date.now() - 6000 });`);
await state('result-wrong', roster + others + me + start + myGuess(false) + `run({ type: 'reveal', now: Date.now() - 6000 });`, { desktop: false });
await state('final', finale);
// Not found
await phone.size(390, 844, true); await phone.ev(`localStorage.setItem('tell:playerme', JSON.stringify({ playerId: 'u_x', room: 'QQQQ', name: '' })); return 1`);
await phone.nav('/play?transport=local&room=QQQQ&seat=me'); await sleep(5000); await phone.shot('p-notfound-m.png');
console.log(b.logs.join('\n') || 'no errors');
b.close();
