import { browser, seedHost, sleep } from './lib.mjs';
const b = await browser(9350, '/tmp/tell-qa/aud1');
const R = 'TVWX';
const H = `/host?transport=local&room=${R}`;
const roster = `run({ type: 'setRoster', rows: sample, ids: sample.map((_, i) => 'p_' + i) });`;
const joinSome = `run({ type: 'join', playerId: 'p_0', name: '' }, { type: 'join', playerId: 'p_1', name: '' }, { type: 'join', playerId: 'p_2', name: '' }, { type: 'join', playerId: 'u_me', name: 'Ben Marshall' });`;
const start = `run({ type: 'start', seed: 4 }, { type: 'beginGuessing', now: Date.now() + 600000 });`;
const someGuesses = `const e = g.currentEntry(s); s.players.filter(p => p.id !== e.ownerId).slice(0, 4).forEach((p, i) => run({ type: 'guess', playerId: p.id, entryId: e.id, ownerId: i % 2 ? e.ownerId : s.players.find(q => q.id !== p.id && q.id !== e.ownerId).id }));`;
const allIn = `for (const x of s.players) x.connected = true;`;
const only = process.argv[2];

const t = await b.tab('/', 1440, 900);
const want = (k) => !only || only.split(',').includes(k);
if (want('static')) {
  await sleep(1500); await t.shot('01-landing-desktop.png', true);
  await t.size(390, 844, true); await sleep(500); await t.shot('02-landing-mobile.png', true);
  await t.size(1440, 900); await t.nav('/play'); await sleep(1500); await t.shot('03-play-code-desktop.png');
  await t.size(390, 844, true); await sleep(400); await t.shot('04-play-code-mobile.png');
}
if (want('setup')) {
  await t.size(1440, 1000); await t.nav('/play?seed=1'); await sleep(800);
  await t.ev(`localStorage.clear(); return 1`); await t.nav(H); await sleep(1800);
  await t.shot('05-setup-empty.png', true);
  // Studio: sample entries, then one too-long entry, one duplicate name and one missing name.
  await t.ev(`btn('sample')?.click(); await wait(400); const tas=[...document.querySelectorAll('ol textarea')]; setVal(tas[1],'x'.repeat(300)); const n=[...document.querySelectorAll('ol input')]; setVal(n[3], n[0].value); setVal(n[5], ''); await wait(300); return 1`);
  await t.shot('06-setup-errors.png', true);
  await t.ev(`btn('Paste a list').click(); await wait(400); const ta=document.querySelector('dialog textarea'); setVal(ta,'Ada Lovelace: I once taught a goose to code.\\nBo | Fun fact: I ate a bee - by accident.\\nthis line has no name\\n"Cy","Quoted, with comma"'); await wait(300); return 1`);
  await t.shot('07-setup-paste.png', true);
  await t.size(390, 844, true); await sleep(500); await t.shot('08-setup-mobile.png', true);
}
const seedAndShow = async (file, body, w = 1920, h = 1080, m = false, wait = 2500) => {
  await t.size(w, h, m);
  await t.nav('/play?seed=1'); await sleep(600);
  await t.ev(seedHost(R, body)); await t.nav(H); await sleep(wait); await t.shot(file);
};
if (want('lobby')) {
  await seedAndShow('10-lobby.png', roster + joinSome);
  await seedAndShow('11-lobby-1280.png', roster + joinSome, 1280, 720);
  await seedAndShow('12-lobby-portrait.png', roster + joinSome, 390, 844, true);
  await seedAndShow('13-lobby-live.png', `run({ type: 'updateSettings', settings: { intake: 'live' } }); ['Ada', 'Bo', 'Cy'].forEach((n, i) => run({ type: 'join', playerId: 'u' + i, name: n })); run({ type: 'submit', playerId: 'u0', text: 'hello' });`);
  await seedAndShow('14-lobby-hostonly.png', `run({ type: 'updateSettings', settings: { hostOnly: true } });` + roster);
}
if (want('game')) {
  await seedAndShow('20-guessing.png', roster + joinSome + allIn + start + someGuesses, 1920, 1080, false, 6000);
  await seedAndShow('21-guessing-1280.png', roster + joinSome + allIn + start + someGuesses, 1280, 720, false, 5000);
  await seedAndShow('22-guessing-portrait.png', roster + joinSome + allIn + start + someGuesses, 390, 844, true, 5000);
  await seedAndShow('23-locked.png', roster + joinSome + allIn + start + someGuesses + `run({ type: 'lock' });`, 1920, 1080, false, 5000);
  await t.nav('/play?seed=1'); await sleep(600);
  await t.ev(seedHost(R, roster + joinSome + allIn + start + someGuesses + `run({ type: 'reveal', now: Date.now() + 2500 });`)); await t.nav(H); await sleep(3200); await t.shot('24-drumroll.png');
  await seedAndShow('25-reveal.png', roster + joinSome + allIn + start + someGuesses + `run({ type: 'reveal', now: Date.now() - 8000 });`, 1920, 1080, false, 5000);
  await seedAndShow('26-reveal-portrait.png', roster + joinSome + allIn + start + someGuesses + `run({ type: 'reveal', now: Date.now() - 8000 });`, 390, 844, true, 5000);
  await seedAndShow('27-reveal-nobody.png', roster + joinSome + allIn + start + `run({ type: 'reveal', now: Date.now() - 8000 });`, 1920, 1080, false, 5000);
  await seedAndShow('28-hostonly-reveal.png', `run({ type: 'updateSettings', settings: { hostOnly: true } });` + roster + start + `run({ type: 'reveal', now: Date.now() - 8000 }); const e=g.currentEntry(s); run({ type: 'tally', playerIds: s.players.filter(p=>p.id!==e.ownerId).slice(0,3).map(p=>p.id) });`, 1920, 1080, false, 5000);
  await t.ev(`btn('Menu')?.click(); await wait(300); return 1`); await t.shot('29-menu.png');
}
const finale = roster + joinSome + allIn + `run({ type: 'start', seed: 4 }); for (let i = 0; i < s.order.length; i++) { run({ type: 'beginGuessing', now: 0 }); const e = g.currentEntry(s); s.players.filter(p => p.id !== e.ownerId).forEach((p, j) => run({ type: 'guess', playerId: p.id, entryId: e.id, ownerId: (j + i) % 3 === 0 ? e.ownerId : s.players.find(q => q.id !== p.id && q.id !== e.ownerId).id })); run({ type: 'reveal', now: 0 }, { type: 'next' }); }`;
if (want('finale')) {
  await seedAndShow('30-finale.png', finale, 1920, 1080, false, 4000);
  await seedAndShow('31-finale-1280.png', finale, 1280, 720, false, 4000);
  await seedAndShow('32-finale-portrait.png', finale, 390, 844, true, 4000);
  await seedAndShow('33-finale-fun.png', `run({ type: 'updateSettings', settings: { scoring: 'none' } });` + finale, 1920, 1080, false, 4000);
}
if (want('misc')) {
  await t.size(1920, 1080); await t.ev(`localStorage.clear(); return 1`); await t.nav(H + '&sample=1'); await sleep(250); await t.shot('34-boot.png');
  await t.size(1440, 900); await t.nav('/demo'); await sleep(4000); await t.shot('35-demo.png', true);
}
console.log(b.logs.join('\n') || 'no errors');
b.close();
