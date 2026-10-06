import { readFileSync } from 'node:fs';
import { browser, sleep } from './lib.mjs';
const AXE = readFileSync('axe3.js', 'utf8');
const axe = (t) => t.ev(`return (${AXE.trim().replace(/;$/, '')})`);
// Ending a game: a joined phone shows "The host ended the game"; a phone opening an ended (or unknown) room shows
// "No game with that code" instead of "Connecting" forever. Local transport, then the real PeerJS broker.
const b = await browser(9465, '/tmp/tell-qa/ended');
const text = (t) => t.ev(`return (document.querySelector('main')?.innerText || '').split(String.fromCharCode(10)).filter(Boolean).slice(0, 3).join(' / ')`);
for (const peer of process.argv[2] === "local" ? [false] : [false, true]) {
  const tr = peer ? '' : 'transport=local&';
  const host = await b.tab('/', 1280, 720);
  await host.nav('/play?seed=1'); await sleep(300); await host.ev(`localStorage.clear(); return 1`);
  await host.nav(`/host?${tr}sample=1&scene=flat`); await sleep(peer ? 6000 : 3000);
  const code = await host.ev(`return [...document.querySelectorAll('[class*=tile], [class*=code] span')].map(e=>e.textContent.trim()).join('').replace(/[^A-Z0-9]/g,'').slice(0,4)`);
  const phone = await b.tab('/', 390, 844, true);
  await phone.nav(`/play?${tr}room=${code}&seat=e`); await sleep(peer ? 8000 : 2500);
  await phone.ev(`let b; for (let i=0;i<40 && !b;i++){ b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Marisol Fenn'); if(!b) await wait(250);} b?.click(); await wait(300); document.querySelector('form')?.requestSubmit(); for (let i=0;i<40 && !document.body.innerText.includes('in.');i++) await wait(250); return 1`);
  console.log(peer ? 'peer' : 'local', code, '| phone joined:', await text(phone));
  // End from the game menu, after starting.
  await host.key(' ', 'Space'); await sleep(peer ? 4000 : 2500);
  await host.ev(`window.confirm=()=>true; let m; for (let i=0;i<40 && !m;i++){ m=[...document.querySelectorAll('button')].find(b=>b.getAttribute('aria-label')==='Menu'); if(!m) await wait(250);} m?.click(); await wait(400); [...document.querySelectorAll('button')].find(b=>b.textContent.includes('End game'))?.click(); return 1`);
  // The phone's screen swap runs in a view transition, which headless Chrome can be slow to paint.
  for (let i = 0; i < 10 && !(await text(phone)).includes('ended'); i++) await sleep(500);
  console.log(peer ? 'peer' : 'local', '| phone after end:', await text(phone));
  await phone.shot(`ended-${peer ? 'peer' : 'local'}.png`);
  if (!peer) console.log('axe ended:', JSON.stringify(await axe(phone)));
  const late = await b.tab('/', 390, 844, true);
  await late.nav(`/play?${tr}room=${code}&seat=late`);
  for (let s = 0; s < (peer ? 30 : 10); s += 2) { await sleep(2000); const tx = await text(late); if (!tx.startsWith('Connecting')) { console.log(peer ? 'peer' : 'local', `| late phone after ${s + 2}s:`, tx); break; } if (s + 2 >= (peer ? 30 : 10)) console.log('late phone STILL:', tx); }
  await late.shot(`ended-late-${peer ? 'peer' : 'local'}.png`);
  if (!peer) { console.log('axe not found:', JSON.stringify(await axe(late))); await late.size(1440, 900); await sleep(600); await late.shot('ended-late-local-d.png'); }
}
console.log(b.logs.slice(0, 5).join('\n') || 'no errors'); b.close();
