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
  - **This departs from PLAN.md**, which says "light" scoring shows awards *instead of* a ranking. Now `competitive` (the True Story default) shows the podium, `light` is labelled "Awards only" in the create UI (the finale component doesn't branch on it yet), and `none` hides points. **Please confirm.**
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
- **Removed** awards (engine, finale, pack copy, tests) and the "Awards only" scoring mode. Scoring is now *Points & places* or *Just for fun*. Also removed the editor's "Import a file".
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

**Approximate time:** about 1 h of wall-clock AI time (≈12:00–13:00 CT), including the parallel QA agent (about 27 min).
