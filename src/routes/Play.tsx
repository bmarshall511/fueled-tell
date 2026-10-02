import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { computeStandings, type Standing } from '../engine/scoring';
import type { Guess, PlayerId } from '../engine/types';
import { MOCK_ENTRIES, MOCK_ME_ID, MOCK_PACK, MOCK_PLAYERS, MOCK_ROOM_CODE } from '../mock/data';
import { isDemo, useDemoChannel, type DemoMsg } from '../mock/demoSync';
import { seeded } from '../mock/random';
import { tokens } from '../tokens/tokens';
import { Button } from '../ui/Button';
import { CodeChip } from '../ui/CodeChip';
import { UI_COPY } from '../ui/copy';
import { formatScore, ordinal } from '../ui/format';
import { BuiltBy, FueledWordmark } from '../ui/Logo';
import { NameGrid } from '../ui/NameGrid';
import { PlayerChip } from '../ui/PlayerChip';
import { useDocumentTitle } from '../ui/useHostChrome';
import styles from './Play.module.css';

type Screen = 'join' | 'lobby' | 'pick' | 'waiting' | 'yours' | 'final';
const SCREENS: Screen[] = ['join', 'lobby', 'pick', 'waiting', 'yours', 'final'];

const ME = MOCK_PLAYERS.find((p) => p.id === MOCK_ME_ID) ?? MOCK_PLAYERS[0]!;
const CODE_LENGTH = MOCK_ROOM_CODE.length;

/** Standalone mock: a plausible round and final result (seeded). */
const STANDALONE_ROUND = { index: 2, total: MOCK_ENTRIES.length, text: MOCK_ENTRIES[2]?.text ?? '' };
function mockFinal(): Standing[] {
  const rand = seeded(42);
  const history: Record<string, Guess[]> = {};
  for (const e of MOCK_ENTRIES) {
    history[e.id] = MOCK_PLAYERS.filter((p) => p.id !== e.ownerId).map((p) => ({
      playerId: p.id,
      entryId: e.id,
      ownerId: rand() < 0.45 ? e.ownerId : (MOCK_PLAYERS[Math.floor(rand() * MOCK_PLAYERS.length)]?.id ?? e.ownerId),
    }));
  }
  return computeStandings(MOCK_ENTRIES, history, MOCK_PLAYERS.map((p) => p.id), MOCK_PACK.points);
}

/** Native-feeling screen changes: View Transitions where supported, instant otherwise. */
function transition(update: () => void) {
  type VT = { finished: Promise<void>; ready: Promise<void>; updateCallbackDone: Promise<void> };
  const doc = document as Document & { startViewTransition?: (cb: () => void) => VT };
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!doc.startViewTransition || reduce) return update();
  const t = doc.startViewTransition(() => flushSync(update));
  // A newer transition can supersede this one (rapid state changes); that's fine.
  [t.finished, t.ready, t.updateCallbackDone].forEach((p) => p.catch(() => {}));
}

/** A short tap of haptics on supporting phones (Android); a no-op elsewhere. */
const buzz = () => navigator.vibrate?.(tokens.duration.fast / 5);

type HostState = Extract<DemoMsg, { type: 'state' }>;

/** Which phone screen a host snapshot implies (demo mode). */
function screenFor(host: HostState, guessed: boolean): Screen {
  switch (host.phase) {
    case 'showing':
    case 'guessing':
      return host.mine ? 'yours' : guessed ? 'waiting' : 'pick';
    case 'locked':
    case 'reveal':
      return host.mine ? 'yours' : 'waiting';
    case 'finale':
      return 'final';
  }
}

