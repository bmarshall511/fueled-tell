# Kickoff prompt (paste into Claude Code, opened in this folder)

Hey! We're starting a new project together. It's a small party game for my team's video calls, and it's also a case study for my engineering guild on prototyping with AI, so we'll document as we go.

## Setup (do this first)

1. Read `PLAN.md` (the full plan) and `MOCKUPS-BRIEF.md` (the brief for today's work).
2. Brand assets are already in place:
   - `assets/brand/`: DOM lab wordmark (black/white), Fueled wordmark (black/white), Fueled lockup (black/white, with the color emblem) and `fueled-emblem.svg` (the planet/bolt emblem)
   - `assets/fonts/`: Aeonik Medium (`.woff2` + `.woff`) and the CoType web font EULA. Self-host them; don't commit them anywhere public.
3. `git init`, add a sensible `.gitignore`, and make an initial commit with the plan docs and assets.
4. Create a `CLAUDE.md` with the project conventions pulled from PLAN.md, so every future session follows them:
   - Simplicity over everything: no backend, no database, no accounts, no paid services
   - Ask before adding any dependency not named in PLAN.md or MOCKUPS-BRIEF.md
   - No hex values or raw design values outside `tokens/tokens.json`
   - No game-specific copy outside pack JSON files
   - `/play` (phones) must never import Three.js
   - Strict TypeScript, small focused modules, DRY shared primitives
   - Append to `BUILD_LOG.md` at the end of every session (goal, what you generated, decisions you made on your own, what I need to verify by hand, approximate time). Keep it factual.
5. Create `BUILD_LOG.md` with a short header explaining its purpose.

## Then: Phase 0 (mockups)

Do everything in `MOCKUPS-BRIEF.md`: three distinct concepts (Orbit, Signal, Deck) plus the phone mockup, sharing one token file and one set of UI primitives, all reachable from `/`.

Build it so the shared pieces (tokens pipeline, UI primitives, the scene props interface, mock round state) are clean enough to carry straight into Phase 1. Treat the scene components as the only disposable parts.

## How I want you to work

- Start by showing me a short plan (folder tree + the order you'll build in) and wait for my OK.
- Get one concept fully working end to end before starting the other two, then reuse everything you can.
- Commit after each concept with a clear message.
- When you're done: give me the run command, a link to each route, `MOCKUPS.md`, your recommendation on which concept to build, and the BUILD_LOG entry.

We're building toward a call on Thursday Oct 8, so favor good-enough-to-choose over polish today.
