import { browser, sleep } from './lib.mjs';
// End-to-end flows: claim and new-name joins, seat-key takeover, Space, host and phone refresh, M/L/R, backup, end game, restore, bad file.
// Uses the flat scene: software WebGL in headless Chrome starves the host's timers and skews round timing.
const b = await browser(9460, '/tmp/tell-qa/func');
const R = 'FNCQ';
const H = `/host?transport=local&room=${R}&sample=1&scene=flat`;
const host = await b.tab('/', 1280, 720);
const p1 = await b.tab('/', 390, 844, true);
const p2 = await b.tab('/', 390, 844, true);
const log = (...a) => console.log(...a);
const main = (t) => t.ev(`return (document.querySelector('main')?.innerText||'').replace(/\\n+/g,' | ').slice(0,110)`);
const live = (t) => t.ev(`return [...document.querySelectorAll('[aria-live]')].map(e=>e.getAttribute('aria-live')+':'+e.textContent.trim()).filter(x=>x.length>8).join(' || ').slice(0,300)`);
await host.nav('/play?seed=1'); await sleep(300); await host.ev(`localStorage.clear(); return 1`);
await host.nav(H); await sleep(4000);
log('host lobby:', await main(host));
// phone 1 claims Marisol, phone 2 types new name
await p1.nav(`/play?transport=local&room=${R}&seat=a`); await sleep(2500);
log('p1 join:', await main(p1));
log('p1 claim:', await p1.ev(`const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Marisol Fenn'); b?.click(); await wait(300); document.querySelector('form')?.requestSubmit(); await wait(1500); return document.querySelector('h1')?.textContent`));
await p2.nav(`/play?transport=local&room=${R}&seat=b`); await sleep(2500);
log('p2 new:', await p2.ev(`setVal(document.querySelector('input'),'Zed Newcomer'); await wait(100); document.querySelector('form').requestSubmit(); await wait(1500); return document.querySelector('h1')?.textContent`));
log('host lobby live:', await live(host));
// seat takeover attempt: p3 with p1's playerId but wrong key
const id1 = await p1.ev(`return localStorage.getItem('tell:playera')`);
const p3 = await b.tab('/', 390, 844, true);
await p3.nav('/play?seed=1'); await sleep(200);
await p3.ev(`const id=JSON.parse(${JSON.stringify(id1)}); id.key='stolen-key'; localStorage.setItem('tell:playerc', JSON.stringify(id)); return 1`);
await p3.nav(`/play?transport=local&room=${R}&seat=c`); await sleep(3000);
log('p3 takeover:', await main(p3));
// start: keyboard Space
await host.ev(`document.body.focus(); return 1`); await host.key(' ', 'Space'); await sleep(5500);
log('host phase after Space:', await live(host));
log('p1:', await main(p1)); log('p2:', await main(p2));
// p2 guess
log('p2 guess:', await p2.ev(`const r=document.querySelector('input[type=radio]'); if(!r) return 'no radios'; r.click(); await wait(200); [...document.querySelectorAll('button')].find(b=>b.textContent.includes('Lock in'))?.click(); await wait(1500); return document.querySelector('h1')?.textContent`));
// host refresh mid-round
await host.nav(H.replace('&sample=1','')); await sleep(5000);
log('host after refresh:', await live(host));
await sleep(6000);
log('p1 after host refresh:', await main(p1)); log('p2 after host refresh:', await main(p2));
// phone refresh
await p2.nav(`/play?transport=local&room=${R}&seat=b`); await sleep(3500);
log('p2 after own refresh:', await main(p2));
// shortcuts: M, L, R
log('M mute:', await host.ev(`const b=document.querySelector('button[aria-pressed]'); const before=b?.getAttribute('aria-pressed'); window.dispatchEvent(new KeyboardEvent('keydown',{key:'m',code:'KeyM'})); await wait(200); return before+'->'+b?.getAttribute('aria-pressed')`));
await host.key('l', 'KeyL'); await sleep(800); log('after L:', await live(host));
await host.key('r', 'KeyR'); await sleep(5000); log('after R:', await live(host)); log('p2 result:', await main(p2));
// backup download
log('backup:', await host.ev(`let got=null; const orig=URL.createObjectURL; URL.createObjectURL=(blob)=>{ got=blob; return orig.call(URL, blob); }; [...document.querySelectorAll('button')].find(b=>b.getAttribute('aria-label')==='Menu'||b.textContent.includes('Menu'))?.click(); await wait(300); [...document.querySelectorAll('button')].find(b=>b.textContent.includes('Download a backup')).click(); await wait(300); window.__backup = got ? await got.text() : null; document.querySelector('dialog[open]')?.close(); return window.__backup ? JSON.parse(window.__backup).state.phase + ' players ' + JSON.parse(window.__backup).state.players.length : 'none'`));
const backup = await host.ev(`return window.__backup`);
// end game, then restore from file
await host.ev(`window.confirm=()=>true; [...document.querySelectorAll('button')].find(b=>b.textContent.includes('Menu')||b.getAttribute('aria-label')==='Menu')?.click(); await wait(300); [...document.querySelectorAll('button')].find(b=>b.textContent.includes('End game')).click(); await wait(1500); return 1`);
log('after end:', await main(host));
log('restore:', await host.ev(`const f=new File([${JSON.stringify(backup)}], 'tell.json', {type:'application/json'}); const inp=document.querySelector('input[type=file]'); const dt=new DataTransfer(); dt.items.add(f); inp.files=dt.files; inp.dispatchEvent(new Event('change',{bubbles:true})); await wait(4000); return document.title`));
log('restored live:', await live(host));
log('restored connected flags:', await host.ev(`return JSON.parse(localStorage.getItem('tell:host-session:local')).state.players.filter(p=>p.connected).length`));
await sleep(5000);
// Ending the game tells phones it's over, so they leave: nobody reconnects to the restored game on their own.
log('after reconnect connected (expect none):', await host.ev(`return JSON.parse(localStorage.getItem('tell:host-session:local')).state.players.filter(p=>p.connected).map(p=>p.name).join(',')`));
log('bad file:', await host.ev(`window.confirm=()=>true; [...document.querySelectorAll('button')].find(b=>b.getAttribute('aria-label')==='Menu')?.click(); await wait(300); [...document.querySelectorAll('button')].find(b=>b.textContent.includes('End game')).click(); await wait(1500); const f=new File(['{"version":1,"roomCode":"AAAA","state":{"players":[]}}'], 'x.json'); const inp=document.querySelector('input[type=file]'); const dt=new DataTransfer(); dt.items.add(f); inp.files=dt.files; inp.dispatchEvent(new Event('change',{bubbles:true})); await wait(800); return document.querySelector('[role=alert]')?.textContent`));
console.log(b.logs.slice(0, 10).join('\n') || 'no errors'); b.close();
