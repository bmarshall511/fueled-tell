import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import type { PlayerView } from '../engine/redact';
import { normalizeRoomCode, ROOM_CODE_LENGTH } from '../engine/roomCode';
import type { PlayerId } from '../engine/types';
import { useDrumroll } from '../ui/hooks/useDrumroll';
import { packById } from '../packs';
import { usePlayerGame, type PlayerGame } from './usePlayerGame';
import { tokens } from '../tokens/tokens';
import { Button } from '../ui/components/Button';
import { CodeChip } from '../ui/components/CodeChip';
import { UI_COPY } from '../ui/copy';
import { formatScore, ordinal } from '../ui/lib/format';
import { useNow } from '../ui/hooks/hooks';
import { BuiltBy, FueledWordmark } from '../ui/components/Logo';
import { NameGrid } from '../ui/components/NameGrid';
import { PlayerChip } from '../ui/components/PlayerChip';
import { useDocumentTitle } from '../ui/hooks/useHostChrome';
import styles from './PlayerApp.module.css';

const P = UI_COPY.play;

/** Native-feeling screen changes: View Transitions where supported. */
function useScreenTransition(key: string) {
  const [shown, setShown] = useState(key);
  useEffect(() => {
    if (key === shown) return;
    type VT = { finished: Promise<void>; ready: Promise<void>; updateCallbackDone: Promise<void> };
    const doc = document as Document & { startViewTransition?: (cb: () => void) => VT };
    const skip =
      !doc.startViewTransition || document.visibilityState !== 'visible' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (skip) return setShown(key);
    const t = doc.startViewTransition(() => flushSync(() => setShown(key)));
    [t.finished, t.ready, t.updateCallbackDone].forEach((p) => p.catch(() => {}));
  }, [key, shown]);
  return shown;
}

/** A short haptic tick on phones that support it (Android). */
const buzz = (ms: number = tokens.duration.fast / 5) => navigator.vibrate?.(ms);

/** Which screen the phone shows. */
function screenFor(g: PlayerGame, changing: boolean): string {
  if (!g.identity.room) return 'code';
  if (!g.view) return g.status === 'not-found' ? 'notfound' : 'connecting';
  if (!g.joined) return 'join';
  const v = g.view;
  if (v.phase === 'lobby') return 'lobby';
  if (v.phase === 'finale') return 'final';
  if (v.item?.mine) return v.phase === 'reveal' ? `result-${v.item.id}` : `yours-${v.item.id}`;
  if (v.phase === 'reveal') return `result-${v.item?.id}`;
  if (v.phase === 'guessing' && (!v.myGuess || changing)) return `pick-${v.item?.id}`;
  if (v.phase === 'showing') return `pick-${v.item?.id}`;
  return `waiting-${v.item?.id}`;
}

