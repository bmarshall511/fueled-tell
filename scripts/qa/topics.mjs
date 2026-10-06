import { readFileSync } from 'node:fs';
import { browser, seedHost, sleep } from './lib.mjs';
const AXE = readFileSync('axe3.js', 'utf8');
// Topics: the setup picker (each topic, custom prompt), and the topic's words in the lobby, round and on phones (audit/t-*).
const b = await browser(9463, '/tmp/tell-qa/topics');
const R = 'TPCK', H = `/host?transport=local&room=${R}`;
const t = await b.tab('/', 1440, 1000);
const pick = (label) => `[...document.querySelectorAll('label')].find(l => l.textContent.trim() === '${label}')?.click(); await wait(300); return 1`;
await t.nav('/play?seed=1'); await sleep(300); await t.ev(`localStorage.clear(); return 1`);
await t.nav(H); await sleep(2000);
await t.ev(`btn('sample')?.click(); await wait(400); return 1`);
await t.shot('t-setup-story-d.png');
await t.ev(pick('Movie')); await t.shot('t-setup-movie-d.png');
await t.ev(pick('Custom')); await t.shot('t-setup-custom-empty-d.png');
await t.ev(`const i=document.querySelector('aside input[type=text], aside input:not([type])'); i.focus(); setVal(i, 'Your dream job as a kid'); await wait(200); return 1`); await t.shot('t-setup-custom-d.png');
await t.size(390, 844, true); await sleep(500); await t.shot('t-setup-custom-m.png', true);
await t.size(1440, 1000);
console.log('axe custom:', JSON.stringify(await t.ev(`return (${AXE.trim().replace(/;$/, '')})`)));
// open the lobby with live intake for the custom topic
await t.ev(`[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Players add their own'))?.click(); await wait(300); [...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Open lobby')?.click(); await wait(2500); return 1`);
await t.size(1920, 1080); await sleep(1500); await t.shot('t-lobby-custom.png');
const phone = await b.tab('/', 390, 844, true);
await phone.nav(`/play?transport=local&room=${R}&seat=t`); await sleep(3000);
await phone.ev(`setVal(document.querySelector('input'),'Ben'); await wait(100); document.querySelector('form').requestSubmit(); await wait(1500); return 1`);
await phone.shot('t-phone-lobby-custom.png');
// a movie round
await t.nav('/play?seed=1'); await sleep(300);
await t.ev(seedHost(R, `run({ type: 'updateSettings', settings: { topic: 'movie' } }); run({ type: 'setRoster', rows: sample, ids: sample.map((_, i) => 'p_' + i) }); run({ type: 'join', playerId: 'u_me', name: 'Ben' }); run({ type: 'start', seed: 4 }, { type: 'beginGuessing', now: Date.now() });`));
await t.nav(H + '&scene=flat'); await sleep(3500); await t.shot('t-round-movie.png');
await phone.ev(`localStorage.setItem('tell:playert', JSON.stringify({ playerId: 'u_me', room: '${R}', name: 'Ben', key: 'k-t', joinedRoom: '${R}' })); return 1`);
await phone.nav(`/play?transport=local&room=${R}&seat=t`); await sleep(3500); await phone.shot('t-phone-pick-movie.png');
console.log('phone:', await phone.ev(`return document.querySelector('main').innerText.split(String.fromCharCode(10)).slice(0,4).join(' / ')`));
console.log(b.logs.slice(0, 5).join('\n') || 'no errors'); b.close();
