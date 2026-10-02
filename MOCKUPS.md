# Phase 0 mockups

Three host concepts plus one phone screen. All of them share one token file, one set of UI primitives, one mock round, and one `SceneProps` interface. The only thing that changes between concepts is the scene component in `src/scenes/<concept>/`.

Run `npm run dev` and open `/`.

| Route | What it is |
|---|---|
| `/orbit` | Host: Orbit concept |
| `/signal` | Host: Signal concept |
| `/deck` | Host: Deck concept |
| `/play` | Phone: join, pick, waiting, yours |

**Host keys:** Space = next step, L = lock, R = reveal.

**Deep links for review:**
- `?timer=15` shortens the guess timer.
- `?at=guessing|locked|reveal&item=3` jumps straight to a phase.
- `?motion=reduced` forces reduced motion.
- `/play?screen=pick|waiting|yours` opens a phone state.

Screenshots (1920×1080, headless Chrome) are in [`docs/mockups/`](docs/mockups/).

## What's shared (carries into Phase 1)

- **`tokens/tokens.json`** (DTCG) feeds a Vite plugin, which generates `src/tokens/tokens.css` (custom properties) and `src/tokens/tokens.ts` (typed values for Three.js). Saving the JSON regenerates both while the dev server is running. Switching `color.accent` to Solar reskins the HUD and the 3D card in one edit (`docs/mockups/token-swap-deck.jpg`).
- **`src/engine/`**: types, a pure round reducer (`showing → guessing → locked → reveal → next`, including the can't-guess-your-own-entry rule), and reveal scoring.
- **`src/ui/`**: Button, CodeChip, NameGrid, Timer, GuessTicker, RevealPanel, PlayerChip, ItemText, and the logos (DOM lab and Fueled wordmark as `currentColor`, via a `?mono` SVG import). Shared `.chamfer` / `.chamfer-all` clip-path classes carry the DOM lab motif.
- **`src/scenes/Scene.ts`**: `SceneProps { phase, item, players, guesses, reveal, copy, reducedMotion }`. `toSceneProps` redacts the round state so guess targets and the owner only appear at reveal.
- **`src/scenes/shared/`** (`SceneCanvas`, `stage.ts`, `SceneOverlay`):
  - DPR capped at 2.
  - Render loop paused while the tab is hidden.
  - Stage pixels mapped to world units, so 3D objects and HTML overlays line up at any aspect ratio.
- **`src/mock/`**: 8 fictional players and 8 entries, plus `useMockRound`, which simulates guesses with a seeded RNG so rounds are repeatable.

In all three concepts, the entry text and the owner's name are **crisp HTML over the canvas**, never 3D text. The 3D is atmosphere and choreography. That keeps the text legible after Meet compresses it, keeps it accessible, and keeps it identical across concepts.

## Bundle sizes (gzipped JS, `vite build`)

| Route | Total | Breakdown |
|---|---|---|
| `/` picker | ~73 KB | React app shell 69.9 + picker 0.8 + logos 2.3 |
| `/play` | **~76 KB** | shell 69.9 + Play 1.6 + primitives 2.4 + logos 2.3. **No Three.js** in the graph (checked in the build output). |
| `/deck` | ~323 KB | shell 69.9 + host 3.7 + primitives 4.7 + Three/R3F/drei 242.4 + scene 1.9 |
| `/orbit` | ~324 KB | same, scene 2.9 (+ emblem SVG fetched as a 11 KB asset) |
| `/signal` | ~323 KB | same, scene 2.5 |

On `/host` routes the shell (header, timer, ticker) paints before the Three.js chunk arrives, because scenes are dynamically imported. The three concepts are **the same size**: Three.js dominates, and each scene is only 2 to 3 KB. So "fastest to load" doesn't separate them. Runtime cost does.

---

## Orbit

![Orbit guessing](docs/mockups/orbit-guessing.jpg)

**Summary:**
- Each entry is a dark planet orbiting the Fueled emblem, with a soft glow in a Fueled secondary.
- The active planet pulls forward to center and becomes the surface the text resolves onto.
- Each guess spawns a moon around it.
- On reveal, correct guessers' moons stream into the planet as colored sparks, wrong ones drift off into space, and the owner's name appears on the planet.

**On a screen share:**
- One big dark disc with high-contrast text in the middle.
- The moons are large, solid Cryo dots, so each "guess received" registers even at low frame rates.
- The motion is slow and large-scale.

**Performance risks:**
- Low GPU cost (8 spheres, a handful of sprites, ~250 spark points).
- Additive glows can band under video compression.
- **Brand risk:** the emblem sits behind the active planet, so it's mostly visible only between rounds. The "orbiting the emblem" idea reads weakly in the middle of a round.
- Planets are colored by entry index, not by owner, so they can't leak the answer. That also means the colors carry no meaning.

## Signal

![Signal reveal](docs/mockups/signal-reveal.jpg)

**Summary:**
- A 7,000-particle noise field.
- The entry's glyphs are sampled from the **live DOM layout**, word by word, so particles fly in and assemble exactly where the crisp HTML text then fades in.
- Each guess sends a Cryo pulse ring through the field.
- Locking snaps the field to a lattice.
- On reveal, the particles reorganize into the owner's name, with the correct guessers' colors mixed in.

It's the most "DOM lab" of the three.

**On a screen share:** the payoff moment (text or name assembling) is large and lasts about 1.5 s. After the handoff, the particles step back to a dim color so the HTML text carries legibility.

**Performance risks:**
- **Highest of the three.** It runs 7,000 CPU particle updates per frame (fine on a modern laptop, but that laptop is also encoding Meet).
- Dense, small, moving dots are exactly what video compression smears into noise, so the ambient field will look muddier on the call than locally.
- Sampling depends on fonts loading and on layout. It re-samples on resize.

## Deck

![Deck reveal](docs/mockups/deck-reveal.jpg)

**Summary:**
- A Perfect White card with the DOM lab chamfered corners is dealt onto a dark table with some weight: a slide-in with rotation and a drop shadow.
- Each guess drops an anonymous grey chip onto a stack beside it.
- Lock presses the card into the table.
- Reveal flips the card, with a lift mid-flip, to a Nebula back with the owner's name. The chips take on guesser colors, correct chips restack, and wrong ones slide off the table.

**On a screen share:**
- **Best of the three.** Black text on a near-white card is the highest-contrast surface we have.
- The flip is a single big, unmistakable event that survives a choppy frame rate.
- Almost nothing moves while people are reading.

**Performance risks:**
- Lowest: a handful of meshes and no per-frame loops over large arrays.
- The flat card faces are unlit, so token colors render exactly.
- The main risk is taste: it's the least "wow" of the three.

## Phone (`/play`)

![Phone states](docs/mockups/phone.jpg)

The four states are:
- **Join:** room code + name.
- **Pick:** a 2-column NameGrid with 48 px+ targets. You can't pick yourself.
- **Waiting:** shows your locked pick.
- **Yours:** "This one's yours. Act natural."

All copy comes from the pack JSON or the generic `UI_COPY`. A mockup-only state switcher sits above the phone frame.

---

## Recommendation: build Deck

Deck is the concept most likely to work on Thursday:
- **Legibility:** it has the highest-contrast reading surface on a compressed Meet stream.
- **Reveal:** the flip is one big moment that stays readable even at a low frame rate.
- **Risk:** it carries the least runtime risk on a laptop that is also screen-sharing.
- **Brand:** the chamfered card and chips put the DOM lab motif in the system itself, not just the logo.
- **Fallback:** it's nearly 2D already, so the Phase 3 `flat` reduced-motion scene is basically "the card without the flip".

Orbit's spark stream and Signal's name assembly are worth keeping as selectable v2 themes. Because they share the same `SceneProps`, that's a drop-in later rather than a rewrite.
