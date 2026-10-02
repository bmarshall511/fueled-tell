import type { ReactNode } from 'react';
import type { PlayerId } from '../../engine/types';
import { PlayerChip } from '../../ui/components/PlayerChip';
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
              correctPlayers.map((p) => <PlayerChip key={p.id} player={p} />)
            ))}
        </div>
      </div>
    </section>
  );
}

export const playersById = (players: readonly SeatedPlayer[], ids: readonly PlayerId[]) =>
  ids.map((id) => players.find((p) => p.id === id)).filter((p): p is SeatedPlayer => p !== undefined);
