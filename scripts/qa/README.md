# QA harness

Browser checks used to audit Tell: screenshots of every state, accessibility (axe-core), layout and
overflow probes, the easter eggs, and full games end to end. They drive headless Chrome over the
DevTools protocol; no extra dependencies.

**Needs:** the dev server running (`npm run dev`, http://localhost:5173), Google Chrome (set `CHROME=/path`
if it isn't at the macOS default), and Node 20+ (Node 20 needs `--experimental-websocket`; Node 22+ has it built in).
Run everything from this folder; screenshots land in `audit/` (gitignored).

```bash
cd scripts/qa
node --experimental-websocket audit1.mjs      # host screens: setup, lobby, rounds, reveal, finale, portrait (audit/NN-*.png)
node --experimental-websocket audit2.mjs      # phone screens, phone + desktop (audit/p-*.png)
node --experimental-websocket overflow.mjs    # no horizontal overflow at 320/360 (and 740x360), every page and state
node --experimental-websocket layout.mjs      # host HUD: overlaps, wrapped buttons, past-edge, 11 window sizes
node --experimental-websocket widths.mjs      # every page shares one content width
node --experimental-websocket vt.mjs          # view-transition names unique; lobby -> game transition runs
node --experimental-websocket axe-pages.mjs   # axe on /, /host, /demo, /play
node --experimental-websocket axe-setup.mjs   # axe on setup: empty, people, paste sheet (desktop + phone)
node --experimental-websocket axe-game.mjs    # axe through a live game (host + phone)
node --experimental-websocket eggs.mjs        # triggers and checks every easter egg
node --experimental-websocket eggs2.mjs       # lucky-code lobby, shortcuts dialog and 404 under axe
node --experimental-websocket full.mjs        # full 8-round local game, host + phone
node --experimental-websocket peer-e2e.mjs    # real PeerJS broker game (flaky if the public broker is slow: rerun)
node --experimental-websocket review.mjs      # setup review shots incl. hover, edit and live modes (audit/rv-*)
node --experimental-websocket review2.mjs     # easter-egg review shots, host + phone (audit/rv-*)
node deadcode.mjs                             # unused CSS classes, exports, tokens, copy keys (some are dynamic: check)
python3 sheet.py out.png 640 2 a.png b.png    # contact sheet of audit/ screenshots for review (needs Pillow)
```

Notes from building these:

- **False positives:** the layout probe flags the 3D card's front/back DOM layers, the boot screen mid-wipe, and clipped
  scroll content. The overflow probe skips the glow backdrop. Always confirm against a screenshot.
- **Timing:** a CDP `Runtime.evaluate` that awaits inside the page can pause CSS animations, so sample animation state
  with sleeps in Node between evaluations.
- **Stale browsers:** if phone shots all show the same old state, a leftover headless Chrome is answering as host:
  `pkill -f remote-debugging-port`.
