# Build log

A factual, per-session record of building "Whose Is It?" with an AI coding assistant, kept for the engineering guild case study. Each entry covers: the session goal, what the AI generated, decisions the AI made on its own, what a human needs to verify by hand, and approximate time spent. Entries are appended, newest last, and not rewritten after the fact.

---

## 2026-10-02 (Fri): Session 1, setup + Phase 0 mockups

**Goal:** Set up the repo and conventions. Then build three distinct host concepts (Orbit, Signal, Deck) plus a phone mockup on one shared token file, UI primitives, mock round and scene interface, with the shared parts clean enough to carry into Phase 1.

**What the AI generated**

- Repo setup: `git init`, `.gitignore`, `CLAUDE.md` (conventions from PLAN.md), this log.
- Vite + React 19 + TypeScript (strict) project. Dependencies, all named in the brief: react, react-dom, three, @react-three/fiber, @react-three/drei, vite, @vitejs/plugin-react, typescript, plus @types packages.
- `tokens/tokens.json` (DTCG) and `scripts/build-tokens.ts`. The token build runs from a Vite plugin and generates `src/tokens/tokens.css` and `tokens.ts`, rebuilding live on save. Also added a `?mono` SVG import plugin, so the logos render in `currentColor`.
- `src/engine/`: types, a pure round reducer, reveal scoring, a pack check.
- `src/ui/`: 9 primitives, logos and hooks.
- `src/mock/`: 8 fictional players and 8 entries, plus a simulated round with a seeded RNG.
- `src/scenes/`: shared `SceneProps`, canvas, stage mapping and HTML overlay. Three scenes (Deck, Orbit, Signal).
- Routes: picker `/`, shared host shell for `/deck`, `/orbit`, `/signal`, and phone `/play`.
- `MOCKUPS.md` with sizes, risks, a recommendation and 8 screenshots in `docs/mockups/`.
- 5 commits: setup, foundation + Deck, Orbit, Signal, phone.

**Decisions the AI made on its own**

- **Fonts:** committed to the local repo as asked. Added a "never push this repo anywhere public" rule to CLAUDE.md, because the Aeonik files are licensed.
- **Generated token files are committed,** so a fresh clone typechecks without running Vite first. `npm run build` runs `vite build` (which regenerates them) and then `tsc`.
- **No router dependency** (a 10-line pathname switch). **No `tsx` dependency:** the token script runs inside the Vite plugin.
- **Entry text and owner names are HTML overlays above the WebGL canvas,** never 3D text, in every concept (legibility after Meet compression, accessibility).
- **The guess ticker is anonymous** (a filled-slot count, not names). Named indicators would give the owner away by elimination, because the owner never guesses. Phase 1 idea: give the owner a decoy "lock in" so they light up too.
- **Added DOM lab dark neutrals** (`color.neutral.900–300`) to the tokens for surfaces, since the Fueled palette has no greys between black and Tech Grey.
- **Host layout uses a 1920×1080 reference stage** scaled by a `--stage` factor, so the type tokens stay in real px at 1080p.
- **Player colors cycle through the 4 accent secondaries,** so with 8 players two people share each color (e.g. Dez and Gus are both Nebula).
- **Orbit colors planets by entry order, not owner,** so planet color can't leak the answer.
- **Deck uses a simple fake drop shadow** instead of drei's ContactShadows, which left a visible band on the table.
- **Mock pacing:** 3.5 s showing, guesses land in the first half of the timer, and the round auto-locks once all are in. Added `?timer`, `?at`, `?item`, `?motion=reduced` and `/play?screen=` deep links for review.

**Verification done by the AI**

- `tsc` (strict) passes and `vite build` succeeds.
- Confirmed from the build output that the `/play` chunk graph contains no Three.js (~76 KB gzipped JS).
- Captured 1920×1080 screenshots of every concept in guessing and reveal, and the phone at 390×844, using headless Chrome with SwiftShader WebGL. The in-app browser pane doesn't produce animation frames while it's hidden, so WebGL couldn't be checked there.
- Changed `color.accent` to Solar and saw both the HUD and the 3D card update, then reverted it.
- Checked reduced motion on Signal (it snaps, no drift).

**What you need to verify by hand**

- **Animation feel and timing at a real frame rate,** in a normal browser window: the deal and flip, planet pull and moons, particle assembly. I only saw still frames from headless Chrome.
- **Keyboard controls** (Space / L / R) on a host route. They're wired in code but weren't exercised in a browser.
- **A real Meet screen-share of each concept.** In particular, how Signal's particle field and Orbit's glows hold up under compression.
- **Brand:** whether showing the Fueled emblem as a texture in Orbit (mostly behind the active planet) is acceptable. Also check the logo usage on the picker page.
- **The CoType EULA:** does the web-font license cover self-hosting on a Vercel deploy?
- **Contrast when a pack overrides `accent`:** white text on Solar (tested above) looks below AA. A pack-override contrast check is needed before themed packs.
- **The phone mockup on a real phone** (iOS Safari input behavior, safe areas).
- **Mock names:** confirm they don't accidentally match real colleagues.

**Approximate time:** about 30 minutes of wall-clock AI time (10:07–10:37 CT), including setup.

---

## 2026-10-02 (Fri): Session 1b, Deck chosen + round 2 of mockups

**Goal:** You picked Deck. Then, in order: give mobile real attention and fix the chip stack, make "built by DOM lab" bigger, make everything accessible, explore "native app" polish (e.g. a loading screen), add a create-a-game mockup, add scoring with places and a winner, brainstorm app names, make the workflow clear, make the screens responsive on desktop too, and show the entry on the phone's guess screen.

**What the AI generated**

- `ui/stage.ts`: landscape and portrait host stages, shared by the HUD (CSS vars) and the scenes (`scenes/shared/stage.ts`).
- Deck: a portrait layout and the chip "pot".
- `ui/BootScreen`, `ui/Finale` (podium, standings, awards) and `ui/useHostChrome` (full screen, wake lock, document title).
- Engine: a `finale` phase plus `history` in the reducer, `computeStandings` and `computeAwards`, and the `intake.ts` parser.
- Packs: finale and award copy and a `points` field. New `fave-show.json` and `two-truths.json`.
- Routes: `/create` (setup + lobby), `/demo` (synced iframes), a flow-ordered `/`, and a rewritten `/play`. `mock/demoSync.ts` connects host and phone.
- An accessibility pass and native-feel CSS. Token-driven `theme-color` and background in `index.html`.
- 11 new screenshots in `docs/mockups/`. 2 commits.

**Decisions the AI made on its own**