/** Phone player app (mock). Deliberately free of Three.js: imports only ui/, engine and mock data. */
export default function Play() {
  const demo = isDemo();
  const [screen, setScreenRaw] = useState<Screen>(() => {
    const s = new URLSearchParams(window.location.search).get('screen') as Screen | null;
    return s && SCREENS.includes(s) ? s : 'join';
  });
  const setScreen = (s: Screen) => s !== screen && transition(() => setScreenRaw(s));
  const [code, setCode] = useState(demo ? MOCK_ROOM_CODE : '');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pick, setPick] = useState<PlayerId | null>(() => (screen === 'join' ? null : (MOCK_PLAYERS[1]?.id ?? null)));
  const [lockedIndex, setLockedIndex] = useState<number | null>(null);
  const [host, setHost] = useState<HostState | null>(null);
  const joined = screen !== 'join';

  // Demo: follow the host mockup's state.
  const send = useDemoChannel((msg) => {
    if (msg.type === 'state') setHost(msg);
  });
  useEffect(() => {
    if (!demo || !host || !joined) return;
    if (lockedIndex !== host.index && host.phase === 'showing') setPick(null);
    setScreen(screenFor(host, lockedIndex === host.index));
  }, [host, joined, lockedIndex]);

  const round = host ?? STANDALONE_ROUND;
  const standings = useMemo(() => host?.standings ?? mockFinal(), [host?.standings]);
  const mine = standings.find((s) => s.playerId === ME.id);
  const winner = MOCK_PLAYERS.find((p) => p.id === standings[0]?.playerId);
  const picked = MOCK_PLAYERS.find((p) => p.id === pick);
  const others = MOCK_PLAYERS.filter((p) => p.id !== ME.id);
  const ids = { code: useId(), name: useId(), hint: useId(), error: useId() };

  // Move focus to each new screen's heading so screen readers announce it.
  const heading = useRef<HTMLHeadingElement>(null);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    heading.current?.focus();
  }, [screen]);
  useDocumentTitle(`${MOCK_PACK.name} · ${UI_COPY.appName}`);

  const progress = `${MOCK_PACK.copy.item} ${round.index + 1} ${UI_COPY.of} ${round.total}`;
  const h1 = (text: string, className = styles.title) => (
    <h1 ref={heading} tabIndex={-1} className={className}>
      {text}
    </h1>
  );
  /** The entry itself, so players never have to remember it. */
  const storyCard = (compact = false) => (
    <figure className={`chamfer ${styles.story} ${compact ? styles.storyCompact : ''}`}>
      <figcaption className={styles.storyLabel}>{progress}</figcaption>
      <blockquote className={styles.storyText}>{round.text}</blockquote>
    </figure>
  );
  const result = host?.result;
  const resultOwner = MOCK_PLAYERS.find((p) => p.id === result?.ownerId);

  return (
    <div className={styles.page}>
      {!demo && (
        <nav className={styles.mockNav} aria-label="Mockup states">
          <span>Mockup:</span>
          {SCREENS.map((s) => (
            <button key={s} type="button" aria-pressed={s === screen} onClick={() => setScreen(s)}>
              {s}
            </button>
          ))}
        </nav>
      )}

      <main className={`chamfer ${styles.phone}`}>
        <header className={styles.top}>
          <FueledWordmark height="20px" />
          {joined && <span className={styles.meta}>{name.trim() || ME.name}</span>}
        </header>

        <div className={styles.screen}>
          {screen === 'join' && (
            <form
              className={styles.stack}
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                if (code.length !== CODE_LENGTH || !name.trim()) {
                  setError(UI_COPY.joinError);
                  return;
                }
                setError(null);
                buzz();
                send({ type: 'join', name: name.trim() });
                send({ type: 'hello' });
                setScreen(demo ? 'lobby' : 'pick');
              }}
            >
              {h1(MOCK_PACK.name, styles.display)}
              <div className={styles.field}>
                <label htmlFor={ids.code} className={styles.label}>
                  {UI_COPY.roomCode}
                </label>
                <input
                  id={ids.code}
                  className={`chamfer ${styles.input} ${styles.code}`}
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CODE_LENGTH))}
                  placeholder={MOCK_ROOM_CODE}
                  autoCapitalize="characters"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  enterKeyHint="next"
                  required
                  aria-describedby={`${ids.hint}${error ? ` ${ids.error}` : ''}`}
                  aria-invalid={error !== null && code.length !== CODE_LENGTH}
                />
                <span id={ids.hint} className={styles.hint}>
                  {UI_COPY.roomCodeHint}
                </span>
              </div>
              <div className={styles.field}>
                <label htmlFor={ids.name} className={styles.label}>
                  {UI_COPY.yourName}
                </label>
                <input
                  id={ids.name}
                  className={`chamfer ${styles.input}`}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={ME.name}
                  autoComplete="nickname"
                  enterKeyHint="go"
                  required
                  aria-invalid={error !== null && !name.trim()}
                  aria-describedby={error ? ids.error : undefined}
                />
              </div>
              <p id={ids.error} className={styles.error} role="alert">
                {error}
              </p>
              <Button type="submit" className={styles.cta}>
                {UI_COPY.join}
              </Button>
            </form>
          )}

          {screen === 'lobby' && (
            <section className={`${styles.stack} ${styles.center}`}>
              <span className={`chamfer-all ${styles.pulse}`} aria-hidden="true" />
              {h1(UI_COPY.youreIn, styles.display)}
              <p className={styles.score}>{UI_COPY.lobbyWait}</p>
            </section>
          )}

          {screen === 'pick' && (
            <section className={styles.stack}>
              {h1(MOCK_PACK.copy.question)}
              {storyCard()}
              <NameGrid players={others} selectedId={pick} onSelect={setPick} legend={MOCK_PACK.copy.question} />
              <Button
                className={styles.cta}
                disabled={!pick}
                onClick={() => {
                  if (!pick) return;
                  buzz();
                  send({ type: 'guess', ownerId: pick });
                  setLockedIndex(round.index);
                  if (!demo) setScreen('waiting');
                }}
              >
                {UI_COPY.lockGuess}
              </Button>
            </section>
          )}

          {screen === 'waiting' && (
            <section className={`${styles.stack} ${styles.center}`}>
              {result && resultOwner ? (
                <>
                  {h1(result.correct === null ? UI_COPY.noGuess : result.correct ? UI_COPY.gotIt : UI_COPY.missed, styles.display)}
                  <p className={styles.label}>{UI_COPY.itWas}</p>
                  <PlayerChip player={resultOwner} size="phone" />
                </>
              ) : (
                <>
                  <span className={`chamfer-all ${styles.pulse}`} aria-hidden="true" />
                  {h1(MOCK_PACK.copy.waiting)}
                  {picked && (
                    <p className={styles.yourGuess}>
                      <span className={styles.label}>{UI_COPY.yourGuess}</span>
                      <PlayerChip player={picked} size="phone" />
                    </p>
                  )}
                </>
              )}
              {storyCard(true)}
            </section>
          )}

          {screen === 'yours' && (
            <section className={`${styles.stack} ${styles.center} ${styles.yours}`}>
              {h1(MOCK_PACK.copy.yours, styles.display)}
              {storyCard(true)}
            </section>
          )}

          {screen === 'final' && mine && (
            <section className={`${styles.stack} ${styles.center}`}>
              <p className={styles.label}>{MOCK_PACK.copy.finale}</p>
              {h1(`${UI_COPY.youPlaced} ${ordinal(mine.place)}`, styles.display)}
              <p className={styles.score}>
                {formatScore(mine.score)} {UI_COPY.points} · {mine.correct} {UI_COPY.correctGuesses} · {mine.fooled}{' '}
                {UI_COPY.fooled}
              </p>
              {winner && (
                <div className={`chamfer ${styles.winnerCard}`}>
                  <span className={styles.label}>{UI_COPY.winnerIs}</span>
                  <PlayerChip player={winner} size="phone" />
                </div>
              )}
            </section>
          )}
        </div>

        <footer className={styles.footer}>
          {joined ? <CodeChip code={MOCK_ROOM_CODE} /> : <span />}
          <BuiltBy height={`${tokens.size.builtbyPage * 0.7}px`} />
        </footer>
      </main>
    </div>
  );
}
