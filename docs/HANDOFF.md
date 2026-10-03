# Session handoff (2026-10-02)

Read this together with `CLAUDE.md` (rules and where things live), `README.md` (how to run a game) and
`BUILD_LOG.md` (what was built, session by session; latest entries at the bottom).

## Where things stand

Tell is feature-complete and deployed from `main` (Vercel, https://fueled-tell.vercel.app). Built in this session:

- **Cleanup:** feature folders, small components, shared primitives, and a pure `screenFor` for the phone.
- **Layout:** responsive fixes (no sideways scroll; the host bottom dock in normal flow) and one page width (`.page` / `size.content`).
- **Retheme to fueled.com:** rounded corners, glass surfaces, the animated glow `Backdrop`, gradient text, white primary pills.
- **One game, no packs:** content lives in `src/content/game.json`.
  - Always points & places (the scoring options are gone).
  - Device-neutral copy (no "laptop", "phone" or "big screen").
- **Sharing and PWA:** Open Graph and Twitter cards with `public/og.png`, and a richer manifest with install screenshots.
- **Transitions:** native View Transitions between pages and host screens; the room code morphs from the lobby into the game bar.
- **Setup studio:** an empty state with three choices, quick add, editable person cards, a sticky panel with a live preview and readiness meter, a pinned dock on phones, and a paste sheet.
- **Buttons:**
  - Hover: a rotating gradient ring, a light sweep and a glow.
  - Press: a ripple. Nothing ever moves.
  - Busy and done states for the phone's join, lock-in and send-entry.
  - Icon tooltips, a sliding segmented thumb and a springy switch.
- **Cursor effects** (pages only, mouse only): a glow that follows the pointer, parallax, and `.spot` card spotlights.
- **Easter eggs** (see `BUILD_LOG.md` session 1r):
  - Round moments on the revealed card: Mind Meld, Master of Disguise, The Herd.
  - Speed Demon bolts, the Enigma award, Bolt Rain, and the phone Highlight Reel.
  - "Act natural" tips.
  - Lucky room codes, plus a blocklist for offensive codes.
  - Bolt Charge (5 clicks on the landing logo), "tell", the Konami retro deck, and the `?` shortcuts.
  - The console hello, a 404 "round", and the hidden "office legends" (type `DOM lab` in the setup quick-add name, then Enter).

## How to run and verify

```bash
npm run dev          # http://localhost:5173 (keep it running for the QA scripts)
npm run check        # tsc + rule checks (no hex outside tokens; /play never imports Three.js) + 53 tests
npx vite build
```

The browser QA harness is now in the repo, in `scripts/qa/` (see its README): screenshots of every state, axe-core,
overflow and layout probes, width and transition checks, an easter-egg checker, and full local and PeerJS games. Screenshots go to
`scripts/qa/audit/` (gitignored). Review them with `python3 sheet.py`, which builds contact sheets.

## Conventions and lessons from this session (keep doing these)

- **The user is very detail-oriented about UI.** Never ship a visual change without screenshot review at desktop, portrait and phone sizes, including hover, focus, busy and empty states. Several regressions were only caught that way: a wrapped button label, a fake-full meter, a moment line colliding with the card, an invisible tooltip widening the page.
- **Interactions:**
  - Feedback is light and color only; controls never move or resize.
  - Effects respect reduced motion (they run once or not at all) and stay off the shared host screen when they follow the cursor.
- **Copy:**
  - It's device-neutral.
  - Game-specific words come from `GAME` (`src/content/game.json`); UI chrome lives in `src/ui/copy.ts`.
- **Mockups first:** for big visual changes, show a mockup in `docs/mockups/` and wait for approval.
- **Commits:** one per concept with the Co-Authored-By line, and push to `main`.
- **Build log:** append a `BUILD_LOG.md` entry per session and get the time from `date`. The user has corrected wrong times several times.
- **Automated checks:** axe must stay at 0 violations. Animated text must keep contrast through its whole animation (breathe between readable colors, not opacity).

## Open items to look at

- **Width probe:** `scripts/qa/widths.mjs` once reported "no .page" for `/host` at 1920. That's probably a timing issue (the lazy route had not rendered yet), but confirm it.
- **Real devices:**
  - iOS Safari: backdrop-filter blur, glow performance and heat over a full game, and View Transitions (Safari 18.2+).
  - Cursor effects with a real mouse.
  - The PWA install dialog on Android/Chrome.
- **After deploying:** check the link-preview card in Slack, iMessage and LinkedIn (Post Inspector to refresh it).
- **On a real Meet or Zoom screen share:** easter-egg wording and feel, whether Bolt Rain is visible, and whether retro mode is fun or too subtle.
- **Font licence:** the Aeonik web fonts are published in a public repo. Check the CoType EULA permits that.

## Suggested audit checklist (next session)

1. **Run the whole harness** and read every result. Then build contact sheets of `audit/` and review each screen by eye.
2. **Pages:**
   - `/` landing: install card, join with a code, Bolt Charge.
   - `/demo`.
   - `/play` code entry.
   - The 404 at `/anything`.
3. **Host:**
   - Setup in every state: empty; adding people; problems; paste sheet; live mode; host-only; editing an open lobby; loading a saved game.
   - Lobby: lucky code, long roster, host-only, "tell", `?`.
   - Round: guessing, locked, drumroll, reveal with each moment, host-only tally, menu, retro.
   - Finale: Enigma, rain, restart.
   - All at 1920×1080, 1280×720, about 900×520, 1024×768 and 390×844 portrait.
4. **Phone:** code, join (claim and new name, busy), lobby (live entry, busy and done), pick (busy), waiting, yours (tips), result (moment, lightning), final (highlight), not found, reconnecting. All at 390 and desktop width.
5. **Functionality:**
   - A full game locally and over PeerJS.
   - A host refresh mid-round.
   - A phone refresh.
   - Host-only mode.
   - Live intake.
   - Seat keys (no seat takeover).
   - Backup and restore.
   - Keyboard shortcuts.
   - Reduced motion.
   - Forced colors.
   - Screen-reader announcements (`aria-live`) for each screen and egg.
6. **Fix what's found, re-verify, append to `BUILD_LOG.md`, commit and push.**
