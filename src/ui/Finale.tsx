import type { CSSProperties } from 'react';
import type { Awards, Standing } from '../engine/scoring';
import type { PackCopy, PlayerId } from '../engine/types';
import { tokens } from '../tokens/tokens';
import { UI_COPY } from './copy';
import { formatScore, ordinal } from './format';
import { PlayerChip } from './PlayerChip';
import { playerColorVar } from './playerColor';
import type { SeatedPlayer } from './types';
import styles from './Finale.module.css';

interface FinaleProps {
  standings: readonly Standing[];
  awards: Awards;
  players: readonly SeatedPlayer[];
  copy: PackCopy;
  showScores: boolean;
  /** Points & places: podium. Awards only: just the awards. */
  showPodium: boolean;
}

/** Podium visual order: 2nd, 1st, 3rd. Rises 3rd -> 2nd -> 1st. */
const PODIUM = [
  { rank: 1, rise: 1 },
  { rank: 0, rise: 2 },
  { rank: 2, rise: 0 },
] as const;

const delay = (step: number): CSSProperties => ({ animationDelay: `${step * tokens.duration.stagger * 2}ms` });

export function Finale({ standings, awards, players, copy, showScores, showPodium }: FinaleProps) {
  const byId = (id: PlayerId | null) => players.find((p) => p.id === id);
  const winners = standings
    .filter((s) => s.place === 1)
    .map((s) => byId(s.playerId)?.name)
    .filter(Boolean);
  const awardRows = [
    { label: copy.awards.detective, player: byId(awards.detective) },
    { label: copy.awards.mysterious, player: byId(awards.mysterious) },
    { label: copy.awards.fooled, player: byId(awards.fooled) },
  ];

  return (
    <section className={styles.finale} aria-labelledby="finale-title">
      <header className={styles.head}>
        <h1 id="finale-title" className={`t-label ${styles.kicker}`}>
          {copy.finale}
        </h1>
        {showPodium && (
          <p className={`t-title ${styles.winner}`} aria-live="assertive" style={delay(3)}>
            <span className="t-label">{copy.winner}</span> {winners.join(' & ')}
          </p>
        )}
      </header>

      {showPodium && (
        <ol className={styles.podium} aria-label={UI_COPY.standings}>
          {PODIUM.map(({ rank, rise }) => {
            const s = standings[rank];
            const p = s && byId(s.playerId);
            if (!s || !p) return <li key={rank} aria-hidden="true" />;
            return (
              <li
                key={p.id}
                className={`chamfer ${styles.step} ${styles[`p${s.place}`] ?? ''}`}
                style={{ ...delay(rise), ['--player' as string]: playerColorVar(p.colorIndex) }}
              >
                <span className={`t-display ${styles.place}`}>{ordinal(s.place)}</span>
                <span className={`t-title ${styles.name}`}>{p.name}</span>
                {showScores && (
                  <span className={`t-label ${styles.score}`}>
                    {formatScore(s.score)} {UI_COPY.points}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      )}

      <div className={styles.lower}>
        {showPodium && (
          <ol className={styles.rest} start={4}>
            {standings.slice(3).map((s, i) => {
              const p = byId(s.playerId);
              if (!p) return null;
              return (
                <li key={s.playerId} className={styles.row} style={delay(4 + i * 0.25)}>
                  <span className={styles.rowPlace}>{ordinal(s.place)}</span>
                  <PlayerChip player={p} />
                  {showScores && (
                    <span className={styles.rowScore}>
                      {formatScore(s.score)} {UI_COPY.points}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        )}
        <ul className={styles.awards}>
          {awardRows.map(
            (a, i) =>
              a.player && (
                <li key={a.label} className={`chamfer ${styles.award}`} style={delay(5 + i * 0.5)}>
                  <span className="t-label">{a.label}</span>
                  <PlayerChip player={a.player} />
                </li>
              ),
          )}
        </ul>
      </div>
    </section>
  );
}
