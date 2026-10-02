import { useNow } from './hooks';
import styles from './Timer.module.css';

interface TimerProps {
  deadline: number | null;
  durationMs: number;
}

/** Countdown: big seconds number plus a draining bar. Shows a full bar when not running. */
export function Timer({ deadline, durationMs }: TimerProps) {
  const now = useNow(250, deadline !== null);
  const remainingMs = deadline === null ? durationMs : Math.max(0, deadline - now);
  const seconds = Math.ceil(remainingMs / 1000);
  const ratio = durationMs > 0 ? remainingMs / durationMs : 0;
  const urgent = deadline !== null && seconds <= 5;
  return (
    <div className={`${styles.timer} ${deadline === null ? styles.idle : ''}`} role="timer" aria-live="off">
      <span className={`t-title ${styles.seconds} ${urgent ? styles.urgent : ''}`}>{seconds}</span>
      <span className={styles.track} aria-hidden="true">
        <span className={styles.fill} style={{ transform: `scaleX(${ratio})` }} />
      </span>
    </div>
  );
}
