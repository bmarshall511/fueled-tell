import type { ReactNode } from 'react';
import type { PlayerId } from '../../engine/types';
import { FueledBolt } from '../../ui/components/Logo';
import { PlayerChip } from '../../ui/components/PlayerChip';
import { UI_COPY } from '../../ui/copy';
import type { SeatedPlayer } from '../../ui/lib/types';
import styles from './RevealPanel.module.css';

interface RevealPanelProps {
  leadIn: string;
  owner: SeatedPlayer;
  ratioCorrect: number;
  correctPlayers: readonly SeatedPlayer[];
  /** Hide the big name when the scene already renders it (e.g. Signal). */
  showName?: boolean;
  guessedLabel: string;
  nobodyLabel: string;
  /** Replaces the list of correct guessers (host-only mode puts the tally toggles here). */
  children?: ReactNode;
  /** Correct guessers who were lightning fast: their chips get a bolt. */
  lightningIds?: readonly PlayerId[];
}

export function RevealPanel({
  leadIn,
  owner,
  ratioCorrect,
  correctPlayers,
  showName = true,
  guessedLabel,
  nobodyLabel,
  children,
  lightningIds = [],
}: RevealPanelProps) {
  return (
    <section className={styles.panel} aria-live="assertive">
      {showName && (
        <div>
          <p className={`t-label ${styles.lead}`}>{leadIn}</p>
          <p className={`t-display ${styles.name}`}>{owner.name}</p>
        </div>
      )}
      <div className={styles.stats}>
        <p className={`t-title ${styles.pct}`}>
          {Math.round(ratioCorrect * 100)}% <span className="t-label">{guessedLabel}</span>
        </p>
        <div className={styles.chips}>
          {children ??
            (correctPlayers.length === 0 ? (
              <span className={`t-label ${styles.nobody}`}>{nobodyLabel}</span>
            ) : (
              <CorrectList players={correctPlayers} lightningIds={lightningIds} />
            ))}
        </div>
      </div>
    </section>
  );
}

/** Shown in full on a big screen; small screens (portrait, short windows) keep one tidy row. */
const SHOWN = { wide: 5, narrow: 1 };

/** Who got it right: the first few chips, then "+N more" (the percentage already tells the story). */
function CorrectList({ players, lightningIds }: { players: readonly SeatedPlayer[]; lightningIds: readonly PlayerId[] }) {
  const more = (shown: number) => players.length - shown;
  return (
    <>
      {players.slice(0, SHOWN.wide).map((p, i) => (
        <span key={p.id} className={i >= SHOWN.narrow ? styles.wideOnly : undefined}>
          <PlayerChip player={p} truncate />
          {lightningIds.includes(p.id) && (
            <span className={styles.bolt} title={UI_COPY.eggs.lightning}>
              <FueledBolt />
              <span className="visually-hidden">{UI_COPY.eggs.lightning}</span>
            </span>
          )}
        </span>
      ))}
      {more(SHOWN.wide) > 0 && (
        <span className={`t-label ${styles.more} ${styles.wideOnly}`}>
          +{more(SHOWN.wide)} {UI_COPY.more}
        </span>
      )}
      {more(SHOWN.narrow) > 0 && (
        <span className={`t-label ${styles.more} ${styles.narrowOnly}`}>
          +{more(SHOWN.narrow)} {UI_COPY.more}
        </span>
      )}
    </>
  );
}

export const playersById = (players: readonly SeatedPlayer[], ids: readonly PlayerId[]) =>
  ids.map((id) => players.find((p) => p.id === id)).filter((p): p is SeatedPlayer => p !== undefined);
