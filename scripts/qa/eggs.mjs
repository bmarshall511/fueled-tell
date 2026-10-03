import { browser, seedHost, sleep } from './lib.mjs';
const b = await browser(9408, '/tmp/tell-qa/eg-' + Date.now());
const host = await b.tab('/', 1280, 720);
const phone = await b.tab('/', 390, 844, true);
const R = 'GAME'; // a lucky code
const roster = `run({ type: 'setRoster', rows: sample, ids: sample.map((_, i) => 'p_' + i) }); for (const id of ['p_1','p_2','p_3']) run({ type: 'join', playerId: id, name: '' }); run({ type: 'join', playerId: 'u_me', name: 'Ben' });`;
const T0 = 'const T = Date.now() - 10000;';
const toReveal = (who) => `${T0} run({ type: 'start', seed: 1 }, { type: 'beginGuessing', now: T }); const e = g.currentEntry(s); const others = s.players.filter(p => p.id !== e.ownerId && p.connected !== false && (p.claimed || p.id === 'u_me')); ${who} run({ type: 'reveal', now: Date.now() - 9000 });`;
async function seed(body) { await host.nav('/play?seed=1'); await sleep(300); await host.ev(seedHost(R, body)); await host.nav(`/host?transport=local&room=${R}`); await sleep(3500); }
const text = (sel) => `return [...document.querySelectorAll('${sel}')].map(e => e.textContent.trim()).filter(Boolean).slice(0,3)`;

// lobby: lucky code + "tell" + "?"
await seed(roster);
console.log('lucky tag      ', await host.ev(`return document.body.innerText.includes('Lucky code')`));
console.log('tell wave      ', await host.ev(`for (const k of 'tell') window.dispatchEvent(new KeyboardEvent('keydown',{key:k})); await wait(100); return document.documentElement.classList.contains('egg-tell')`));
console.log('? dialog       ', await host.ev(`window.dispatchEvent(new KeyboardEvent('keydown',{key:'?'})); await wait(200); const d=[...document.querySelectorAll('dialog')].find(d=>d.open); const t=d?.textContent; d?.close(); return t?.includes('find') ?? false`));

// mind meld + lightning (everyone right, first guess 500ms after opening)
await seed(roster + toReveal(`others.forEach((p, i) => run({ type: 'guess', playerId: p.id, entryId: e.id, ownerId: e.ownerId, at: T + 500 + i * 3000 }));`));
console.log('mind meld      ', await host.ev(`return document.body.innerText.includes('Collective consciousness')`), '| bolts:', await host.ev(`return document.querySelectorAll('[class*=bolt]').length`));
// konami during the round
console.log('retro          ', await host.ev(`for (const k of ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a']) window.dispatchEvent(new KeyboardEvent('keydown',{key:k})); await wait(300); const c=document.querySelector('canvas'); const on=document.documentElement.classList.contains('egg-retro'); return [on, c ? getComputedStyle(c).imageRendering : 'no canvas']`));

// herd: everyone picks the same wrong person
await seed(roster + toReveal(`const wrong = s.players.find(p => p.id !== e.ownerId && !others.slice(0,3).some(o => o.id === p.id)) ?? s.players.find(p => p.id !== e.ownerId); others.slice(0,3).forEach(p => p.id !== wrong.id && run({ type: 'guess', playerId: p.id, entryId: e.id, ownerId: wrong.id, at: T + 4000 }));`));
console.log('herd           ', await host.ev(`return [...document.querySelectorAll('p')].map(p=>p.textContent).find(t=>t.includes('sounded like you')) ?? document.body.innerText.includes('Master of disguise')`));

// phone result + yours tips
await phone.nav('/play?seed=1'); await sleep(200);
await phone.ev(`localStorage.setItem('tell:playerme', JSON.stringify({ playerId: 'u_me', room: '${R}', name: 'Ben', key: 'k-eg', joinedRoom: '${R}' })); return 1`);
await phone.nav(`/play?transport=local&room=${R}&seat=me`); await sleep(3000);
console.log('phone moment   ', await phone.ev(`return [...document.querySelectorAll('.text-glow')].map(e=>e.textContent).join(' | ')`));

// finale: enigma + bolt rain
await seed(roster + `run({ type: 'start', seed: 4 }); for (let i = 0; i < s.order.length; i++) { run({ type: 'beginGuessing', now: 0 }); const e = g.currentEntry(s); s.players.filter(p => p.id !== e.ownerId).forEach((p, j) => run({ type: 'guess', playerId: p.id, entryId: e.id, ownerId: (j + i) % 3 === 0 ? e.ownerId : s.players.find(q => q.id !== p.id && q.id !== e.ownerId).id })); run({ type: 'reveal', now: 0 }, { type: 'next' }); }`);
console.log('enigma         ', await host.ev(`return [...document.querySelectorAll('p')].map(p=>p.textContent).find(t=>t.includes('The Enigma')) ?? 'none'`), '| rain drops:', await host.ev(`return document.querySelectorAll('[class*=drop]').length`));
await phone.nav(`/play?transport=local&room=${R}&seat=me`); await sleep(3000);
console.log('highlight      ', await phone.ev(`return [...document.querySelectorAll('p')].map(p=>p.textContent).find(t=>/You (fooled|spotted|’re the Enigma|played)/.test(t)) ?? 'none'`));

// landing charge, 404, setup legends
await host.nav('/'); await sleep(1500);
console.log('bolt charge    ', await host.ev(`const h=document.querySelector('header'); for (let i=0;i<5;i++) h.click(); await wait(100); return document.documentElement.classList.contains('egg-charge')`));
await host.nav('/nope'); await sleep(2500);
console.log('404            ', await host.ev(`return document.title + ' | ' + document.body.innerText.slice(0, 80).replace(/\\n/g,' ')`));
await host.nav('/play?seed=1'); await sleep(200); await host.ev(`localStorage.clear(); return 1`); await host.nav('/host'); await sleep(2000);
console.log('legends        ', await host.ev(`[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Add one by one')).click(); await wait(300); const i=document.querySelector('input'); setVal(i,'DOM lab'); i.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true})); await wait(400); return document.body.innerText.includes('Printer Whisperer')`));
console.log(b.logs.slice(0, 6).join('\n') || 'no errors'); b.close();