/** /play: the player app. Phones first, but a proper two-column layout on desktop. Never loads Three.js. */
export default function Play() {
  const g = usePlayerGame();
  const [changing, setChanging] = useState(false);
  const itemId = g.view?.item?.id;
  useEffect(() => setChanging(false), [itemId]);
  const screen = useScreenTransition(screenFor(g, changing));
  const pack = packById(g.view?.packId ?? 'true-story');
  useDocumentTitle(`${g.identity.room ? `${g.identity.room} · ` : ''}${UI_COPY.appName}`);

  // Focus each new screen's heading so screen readers announce it.
  const main = useRef<HTMLElement>(null);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    main.current?.querySelector<HTMLElement>('h1')?.focus();
  }, [screen]);

  const me = g.view?.players.find((p) => p.id === g.view?.me);
  const kind = screen.split('-')[0];

  return (
    <div className={styles.app}>
      <header className={styles.bar}>
        <a href="/" className={styles.brand} aria-label={`${UI_COPY.appName} home`}>
          <FueledWordmark height="20px" />
          <span className={styles.appName}>{UI_COPY.appName}</span>
        </a>
        <span className={styles.who}>
          {me && <PlayerChip player={me} size="phone" />}
          {g.identity.room && g.view && (
            <span className={styles.roomTag} aria-label={`${UI_COPY.lobby.joinAt} ${g.identity.room.split('').join(' ')}`}>
              {g.identity.room}
            </span>
          )}
        </span>
      </header>

      {g.status === 'reconnecting' && g.view && (
        <p className={styles.banner} role="status">
          {P.reconnecting}
        </p>
      )}

      <main ref={main} className={`${styles.main} ${styles[`s_${kind}`] ?? ''}`}>
        {kind === 'code' && <CodeEntry onSubmit={g.setRoom} />}
        {kind === 'connecting' && (
          <Centered>
            <span className={`chamfer-all ${styles.pulse}`} aria-hidden="true" />
            <Heading>{P.connecting}</Heading>
            <CodeChip code={g.identity.room ?? ''} />
            <Button variant="secondary" onClick={g.leaveRoom}>
              {P.changeCode}
            </Button>
          </Centered>
        )}
        {kind === 'notfound' && (
          <Centered>
            <Heading>{P.notFound}</Heading>
            <CodeChip code={g.identity.room ?? ''} />
            <Button variant="secondary" onClick={g.leaveRoom}>
              {P.changeCode}
            </Button>
          </Centered>
        )}
        {kind === 'join' && g.view && <JoinForm view={g.view} game={g} />}
        {kind === 'lobby' && g.view && <LobbyScreen view={g.view} game={g} prompt={pack.prompt} itemNoun={pack.copy.item} />}
        {kind === 'pick' && g.view && (
          <PickScreen
            view={g.view}
            game={g}
            question={pack.copy.question}
            item={pack.copy.item}
            onLocked={() => setChanging(false)}
            receivedAt={g.receivedAt}
          />
        )}
        {kind === 'waiting' && g.view && (
          <WaitingScreen view={g.view} copy={pack.copy.waiting} item={pack.copy.item} onChange={() => setChanging(true)} />
        )}
        {kind === 'yours' && g.view && (
          <Split aside={<StoryCard view={g.view} item={pack.copy.item} />}>
            <Heading className={styles.accent}>{pack.copy.yours}</Heading>
            <Progress view={g.view} />
          </Split>
        )}
        {kind === 'result' && g.view && <ResultScreen view={g.view} item={pack.copy.item} receivedAt={g.receivedAt} />}
        {kind === 'final' && g.view && <FinalScreen view={g.view} finale={pack.copy.finale} />}
      </main>

      <footer className={styles.footer}>
        <BuiltBy height={`${tokens.size.builtbyPage * 0.7}px`} />
      </footer>
    </div>
  );
}

// ---------- Layout helpers ----------

function Heading({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h1 tabIndex={-1} className={`${styles.h1} ${className ?? ''}`}>
      {children}
    </h1>
  );
}

const Centered = ({ children }: { children: ReactNode }) => <section className={styles.centered}>{children}</section>;

/**
 * One column on phones; context left, actions right on wide screens.
 * `actionsFirst`: on phones, show the actions above the context (e.g. "You're in" before the roster).
 */
const Split = ({ aside, children, actionsFirst }: { aside: ReactNode; children: ReactNode; actionsFirst?: boolean }) => (
  <div className={`${styles.split} ${actionsFirst ? styles.actionsFirst : ''}`}>
    <div className={styles.aside}>{aside}</div>
    <section className={styles.actions}>{children}</section>
  </div>
);

function StoryCard({ view, item, compact }: { view: PlayerView; item: string; compact?: boolean }) {
  if (!view.item) return null;
  return (
    <figure className={`chamfer ${styles.story} ${compact ? styles.storyCompact : ''}`}>
      <figcaption className={styles.storyLabel}>
        {item} {view.index + 1} {UI_COPY.of} {view.total}
      </figcaption>
      <blockquote className={styles.storyText}>{view.item.text}</blockquote>
    </figure>
  );
}

function Progress({ view }: { view: PlayerView }) {
  return (
    <p className={styles.muted} aria-live="polite">
      {view.guessedCount}/{view.expectedCount} {UI_COPY.guesses}
    </p>
  );
}

