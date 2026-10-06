import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
/** Chrome binary (override with CHROME=/path/to/chrome). */
/** The app under test (set BASE=https://fueled-tell.vercel.app to test production). */
export const BASE = process.env.BASE ?? 'http://localhost:5173';
export const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

/**
 * Headless Chrome driven over CDP. Every run gets a fresh profile (a reused profile can hand
 * the session to a leftover Chrome whose old host tab then answers on the same room code),
 * and Chrome is killed when the script exits.
 */
export async function browser(port, dir) {
  const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--hide-scrollbars', `--user-data-dir=${dir}-${Date.now()}`, 'about:blank'], { stdio: 'ignore' });
  process.on('exit', () => chrome.kill());
  let ver; for (let i = 0; i < 60; i++) { try { ver = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); break; } catch { await sleep(200); } }
  const ws = new WebSocket(ver.webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r));
  let id = 0; const pending = new Map(); const logs = [];
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } if (d.method === 'Runtime.exceptionThrown') logs.push('EXC ' + (d.params.exceptionDetails.exception?.description ?? d.params.exceptionDetails.text).slice(0, 300)); if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') logs.push('ERR ' + d.params.args.map((a) => a.value ?? a.description).join(' ').slice(0, 300)); };
  const send = (method, params = {}, sessionId) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params, ...(sessionId ? { sessionId } : {}) })); });
  const B = {
    logs,
    async tab(url, w = 1920, h = 1080, mobile = false) {
      const { result } = await send('Target.createTarget', { url: 'about:blank' });
      const { result: att } = await send('Target.attachToTarget', { targetId: result.targetId, flatten: true });
      const s = att.sessionId;
      await send('Runtime.enable', {}, s);
      await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile }, s);
      await send('Emulation.setFocusEmulationEnabled', { enabled: true }, s);
      if (url) await send('Page.navigate', { url: (url.startsWith('http') ? '' : BASE) + url }, s);
      return {
        s,
        nav: (u) => send('Page.navigate', { url: (u.startsWith('http') ? '' : BASE) + u }, s),
        size: (w2, h2, m = false) => send('Emulation.setDeviceMetricsOverride', { width: w2, height: h2, deviceScaleFactor: 1, mobile: m }, s),
        ev: async (expr) => { const r = await send('Runtime.evaluate', { expression: `(async()=>{const btn=(t)=>[...document.querySelectorAll('button')].find(b=>b.textContent.includes(t)); const setVal=(el,v)=>{const p=el.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(p,'value').set.call(el,v); el.dispatchEvent(new Event('input',{bubbles:true}));}; const wait=(ms)=>new Promise(r=>setTimeout(r,ms)); ${expr}})()`, returnByValue: true, awaitPromise: true }, s); return r.result?.result?.value ?? r.result?.exceptionDetails?.exception?.description; },
        shot: async (f, full = false) => { const p = full ? { format: 'png', captureBeyondViewport: true } : { format: 'png' }; if (full) { const m = await send('Page.getLayoutMetrics', {}, s); p.clip = { x: 0, y: 0, width: m.result.cssContentSize.width, height: Math.min(m.result.cssContentSize.height, 4000), scale: 1 }; } const { result } = await send('Page.captureScreenshot', p, s); mkdirSync('audit', { recursive: true }); writeFileSync('audit/' + f, Buffer.from(result.data, 'base64')); },
        mouse: async (x, y) => { await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, pointerType: 'mouse' }, s); },
        hoverSel: async (sel) => { const r = await send('Runtime.evaluate', { expression: `(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const b = e.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; })()`, returnByValue: true }, s); const p = r.result?.result?.value; if (p) await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p[0], y: p[1], pointerType: 'mouse' }, s); return !!p; },
        /** Emulate media features, e.g. [{ name: 'forced-colors', value: 'active' }] or prefers-reduced-motion. */
        emu: (features) => send('Emulation.setEmulatedMedia', { features }, s),
        key: (k, code) => send('Runtime.evaluate', { expression: `window.dispatchEvent(new KeyboardEvent('keydown',{key:'${k}',code:'${code}'}))` }, s),
      };
    },
    close() { ws.close(); chrome.kill(); },
  };
  return B;
}
/** In-page: build a host session with the real engine and store it for the local transport. */
export const seedHost = (room, body) => `
  const g = await import('/src/engine/game.ts'); const content = await import('/src/content/index.ts'); const sample = (await import('/src/content/sample-entries.json')).default;
  const R = g.gameReducer; let s = g.createGame(content.GAME);
  const run = (...as) => { for (const a of as) s = R(s, a); };
  ${body}
  localStorage.setItem('tell:host-session:local', JSON.stringify({ version: 1, roomCode: '${room}', state: s }));
  return s.phase;`;
