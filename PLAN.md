# Build plan: Tell, a party game (built by DOM lab)

> **Status (Fri Oct 2):** everything in this plan is built: engine, PeerJS + local transports, host and phone apps, Deck scene + flat fallback, finale with ranking, PWA, README. What remains is testing on real phones and networks (section 6). The working title "Whose Is It?" became **Tell**.

> Project plan. Kickoff prompts for each phase are at the bottom.

**Goal:** a static, zero-backend PWA on Vercel that any pod can use to run "guess who it belongs to" games on a video call. The first run is the DOM lab pod call on **Thu Oct 8**.

**Guiding rule:** simplicity over everything. No database, no accounts, no paid services. When in doubt, cut it.

---

## 1. Architecture at a glance

```
Host laptop (screen shared on Meet)            Player phones
┌─────────────────────────────┐               ┌──────────────┐
│ /host                       │◄── WebRTC ───►│ /play        │
│  game engine (source of     │   (PeerJS)    │  join, guess │
│  truth) + 3D scene          │               │  no Three.js │
│  localStorage: packs/state  │               └──────────────┘
└─────────────────────────────┘
        Static files on Vercel (free tier). No server code.
```

- **The host's browser is the server.** It runs the game engine and holds all state. Players connect to it peer-to-peer.
- **Transport: PeerJS** (free public broker, no account). The room code maps to the host's peer ID (e.g. `domlab-K7QF`). It sits behind a `Transport` interface so it can be swapped later (PartyKit, Supabase Realtime) without touching the game code.
- **Persistence: the host's `localStorage`** plus JSON import/export. Nothing personal leaves the host's machine except over the live peer connection.
- **Phones never download Three.js.** `/play` is a light React bundle; the 3D scene is lazy-loaded on `/host` only.

### Known risk and mitigation

WebRTC can fail on strict corporate or hotel networks, and the free tier doesn't include a TURN relay.

- **Mitigation 1:** test on Tue with 2 or 3 phones on cellular plus home Wi-Fi.
- **Mitigation 2:** **host-only mode**, which always works. Players shout or type guesses in Meet chat, and you tap the tally on the host screen. The game is still fun with zero networking.

## 2. Getting submissions in (no DB)

Two intake modes, both stored only on the host:

1. **Host import** (for Thursday): paste `Name | story` lines, or a CSV, into the host setup screen. Stories you received by DM go straight in.
2. **Live lobby submit** (for other pods): players type their entry on their phone while in the lobby. It's sent to the host over the peer connection and nothing is stored server-side.

Other things in this section:

- **Export / import a session or pack as JSON.** This is how another pod gets a pre-built game, or how you resume after a refresh.
- **Anonymity:** entries are shuffled, and the author is only sent to phones at reveal. The host screen never shows authors before reveal, so it's safe to share.

## 3. Repo structure

```
tokens/tokens.json          # DTCG source of truth (Fueled + DOM lab)
scripts/build-tokens.ts     # -> src/tokens/tokens.css + tokens.ts
src/
  engine/                   # pure TS, no React, no DOM
    types.ts                # Pack, Entry, Player, Guess, GameState, Msg
    machine.ts              # reducer: (state, action) -> state
    scoring.ts
    redact.ts               # strips authors from state sent to players
  transport/
    Transport.ts            # interface: host(), join(), send(), on()
    peer.ts                 # PeerJS adapter
    local.ts                # BroadcastChannel adapter (multi-tab dev + tests)
  packs/                    # JSON pack configs
    true-story.json
    fave-show.json
    two-truths.json
  scenes/
    Scene.ts                # shared props interface
    <winner>/               # the mockup you picked
    flat/                   # 2D fallback (reduced motion / low power)
  ui/                       # primitives: Button, CodeChip, NameGrid, Timer, Logo
  routes/
    Landing.tsx  Host.tsx  Play.tsx
```

## 4. Core concepts

**Pack**: everything game-specific lives in config, not code.

```jsonc
{
  "id": "true-story",
  "name": "True Story",
  "prompt": "A short, true story from your life. Weird, funny, or 'wait, really?'",
  "entry": { "type": "text", "maxLength": 280 },
  "guess": "owner",                 // who does this belong to
  "timerSec": 45,
  "copy": { "reveal": "It was…", "yours": "This one's yours. Act natural." }
}
```

**Engine phases:** `lobby → intro → showing → guessing → locked → reveal → (next | finale)`. Pure reducer, fully unit-tested, transport-agnostic.

**Messages:**

- **Player → host:** `join {playerId, name}`, `submit {text}`, `guess {entryId, ownerId}`
- **Host → players:** `state {redacted snapshot}`. The host broadcasts the whole redacted state on every change. That's simpler than diffs, and the state is tiny.
- **Reconnects:** `playerId` lives in the phone's `localStorage`, so a refresh rejoins as the same player.

**Scoring (ranked):** every game ends with a ranking: points, places and a winner. (The "Just for fun" mode was removed on 2026-10-02.)