function Countdown({ view, receivedAt }: { view: PlayerView; receivedAt: number }) {
  const now = useNow(250, view.remainingMs !== null);
  if (view.remainingMs === null) return null;
  const secs = Math.max(0, Math.ceil((view.remainingMs - (now - receivedAt)) / 1000));
  return (
    <p className={`${styles.countdownRow} ${secs <= 5 ? styles.urgent : ''}`} role="timer" aria-label={`${secs} ${P.secondsLeft}`}>
      <span className={styles.countdown}>{secs}</span>
      <span className={styles.label}>{P.secondsLeft}</span>
    </p>
  );
}

// ---------- Screens ----------

function CodeEntry({ onSubmit }: { onSubmit: (code: string) => void }) {
  const [code, setCode] = useState('');
  const ids = { code: useId(), hint: useId() };
  return (
    <Split
      aside={
        <div className={`${styles.hero} ${styles.wideOnly}`}>
          <p className={styles.heroName}>{UI_COPY.appName}</p>
          <p className={styles.muted}>{UI_COPY.tagline}</p>
        </div>
      }
    >
      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          if (code.length === ROOM_CODE_LENGTH) onSubmit(code);
        }}
      >
        <Heading>{P.enterCode}</Heading>
        <label htmlFor={ids.code} className="visually-hidden">
          {UI_COPY.landing.join}
        </label>
        <input
          id={ids.code}
          className={`chamfer ${styles.input} ${styles.codeInput}`}
          value={code}
          onChange={(e) => setCode(normalizeRoomCode(e.target.value))}
          autoCapitalize="characters"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          inputMode="text"
          enterKeyHint="go"
          aria-describedby={ids.hint}
          autoFocus
        />
        <span id={ids.hint} className={styles.hint}>
          {P.codeHint}
        </span>
        <Button type="submit" disabled={code.length !== ROOM_CODE_LENGTH} className={styles.cta}>
          {P.go}
        </Button>
        <a className={styles.textLink} href="/host">
          {P.hostInstead}
        </a>
      </form>
    </Split>
  );
}

