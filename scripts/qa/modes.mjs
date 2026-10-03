import { browser, seedHost, sleep } from './lib.mjs';
// Forced colors and reduced motion: screenshots of landing, lobby, round, reveal, finale and /play (audit/m-*), and checks that nothing loops under reduced motion.
const b = await browser(9462, '/tmp/tell-qa/modes');
const R = 'TVWX', H = `/host?transport=local&room=${R}`;
const roster = `run({ type: 'setRoster', rows: sample, ids: sample.map((_, i) => 'p_' + i) }); for (const id of ['p_0','p_1','p_2']) run({ type: 'join', playerId: id, name: '' }); run({ type: 'join', playerId: 'u_me', name: 'Ben' }); for (const x of s.players) x.connected = true;`;
const start = `run({ type: 'start', seed: 4 }, { type: 'beginGuessing', now: Date.now() });`;
const guesses = `{ const e = g.currentEntry(s); s.players.filter(p => p.id !== e.ownerId).slice(0,3).forEach(p => run({ type: 'guess', playerId: p.id, entryId: e.id, ownerId: e.ownerId, at: Date.now() })); }`;
const finale = roster + `run({ type: 'start', seed: 4 }); for (let i = 0; i < s.order.length; i++) { run({ type: 'beginGuessing', now: 0 }); const e = g.currentEntry(s); s.players.filter(p => p.id !== e.ownerId).forEach((p, j) => run({ type: 'guess', playerId: p.id, entryId: e.id, ownerId: (j + i) % 3 === 0 ? e.ownerId : s.players.find(q => q.id !== p.id && q.id !== e.ownerId).id })); run({ type: 'reveal', now: 0 }, { type: 'next' }); }`;
const t = await b.tab('/', 1280, 720);
for (const mode of ['forced', 'reduced']) {
  const features = mode === 'forced' ? [{ name: 'forced-colors', value: 'active' }] : [{ name: 'prefers-reduced-motion', value: 'reduce' }];
  await t.ev('return 1');
  await t.emu(features);
  const shoot = async (name, body, wait = 3500) => { await t.nav('/play?seed=1'); await sleep(400); await t.ev(seedHost(R, body)); await t.nav(H); await sleep(wait); await t.shot(`m-${mode}-${name}.png`); };
  await t.nav('/'); await sleep(1500); await t.shot(`m-${mode}-landing.png`);
  await shoot('lobby', roster);
  await shoot('guessing', roster + start + guesses, 4500);
  await shoot('reveal', roster + start + guesses + `run({ type: 'reveal', now: Date.now() - 8000 });`, 4500);
  await shoot('finale', finale, 4000);
  if (mode === 'reduced') console.log('rain visible:', await t.ev(`const r=document.querySelector('[class*=rain]'); return r ? getComputedStyle(r).display : 'none'`), 'backdrop anim:', await t.ev(`return [...document.querySelectorAll('*')].filter(e=>{const a=getComputedStyle(e); return a.animationName!=='none' && a.animationIterationCount==='infinite' && parseFloat(a.animationDuration)>0.01}).map(e=>e.className.toString().slice(0,30)).slice(0,8)`));
  await t.nav('/play?seed=1'); await sleep(300); await t.size(390,844,true); await t.nav('/play'); await sleep(1500); await t.shot(`m-${mode}-play.png`); await t.size(1280,720);
}
console.log(b.logs.slice(0,5).join('\n')||'no errors'); b.close();
