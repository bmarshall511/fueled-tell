import type { CSSProperties } from 'react';
import type { Standing } from '../../engine/scoring';
import type { GameCopy, PlayerId } from '../../engine/types';
import { tokens } from '../../tokens/tokens';
import { enigma } from '../../engine/moments';
import { FueledBolt } from '../../ui/components/Logo';
import { UI_COPY } from '../../ui/copy';
import { useFitToHeight } from '../../ui/hooks/useFitToHeight';
import { formatScore, listNames, ordinal, plural } from '../../ui/lib/format';
import { playerColorVar } from '../../ui/lib/playerColor';
import type { SeatedPlayer } from '../../ui/lib/types';
import styles from './Finale.module.css';

interface FinaleProps {
  standings: readonly Standing[];
  players: readonly SeatedPlayer[];
  copy: GameCopy;
}

/** Podium visual order: 2nd, 1st, 3rd (rises 3rd, then 2nd, then 1st). */
const PODIUM = [
  { rank: 1, rise: 1 },
  { rank: 0, rise: 2 },
  { rank: 2, rise: 0 },
] as const;

/** The smallest the standings shrink to fit the screen (below this they scroll). */
const MIN_FIT = 0.6;

const delay = (step: number): CSSProperties => ({ animationDelay: `${step * tokens.duration.stagger * 2}ms` });

/** Game over: the winner, a podium for the top three, then everyone else in ranked rows. */
export function Finale({ standings, players, copy }: FinaleProps) {
  const byId = (id: PlayerId) => players.find((p) => p.id === id);

  const names = (ids: readonly PlayerId[]) => listNames(ids.map((id) => byId(id)?.name ?? '').filter(Boolean));

  // Podium order (standings order), so the winner line and the cards read the same way round.
  const winners = names(standings.filter((s) => s.place === 1).map((s) => s.playerId));
  const rest = standings.slice(3);
  const theEnigma = enigma(standings);
  const { box, content, fit } = useFitToHeight<HTMLElement, HTMLDivElement>(MIN_FIT);

  return (
    <section ref={box} className={styles.finale} aria-labelledby="finale-title">
      <BoltRain />
      <div ref={content} className={styles.content} style={{ zoom: fit }}>
      <header className={styles.head}>
        <p className={`t-label ${styles.kicker}`}>{copy.finale}</p>
        <h1 id="finale-title" className={`t-title ${styles.winner}`} style={delay(3)}>
          <span className={`t-label ${styles.winnerLabel}`}>{copy.winner}</span>
          <span className={styles.winnerName}>{winners}</span>
        </h1>
      </header>

      <ol className={styles.podium} aria-label={UI_COPY.standings}>
        {PODIUM.map(({ rank, rise }) => {
          const s = standings[rank];
          const p = s && byId(s.playerId);
          if (!s || !p) return <li key={rank} aria-hidden="true" />;
          return (
            <li
              key={p.id}
              className={`${styles.step} ${styles[`p${Math.min(s.place, 3)}`] ?? ''} ${s.place === 1 ? styles.first : ''}`}
              style={{ ...delay(rise), ['--player' as string]: playerColorVar(p.colorIndex) }}
            >
              <span className={`t-display ${styles.place}`}>{ordinal(s.place)}</span>
              <span className={`t-title ${styles.name}`}>{p.name}</span>
              <span className={`t-label ${styles.score}`}>
                {formatScore(s.score)} {UI_COPY.points}
              </span>
            </li>
          );
        })}
      </ol>

      {theEnigma && (
        <p className={`${styles.enigma} ${styles.rise}`} style={delay(3.5)}>
          <span className={`t-label ${styles.enigmaLabel}`}>{UI_COPY.eggs.enigma}</span>
          <span className="t-body">
            {names(theEnigma.playerIds)} {UI_COPY.eggs.enigmaFooled}{' '}
            {plural(theEnigma.fooled, UI_COPY.eggs.enigmaPeople)}
          </span>
        </p>
      )}

      {rest.length > 0 && (
        <ol className={styles.rest} aria-label={UI_COPY.standings}>
          {rest.map((s, i) => {
            const p = byId(s.playerId);
            if (!p) return null;
            return (
              <li key={s.playerId} className={`${styles.row} ${styles.rise}`} style={delay(4 + i * 0.25)}>
                <span className={styles.rowPlace}>{ordinal(s.place)}</span>
                <span className={styles.rowName}>
                  <span className={styles.rowDot} style={{ background: playerColorVar(p.colorIndex) }} aria-hidden="true" />
                  {p.name}
                </span>
                <span className={styles.rowScore}>
                  {formatScore(s.score)} {UI_COPY.points}
                </span>
              </li>
            );
          })}
        </ol>
      )}
      </div>
    </section>
  );
}

/** How many bolts drift down behind the podium (few and slow, so a screen share stays smooth). */
const BOLTS = 9;

/** Bolt Rain: white Fueled bolts drifting down behind the finale. Decorative; hidden with reduced motion. */
function BoltRain() {
  return (
    <div className={styles.rain} aria-hidden="true">
      {Array.from({ length: BOLTS }, (_, i) => (
        <span key={i} className={styles.drop} style={{ ['--i' as string]: i } as CSSProperties}>
          <FueledBolt />
        </span>
      ))}
    </div>
  );
}
