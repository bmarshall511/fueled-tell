import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new','--remote-debugging-port=9338','--use-angle=swiftshader','--enable-unsafe-swiftshader','--hide-scrollbars','--user-data-dir=/tmp/tell-qa/wii-chrome6','about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ver; for (let i = 0; i < 50; i++) { try { ver = await (await fetch('http://127.0.0.1:9338/json/version')).json(); break; } catch { await sleep(200); } }
const ws = new WebSocket(ver.webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map(); const logs = [];
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } if (d.method === 'Runtime.exceptionThrown') logs.push('EXC ' + (d.params.exceptionDetails.exception?.description ?? d.params.exceptionDetails.text)); if (d.method === 'Runtime.consoleAPICalled' && d.params.type==='error') logs.push('ERR ' + d.params.args.map(a=>a.value ?? a.description).join(' ').slice(0,200)); };
const send = (method, params = {}, sessionId) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params, ...(sessionId ? { sessionId } : {}) })); });
async function tab(url, w, h, mobile) { const { result } = await send('Target.createTarget', { url: 'about:blank' }); const { result: att } = await send('Target.attachToTarget', { targetId: result.targetId, flatten: true }); const s = att.sessionId; await send('Runtime.enable', {}, s); await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile }, s); await send('Emulation.setFocusEmulationEnabled', { enabled: true }, s); await send('Page.navigate', { url }, s); return s; }
const ev = async (s, expr) => { const r = await send('Runtime.evaluate', { expression: `(async()=>{${expr}})()`, returnByValue: true, awaitPromise: true }, s); return r.result?.result?.value ?? r.result?.exceptionDetails?.exception?.description; };
const shot = async (s, f) => { const { result } = await send('Page.captureScreenshot', { format: 'png' }, s); writeFileSync(f, Buffer.from(result.data, 'base64')); };
const H = `const btn=(t)=>[...document.querySelectorAll('button')].find(b=>b.textContent.includes(t)); const setVal=(el,v)=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,v); el.dispatchEvent(new Event('input',{bubbles:true}));}; const wait=(ms)=>new Promise(r=>setTimeout(r,ms));`;
const R = 'HJKM';
const host = await tab(`http://localhost:5173/host?transport=local&room=${R}&sample=1&bots=1`, 1920, 1080, false);
await sleep(4000);
const phone = await tab(`http://localhost:5173/play?transport=local&room=${R}&seat=f`, 390, 844, true);
await sleep(2500);
await ev(phone, `${H} setVal(document.querySelector('input'),'Ben'); await wait(100); document.querySelector('form').requestSubmit(); return 1`);
await sleep(1500);
await ev(host, `${H} btn('Start game').click(); return 1`);
const seen = new Set();
for (let round = 0; round < 8; round++) {
  await sleep(4200); // showing -> guessing
  const p = await ev(phone, `${H} const h=document.querySelector('h1')?.textContent; const r=document.querySelector('input[type=radio]'); if(r){ r.click(); await wait(150); btn('Lock in guess')?.click(); } return h`);
  seen.add(p);
  await sleep(800);
  
  await ev(host, `window.dispatchEvent(new KeyboardEvent('keydown',{key:'r', code:'KeyR'})); return 1`);
  await sleep(3200);
  const res = await ev(phone, `return document.querySelector('h1')?.textContent`);
  seen.add('result:' + res);
  await ev(host, `window.dispatchEvent(new KeyboardEvent('keydown',{key:' ', code:'Space'})); return 1`);
}
await sleep(2500);
console.log('phone screens seen:', [...seen].join(' | '));
console.log('host finale:', await ev(host, `return [document.title, document.querySelector('[class*=winner]')?.textContent]`));
console.log('phone final:', await ev(phone, `return document.querySelector('h1')?.textContent`));
await shot(host, 'full-finale.png'); await shot(phone, 'full-phone-final.png');
console.log('restart:', await ev(host, `${H} btn('Play again')?.click(); await wait(800); return document.querySelector('h1')?.textContent`));
console.log(logs.slice(0,10).join('\n') || 'no errors'); ws.close(); chrome.kill();
