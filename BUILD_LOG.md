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
