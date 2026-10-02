# Tell

A party game for video calls, built by DOM lab for Fueled. Everyone shares a short true story; one laptop shares its screen; players guess **whose story it is** on their phones. Drumroll, reveal, points, podium.

No accounts, no servers, no cost. The host's browser runs the game; phones connect to it directly (WebRTC via the free PeerJS broker).

---

## Running a game with your pod (for the host)

**You need:** a laptop on the call that can share its screen, and everyone's phone (or laptop) on a normal network.

### Before the call (5 minutes)

1. Ask everyone for a short true story (1–3 sentences, weird or funny). DMs are fine.
2. Open **`/host`** on the laptop you'll share. **Don't share your screen yet**: setup shows who wrote what.
3. Pick a pack (True Story, Comfort Watch, Two Truths).
4. Add entries, either way:
   - Type them in, one row per person (Enter jumps to the entry; Cmd/Ctrl+Enter adds the next row).
   - **Paste a list** from Slack, a doc or a spreadsheet: `Name | story`, `Name: story`, `Name - story`, two spreadsheet columns, or a name on its own line with the story underneath. You'll see a preview of every row before anything is added, and rows that need a fix are highlighted, never dropped.
   - Or choose **Players type them on their phones** and they'll write their entry in the lobby.
5. Pick a timer and scoring (**Points & places** is the default), then **Open lobby**.

### On the call

1. **Share your screen** (the browser tab is best). Press **F** for full screen.
2. Players go to the link on screen (or scan the QR) and enter the 4-letter code. If you added their story, they just tap their name.
3. Press **Start game** (or **Space**). Each story is dealt to the screen and appears on everyone's phone.
4. Players guess on their phone. Guessing locks when the timer runs out or everyone's in.
5. **Space** steps through: lock → drumroll + reveal → next story. After the last one: the podium.

**Keys:** Space next · L lock · R reveal · M sound · F full screen. **Menu** has _Download a backup_ and _End game_.

**Sound:** short, synthesized cues. To have them reach the call, share the _tab_ with "Share tab audio" ticked; otherwise press M to mute.

### If phones can't connect

Some corporate or hotel networks block peer-to-peer connections. In the lobby use **Switch to host-only**: no phones needed. Read each story, let people shout, and after the reveal tick who got it right. Scoring still works.

### If something goes wrong

- **Refresh is safe.** The game is saved in this browser and resumes; phones reconnect on their own (give it up to ~10 seconds: the connection service briefly holds the old room after a refresh).
- **Keep one host tab per game.** A second tab on the same room shows "in use" and won't overwrite the first tab's game.
- **"Room code in use"**: another tab is hosting it. Close it, or use _Get a new code_.
- Players who refresh rejoin as themselves automatically.

---

## Development

```bash
npm install
npm run dev        # http://localhost:5173
npm run check      # typecheck + project rules + tests
npm run build      # production build (PWA) in dist/
```

| Route   | What                                                                                |
| ------- | ----------------------------------------------------------------------------------- |
| `/`     | Landing: host, join, demo                                                           |
| `/host` | Host: setup → lobby → game → finale                                                 |
| `/play` | Player app (`?room=K7QF` from the QR)                                               |
| `/demo` | A real game in one browser: host + phone frames over the local transport, with bots |

**Dev flags:** `?transport=local` (BroadcastChannel instead of PeerJS, same browser only) · `?room=K7QF` (force a code, local only) · `?sample=1` (host: skip setup with sample entries) · `?bots=1` (host: imported players guess on their own) · `?scene=flat` (2D scene) · `?motion=reduced` · `?seat=2` (player: separate identity per tab).

**Try a game alone:** open `/host?transport=local&sample=1&bots=1` in one tab and `/play?transport=local&room=<code>` in another, or just open `/demo`.

### How it's put together

- `tokens/tokens.json` is the only place design values live (W3C DTCG). A Vite plugin generates `src/tokens/tokens.css` and `tokens.ts`; change a token and the UI and 3D scene both update.
- `src/engine/`: pure game logic (reducer, scoring, redaction, intake parser, room codes), with tests.
- `src/transport/`: one `Transport` interface; `peer.ts` (PeerJS) and `local.ts` (BroadcastChannel).
- `src/host/`: the shared-screen app, in `setup/`, `lobby/`, `game/` and `state/` (`useHostGame`, split into session, room, timers and bots hooks).
- `src/player/`: the phone app. `screenFor.ts` picks the screen, `screens/` holds one file per screen, and `components/` the layout pieces.
- `src/ui/`: shared components, hooks, copy and base styles. `src/scenes/`: Deck (Three.js, lazy) and the flat fallback.
- Packs are JSON in `src/packs/`. Add one: drop in a file shaped like `true-story.json` and list it in `src/packs/index.ts`.

See `PLAN.md` for the design, `CLAUDE.md` for conventions, `BUILD_LOG.md` for how it was built.

### Deploying (Vercel, free)

1. Import `github.com/bmarshall511/fueled-tell` in Vercel. `vercel.json` sets the build (`npm run build` → `dist/`) and the rewrites that make `/host`, `/play` and `/demo` work on refresh.
2. Share the URL. The lobby's QR code and join link use whatever domain you deploy to.
3. It's a PWA: on HTTPS, Chrome/Edge/Android offer **Install Tell**; on iOS use Share → Add to Home Screen.

No environment variables or services to configure. Realtime uses the free public PeerJS broker.

**Fonts:** Aeonik Medium is included in `assets/fonts/` with its CoType web-font EULA.
