import type { PlayerView } from '../../engine/redact';
import { UI_COPY } from '../../ui/copy';
import { useNow } from '../../ui/hooks/useNow';
import styles from './RoundStatus.module.css';

/** Seconds left to guess, counted locally from the snapshot (no clock skew between devices). */
export function Countdown({ view, receivedAt }: { view: PlayerView; receivedAt: number }) {
  const now = useNow(250, view.remainingMs !== null);
  if (view.remainingMs === null) return null;
  const secs = Math.max(0, Math.ceil((view.remainingMs - (now - receivedAt)) / 1000));
  return (
    <p className={`${styles.row} ${secs <= 5 ? styles.urgent : ''}`} role="timer" aria-label={`${secs} ${UI_COPY.play.secondsLeft}`}>
      <BigNumber>{secs}</BigNumber>
      <span className="text-label">{UI_COPY.play.secondsLeft}</span>
    </p>
  );
}

/** A big tabular number (countdowns, the drumroll). */
export const BigNumber = ({ children }: { children: React.ReactNode }) => <span className={styles.number}>{children}</span>;

/** "4/7 guesses in" */
export function GuessProgress({ view }: { view: PlayerView }) {
  return (
    <p className="text-body text-muted" aria-live="polite">
      {view.guessedCount}/{view.expectedCount} {UI_COPY.guesses}
    </p>
  );
}