- **Scoring rule:** 100 per correct guess, plus 50 to the owner per player fooled.
  - Equal scores share a place. Ties are ordered by correct guesses, but the place stays shared.
  - **This departs from PLAN.md**, which says "light" scoring shows awards _instead of_ a ranking. Now `competitive` (the True Story default) shows the podium, `light` is labelled "Awards only" in the create UI (the finale component doesn't branch on it yet), and `none` hides points. **Please confirm.**
- **The finale is a host screen, not a scene phase.** Scenes never see `finale`; the reducer moves there after the last reveal.
- **The guess ticker stays anonymous** (decided in session 1).
- **The phone shows the entry text** on the guess, waiting and yours screens. It's the same text that's on the shared screen, so it doesn't affect anonymity.
- **The QR in the lobby is a decorative placeholder** that looks like a QR code and is captioned "QR code arrives in Phase 2". A real QR needs a dependency, which is your call in Phase 2. It isn't scannable.
- **`/demo` uses iframes plus `BroadcastChannel`.** The host mock skips simulating the phone player when `?demo` is set, so that player's guess comes from the phone.
- **Boot screen minimum of 1.4 s once shown,** so it never just flickers.
- **The full-screen button is hidden on touch devices** (`pointer: coarse`).
- **Ran axe-core in headless Chrome from cdnjs** for the audit. This is a test-time script only, not a project dependency.

**Verification done by the AI**

- `tsc` passes and `vite build` succeeds.
- The build output shows Three.js only in the lazy scene chunk. `/play`, `/create` and `/demo` don't load it.
  - Mid-session the Host chunk had pulled in Three.js through a React context import. It was caught in the build output and fixed by moving the context to `scenes/sceneReady.ts`.
- **axe-core** (WCAG 2 A/AA, 2.1 AA, 2.2 AA, best practice): 0 violations on all 13 route/state combinations at 1440×900, and on `/play?screen=pick` at 390×844.
  - **One flag remains on `/deck` at 390×844:** the Nebula "STORY 1" label is measured against black, because axe can't see the WebGL card. Against the white card the real ratio is about 4.55:1.
  - It does point at a real risk: if WebGL fails, the dark card text would sit on black. The Phase 3 flat fallback must draw the card in HTML.
- **Headless end-to-end run of `/demo`:** the phone joins, the host opens the lobby and starts, the phone switches to the guess screen with the entry text, and its locked guess raises the host count (0/7 → 2/7).
- **Screenshots** at 1920×1080, 1440×900, 1280×720, 2560×1080, 390×844 and landscape 844×390.

**What you need to verify by hand**

- **Real devices:** iOS Safari and Android Chrome for `/play`. Check View Transitions, safe areas, keyboard behavior on join, and the haptic tick (Android only; iOS ignores `vibrate`).
- **Timing feel at a real frame rate:** deal, chip drop, flip, boot wipe, podium rise. I only saw still frames.
- **The scoring rule and the "light" vs "competitive" behavior** (see above). Should True Story default to places?
- **Award names and the finale headline copy** ("Top detective") in the packs.
- **Real screen-reader passes:** VoiceOver (iOS/macOS) and NVDA. I checked the semantics (labels, live regions, focus moves), but automated tools can't confirm the experience.
- **A Windows High Contrast check.** The `forced-colors` styling was written but not seen.
- **That the fake QR won't confuse people in a demo.** It looks like a real code.

**Approximate time:** about 30 min of wall-clock AI time (roughly 10:37–11:05 CT), with 4 rounds of mid-task feedback folded in.

---

## 2026-10-02 (Fri): Session 1c, building the whole app (Tell)

**Goal:** You said: no deferred phases, build everything now. That covered the real game end to end (networking, QR, host-only mode, persistence, PWA, flat fallback, tests). Plus:

- `/play` fully responsive on desktop.
- A much less error-prone way to add entries.
- PLAN.md updated so scoring includes a ranking.
- Sounds.
- Renamed to **Tell**.
- You also gave the GitHub repo (bmarshall511/fueled-tell).

**What the AI generated**

- **Engine:**
  - `game.ts`: the full lobby → showing → guessing → locked → reveal → finale → lobby machine. It handles joins and re-joins, players claiming host-imported names, live submissions, the host-only tally, and removing players.
  - `redact.ts`: each phone's view. It never includes the owner before the reveal, never shows other entries, and sends remaining time instead of the host clock.
  - Also `roomCode.ts`, `random.ts`, `rules.ts`, and a rewritten intake parser. The parser handles pipe, colon, dash and tab lines; CSV with quotes and a header; name-then-paragraph blocks; and stray quoted rows. It never drops a line.
- **Tests:** 35 Vitest tests covering every phase transition, redaction, can't-guess-own and can't-name-yourself, claiming, host-only mode, standings with ties, awards, parser formats, room codes, and the QR encoder.
- **Transport:**
  - The `Transport` interface.
  - `peer.ts` (PeerJS): heartbeats, a reconnect watchdog, a connect timeout, retry while the broker still holds a refreshed host's ID, and a "room taken" error.
  - `local.ts` (BroadcastChannel): mirrors the same behavior.
  - `protocol.ts`, with runtime guards on every incoming message.
- **QR code:** a dependency-free encoder (`ui/qr/`), written by a sub-agent and verified by Chrome's built-in barcode reader. It decoded all 15 versions at every error-correction level, plus UTF-8 text.
- **Host:**
  - `useHostGame`: persistence, timers, room, message routing, and `?bots=1` for demos.
  - **Setup with a new EntriesEditor:** one row per person, inline issues (missing name or entry, too long, duplicate name), and a character counter. "Paste a list" (also triggered by pasting multiple lines into any field) shows a preview of every parsed row before adding, and nothing is dropped. File import, sample entries, and an autosaved draft.
  - **Lobby:** real QR, join URL, roster with joined and entry status, remove player, and a fallback to host-only mode.
  - **GameScreen:** drumroll, synthesized sounds, host-only tally, a menu (download backup, end game), and the finale.
  - A podium only when scoring is "Points & places".
- **Player app** (`routes/Play.tsx` + `player/usePlayerGame`):
  - Screens: room code, join (tap your name if the host added you, or type it), lobby with live entry submit, pick (story on screen, countdown), waiting (change guess), mini-flip result, and final place with standings.
  - Layout: one column on phones; a two-column layout filling the window from 960 px.
  - Reconnects with a stable player ID.
- **Other pieces:**
  - **Flat scene:** HTML/CSS Deck for reduced motion and no WebGL.
  - **Sound:** `ui/sound.ts`, Web Audio, persisted mute.
  - **PWA:** vite-plugin-pwa with manifest, icons rendered from the Fueled emblem, offline shell, shortcuts, and an "Install Tell" button.
  - **Pages:** a landing page, and `/demo` running a real local game with bots.
  - **Checks:** `scripts/check-rules.mjs` plus `npm run check`.
  - **Docs:** a README for hosts and developers, and updates to PLAN.md and CLAUDE.md.
- **Removed:** the mock round, Orbit, Signal, the mockup picker and `/create`. They're still in git history.

**Decisions the AI made on its own**

- **ESLint isn't installed.** `typescript-eslint` doesn't support TypeScript 7 yet: npm refused the peer dependency, and I didn't force it. Instead, `scripts/check-rules.mjs` enforces the two project rules that matter: no hex colors outside tokens, and Three.js never reachable from `/play`. Both were tested by deliberately breaking them. Prettier is installed and has been run.
- **I wrote the QR encoder myself** rather than add a QR library (CLAUDE.md asks before new dependencies). It was verified by decoding.
- **PeerJS host ID:** `fueled-tell-<CODE>`. Room alphabet: `ACDEFGHJKMNPQRTUVWXY34679`, with no O/0, I/1/L, S/5, Z/2 or B/8.
- **Players claim host-imported names** by tapping them on the phone, or by typing the same name (case-insensitive). The phone's ID then replaces the imported placeholder everywhere.
- **Scoring modes:** "Points & places" shows the podium, "Awards only" shows awards, and "Just for fun" shows no points. The finale headline is "Winner" (not "Top detective", which clashed with the Best Detective award).
- **"Play again" returns to the lobby** with the same people and entries. Change entries from there with "Back to setup".
- **The drumroll lasts 2.1 s,** shared by host and phones (phones sync from the elapsed time in each snapshot).
- **`/play` bundle:** about 86 KB gzipped to first paint, then PeerJS (24 KB) loads lazily to connect, so about 110 KB in total. That's about 10% over PLAN.md's ~100 KB target. React DOM is 60 KB of it.
- **The Deck card label on Nebula is now full strength,** because faded text there failed contrast.

**Verification done by the AI**

- `npm run check` is clean: `tsc` (strict), the rule checks and 35/35 tests. `vite build` produces the PWA (41 precached files).
- **Local end to end (headless Chrome, two frames or tabs):**
  - The phone joins, bots claim the imported names, the host starts, and the phone shows the story.
  - The phone's guess is counted, guessing auto-locks, the drumroll runs, and the result appears.
  - A full 8-round game reaches the finale. The phone shows its place, and "Back to lobby" works.
- **Over the real PeerJS public broker:** a host tab opened room UHAM, and a separate tab joined by code, got the story, and its guess was counted. Both tabs were on **one machine**.
- **axe-core** (WCAG 2.2 AA + best practice): 0 violations on `/`, `/host` setup, `/play`, `/demo`, and in a live game on host lobby, round, reveal and finale, and on phone join, lobby, pick, result and final.
  - axe found two contrast bugs on phone screens, both now fixed.
- **Bugs found and fixed during verification:**
  - The drumroll restarted every render (repeated ticks) and could flash the previous reveal.
  - The host key handler crashed on non-element event targets.
  - The phone header overflowed at 390 px.
  - The phone footer floated mid-page.
  - The parser missed quoted CSV rows inside mixed pastes.

**What you need to verify by hand**

- **Real phones on different networks** (cellular plus home Wi-Fi), per PLAN.md's Tue test. I only tested PeerJS between two tabs on one machine. Strict NATs may need TURN; if they fail, host-only mode is the fallback.
- **Feel at a real frame rate:** deal, chip drop, flip, drumroll, and the phone mini-flip.
- **Sound:** whether the levels work on a Meet tab share, and whether the cues are too much or too little.
- **PWA install:** the "Install" prompt on Chrome/Android and Add to Home Screen on iOS. This needs HTTPS, so it can only be checked on the Vercel deploy (localhost is exempt).
- **VoiceOver / NVDA passes** and Windows High Contrast.
- **The CoType EULA** for web use on a public URL.
- **The GitHub repo:** `bmarshall511/fueled-tell` is **public**, and this repo contains the licensed Aeonik files, so **nothing has been pushed**. Decide: make the repo private, or keep the fonts out of git.

**Approximate time:** about 31 min of wall-clock AI time (11:17–11:48 CT), including the parallel QR sub-agent.

---

## 2026-10-02 (Fri): Session 1d, production hardening

**Goal:**

- The repo goes public (github.com/bmarshall511/fueled-tell) with everything the app needs, fonts included.
- Fix the roster "×" ambiguity.
- A full visual audit for alignment and padding.
- Fix "my name doesn't show on the shared screen" in /demo.
- Remove awards (never requested).
- Remove file import (never requested).
- A better tagline.
- An end-to-end audit so it's production-ready.

**What the AI did**

- **Removed** awards (engine, finale, pack copy, tests) and the "Awards only" scoring mode. Scoring is now _Points & places_ or _Just for fun_. Also removed the editor's "Import a file".
- **Visual audit:** a CDP harness seeds every game state through the real engine and screenshots host and phone at 1920×1080, 1280×720, 1440×900, 2560×1080 and 390×844 (about 45 states). Every capture was reviewed and fixed:
  - **Lobby:** the remove "×" is now a divided segment inside each name chip.
  - **Buttons:** the outline variant is used where secondary buttons vanished (room-in-use banner, paste helper, menu).
  - **Focus ring:** no longer outlines whole containers.
  - **Reveal:** stats are baseline-aligned, and the host-only tally is merged into the stats row.
  - **Finale:** the podium has one shared height with rank as a step, and the standings rows show full names in aligned columns.
  - **Portrait host:** only Menu plus the main action; sound and full screen are in the menu, and the menu scales with the stage.
  - **Lobby on phones:** sticky controls.
  - **Phone:** the header fits at 390 px; actions come first on phones; "tap your name" comes first on join; the countdown has its own row.
  - **Editor:** textareas re-measure on resize; grammar fixed for counts ("1 entry", "1 needs a fix").
  - **Landing:** the card arrows, the join row, and the overflow.
- **Functional QA:** a background QA agent tested 18 scenarios against the running app and reported 8 bugs. All were fixed and re-verified with its own repro scripts:
  - **/demo name not showing:** every run used a fixed room, so an older demo tab could capture the phone. Each run now gets a fresh room. Also fixed:
    - The first phone connect attempt could arrive during the host's room check and wasn't retried for 3 s. The client now retries every 0.5 s, and the host announces itself when up.
    - View transitions swallowed taps.
    - Phones weren't told when the host reloaded. The host now says goodbye on unload, and a new host instance makes every phone reconnect.
  - **Duplicate entries:** editing the lobby in live-intake mode duplicated every phone's entry (`setRoster` now keeps one entry per person).
  - **Host reload:** players stayed "connected" forever after a host reload. Everyone now starts disconnected until their phone returns.
  - **Host-only percentage:** it always showed 100%. It's now out of everyone who could have guessed.
  - **Space in the lobby:** it didn't start the game.
  - **Two host tabs:** a tab that finds its room taken no longer overwrites the other tab's saved game.
  - **Paste parser:** it merged mixed pastes, split an entry's wrapped second line into its own row, and kept Slack timestamps in names.
  - **Seat takeover:** any phone could take over another seat. Each phone now holds a secret key for its seat, sent only to the host.
  - **Crash recovery:** an app-wide error boundary now shows "Something went wrong / Reload" instead of a blank page.
  - **A bug the audit itself found:** the phone's "no game with that code" screen rendered blank (a screen-key bug).
  - **Another:** a saved name used to auto-join new rooms. It now only auto-rejoins the same room.
- **Production:**
  - `vercel.json`: SPA rewrites so `/host`, `/play` and `/demo` survive a refresh, plus caching headers.
  - Production build smoke-tested with `vite preview`: every route returns 200, the service worker registers, the manifest is valid, and Aeonik loads.
  - CLAUDE.md and the README updated (public repo, deploy steps).
- **New tagline:** "Everyone has a story. Can you tell whose?"
- **Screenshots** refreshed in `docs/screens/`.

**Decisions the AI made on its own**

- **Host-only scoring:** only correct guesses score, because the host just ticks who got it right, so there are no "fooled" points. Written into PLAN.md.
- **"Load a saved game" stays:** it restores a backup download, and backups are in PLAN.md. Only the entries "Import a file" was removed.
- **Imported players who never join** still appear in standings and can earn "fooled" points. Their story was played, so they're part of the game.
- **One host tab per game** is the supported model. A second tab shows "in use".

**Verification done by the AI**

- `npm run check`: `tsc`, the rule checks, and 40/40 tests (6 new: roster dedupe, seat keys, reload disconnect, host-only ratio, 3 parser cases).
- **axe-core** (WCAG 2.2 AA): 0 violations on every route and in every live host and phone state.
- **Full 8-round local game:** to the finale, with the phone's place shown.
- **PeerJS (real broker) game:** fresh and resumed sessions both worked (join, story, guess counted).
- **The QA agent's repro scripts** re-run after the fixes, confirming each fix:
  - **Demo:** a stale demo tab plus a slow join gives 9 joined on the right screen.
  - **Live edit:** stays at 3 entries.
  - **Host reload:** all phones reconnect and guesses count.
  - **Host-only:** 14% / 29%.
  - **Paste formats:** all parse.
  - **Wrong code:** shows "not found" within 4 s.

**What you need to verify by hand**

- **Real phones on cellular and Wi-Fi** against the Vercel deploy, including a host refresh mid-round. The connection service can hold an old room for about 10 s after a refresh.
- **Feel at a real frame rate,** and sound levels on a Meet tab share.
- **VoiceOver / NVDA** passes.
- **Font licence:** you decided to publish the Aeonik files in a public repo, so check the CoType EULA permits that distribution.

**Approximate time:** about 50 min of wall-clock AI time (≈11:52–12:43 CT), including the parallel QA agent (about 27 min).

## 2026-10-02 (Fri): Session 1e, cleanup and code-quality audit

**Goal:** make the codebase very well organized, component-driven, DRY and maintainable, with no change in behaviour.

**What got done**

- **Feature folders:** `landing/`, `demo/`, `host/{setup,lobby,game,state,components}`, `player/{screens,components}`, plus `ui/{components,hooks,lib,styles}`.
  - The three biggest files were split: `Play.tsx` (574 lines), `Play.module.css` (597) and `host/screens.module.css` (586).
  - The largest app file is now `GameScreen.tsx`, at 169 lines.
- **Host:**
  - `useHostGame` is split into session, room, round-timer and bot hooks.
  - The phase-advance logic moved into the engine as a pure `nextStep`.
  - Setup, Lobby and GameScreen are now short composition components, with one file per part (header, footer, tally, menu, roster, join panel, entries editor, entry row, paste helper).
- **Player:**
  - `screenFor.ts` is a pure, typed and tested function that picks the screen. It replaced string keys, which earlier caused the blank "not found" bug.
  - Each of the nine screens is now its own file.
  - The shared layout is `PlayerShell`, `Split`, `Heading`, `PrimaryAction`, `StoryCard` and `RoundStatus`.
  - Seat storage lives in `identity.ts`, so the demo no longer hard-codes the key or pulls in PeerJS.
  - Vibration lives in `haptics.ts`.
- **Shared UI, de-duplicated:**
  - One `TextInput`/`TextArea` (sizes and tone) replaces four hand-styled inputs.
  - `Notice` replaces three banner styles, and `BrandHeader` three page headers.
  - Logo `size` presets replace inline calc strings.
  - One `useKeyboardShortcuts` replaces two key handlers, and `useScreenTransition` / `useDrumroll` are hooks.
  - Page type utilities (`text-headline`, `text-lede`, `text-label`, `text-hint`, `text-body`, `text-subhead`, `text-ok/muted/error`) replace about 20 copied rules.
- **Dead code removed:**
  - Unused classes, the Orbit/Signal tokens, the copy keys `getReady` and `pastedSplit`, and `useStageToWorld`.
  - A portrait-lobby font rule that had never matched; fixing its selector during the move would have changed the look.
- **Config:** `.ts` extensions on the config imports, which silences Vite's native config-loader warning.
- **Docs:** CLAUDE.md "Where things live" and the README structure section rewritten for the new layout.

**Decisions the AI made on its own**

- **Host-screen wordmark:** it now has a floor at the phone-bar size, so it no longer shrinks to about 13px in portrait. This is the only intended visual change.
- **One input style everywhere:** the phone's text fields use the shared padding, which makes them a few pixels shorter than before.

**Verification done by the AI**

- `npm run check`: `tsc`, the rule checks (the /play graph is still Three.js-free), and 45/45 tests, including the new `screenFor` tests.
- `vite build` is clean.
- **Before/after screenshot diff** of 22 phone states and 30+ host, landing and demo states:
  - Identical, apart from the wordmark floor and field padding noted above, and a mid-animation drumroll frame.
- **axe-core:** 0 violations in the live host and phone states.
- **Full 8-round local game:** to the finale and restart.
- **PeerJS game on the real broker:** join, story, guess counted.
  - The first run timed out on the broker and the rerun passed. The broker is public, so check this on real phones.

**What you need to verify by hand**

- **A quick play-through on a real phone,** to confirm that screen transitions and haptics feel the same.

**Approximate time:** about 30 min of wall-clock AI time (≈12:45–13:15 CT).

## 2026-10-02 (Fri): Session 1f, no sideways scrolling + room code everywhere

**Goal:** no horizontal scrolling on any page at phone widths (reported on the lobby with a long name). Show the room code everywhere in the app.

**What got done**

- **Overflow probe** (a scratch harness): loads every page and game state with 32-character names and a long unbroken word. It checks host and phone at 320×640 and 360×740, and the host also in phone landscape (740×360). It flags any element past the screen edge or any scrolling container. 41 combinations; before the fix, 11 failed:
  - **Host lobby roster:** chips didn't wrap, and the lobby grid grew to fit the widest chip. Now names wrap inside the chip, name and status tags wrap as a group, and the grid track is `minmax(0, 1fr)`.
  - **Phone player chips:** lobby, waiting and standings. Chips now cap at the container width and names wrap. The phone bar and the standings truncate with an ellipsis, with the full name in the tooltip.
  - **Guess grid:** the columns could not shrink below a long name. They're now `minmax(0, 1fr)`.
  - **Host timer:** the fill could draw past a full bar after a clock skew. It's now clamped.
  - **Globally:** `overflow-wrap: break-word` on `body`, so long unbroken words wrap instead of widening a layout.
- **Room code everywhere:**
  - A new shared `RoomTag`.
  - Host bottom bar on every round and the finale: "Join at …/play [CODE]" (new `JoinTag`).
  - The host menu shows the code, link and QR for latecomers.
  - Setup shows the room while you edit an open lobby.
  - The phone bar shows the code as soon as a room is entered, including connecting and not-found.
  - Host-only games skip all of this, since there are no phones.
  - `joinUrl.ts` moved to `src/host/`, now that lobby and game both use it.

**Decisions the AI made on its own**

- **Truncation vs wrapping:** names truncate only in tight one-line spots (phone bar, phone standings rows). Everywhere else they wrap, so the host can always read the full name.
- **Where the code appears:** in the bottom bar, not the header, so it's on the finale too and never competes with the progress label and timer.

**Verification done by the AI**

- **Overflow probe:** 41/41 clean (it was 30/41).
- `npm run check`: 45/45 tests; the /play graph is still free of Three.js.
- `vite build` is clean.
- **axe-core:** 0 violations across the game states.
- **Full 8-round local game:** passes.
- **Screenshots** reviewed at 320, 360 and 1280 px wide.

**What you need to verify by hand**

- **Redeploy, then on your phone:** the lobby with a long name, the host menu, and the bottom-bar join line during a round.

**Approximate time:** about 25 min of wall-clock AI time.

## 2026-10-02 (Fri): Session 1g, host layout at in-between sizes

**Goal:** fix the shared screen's bottom bar at in-between window sizes. In the reported ~900px window, the labels wrapped and the bar overlapped "Whose story is it?". Fix any similar overlaps elsewhere.

**What got done**

- **Bottom dock:** the round info and the controls bar now stack in one dock in normal flow, so they can't overlap at any height. This replaces two absolutely positioned layers with magic offsets.
- **Controls bar:**
  - Host button labels never wrap.
  - The bar stays on one row using container queries: under 1100px the key hints hide, and under 860px Sound and Full screen hide (both are still in the menu).
- **Finale:** standings and the dock sit in a two-row grid, so standings can never slide under the bar; they scroll only if the window truly can't fit them.
  - Podium names shrink to the card (`10cqi`), so whole words fit instead of breaking mid-letter.
- **Reveal:** the list of who guessed right shows truncated chips, at most 5 on a big screen and 1 on portrait or short windows, then "+N more".
- **Layout probe** (a scratch harness): host states × 11 window sizes from 360×640 to 1920×1080, including short laptop windows. It checks for overlapping text, wrapped button labels, and content past the edges.

**Decisions the AI made on its own**

- **Reveal names:** small screens show one name plus "+N more". The percentage carries the result, so this protects the card.
- **Narrow bar:** it drops the key hints, then the duplicated buttons, rather than shrinking the type.

**Verification done by the AI**

- `npm run check`: 45/45 tests.
- `vite build` is clean.
- **axe-core:** 0 violations.
- **Full 8-round local game:** passes.
- **Overflow probe:** 41/41 clean.
- **Layout probe:** clean except for false positives, checked against screenshots: the 3D card's front and back text layers, the boot screen mid-wipe, and the finale's scrolled-off rows.

**What you need to verify by hand**

- **Resize a desktop window** from full screen down to ~800px on the round, reveal and finale screens.

**Known leftover**

- **Portrait reveal:** the 3D guess tokens sit just behind the "100%" line. This will be handled in the retheme layout pass.

**Approximate time:** about 35 min of wall-clock AI time.

## 2026-10-02 (Fri): Session 1h, retheme to match fueled.com

**Goal:** apply the approved retheme mockup (`docs/mockups/retheme.html`): rounded, glassy, animated gradient backgrounds, one design system for host and phone.

**What got done**

- **Tokens:**
  - New `radius.*` tokens (pill, card, panel, field, tile) replace `chamfer.*`.
  - New `blur.glass` and `blur.glow`, plus `gradient.glow` and `gradient.text`.
  - New colors: `color.glow.*`, and `fueled.lilac` / `fueled.deep-violet` for the gradient ends.
  - New `opacity.glow` / `glow-calm` and `duration.drift`.
  - `surface-raised` is now translucent glass, `border` is a white hairline, and `surface-solid` is the opaque fallback.
- **Shape:** the chamfer `clip-path` utilities and every `--cut` are gone. Each component uses a radius token: pills for buttons, chips, tags, toggles and the step badges; fields, tiles, panels and cards for the rest.
- **Buttons:** the main action is a white pill with black text and a Nebula halo on hover; secondary buttons are glass pills with a hairline. Key hints are pills.
- **Glass:** every raised surface gets a backdrop blur (with the `-webkit-` prefix for iOS) and a hairline.
- **Backdrop** (new shared component): three blurred blobs (Solar, Nebula, lilac) drifting behind the page.
  - It's vivid on the landing page, setup, demo, lobby and finale, and on the phone's code, join and final screens. It's calm during rounds and the other phone screens.
  - It pauses when the tab is hidden, holds still with reduced motion, and is hidden in forced-colors mode.
- **3D deck:**
  - The canvas is transparent and the opaque table is gone, so the glow shows through.
  - The card and guess tokens are rounded rectangles.
  - The card back is the glow gradient (a canvas texture on normalized UVs).
  - The flat scene and the boot deck match.
- **Gradient text:** used for the question, the phone's result headings and the "Tell" hero. Small labels on dark use lilac, not Nebula.
- **Root cause found while testing:** the Vite plugin injected `html,body{background}` to avoid a white flash, and the body background painted over the glow. Black now lives on `html` only.
- **Fixes along the way:**
  - The host bottom bar's endorsement and join line wrap onto two lines when tight (safe now that the dock is in flow).
  - The finale's other standings are capped at two columns and drop to one before names get squeezed.
  - The roster × is a round badge inside the pill.
  - Your own row in the phone standings gets a rounded highlight.
- **Docs:** CLAUDE.md has the new look rules and the Backdrop. MOCKUPS-BRIEF notes that the chamfer motif is superseded. `docs/screens/` is refreshed.

**Decisions the AI made on its own**

- **White primary pills, not Nebula fills:** small text on Nebula fails AA, and white with black text is how fueled.com reads.
- **Calm glow on phones and during rounds:** this keeps the entry and names crisp on a screen share, and saves battery.
- **The chamfer is gone entirely, including the 3D cards,** so the app reads as one system.

**Verification done by the AI**

- `npm run check`: 45/45 tests; no hex outside tokens; the /play graph is still free of Three.js.
- `vite build` is clean.
- **axe-core:** 0 violations on `/`, `/host`, `/demo` and `/play` at phone and desktop sizes, and in every live host and phone game state.
- **Full 8-round game:** passes.
- **Overflow probe:** 41/41 clean.
- **Host layout probe:** checked at narrow sizes against screenshots.
- **Screenshot review:** every host and phone state.
- **Test harness note:** a stale headless Chrome had been answering as an old host, so all phone shots showed the finale. The process was killed, and the harness now leaves none behind.

**What you need to verify by hand**

- **Real phones (especially iOS Safari):** backdrop blur, the glow drift, and battery and heat over a full game.
- **The glow on a real screen share** (Meet/Zoom compression), and whether calm is calm enough.

**Approximate time:** about 40 min of wall-clock AI time (≈14:05–14:45 CT).

## 2026-10-02 (Fri): Session 1i, lobby bar background

**Goal:** remove the gradient band behind the lobby's bottom bar (reported as looking awful).

**What got done:**

- The lobby's controls are no longer sticky over the roster, so they need no background at all. They sit in the grid in normal flow.
- The roster row may shrink (`minmax(0, auto)`), and its chip list scrolls inside itself, with padding so focus rings aren't clipped.
- Start is always on screen at every size, and the page itself never scrolls.

**Verification done by the AI:**

- **Lobby with 22 players** at 1920×1080, 1280×720, 910×520, 390×844 and 740×360: the controls are fully visible, the list scrolls, and the page doesn't.
- `npm run check` passes.
- **axe-core:** 0 violations in the lobby states.

**Approximate time:** about 10 min.

## 2026-10-02 (Fri): Session 1j, full UI/UX audit and polish

**Goal:** a complete audit of every screen and state, then polish to finish the UI/UX.

**Audit:** 51 screenshots (every host state at 1920, 1280 and portrait; every phone state on phone and desktop; landing, setup and demo on desktop and mobile). Each was reviewed as a contact sheet. No blocking issues; these rough edges were fixed:

- **Phone waiting indicator:** was a dull dark-blue dot that looked broken. It's now a breathing glow orb (the glow gradient with a soft halo).
- **Setup:** invalid entry rows used a thick yellow left border, which looked like a bracket on rounded rows. They now get a rounded Nova hairline ring.
- **Lobby room code:** the most important thing on the screen was title-sized. A new `CodeChip` `hero` size makes it display-sized, with a floor on phones.
- **Code fields:** the phone's code field now shows an example code. The placeholder moved into copy (`UI_COPY.codePlaceholder`) and is shared with the landing page.
- **Host-only tally:** native square checkboxes became round check badges, and unticked chips got a hairline.
- **Host menu:** opens with a soft scale-in over a blurred backdrop.
- **Last 5 seconds:** the countdown number pulses (host and phone), and the host's timer bar turns Nova.
- **Landing steps:** the numbers use gradient text.
- **Selection and scrollbars:** brand-colored text selection; thin, dark scrollbars.
- **Hover and press feedback:** pack cards lift on hover and press in; the phone's name-claim tiles press in.
- **Lobby:** "Waiting for players…" breathes gently.
- **Reduced motion:** looping animations now run once instead of flickering at 1ms. This also fixes the boot screen's loops.

**Checked and not a bug:** the drumroll screenshot showed the owner's name blurred on the card. That was the name's blur-in after the drumroll had ended; the footer already showed the result.

**Verification done by the AI**

- `npm run check`: 45/45 tests.
- `vite build` is clean.
- **axe-core:** 0 violations on every page at phone and desktop sizes, and in every live game state.
- **Full 8-round game:** passes.
- **Overflow probe:** 41/41 clean.
- **Before/after contact sheets** of the changed screens.
- `docs/screens/` refreshed.

**What you need to verify by hand**

- **On a real phone:** the breathing orb and countdown pulse, and the tap feedback.
- **On the host:** the menu animation and the bigger lobby code on a real screen share.

**Approximate time:** about 45 min of wall-clock AI time (≈14:50–15:35 CT).

## 2026-10-02 (Fri): Session 1k, host bar redesign, gradient motion, one page width

**Goal:** three requests:

- Redesign the host's bottom bar (reported as busy, an afterthought, not well designed).
- Add motion to the background and the gradient colors.
- Make content widths consistent across the app.

**What got done**

- **Host bar, redesigned:**
  - "built by DOM lab" moved up beside the Fueled wordmark as one top-left lockup (new `HostBrand`) on the lobby, rounds and finale. Portrait shows the wordmark alone.
  - The join info is one quiet glass capsule (`JoinTag`): "Join at …/play" plus the code in an inner pill, the one thing to read from across the room.
  - Menu, Sound and Full screen are round icon buttons (new `Icon` + `IconButton`). Shortcuts are in their tooltips and `aria-keyshortcuts`; the menu still lists them.
  - The main action (Lock in, Reveal, Next, Back to lobby) is the single white pill, and the only button with a key hint.
  - The old container-query hiding rules are gone. In portrait, the actions sit in one row (the main action stretches) above the capsule, and Full screen is hidden there (still in the menu).
  - The round header is a three-column grid, so "Story 1 of 8" is truly centered.
- **Motion:**
  - Gradient text (`text-glow`) drifts slowly. The new `glow-fill` does the same for the reveal cards (phone and flat scene).
  - The 3D card back's gradient drifts: it's painted at double size, and the visible window slides.
  - The background glow drifts wider, on a 14 s cycle (was 22 s).
  - All of it holds still with reduced motion.
- **One page width:**
  - New `size.content` token (1280px) and a `.page` utility in `base.css`: one max width, one gutter (24px on phones, safe-area aware; 64px from 960px).
  - Landing, setup, demo and the player app all use it, replacing their own widths (1344px, about 1190px, 1728px, and unbounded).
  - Measured: identical content edges on all four pages at 1920, 1440, 1024 and 390.
- **Fixes along the way:** at 320px the finale grid grew to fit the join capsule. It now has a `minmax(0, 1fr)` column, and the capsule truncates its URL.

**Decisions the AI made on its own**

- **Icons with tooltips** rather than text plus key hints for the secondary controls. They're secondary on a shared screen, and the menu repeats them with labels.
- **The host stage stays full-screen,** not capped at the page width: it's the screen being shared.

**Verification done by the AI**

- `npm run check`: 45/45 tests.
- `vite build` is clean.
- **axe-core:** 0 violations on all pages and live states.
- **Full 8-round game:** passes.
- **Overflow probe:** 41/41 clean.
- **Width measurement:** as above.
- **Screenshot review:** landscape and portrait.
- `docs/screens/` refreshed.

**What you need to verify by hand**

- **The new bar on a real screen share,** and whether the icon tooltips are discoverable enough.
- **The gradient drift speed:** it should feel alive, not distracting.

**Approximate time:** about 60 min of wall-clock AI time (≈15:00–16:00 CT).

## 2026-10-02 (Fri): Session 1l, background glow actually animates

**Goal:** the background was supposed to drift, but it never moved (reported).

**Root cause:** `.backdrop i` (specificity 0,1,1) used the `animation` shorthand, which resets `animation-name` to `none`. That overrode each blob's `animation-name` (`.pink` and the others, specificity 0,1,0). Screenshots couldn't show it. `.backdrop i` now sets longhands only, and the blob rules are `.backdrop .pink` and so on. Also removed an `undefined` class from the vivid tone.

**Verification done by the AI:**

- In a live page, each blob has one running animation (`document.getAnimations()`), and its transform changes over 3 s.
- The gradient text `shimmer` animations run too.
- `npm run check` passes.

**Approximate time:** about 10 min.

## 2026-10-02 (Fri): Session 1m, one game (no packs), device-neutral copy

**Goal:** the game has one use case, so the multi-pack system goes (Two Truths didn't even work as you'd expect). And the copy must not assume a laptop or a phone.

**What got done**

- **Packs removed:** `src/packs/` became `src/content/`.
  - `game.json` holds the True Story content, trimmed to what's used: prompt, entry length, timer, scoring, points and copy. `GAME` is exported from `src/content`.
  - Comfort Watch, Two Truths and the setup's "Pick a pack" step (`PackPicker`) are deleted.
- **Types:** `Pack` / `PackCopy` became `GameContent` / `GameCopy`, and `asPack` became `asContent` (`engine/content.ts`). `packId` is gone from `GameState` and `PlayerView`.
- **Content wiring:**
  - The engine still takes the content as an input (`createGame(GAME, …)`), so it stays content-agnostic and testable (`TEST_CONTENT`).
  - Host and phone screens read `GAME` directly instead of threading a `pack` prop, and `useHostGame` no longer returns one.
  - The lobby's pack-name label is gone.
- **Device-neutral copy:** no more "laptop", "phone" or "big screen" in the UI. It now says "the device whose screen you'll share", "the shared screen", "their own device", "when they join". The README is updated the same way.

**Verification done by the AI:**

- `npm run check`: 45/45 tests.
- **Full 8-round game:** passes.
- **axe-core:** 0 violations.
- **References:** `src` has no "pack" left.

**Approximate time:** about 25 min.

## 2026-10-02 (Fri): Session 1n, always points & places

**Goal:** remove the scoring options; every game is scored (points, places and a winner).

**What got done:**

- `ScoringMode` and `settings.scoring` are gone from the engine, content, redaction, the setup draft and setup.
- The unscored "Thanks for playing" finale is gone on both host and phone, along with its copy (`thanks`, `players`, `scoring`, `scoringModes`) and CSS.
- README and PLAN are updated, and the Scoring control is out of the setup mockup.

**Verification done by the AI:**

- `npm run check`: 45/45 tests.
- **Full 8-round game:** passes.
- **axe-core:** 0 violations.

**Approximate time:** about 10 min.

## 2026-10-02 (Fri): Session 1o, sharing + PWA, page transitions, no-movement feedback

**Goal:** three requests:

- Proper link previews and PWA metadata.
- Modern page and screen transitions.
- Buttons should never move when you interact with them (reported). Also fix the mockup's clipped story field (reported).

**What got done**

- **Sharing:**
  - A branded 1200×630 card (`public/og.png`, rendered from `docs/og/og.html`).
  - A `sharePlugin` in `scripts/vite-plugins.ts` injects the description, canonical URL, Open Graph, Twitter/X `summary_large_image` and iOS/Android app-title tags.
  - Name, title, description and URL come from one `APP` object in `vite.config.ts`. The URL comes from `SITE_URL`, then Vercel's production domain, then `https://fueled-tell.vercel.app`.
- **PWA manifest:** gains `id`, the new description, `lang`/`dir`, `display_override`, and `launch_handler: focus-existing`. Shortcuts get descriptions and icons. Wide and narrow install screenshots (`public/screenshots/`) are excluded from the precache, along with the share card.
- **Transitions** (native View Transitions API):
  - `@view-transition { navigation: auto }` animates navigations between pages.
  - Host screen changes animate too: setup → lobby (create), lobby → game (Start), editing, end, and restart. HostApp wraps those actions with `transitioned` (`ui/lib/viewTransition.ts`, now shared with the player's `useScreenTransition`). Round steps don't use them; the 3D scene handles those.
  - **The motion:** the old screen recedes into a soft blur while the new one arrives from slightly closer.
  - **Shared elements:** the background glow (`backdrop`) blends continuously, and the brand mark (`vt-brand`) glides between pages. The lobby's big room code (`vt-room-code`) flies into the bar's join capsule when the game starts.
  - Reduced motion turns all of it off.
- **No movement on interaction:**
  - The shared Button's press-scale is now `filter: brightness(.86)`, and the name grid and claim tiles do the same.
  - Landing cards no longer lift; they brighten and light their edge, and their arrow no longer nudges.
  - In the mockup, the lift, magnetic pull, icon scaling and press-squeeze are all removed. Ring, sweep, glow, ripple and color remain.
- **Mockup:** the composer's story field auto-grows (`field-sizing: content`) and caps at about 6 lines with a thin dark scrollbar; it had been clipped with a bright scrollbar. A label-class mix-up from the previous mockup edit is fixed.
- **Fix:** creating a game no longer starts two screen transitions back to back.

**Verification done by the AI**

- **Transition names:** unique on every page and state (`root`, `backdrop`, `brand`, `room-code`, `play-main`).
- **A live lobby → game transition** reached `ready` with `root`, `backdrop`, `brand` and `room-code` groups animating.
- `npm run check`: 45/45 tests.
- `vite build` is clean.
- **Tags and manifest:** all present in `dist/index.html` and `dist/manifest.webmanifest`. `og.png` and the screenshots are not in `sw.js`.
- **axe-core:** 0 violations on all pages and states.
- **Full 8-round game:** passes.
- **Overflow probe:** 41/41 clean.

**What you need to verify by hand**

- **Link previews after deploying:** paste the URL into Slack, iMessage and LinkedIn. LinkedIn's Post Inspector can refresh a cached card.
- **The install dialog** on Chrome/Android, with screenshots.
- **Transitions:** in Safari 18.2+ and Chrome. Firefox falls back to instant changes.

**Approximate time:** about 70 min of wall-clock AI time.

## 2026-10-02 (Fri): Session 1p, setup studio, button states, cursor effects (approved mockup)

**Goal:** build the approved `docs/mockups/setup.html`: setup as an app-like studio, the new button states, and cursor-reactive effects. The cursor effects go on pages, not the shared host screen, as proposed.

**What got done**

- **Setup studio** (`src/host/setup/`): `EntriesEditor`, `EntryRow` and `SetupStep` are replaced by small components.
  - **`SetupBar`:** compact lockup, "New game" / "Edit lobby", the room tag when editing, and a privacy pill instead of the yellow banner.
  - **`StartChoices`:** the empty state offers Paste a list, Add one by one, and Players add their own (hidden in host-only mode), plus "Try it with sample entries".
  - **`Composer`:** quick add. Enter moves from name to entry, Enter adds (Shift+Enter for a new line), the entry grows to 6 lines then scrolls, and a pasted list opens the sheet.
  - **`PeopleList` + `PersonCard`:** people as cards with a color-ring avatar, editing in place (new `bare` text-field tone), an inline problem and count, a remove icon button, and a count with "Show me".
  - **`SetupPanel`:** sticky. It holds a `MiniStage` live preview, the timer, host-only mode, a `ReadyMeter`, Open lobby, and Load saved game or Cancel.
  - **Phones:** the meter and Open lobby are pinned in a dock.
  - **`PasteSheet`:** a modal dialog around `PasteHelper` (a bottom sheet on phones).
  - **Toolbar:** Paste a list, Players add their own (a pressed toggle), Sample entries, Clear all.
  - **Unchanged:** parsing, validation, the draft autosave, and editing an open lobby. Pasted-list detection moved to `pasteDetect.ts`.
- **Buttons:**
  - **Rotating gradient ring:** on hover (main action) and on keyboard focus (every button). An `@property --ring-angle`.
  - **Hover:** a light sweep, and a soft glow under the main action.
  - **Press:** a ripple from the press point, plus the existing darken.
  - **Toggles:** a Cryo tint when pressed (`aria-pressed`).
  - Nothing moves or resizes.
- **Other controls:**
  - **Icon buttons:** custom tooltips (label + shortcut) instead of `title`. They take no space until shown, after one widened the phone layout.
  - **Segmented:** a single glass track with a white thumb that springs to the choice.
  - **Switch:** springs.
- **Cursor effects** (`ui/lib/pointerFx.ts`, mouse only, off with reduced motion):
  - An eased `--pointer-x` / `--pointer-y` drives a glow that trails the pointer and a gentle parallax on the Backdrop blobs.
  - `.spot` cards get a spotlight under the pointer: landing cards, setup cards and panel, the name grid, and claim tiles.
  - The host stage passes `interactive={false}`.
- **New tokens:** `easing.spring`, `duration.ring` / `sweep`, `size.spotlight` / `follow`, `opacity.ripple` / `spot`.
- **Copy:** the setup and editor strings are rewritten for the studio.

**Decisions the AI made on its own**

- **No busy/done button states in the app:** nothing in the app waits on a network action yet, so there's nowhere to use them. They'd be easy to add later.
- **People cards are always editable** (bare fields that show their box on hover or focus) instead of having a separate edit mode.

**Verification done by the AI**

- `npm run check`: 45/45 tests.
- `vite build` is clean.
- **axe-core:** 0 violations on setup (empty, with people, paste sheet open, at 1440 and 390), all pages, and every live game state.
- **Overflow probe:** 43/43, now including setup with people at 320 and 360.
- **Full 8-round game:** passes.
- **Screenshots:** setup reviewed on desktop and phone. `docs/screens` setup and paste shots refreshed.

**What you need to verify by hand**

- **The studio on a real phone:** the dock, the paste sheet, and typing in the cards.
- **The cursor glow and spotlights with a real mouse.**

**Approximate time:** about 55 min of wall-clock AI time (≈17:50–18:45 CT).

## 2026-10-02 (Fri): Session 1q, busy and done button states

**Goal:** finish the approved button states. Busy and done were skipped in 1p because nothing seemed to wait. In fact the phone's network actions all wait on the host to confirm.

**What got done:**

- **`Button` gains `busy` and `done`.** Busy: a spinner replaces the label (which keeps its width, so nothing resizes), `aria-busy` is set, and presses are ignored. Done: a brief glow-gradient check.
- **New `useAck(acked)` hook:** `start()` when a request is sent, busy until the host's snapshot shows it, then done. It gives up after about 9 s so the player can try again.
- **Wired into the phone's three host-confirmed actions:**
  - **Join:** busy until seated; a "name taken" error cancels it.
  - **Lock in guess:** busy until the host has this guess, then hands over to the waiting screen.
  - **Send/update entry:** busy, then the check.

**Verification done by the AI:**

- `npm run check`: 45/45 tests.
- **Full 8-round game:** passes.
- **PeerJS e2e on the real broker:** join, round, guess counted.
- **axe-core:** 0 violations.
- **The entry-send done state** was captured on a phone viewport.

**Approximate time:** about 15 min.

## 2026-10-02 (Fri): Session 1r, easter eggs (+ UI fixes from a careful review)

**Goal:** build the brainstormed easter eggs (all approved), and fix the setup panel issues reported along the way (a wrapped "Save and return to lobby" label, oversized text, and a misleading full bar).

**Easter eggs**

- **Round moments,** shown on the revealed card under the owner's name, and on phones under the headline:
  - **Mind Meld:** everyone right.
  - **Master of Disguise:** nobody right.
  - **The Herd:** everyone picked the same wrong person ("Sorry, X. Apparently it sounded like you.").
- **Speed Demon:** a correct guess within 2 s of guessing opening gets a white Fueled bolt on the host's chip and a "Lightning fast" tag on the phone. The host stamps `at` on each guess, and `openedAt` is new in state.
- **The Enigma:** on the finale, a lilac card under the podium for whoever fooled the most people (ties share it).
- **Bolt Rain:** nine white bolts drifting slowly behind the finale at 16% opacity, hidden with reduced motion.
- **Highlight Reel:** each phone's final screen shows one personal line ("You're the Enigma…", "You fooled N people", "You spotted N stories").
- **"Act natural" tips:** they rotate quietly on the owner's own screen. There's no sound or vibration, and nothing shows on the shared screen.
- **Room Code Bingo:** lucky codes spelled from the code alphabet (GAME, CAFE, DECK…) shimmer, with a "Lucky code" tag. A blocklist now stops the alphabet from generating offensive words. That was a real gap.
- **Hidden inputs:**
  - **Bolt Charge:** five quick clicks on the landing logo make the glow surge and light the title. The logo itself never changes.
  - **"tell":** in the lobby or finale, a gradient wave across the code tiles or the winner's name.
  - **Konami code:** during rounds, retro pixel mode for the 3D deck (render scale 0.1, pixelated); the code again turns it off.
  - **`?`:** the shortcuts dialog, ending "…and a few you'll have to find."
- **Meta:**
  - A styled console hello with the repo link.
  - A 404 "round": "Whose page is it?" flips to "Nobody's. It was never here." Unknown paths no longer fall through to the landing page.
- **Office legends:** typing "DOM lab" as a name in setup's quick add with no entry, then Enter, adds 8 clearly fictional office legends.
- **Engine, tests and copy:** `engine/moments.ts` is pure and has 8 new tests (53 total). The strings are in `UI_COPY.eggs`, `UI_COPY.notFound` and `copy.actNatural` / `copy.items` in `game.json`.

**Fixes from a careful screenshot review** (host, phone, portrait, editing, live mode, hover)

- **Setup panel:**
  - "Save changes" (was "Save and return to lobby") stays on one line at body size.
  - In live mode the meter no longer shows a full bar next to "0 ready": it shows the status only.
- **Setup on phones:**
  - Calmer intro size, and a 2×2 toolbar instead of ragged wrapping.
  - Timer options are equal-width segments, so they never wrap.
  - The paste sheet has a smaller title, with its main action full width on top.
- **The moment line:** it was first placed in the reveal row, where it collided with the 3D card, then squeezed into one letter per line. It now lives on the card itself.
- **Accessibility:**
  - Unjoined lobby names use a muted color instead of opacity, for contrast.
  - "Waiting for players…" breathes between two readable colors.
  - The 404 page gets an h1 and no longer overflows on phones.
- **Tooltips:** they take no space until shown (one had widened the phone layout earlier in 1p).

**Verification done by the AI**

- `npm run check`: 53/53 tests.
- `vite build` is clean.
- **Every egg triggered and confirmed in a live browser** (`eggs.mjs`).
- **axe-core:** 0 violations on all pages, setup states, live game states, the lobby with a lucky code, the shortcuts dialog and the 404 page at both sizes.
- **Overflow probe:** clean.
- **Full 8-round game:** passes.
- **Reviewed contact sheets:** reveal moments in landscape and portrait, the finale with Enigma and rain, retro mode, phone screens, setup on phone and desktop, edit and live modes.

**What you need to verify by hand**

- **Try the eggs on a real call:** the moment lines' wording, whether Bolt Rain reads on a screen share, and whether the Konami retro mode is fun or too subtle.

**Approximate time:** about 35 min of wall-clock AI time (≈18:50–19:25 CT).

## 2026-10-02 (Fri): Session 1s, handoff

**Goal:** hand off to a new session, which will run a full audit of everything: easter eggs, functionality and UI/UX.

**What got done:**

- **The QA harness moved into the repo** (`scripts/qa/`, with a README). It was in a temporary per-session folder before. The move covers the screenshot runners, axe scans, overflow, layout, width and transition probes, the easter-egg checker, the full local and PeerJS games, contact sheets and the dead-code scan.
  - Paths are now portable (`CHROME` override, `/tmp/tell-qa/` profiles).
  - Every run gets a fresh browser profile and kills its Chrome on exit. That prevents the "stale host answers" problem.
  - Output goes to `scripts/qa/audit/` (gitignored).
  - The setup steps in `audit1.mjs` are updated for the studio.
- **`docs/HANDOFF.md`:** state, how to run and verify, conventions and lessons, open items, and an audit checklist.

**Approximate time:** about 10 min.

## 2026-10-02 (Fri): Session 1t, full audit and fixes

**Goal:** audit everything (functionality, UI/UX, easter eggs) with the QA harness and by eye, then fix what was found.

**How:** `npm run check`, `vite build`, every script in `scripts/qa`, contact-sheet review of each screen and state (1920×1080, 1280×720, 910×520, 1024×768, 390×844 and player desktop widths), plus new end-to-end and display-mode scripts.

**Findings, by severity, and what was done**

1. **High: the finale hid standings under the controls.** With long names or a big tie, the rest of the standings ran behind the controls bar at 1280×720 and shorter windows, and the overflow could only be scrolled, which nobody does on a shared screen. **Fixed:** the finale content now shrinks to fit (`useFitToHeight`, CSS `zoom`, never below 0.6), so it fits at all 11 probed sizes.
2. **Medium: a seat-takeover attempt hung on "Connecting to the room…" forever.** The host answered only with an error, and the phone never got a view. **Fixed:** the phone takes a fresh seat and asks again, which lands on the join screen with the "That seat belongs to another device" message.
3. **Medium: restoring a backup kept everyone marked as connected.** That inflated "guesses in" and could stop auto-lock. **Fixed:** a restored game starts with nobody attached (as after a reload). The backup check also now requires `phase`, `entries` and `order`.
4. **Medium: correct-guesser chips on the reveal were cut off.** Names like "Juniper V…" were truncated even on a 1920 screen: the cap was 14em of the 16px parent, not of the chip. **Fixed:** the cap is now sized against the stage.
5. **Medium: forced colors (Windows high contrast) lost every control edge.** Buttons, inputs and cards had no edges, so controls read as plain text. Custom focus rings also vanished, and the 3D card's text got black backplates. **Fixed:**
   - Inset system-colored outlines on controls.
   - A system Highlight focus ring in forced-colors mode.
   - `forced-color-adjust: none` on the WebGL card's text layers.
6. **Medium: the timer showed a full "45" after lock and during the reveal.** It read as time left. **Fixed:** the timer hides once guessing closes and keeps its space, so nothing shifts.
7. **Low: names were joined "A & B & C" and in a different order from the podium.** **Fixed:** they now read "A, B & C" (`listNames`, tested) in standings order, on the host and the phone. The Enigma card is also no wider than the podium, and its lines are balanced.
8. **Low: the menu's shortcut line orphaned "· F full screen".** **Fixed:** shortcut pairs no longer break.
9. **Low: the menu's sound toggle read "Sound on" and was also `aria-pressed`.** That said the state twice. **Fixed:** it's action-labelled now ("Mute sound" / "Turn sound on"), and the full-screen item has no `aria-pressed` either.
10. **Low: screen-reader wording.**
    - The locked state announced "Lock in. 1 guesses in." It now says "Guesses are locked. 1 guess in."
    - The boot screen announced its title and logos. Only its status line is live now.
    - The boot status no longer swaps to a second "Tell" under the title.
11. **Low: the reveal with no right guesses said "0% guessed right · Nobody got it".** **Fixed:** it now shows only "0% guessed right".
12. **Low: text and layout polish.**
    - One-word last lines (the host-only lobby's "it."): `text-wrap: pretty` on running text and `balance` on headings.
    - Landing steps weren't top-aligned when one wrapped.
13. **Low: build warning.** `sample-entries.json` was imported both dynamically and statically. It's static now, and the warning is gone.

**Checked and fine**

- **Games:**
  - A full 8-round local game and a PeerJS game on the real broker.
  - A host refresh mid-round and a phone refresh, both rejoining as themselves.
  - Host-only mode, live intake, and claim and new-name joins.
  - Backup, end game, restore, and a bad file being rejected.
  - Space, L, R and M; `?` and every easter egg.
- **Reduced motion:** no rain and no looping animations.
- **Axe:** 0 violations on every page and every game state.
- **Overflow and width probes:** clean. The old "no .page at 1920" was a first-load timing issue; the probe now waits.
- **Easter eggs can't hint at owners:**
  - Moments, lightning and the Enigma are computed only at reveal or the finale.
  - "Act natural" tips show on the owner's own device only, with no sound or haptics.
  - Guess dots and tokens are uniform until the reveal.
  - Phone views never carry another entry's owner.

**Harness changes**

- New `func.mjs` (end-to-end flows) and `modes.mjs` (forced colors and reduced motion), and an `emu()` media-emulation helper.
- Phone shots wait longer.
- `full` and `peer` screenshots now go to `audit/`.
- The README now covers three gotchas:
  - Run one script at a time: parallel Chromes starve the CPU and make phones look stuck.
  - Software WebGL delays host timers, so use `?scene=flat` for timing-sensitive flows.
  - The room-code alphabet.

**Decisions the AI made on its own**

- Finale fit uses CSS `zoom` rather than restructuring the layout.
- The timer hides after lock instead of showing 0.
- "Nobody got it" was removed instead of the percentage.
- The menu toggles are action labels.
- Not changed:
  - The player app's narrower main button on desktop (consistent across screens).
  - Uneven card heights in setup when one entry is very long.
  - 32-character names breaking mid-word in portrait podium cards.

**Process note:** fixes were made as findings were confirmed. The ranked list was not shown to the user before fixing, as asked.

**What you need to verify by hand**

- Forced colors on a real Windows high-contrast theme.
- The finale with a real big tie on a screen share.
- The seat-takeover message on two real phones.

**Approximate time:** about 60 min of wall-clock AI time (≈19:34–20:35 CT).

## 2026-10-05 (Mon): Session 1u, topics

**Goal:** let the host choose what everyone shares, so the game works for a favorite movie, a TV show or any prompt as well as a true story. Before this, a player typing their own entry was always asked for "a short, true story".

**What got done**

- **Topics in `game.json`:** Story (the default), Movie, TV show, and Custom.
  - Each has its own prompt and words ("Movie 1 of 8", "Whose favorite movie is it?", "You spotted 2 movies").
  - Custom uses the host's own prompt (up to 120 characters). Left blank, it falls back to "Something about you the others could guess."
- **Setup:** an **Everyone shares** picker in the side panel, with a prompt field for Custom.
  - The live preview, the quick-add placeholder and the person cards follow the topic.
  - Editing an open lobby keeps the topic. Older saves and drafts get the default.
- **Everywhere else:** the topic travels in the game settings, so phones get it too.
  - The lobby prompt, the phone's entry form, the round header and question, phone cards, the finale highlight and screen-reader lines all use it.
  - New helpers `gameCopy(settings)` and `gamePrompt(settings)` (`engine/content.ts`), with 4 new tests (59 total).
- **Landing:** the "how it works" steps no longer say "story".
- **Docs:** README, CLAUDE.md, and a new `scripts/qa/topics.mjs`.

**Decisions the AI made on its own**

- The four topics, and their prompts and wording.
- The picker label is "TV" (not "TV show") so the four options fit the panel evenly. The prompt and question still say "TV show".
- No mockup: this is one more segmented control in the existing panel, in the existing style.
- The sample entries are still stories, whatever the topic.

**Verification done by the AI**

- `npm run check`: 59/59 tests. `vite build` is clean.
- **axe-core:** 0 violations on setup (empty, people, paste, at 1440 and 390) and on the custom-topic state.
- **Overflow probe:** clean.
- **Screenshots reviewed:**
  - The picker for each topic, including the custom prompt (empty and filled) at desktop and phone width.
  - The custom prompt in the lobby and on the phone's entry form.
  - A Movie round on the shared screen and the phone's pick screen.

**What you need to verify by hand**

- Pick a topic and play a short game with real phones.

**Approximate time:** about 15 min (≈08:27–08:41 CT).

## 2026-10-06 (Tue): Session 1v, menu overflow and ending a game

**Goal:** fix three bugs the user found on the live site.

1. The host menu overflowed sideways.
2. Phones weren't told when the host ended the game.
3. Opening an ended room hung on "Connecting to the room…".

**What got done**

- **Menu (a regression from session 1t):**
  - The shortcut separators had been put inside the no-wrap pairs, which left the line no place to break. With the join info showing, it pushed the buttons past the dialog's edge and added a sideways scrollbar.
  - The line now breaks between pairs, and the menu is one column that can't grow past the dialog.
  - Checked at 5 sizes with the new `menu.mjs`.
- **Ending a game:**
  - The host now sends phones an `ended` message and keeps the room open for 400 ms (`END_FLUSH_MS`) so it gets out.
  - Phones show a new **"The host ended the game. Thanks for playing!"** screen with **Join another game**, and leave the room instead of trying to reconnect.
- **Ended or unknown rooms:**
  - Before, the PeerJS phone reported "not found" only if its very first attempt got the broker's "no such room" answer. A timeout or slow broker left it "reconnecting" forever, which shows as "Connecting…".
  - Now any failed attempt reports not found. A phone that already has a game keeps showing it with the "Reconnecting…" note (a host refresh still works), and retries continue, so a room that opens later still connects.
  - Attempts no longer overlap.
- **Not-found screen:** a short heading ("No game with that code.") with the hint underneath, instead of a whole sentence as the headline.
- **Tests and harness:**
  - `screenFor` tests for the ended screen, and for keeping the game on screen while the host is briefly gone (60 tests).
  - New `menu.mjs` and `ended.mjs`. Harness fixes: the lucky-code check (the label is uppercased on screen), the full-game restart check, and axe loading in `topics.mjs`.

**Decisions the AI made on its own**

- The ended screen's copy, and its "Join another game" action.
- After **End game**, phones leave for good. A restored backup isn't rejoined automatically; players re-enter the code.
- On PeerJS, a never-reachable room still takes about 10–14 s to show "not found". The public broker doesn't answer "no such room" for a just-closed host, so the phone waits out one connection timeout.

**Verification done by the AI**

- `npm run check`: 60/60 tests. `vite build` is clean.
- **Ending a game, local and on the real PeerJS broker:** a joined phone shows the ended screen. A new phone on the ended code shows "No game with that code" (about 4 s local, 12–14 s PeerJS).
- **axe-core:** 0 violations on the ended and not-found screens, and through a whole game.
- **Regression runs pass:**
  - Full 8-round game, PeerJS game, and end-to-end flows.
  - Eggs, topics, and the menu at 5 sizes.

**What you need to verify by hand**

- On real phones, end a game from the host menu and check every phone switches to the ended screen.
- Open an old code and check you land on "No game with that code".

**Approximate time:** about 30 min (≈08:05–08:36 CT).

## 2026-10-06 (Tue): Session 1w, "still stuck on Connecting" on the live site

**Goal:** the user still saw "Connecting to the room…" for ended room FDC7 on fueled-tell.vercel.app after session 1v. Find out why, against production this time, and fix it.

**What was found (tested against the live site and the production build)**

1. **Old code from the offline cache.** The service worker updated in the background but never took over (no `skipWaiting`), so open browsers kept running the old build after a deploy.
2. **The public PeerJS broker never says "no such room".** No error arrived even after 25 s, and registering a phone takes 2–8 s. Even with the new code, a fresh browser sat on "Connecting" for 16 s on production before "No game with that code".

**What got done**

- **Service worker:**
  - It's now registered from `main.tsx` (`virtual:pwa-register`), with `skipWaiting` and `clientsClaim`.
  - A new deploy takes over open pages and reloads them onto the new build. A game in progress survives the reload: the host's game is saved, and phones rejoin.
  - Tested: changing `sw.js` on a running preview reloaded the open page, with no worker left waiting.
- **Connecting:**
  - One connection attempt now times out after 5 s (`CONNECT_TIMEOUT_MS`, was 10 s).
  - After 5 s on "Connecting…" the screen adds "Taking a while? Check the code on the shared screen. The game may have ended." The "Use a different code" button stays as it was.
- **Harness:** `lib.mjs` takes `BASE=` to test production or `vite preview`.

**Verification done by the AI**

- **Live site, before the fix:** confirmed the new build was deployed, and measured 16 s from opening FDC7 to "No game with that code" in a fresh browser.
- **Production build (`vite preview`) with the real PeerJS broker:**
  - **End game:** the joined phone shows "The host ended the game."
  - **A new phone on the ended code:** "No game with that code" after 6–7 s.
  - **A returning seat on FDC7:** the hint at about 6 s, and "not found" after 10–18 s depending on the broker.
  - **Joining a live room:** still works.
  - **Auto-update:** reloads the page onto a new version.
- `npm run check`: 60/60 tests. `vite build` is clean. axe-core: 0 violations on the ended and not-found screens.

**What you need to verify by hand**

- Load the site once after this deploy, and the page should switch to the new version on its own. In Safari, if it's still old, close and reopen the tab.
- Then open FDC7: the hint shows within about 5 s, and "No game with that code" shortly after.

**Approximate time:** about 15 min (≈08:38–08:52 CT).

**Follow-up (same session):**

- **Menu polish:** the line now breaks after a "·", never before it. The join address sits on its own line, so the code tiles stay beside the QR code on wide screens and stack under it on phones.
- **Checked on the live site:** "no sideways overflow" at 4 sizes, before this last change.
- **Checked on the identical production build** (`vite preview`, real PeerJS): the final version, at 1920, 1280, 910 and 390.
- **Live checks stopped:** Vercel's bot protection began challenging this machine's automated requests (a 403 "Security Checkpoint"), so live checks stopped there. It's tied to the AI's automated traffic; normal visitors shouldn't see it.