function JoinForm({ view, game }: { view: PlayerView; game: PlayerGame }) {
  const [name, setName] = useState(game.identity.name);
  const ids = { name: useId(), err: useId(), claim: useId() };
  const unclaimed = view.players.filter((p) => !p.claimed);
  const err = game.error ? P.errors[game.error] : null;
  return (
    <Split
      aside={
        <div className={`${styles.hero} ${styles.wideOnly}`}>
          <p className={styles.heroName}>{UI_COPY.appName}</p>
          <p className={styles.muted}>{UI_COPY.tagline}</p>
        </div>
      }
    >
      <Heading>{P.whoAreYou}</Heading>
      {unclaimed.length > 0 && (
        <section className={styles.claim} aria-labelledby={ids.claim}>
          <h2 id={ids.claim} className={styles.h2}>
            {P.claimHint}
          </h2>
          <ul className={styles.claimList}>
            {unclaimed.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  className={`chamfer ${styles.claimBtn}`}
                  onClick={() => {
                    buzz();
                    game.join(p.name, p.id);
                  }}
                >
                  {p.name}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      <form
        className={styles.form}
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          buzz();
          game.join(name);
        }}
      >
        <label htmlFor={ids.name} className={styles.label}>
          {unclaimed.length ? P.orNew : P.yourName}
        </label>
        <input
          id={ids.name}
          className={`chamfer ${styles.input}`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="nickname"
          enterKeyHint="go"
          maxLength={32}
          required
          aria-invalid={!!err}
          aria-describedby={err ? ids.err : undefined}
        />
        <p id={ids.err} className={styles.error} role="alert">
          {err}
        </p>
        <Button type="submit" className={styles.cta}>
          {P.joinBtn}
        </Button>
      </form>
    </Split>
  );
}

function LobbyScreen({ view, game, prompt, itemNoun }: { view: PlayerView; game: PlayerGame; prompt: string; itemNoun: string }) {
  // (actions first on phones: "You're in" and the entry form before the roster)
  const live = view.settings.intake === 'live';
  const [text, setText] = useState(view.myEntry ?? '');
  const ids = { text: useId(), count: useId() };
  const len = text.trim().length;
  const here = view.players.filter((p) => p.claimed && p.connected);
  return (
    <Split
      actionsFirst
      aside={
        <section className={styles.here}>
          <h2 className={styles.h2}>
            {P.here} ({here.length})
          </h2>
          <ul className={styles.chips}>
            {here.map((p) => (
              <li key={p.id}>
                <PlayerChip player={p} size="phone" />
              </li>
            ))}
          </ul>
        </section>
      }
    >
      <Heading>{P.youreIn}</Heading>
      <p className={styles.muted}>{P.lobbyWait}</p>
      {live && (
        <form
          className={styles.form}
          onSubmit={(e) => {
            e.preventDefault();
            if (!len || len > view.settings.maxLength) return;
            buzz();
            game.submit(text);
          }}
        >
          <label htmlFor={ids.text} className={styles.label}>
            {P.yourEntry}: {prompt}
          </label>
          <textarea
            id={ids.text}
            className={`chamfer ${styles.input} ${styles.textarea}`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            placeholder={itemNoun}
            aria-describedby={ids.count}
          />
          <span id={ids.count} className={`${styles.hint} ${len > view.settings.maxLength ? styles.urgent : ''}`}>
            {len}/{view.settings.maxLength}
          </span>
          {view.myEntry && <p className={styles.ok}>{P.sent}</p>}
          <Button type="submit" disabled={!len || len > view.settings.maxLength || text.trim() === view.myEntry} className={styles.cta}>
            {view.myEntry ? P.update : P.submit}
          </Button>
        </form>
      )}
    </Split>
  );
}

function PickScreen({
  view,
  game,
  question,
  item,
  onLocked,
  receivedAt,
}: {
  view: PlayerView;
  game: PlayerGame;
  question: string;
  item: string;
  onLocked: () => void;
  receivedAt: number;
}) {
  const [pick, setPick] = useState<PlayerId | null>(view.myGuess);
  const open = view.phase === 'guessing';
  const others = view.players.filter((p) => p.id !== view.me);
  return (
    <Split aside={<StoryCard view={view} item={item} />}>
      <Countdown view={view} receivedAt={receivedAt} />
      <Heading>{question}</Heading>
      {!open && <p className={styles.muted}>{P.opensSoon}</p>}
      <NameGrid players={others} selectedId={pick} onSelect={setPick} legend={question} />
      <Button
        className={styles.cta}
        disabled={!pick || !open}
        onClick={() => {
          if (!pick) return;
          buzz(tokens.duration.fast / 3);
          game.guess(pick);
          onLocked();
        }}
      >
        {P.lockGuess}
      </Button>
    </Split>
  );
}

function WaitingScreen({ view, copy, item, onChange }: { view: PlayerView; copy: string; item: string; onChange: () => void }) {
  const picked = view.players.find((p) => p.id === view.myGuess);
  return (
    <Split aside={<StoryCard view={view} item={item} compact />}>
      <span className={`chamfer-all ${styles.pulse}`} aria-hidden="true" />
      <Heading>{view.phase === 'locked' ? P.locked : copy}</Heading>
      {picked && (
        <p className={styles.yourGuess}>
          <span className={styles.label}>{P.yourGuess}</span>
          <PlayerChip player={picked} size="phone" />
        </p>
      )}
      <Progress view={view} />
      {view.phase === 'guessing' && (
        <Button variant="secondary" onClick={onChange}>
          {P.changeGuess}
        </Button>
      )}
    </Split>
  );
}

function ResultScreen({ view, item, receivedAt }: { view: PlayerView; item: string; receivedAt: number }) {
  // Pin the drumroll start to the first snapshot of this reveal.
  const start = useRef<{ id: string; elapsed: number } | null>(null);
  const id = view.item?.id ?? '';
  if (start.current?.id !== id) start.current = { id, elapsed: (view.revealElapsedMs ?? 0) + (Date.now() - receivedAt) };
  const drum = useDrumroll(true, start.current.elapsed, false);
  const reveal = view.reveal;
  const owner = view.players.find((p) => p.id === reveal?.ownerId);
  const mine = view.item?.mine;
  const right = !!reveal && reveal.correctPlayerIds.includes(view.me);
  useEffect(() => {
    if (drum.done && right) buzz(tokens.duration.fast);
  }, [drum.done, right]);

  const headline = mine
    ? `${P.youFooled} ${view.guessedCount - (reveal?.correctPlayerIds.length ?? 0)} ${UI_COPY.of} ${view.guessedCount}`
    : !view.myGuess
      ? P.noGuess
      : right
        ? P.gotIt
        : P.missed;

  return (
    <Split
      aside={
        <div className={`${styles.flipCard} ${drum.done ? styles.flipped : ''}`}>
          <div className={styles.flipFront}>
            <StoryCard view={view} item={item} />
          </div>
          <div className={`chamfer ${styles.flipBack}`} aria-hidden={!drum.done}>
            <span className={styles.storyLabel}>{P.itWas}</span>
            <span className={styles.ownerName}>{owner?.name}</span>
          </div>
        </div>
      }
    >
      {drum.count !== null ? (
        <p className={styles.drum} aria-live="off">
          <span className={styles.label}>{UI_COPY.drumroll}</span>
          <span className={styles.countdown}>{drum.count}</span>
        </p>
      ) : (
        <>
          <Heading className={right || mine ? styles.accent : undefined}>{headline}</Heading>
          {owner && (
            <p className={styles.yourGuess}>
              <span className={styles.label}>{P.itWas}</span>
              <PlayerChip player={owner} size="phone" />
            </p>
          )}
        </>
      )}
    </Split>
  );
}

function FinalScreen({ view, finale }: { view: PlayerView; finale: string }) {
  const standings = view.standings ?? [];
  const mine = standings.find((s) => s.playerId === view.me);
  const byId = (id: string) => view.players.find((p) => p.id === id);
  const winners = standings.filter((s) => s.place === 1).map((s) => byId(s.playerId)?.name);
  const scored = view.settings.scoring !== 'none';
  if (!scored) {
    return (
      <Centered>
        <p className={styles.label}>{finale}</p>
        <Heading>{UI_COPY.thanks}</Heading>
      </Centered>
    );
  }
  return (
    <Split
      actionsFirst
      aside={
        <section>
          <h2 className={styles.h2}>{UI_COPY.standings}</h2>
          <ol className={styles.standings}>
            {standings.map((s) => {
              const p = byId(s.playerId);
              return (
                p && (
                  <li key={s.playerId} className={`${styles.standingRow} ${s.playerId === view.me ? styles.meRow : ''}`}>
                    <span className={styles.place}>{ordinal(s.place)}</span>
                    <PlayerChip player={p} size="phone" />
                    {scored && (
                      <span className={styles.score}>
                        {formatScore(s.score)} {UI_COPY.points}
                      </span>
                    )}
                  </li>
                )
              );
            })}
          </ol>
        </section>
      }
    >
      <p className={styles.label}>{finale}</p>
      {mine && <Heading>{`${UI_COPY.youPlaced} ${ordinal(mine.place)}`}</Heading>}
      {mine && scored && (
        <p className={styles.muted}>
          {formatScore(mine.score)} {UI_COPY.points} · {mine.correct} {UI_COPY.correctGuesses} · {mine.fooled} {UI_COPY.fooled}
        </p>
      )}
      {winners.length > 0 && (
        <div className={`chamfer ${styles.winnerCard}`}>
          <span className={styles.label}>{UI_COPY.winnerIs}</span>
          <span className={styles.winnerName}>{winners.join(' & ')}</span>
        </div>
      )}
    </Split>
  );
}
