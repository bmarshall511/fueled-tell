import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const chrome = spawn(process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new','--remote-debugging-port=9336','--use-angle=swiftshader','--enable-unsafe-swiftshader','--hide-scrollbars',`--user-data-dir=/tmp/tell-qa/peer-${Date.now()}`,'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ver; for (let i = 0; i < 50; i++) { try { ver = await (await fetch('http://127.0.0.1:9336/json/version')).json(); break; } catch { await sleep(200); } }
const ws = new WebSocket(ver.webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map(); const logs = [];
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } if (d.method === 'Runtime.exceptionThrown') logs.push(d.sessionId.slice(0,4)+' EXC ' + (d.params.exceptionDetails.exception?.description ?? d.params.exceptionDetails.text)); if (d.method === 'Runtime.consoleAPICalled' && ['error','warning'].includes(d.params.type)) logs.push(d.sessionId.slice(0,4)+' '+d.params.type+' ' + d.params.args.map(a=>a.value ?? a.description).join(' ').slice(0,200)); };
const send = (method, params = {}, sessionId) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params, ...(sessionId ? { sessionId } : {}) })); });
async function tab(url, w, h, mobile) {
  const { result } = await send('Target.createTarget', { url: 'about:blank' });
  const { result: att } = await send('Target.attachToTarget', { targetId: result.targetId, flatten: true });
  const s = att.sessionId;
  await send('Runtime.enable', {}, s);
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile }, s);
  await send('Page.navigate', { url }, s);
  return s;
}
const ev = async (s, expr) => { const r = await send('Runtime.evaluate', { expression: `(async()=>{${expr}})()`, returnByValue: true, awaitPromise: true }, s); return r.result?.result?.value ?? r.result?.exceptionDetails?.exception?.description; };
const shot = async (s, f) => { const { result } = await send('Page.captureScreenshot', { format: 'png' }, s); writeFileSync(f, Buffer.from(result.data, 'base64')); };
const H = `const btn=(t)=>[...document.querySelectorAll('button')].find(b=>b.textContent.includes(t)); const setVal=(el,v)=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,v); el.dispatchEvent(new Event('input',{bubbles:true}));}; const wait=(ms)=>new Promise(r=>setTimeout(r,ms));`;
const host = await tab('http://localhost:5173/host?sample=1&bots=1', 1920, 1080, false);
await sleep(9000);
const code = await ev(host, `return document.querySelector('[role=img][aria-label^="Room code"]')?.getAttribute('aria-label')?.replace('Room code ','').replace(/ /g,'')`);
const status = await ev(host, `return document.body.innerText.includes('Opening the room') ? 'opening' : document.body.innerText.includes('Couldn') ? 'error' : 'live?'`);
console.log('room', code, status, await ev(host, `return document.querySelector('[role=alert]')?.textContent ?? document.body.innerText.includes('Opening') `));
const phone = await tab(`http://localhost:5173/play?room=${code}`, 1440, 900, false);
await sleep(9000);
console.log('phone h1', await ev(phone, `return document.querySelector('h1')?.textContent`));
console.log('join', await ev(phone, `${H} const i=document.querySelector('input'); setVal(i,'Ben'); await wait(100); document.querySelector('form').requestSubmit(); await wait(3000); return document.querySelector('h1')?.textContent`));
await shot(phone, 'peer-phone-lobby.png');
console.log('host roster', await ev(host, `return document.querySelector('[aria-live=polite]')?.textContent`));
console.log('start', await ev(host, `${H} btn('Start game').click(); await wait(6000); return document.title`));
console.log('phone round', await ev(phone, `return [document.querySelector('h1')?.textContent, document.querySelector('blockquote')?.textContent?.slice(0,30)]`));
console.log('guess', await ev(phone, `${H} const r=document.querySelector('input[type=radio]'); if(!r) return 'no radio'; r.click(); await wait(200); btn('Lock in guess')?.click(); await wait(2500); return document.querySelector('h1')?.textContent`));
await shot(phone, 'peer-phone-wait.png');
console.log('host count', await ev(host, `return document.querySelector('[class*=count]')?.textContent`));
console.log(logs.slice(0,15).join('\n') || 'no errors'); ws.close(); chrome.kill();
