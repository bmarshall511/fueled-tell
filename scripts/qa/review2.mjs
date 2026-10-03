import { browser, seedHost, sleep } from './lib.mjs';
const b = await browser(9411, '/tmp/tell-qa/rv2-' + Date.now());
const host = await b.tab('/', 1280, 720);
const phone = await b.tab('/', 390, 844, true);
const R = 'GAME';
const roster = `run({ type: 'setRoster', rows: sample, ids: sample.map((_, i) => 'p_' + i) }); for (const id of ['p_1','p_2','p_3','p_4','p_5']) run({ type: 'join', playerId: id, name: '' }); run({ type: 'join', playerId: 'u_me', name: 'Ben' });`;
const T0 = 'const T = Date.now() - 10000;';
const reveal = (who) => `${T0} run({ type: 'start', seed: 1 }, { type: 'beginGuessing', now: T }); const e = g.currentEntry(s); const others = s.players.filter(p => p.id !== e.ownerId && p.claimed); ${who} run({ type: 'reveal', now: Date.now() - 9000 });`;
async function seed(body, w = 1280, h = 720) { await host.size(w, h, w < 800); await host.nav('/play?seed=1'); await sleep(250); await host.ev(seedHost(R, body)); await host.nav(`/host?transport=local&room=${R}`); await sleep(6500); }
async function phoneShot(name) { await phone.nav('/play?seed=1'); await sleep(200); await phone.ev(`localStorage.setItem('tell:playerme', JSON.stringify({ playerId: 'u_me', room: '${R}', name: 'Ben', key: 'k-rv', joinedRoom: '${R}' })); return 1`); await phone.nav(`/play?transport=local&room=${R}&seat=me`); await sleep(3500); await phone.shot(name); }
const meld = reveal(`others.forEach((p, i) => run({ type: 'guess', playerId: p.id, entryId: e.id, ownerId: e.ownerId, at: T + 400 + i * 2500 }));`);
await seed(roster); await host.shot('rv-lucky.png');
await host.ev(`window.dispatchEvent(new KeyboardEvent('keydown',{key:'?'})); return 1`); await sleep(500); await host.shot('rv-shortcuts.png');
await seed(roster + meld); await host.shot('rv-meld.png'); await phoneShot('rv-p-meld.png');
await seed(roster + meld, 390, 844); await host.shot('rv-meld-portrait.png');
await seed(roster + reveal(`const wrong = s.players.find(p => p.id !== e.ownerId && p.id !== 'u_me' && !p.claimed) ?? s.players.find(p => p.id !== e.ownerId && p.id !== 'u_me'); others.forEach(p => p.id !== wrong.id && run({ type: 'guess', playerId: p.id, entryId: e.id, ownerId: wrong.id, at: T + 4000 }));`)); await host.shot('rv-herd.png'); await phoneShot('rv-p-herd.png');
await seed(roster + `run({ type: 'start', seed: 1 }, { type: 'beginGuessing', now: Date.now() + 30000 });`);
await host.ev(`for (const k of ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a']) window.dispatchEvent(new KeyboardEvent('keydown',{key:k})); return 1`); await sleep(1500); await host.shot('rv-retro.png');
const fin = roster + `run({ type: 'start', seed: 4 }); for (let i = 0; i < s.order.length; i++) { run({ type: 'beginGuessing', now: 0 }); const e = g.currentEntry(s); s.players.filter(p => p.id !== e.ownerId).forEach((p, j) => run({ type: 'guess', playerId: p.id, entryId: e.id, ownerId: (j + i) % 3 === 0 ? e.ownerId : s.players.find(q => q.id !== p.id && q.id !== e.ownerId).id })); run({ type: 'reveal', now: 0 }, { type: 'next' }); }`;
await seed(fin); await host.shot('rv-finale.png'); await phoneShot('rv-p-final.png');
await seed(fin, 390, 844); await host.shot('rv-finale-portrait.png');
// yours screen with tip
await seed(roster + `run({ type: 'start', seed: 1 }); { const e = g.currentEntry(s); run({ type: 'join', playerId: 'u_mine', name: '', claimId: e.ownerId }); } run({ type: 'beginGuessing', now: Date.now() + 40000 });`);
await phone.nav('/play?seed=1'); await sleep(200); await phone.ev(`localStorage.setItem('tell:playerme', JSON.stringify({ playerId: 'u_mine', room: '${R}', name: '', key: 'k-mine', joinedRoom: '${R}' })); return 1`); await phone.nav(`/play?transport=local&room=${R}&seat=me`); await sleep(3500); await phone.shot('rv-p-yours.png');
for (const [w, h, tag] of [[1280, 720, 'd'], [390, 844, 'm']]) { await host.size(w, h, w < 800); await host.nav('/nope'); await sleep(3000); await host.shot(`rv-404-${tag}.png`); }
await host.size(1280, 720); await host.nav('/'); await sleep(1500); await host.ev(`const h=document.querySelector('header'); for (let i=0;i<5;i++) h.click(); return 1`); await sleep(650); await host.shot('rv-charge.png');
console.log(b.logs.slice(0, 6).join('\n') || 'no errors'); b.close();
