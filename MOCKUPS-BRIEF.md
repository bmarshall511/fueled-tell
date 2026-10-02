# Mockups brief (Phase 0)

You're helping me prototype a party game for remote team calls at Fueled. This is also a small case study for my team on prototyping with AI, so work fast, show options, and keep a build log (details at the end).

## The game

Before a call, everyone submits a short true story about themselves. During the call (Google Meet), I share my screen showing the **host view**. Players open a link on their phones, enter a room code, and join. Each round, one anonymous story appears on the host screen, players guess on their phones who wrote it, then there's a big reveal. Roughly 8 to 10 players, about 2 minutes per round.

The mechanic is generic: **prompt, submissions, guess the owner, reveal**. Later it'll run other "packs" (favorite movie/TV show, two truths and a lie, etc.), so don't hard-code "story" into anything except copy and mock data.

## What I want right now

**Three mockups that are actually different concepts**, not three color variations. Each one is a clickable prototype of the full round loop, driven by simulated data (no networking yet):

1. Story appears (entrance moment)
2. Guessing phase: countdown, and player "guess received" indicators that come in over time (simulated)
3. Lock in
4. Reveal: the owner's name, the % who guessed right, and who guessed it
5. Next story

Plus **one shared phone (player) screen mockup**: join with code + name, a guess picker (a grid of names), a waiting state, and a "this one's yours, act natural" state for when it's your own story.

### The three directions

- **Orbit**: stories are planets orbiting a central emblem, a nod to the Fueled planet/emblem brand language. The active story's planet pulls to center and the text resolves on it. On reveal, guesses fly in as particles toward the owner.
- **Signal**: an abstract particle/noise field. The story text assembles out of the particles. On reveal, the field reorganizes into the owner's name. Moody, techy, a little "DOM lab."
- **Deck**: tactile 3D cards with physical weight. The story is a card dealt to center; the reveal is a flip; guesses stack up like chips. The most restrained of the three and the fastest to load.

Feel free to push each one further than I described, as long as each stays readable on a Google Meet screen share (big type, high contrast, nothing that depends on fine detail or high frame rates, because screen share compresses heavily).

## Tech

- Vite + React + TypeScript, Three.js via React Three Fiber (+ drei where it helps). No backend.
- One project, three routes (`/orbit`, `/signal`, `/deck`), plus `/play` for the phone mockup and `/` as a picker page linking to all of them.
- **Shared design tokens are the point.** Create `tokens/tokens.json` (W3C DTCG format) and generate both CSS custom properties and a typed TS export from it (Style Dictionary, or a tiny build script if that's simpler). All three scenes and the UI must read colors, type and spacing ONLY from the tokens: no hex values in components or Three.js materials. I want to change one token and see all three mockups change.
- Shared, non-scene code (mock data, round state machine, UI primitives like Button, Timer, NameGrid) lives in one place and is reused by all three. Each concept differs only in its scene component.
- Each scene implements the same small interface, e.g. `{ phase, item, guesses, reveal }` as props, so the winning concept can drop into the real build later.
- Respect `prefers-reduced-motion` (simplified transitions, no camera moves). Cap device pixel ratio at 2. Stop rendering when the tab is hidden.

## Brand

**Fueled** (primary brand):
- Colors (token names should match):
  - Perfect Black `#000000` (primary)
  - Perfect White `#F5F5F1` (primary)
  - Nebula `#6652FF` (primary)
  - Tech Grey `#EAEAEA` (secondary)
  - Cryo `#00A6FF` (secondary)
  - Solar `#FF52B7` (secondary)
  - Nova `#FBBC09` (secondary)
- Build the theme on Black / White / Nebula; use secondaries as accents (e.g. player colors, particles, reveal moments).
- Type: **Aeonik Medium**, one typeface, one weight. Load from `assets/fonts/` if present; otherwise fall back to `system-ui` and leave a TODO. Create hierarchy with size and spacing, not weight.
- Icons: Font Awesome 6 Sharp style (crisp, angular). Inline SVG is fine for a mockup.
- Logo rules: always write "Fueled" with a capital F in copy; never stack the lockup vertically; never apply secondary colors to the logo; never skew or stretch it.
- Contrast: Nebula on black is about 4.2:1, so use it for large text and accents only; body text is Perfect White.

**DOM lab** (sub-brand, "built by"):
- Logo files: `assets/brand/DOMlab-logo-white.svg` and `-black.svg`. It's a single-color wordmark with chamfered (cut-corner) letterforms. Convert it to a component that uses `currentColor`.
- Use it as an endorsement ("built by DOM lab") on the picker page, the host lobby and the end screen. Fueled stays the primary brand.
- Pick up the chamfered-corner motif in the UI (cards, buttons, code chips via `clip-path`) so the sub-brand shows in the system, not just the logo.

## Mock data

8 obviously fictional players and 8 short (2 to 3 sentence) silly-but-plausible true-story-style entries. No real names.

## Deliverables

1. The running project (`npm run dev`), with all three concepts and the phone mockup reachable from `/`.
2. `MOCKUPS.md`: for each concept, a short summary, what makes it work on a screen share, rough JS bundle size for its route, and any performance risks.
3. Your recommendation: which concept to build, and why, in 3 to 5 sentences.
4. `BUILD_LOG.md`: append an entry for this session: the prompt goal, what you generated, decisions you made on your own, anything I need to verify by hand, and the approximate time it took. Keep it factual; I'm going to share it with my team.

Time-box this: aim for good-enough-to-choose, not production polish. Ask me before adding any dependency beyond the ones above.
