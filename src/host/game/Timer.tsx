import { useNow } from '../../ui/hooks/useNow';
import styles from './Timer.module.css';

interface TimerProps {
  deadline: number | null;
  durationMs: number;
  /** Guessing has closed for this round (locked or revealed): hide the clock rather than show a full one. */
  over?: boolean;
}

/** Countdown: big seconds number plus a draining bar. Full (and dimmed) before guessing opens. */
export function Timer({ deadline, durationMs, over = false }: TimerProps) {
  const now = useNow(250, deadline !== null);
  const remainingMs = deadline === null ? durationMs : Math.max(0, deadline - now);
  const seconds = Math.ceil(remainingMs / 1000);
  const ratio = durationMs > 0 ? Math.min(1, remainingMs / durationMs) : 0;
  const urgent = deadline !== null && seconds <= 5;
  return (
    <div
      className={`${styles.timer} ${deadline === null ? styles.idle : ''} ${over ? styles.over : ''}`}
      role="timer"
      aria-live="off"
    >
      <span className={`t-title ${styles.seconds} ${urgent ? styles.urgent : ''}`}>{seconds}</span>
      <span className={styles.track} aria-hidden="true">
        <span className={styles.fill} style={{ transform: `scaleX(${ratio})` }} />
      </span>
    </div>
  );
}
