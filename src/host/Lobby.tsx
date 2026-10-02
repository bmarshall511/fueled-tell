import { useEffect, useRef, type CSSProperties } from 'react';
import { canStart, playableEntries } from '../engine/game';
import { RULES } from '../engine/rules';
import { tokens } from '../tokens/tokens';
import { Button } from '../ui/Button';
import { CodeChip } from '../ui/CodeChip';
import { UI_COPY } from '../ui/copy';
import { BuiltBy, FueledWordmark } from '../ui/Logo';
import { plural } from '../ui/format';
import { playerColorVar } from '../ui/playerColor';
import { QrCode } from '../ui/qr/QrCode';
import { sound } from '../ui/sound';
import { stageCssVars, useStageLayout } from '../ui/stage';
import { useDocumentTitle } from '../ui/useHostChrome';
import type { HostGame } from './useHostGame';
import styles from './screens.module.css';

const L = UI_COPY.lobby;

/** The URL phones open: same origin, room in the query (keeps ?transport=local for same-browser demos). */
export function joinUrl(code: string): string {
  const url = new URL('/play', window.location.origin);
  url.searchParams.set('room', code);
  if (new URLSearchParams(window.location.search).get('transport') === 'local') url.searchParams.set('transport', 'local');
  return url.toString();
}

/** Shared on the call: big room code, QR, and who's in. Never shows who wrote what. */
export function Lobby({ host, onEdit }: { host: HostGame; onEdit: () => void }) {
  const layout = useStageLayout();
  const s = host.state!;
  const pack = host.pack!;
  const code = host.roomCode!;
  const hostOnly = s.settings.hostOnly;
  const live = s.settings.intake === 'live';
  const entries = playableEntries(s).length;
  const joined = s.players.filter((p) => p.claimed && p.connected).length;
  useDocumentTitle(`${code} · ${UI_COPY.appName}`);

  // A soft chime when someone joins.
  const prev = useRef(joined);
  useEffect(() => {
    if (joined > prev.current) sound.join();
    prev.current = joined;
  }, [joined]);

  const url = joinUrl(code);
  const shownUrl = url.replace(/^https?:\/\//, '').replace(/&transport=local$/, '');

  return (
    <main className={styles.lobby} style={stageCssVars(layout) as CSSProperties} data-orientation={layout.orientation}>
      <header className={styles.lobbyTop}>
        <FueledWordmark height={`calc(${tokens.size.tapTarget * 0.6}px * var(--stage))`} />
        <span className="t-label">{pack.name}</span>
      </header>

      {hostOnly ? (
        <section className={styles.lobbyMain}>
          <div className={styles.joinBlock}>
            <h1 className={`t-display ${styles.hostOnlyTitle}`}>{L.hostOnlyTitle}</h1>
            <p className={`t-body ${styles.prompt}`}>{L.hostOnlyHint}</p>
          </div>
        </section>
      ) : (
        <section className={styles.lobbyMain}>
          <div className={styles.joinBlock}>
            <h1 className={`t-label ${styles.joinAt}`}>
              {L.joinAt} <span className={styles.url}>{shownUrl.split('?')[0]}</span>
            </h1>
            <CodeChip code={code} size="host" />
            <p className={`t-body ${styles.prompt}`}>{pack.prompt}</p>
            {host.link === 'opening' && <p className="t-label">{L.opening}</p>}
            {host.link === 'error' && (
              <div className={styles.banner} role="alert">
                <span>{host.linkError === 'taken' ? L.takenError : L.networkError}</span>
                {host.linkError === 'taken' ? (
                  <Button variant="outline" onClick={host.newRoomCode}>
                    {L.newCode}
                  </Button>
                ) : (
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    {L.retry}
                  </Button>
                )}
                <Button variant="outline" onClick={() => host.dispatch({ type: 'updateSettings', settings: { hostOnly: true } })}>
                  {L.useHostOnly}
                </Button>
              </div>
            )}
          </div>
          <figure className={styles.qrBlock}>
            <span className={`chamfer ${styles.qrSvg}`}>
              <QrCode value={url} label={`${L.scan}: ${shownUrl}`} />
            </span>
            <figcaption className="t-label">{L.scan}</figcaption>
          </figure>
        </section>
      )}

      <section className={styles.roster} aria-label={`${joined} ${L.joined}`}>
        <p className={`t-label ${styles.rosterCount}`} aria-live="polite">
          {hostOnly ? plural(s.players.length, L.people) : `${joined} ${L.joined}`} · {plural(entries, L.entries)}
          {entries < RULES.minEntries && ` · ${L.needMore}`}
        </p>
        <ul className={styles.rosterList}>
          {s.players.map((p) => {
            const hasEntry = s.entries.some((e) => e.ownerId === p.id);
            const away = !hostOnly && !(p.claimed && p.connected);
            return (
              <li key={p.id} className={styles.rosterItem}>
                <span className={`chamfer ${styles.rosterChip} ${away ? styles.away : ''}`}>
                  <span className={styles.rosterDot} style={{ background: playerColorVar(p.colorIndex) }} aria-hidden="true" />
                  <span className={styles.rosterName}>{p.name}</span>
                  {!hostOnly && !p.claimed && <span className={styles.statusTag}>{L.notJoined}</span>}
                  {live && !hostOnly && (
                    <span className={`${styles.statusTag} ${hasEntry ? styles.statusIn : ''}`}>{hasEntry ? L.submitted : L.noEntry}</span>
                  )}
                  <button
                    type="button"
                    className={styles.rosterRemove}
                    aria-label={`${L.remove} ${p.name}`}
                    title={`${L.remove} ${p.name}`}
                    onClick={() => host.dispatch({ type: 'removePlayer', playerId: p.id })}
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </span>
              </li>
            );
          })}
          {!hostOnly && joined === 0 && <li className={`t-label ${styles.waiting}`}>{L.waitingFor}</li>}
        </ul>
      </section>

      <nav className={styles.lobbyControls} aria-label={UI_COPY.hostControls}>
        <BuiltBy height={`max(${tokens.size.builtbyPage * 0.7}px, calc(${tokens.size.builtbyHost}px * var(--stage)))`} />
        <span className={styles.lobbyButtons}>
          <Button size="host" variant="secondary" onClick={onEdit}>
            {L.edit}
          </Button>
          <Button size="host" disabled={!canStart(s)} onClick={host.advance} shortcut="Space" aria-keyshortcuts="Space">
            {UI_COPY.start}
          </Button>
        </span>
      </nav>
    </main>
  );
}
