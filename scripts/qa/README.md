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
node --experimental-websocket func.mjs        # end-to-end flows: refreshes, seat keys, shortcuts, backup and restore
node --experimental-websocket modes.mjs       # forced colors + reduced motion screenshots (audit/m-*)
node --experimental-websocket topics.mjs      # topic picker and topic wording in setup, lobby, round and phones (audit/t-*)
node --experimental-websocket menu.mjs        # host menu with join info at 5 sizes: no sideways overflow (audit/menu-*)
node --experimental-websocket ended.mjs       # ending a game updates phones; an ended room shows "not found" (local + PeerJS)
BASE=https://fueled-tell.vercel.app node --experimental-websocket ended.mjs   # any script can target another server (e.g. production, or `vite preview` on :4173)
node deadcode.mjs                             # unused CSS classes, exports, tokens, copy keys (some are dynamic: check)
python3 sheet.py out.png 640 2 a.png b.png    # contact sheet of audit/ screenshots for review (needs Pillow)
```

Notes from building these:

- **Run one script at a time.** Several headless Chromes at once starve the CPU: the host sits on its boot screen,
  phones stay on "Connecting" and the shots look broken when the app is fine. Also don't edit `src/` mid-run (hot reloads
  restart the pages and break full/peer games).
- **Software WebGL is slow.** Headless Chrome renders the 3D deck on the CPU, which delays the host's timers (a 3.5 s
  timer once fired after 9.7 s). Timing-sensitive flows use `?scene=flat` (as `func.mjs` does).
- **Room codes** only use `ACDEFGHJKMNPQRTUVWXY34679`; a forced `?room=` with other letters is ignored.

- **False positives:** the layout probe flags the 3D card's front/back DOM layers, the boot screen mid-wipe, and clipped
  scroll content. The overflow probe skips the glow backdrop. Always confirm against a screenshot.
- **Timing:** a CDP `Runtime.evaluate` that awaits inside the page can pause CSS animations, so sample animation state
  with sleeps in Node between evaluations.
- **Stale browsers:** if phone shots all show the same old state, a leftover headless Chrome is answering as host:
  `pkill -f remote-debugging-port`.
