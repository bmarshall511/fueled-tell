import { browser, seedHost, sleep } from './lib.mjs';
const b = await browser(9410, '/tmp/tell-qa/rv-' + Date.now());
const t = await b.tab('/', 1440, 900);
const clear = async () => { await t.nav('/play?seed=1'); await sleep(250); await t.ev(`localStorage.clear(); return 1`); };
const click = (txt) => t.ev(`[...document.querySelectorAll('button')].find(b=>b.textContent.includes(${JSON.stringify(txt)}))?.click(); await wait(500); return 1`);
const long = `const ta=[...document.querySelectorAll('textarea')][2]; setVal(ta, 'x'.repeat(300)); await wait(300); return 1`;
for (const [w, h, tag] of [[1440, 900, 'd'], [390, 844, 'm']]) {
  await t.size(w, h, w < 800);
  await clear(); await t.nav('/host'); await sleep(2200); await t.shot(`rv-setup-empty-${tag}.png`);
  await click('sample'); await t.ev(long); await t.ev(`scrollTo(0,0); return 1`); await t.shot(`rv-setup-people-${tag}.png`);
  await click('Players add their own'); await t.ev(`scrollTo(0,0); return 1`); await t.shot(`rv-setup-live-${tag}.png`);
  if (tag === 'd') {
    await t.hoverSel('form button[type=submit]'); await sleep(900); await t.shot('rv-setup-hover-open-d.png');
    await t.hoverSel('li [aria-label^=Remove]'); await sleep(500); await t.shot('rv-setup-tooltip-d.png');
  }
  await clear(); await t.nav('/host'); await sleep(1800); await click('Players add their own'); await t.shot(`rv-setup-live-empty-${tag}.png`);
  await click('Paste a list'); await t.shot(`rv-setup-paste-${tag}.png`);
  // editing an open lobby
  await clear(); await t.ev(seedHost('GAME', `run({ type: 'setRoster', rows: sample, ids: sample.map((_, i) => 'p_' + i) }); run({ type: 'updateSettings', settings: { intake: 'live' } });`)).catch(() => 0);
}
// editing an open lobby (desktop + phone)
for (const [w, h, tag] of [[1440, 900, 'd'], [390, 844, 'm']]) {
  await t.size(w, h, w < 800); await t.nav('/play?seed=1'); await sleep(250); await t.ev(`localStorage.clear(); return 1`);
  await t.ev(seedHost('GAME', `run({ type: 'setRoster', rows: sample, ids: sample.map((_, i) => 'p_' + i) }); run({ type: 'updateSettings', settings: { intake: 'live' } });`));
  await t.nav('/host?transport=local&room=GAME'); await sleep(3000);
  await t.shot(`rv-lobby-${tag}.png`);
  await click('Back to setup'); await sleep(800); await t.ev(`scrollTo(0,0); return 1`); await t.shot(`rv-setup-edit-${tag}.png`);
  await t.ev(`scrollTo(0, document.body.scrollHeight); return 1`); await sleep(300); await t.shot(`rv-setup-edit-bottom-${tag}.png`);
}
console.log(b.logs.slice(0, 6).join('\n') || 'no errors'); b.close();
