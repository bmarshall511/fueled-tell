import styles from './GuessTicker.module.css';

interface GuessTickerProps {
  received: number;
  expected: number;
  label: string;
}

/**
 * Anonymous "guess received" slots. Deliberately not per-name: the owner never
 * guesses, so named indicators would give the owner away by elimination.
 */
export function GuessTicker({ received, expected, label }: GuessTickerProps) {
  return (
    <div className={styles.ticker}>
      <span className={`t-label ${styles.count}`} aria-live="polite">
        {received}/{expected} {label}
      </span>
      <span className={styles.slots} aria-hidden="true">
        {Array.from({ length: expected }, (_, i) => (
          <span key={i} className={`chamfer-all ${styles.slot} ${i < received ? styles.filled : ''}`} />
        ))}
      </span>
    </div>
  );
}