- A correct guess scores **100**; an owner scores **50** for every player their entry fools. Points are set in `src/content/game.json` (`points`).
- Places use standard competition ranking: equal scores share a place (1, 2, 2, 4); within a tie, more correct guesses list first.
- Host-only mode: the host ticks who guessed right after each reveal, so only correct guesses score (there's no record of wrong guesses to award "fooled" points).
- Each reveal shows the % who guessed right; phones show "You got it" / "Not this time", and the owner sees how many they fooled.
- You can't guess your own entry, or name yourself.

**Tokens → everything:**

- `tokens.json` generates CSS variables for the UI and a typed TS object that the Three.js materials read.
- A pack can override semantic tokens (e.g. `accent`) for a themed game.
- This is the article demo: one token change reskins both the UI and the 3D scene.

## 5. Quality bars

- **Performance:**
  - `/play` stays under about 100 KB gzipped JS.
  - `/host` paints the shell before Three.js loads (dynamic import).
  - DPR capped at 2, render loop paused when hidden, geometries and textures disposed on scene change.
- **Screen-share friendly:** body text at least 40px on the host view, high contrast, no meaning carried by subtle motion or thin lines.
- **Accessibility:**
  - WCAG AA contrast (Nebula for large text/accents only).
  - Full keyboard control on the host (Space = next, R = reveal).
  - `prefers-reduced-motion` switches to the `flat` scene.
  - Phone tap targets at least 44px.
- **PWA:** `vite-plugin-pwa` with a manifest, icons and an offline app shell, so the host is installable. Realtime naturally needs a network.
- **Code:**
  - Strict TS, ESLint + Prettier.
  - Vitest for `engine/` and `redact.ts`.
  - No hex values outside `tokens.json`.
  - No game copy outside packs.

## 6. Schedule (call is Thu Oct 8)

| When | Phase | Done when |
|---|---|---|
| Fri Oct 2 | **0. Mockups** (Prompt 1) | Picked **Deck** ✅ |
| Fri Oct 2 | **1–3 built in one go** (foundation, networking + intake, polish) | ✅ Built; see BUILD_LOG.md |
| Mon Oct 5 | **1. Foundation:** token pipeline, engine + tests, packs, local transport, host and play routes working across two browser tabs | A full game plays end to end in two tabs |
| Tue Oct 6 | **2. Networking + intake:** PeerJS adapter, room code + QR join, phone UI, host import + live submit, JSON export/import. Deploy a Vercel preview | 3 real phones on different networks join and play |
| Wed Oct 7 | **3. Polish:** port the winning scene into `scenes/`, flat fallback, finale podium, PWA, perf + a11y pass, README for other pods. **Load the stories at EOD** | Lighthouse looks good, the README lets another EM run it cold |
| Thu Oct 8 AM | **Dry run:** a full game with a laptop + 2 phones, with host-only mode ready as a backup | Confident |
| Thu Oct 8 | **Play it** | 🎉 |
| After | **v2 ideas:** more packs (photo entries, fave show), other scenes as selectable themes, optional PartyKit transport, share it in the guild | |

If a day slips, the cut order is: (1) live submit, (2) PWA. **Never cut host-only mode.**

## 7. For the guild write-up

`BUILD_LOG.md` gets an entry every session: the goal, what the AI generated, what you decided or changed by hand, what you had to verify, and time spent. That gives you a factual before/after for the workflow story (mockups to production in about 5 days, solo), without reconstructing it from memory.

---

## Kickoff prompts (paste one per session)

**Phase 1:**
> Read `PLAN.md` and `MOCKUPS.md`. I picked **[concept]**. Do Phase 1 only: token pipeline, the engine (with Vitest tests covering every phase transition, redaction, and the can't-guess-own-entry rule), the three pack JSONs, the `Transport` interface + `local` adapter, and minimal `/host` and `/play` routes that play a full game across two tabs using the flat scene. Reuse the mockup's UI primitives and tokens; delete anything from the mockups we're not keeping. Show me the folder tree and test results when done, then update `BUILD_LOG.md`.

**Phase 2:**
> Read `PLAN.md`. Do Phase 2: PeerJS adapter behind `Transport`, room codes (4 chars, no ambiguous letters) + a QR code on the host lobby, the phone join/guess/waiting/yours screens, host import (paste `Name | story` or CSV), live lobby submit, and session JSON export/import to localStorage. Add host-only mode (manual tally) as a toggle. Keep `/play` free of Three.js and report its gzipped size. Give me a checklist for testing on real phones, then update `BUILD_LOG.md`.

**Phase 3:**
> Read `PLAN.md`. Do Phase 3: port the **[concept]** scene into `scenes/` against the shared `Scene` interface (lazy-loaded), wire reduced-motion to the flat scene, build the finale podium, add `vite-plugin-pwa`, and do a performance + accessibility pass against section 5 (report numbers). Write a `README.md` aimed at another engineering manager running this with their pod for the first time. Update `BUILD_LOG.md` with a summary of the whole build.
