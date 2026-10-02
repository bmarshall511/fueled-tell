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
