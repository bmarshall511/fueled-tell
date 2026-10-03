import { UI_COPY } from '../../ui/copy';
import styles from './ReadyMeter.module.css';

const M = UI_COPY.setup.meter;

interface ReadyMeterProps {
  ready: number;
  total: number;
  /** How many entries a game needs. */
  needed: number;
  /** "Players add their own": the lobby fills the rest, so it's ready as soon as nothing needs fixing. */
  live: boolean;
  /** Shown instead of the status when something needs fixing (e.g. "1 needs a fix"). */
  problem: string | null;
}

/**
 * How close the game is to ready: a status line, and a progress bar toward the minimum.
 * With "Players add their own" the lobby fills the rest, so there's no bar to fill: just the status.
 */
export function ReadyMeter({ ready, total, needed, live, problem }: ReadyMeterProps) {
  const short = Math.max(0, needed - ready);
  const status = problem ?? (live ? M.live : short > 0 ? `${short} ${M.needed}` : M.allSet);
  const count = total > ready ? `${ready} ${M.of} ${total} ${M.ready}` : `${ready} ${M.ready}`;
  // Share of entries that are fine while some need fixing; otherwise progress toward the minimum.
  const progress = problem ? ready / Math.max(total, 1) : Math.min(1, ready / needed);
  const showCount = !live || ready > 0;
  return (
    <div className={styles.meter}>
      <p className={`${styles.line} ${showCount ? '' : styles.solo}`} aria-live="polite">
        {showCount && <span>{count}</span>}
        <span className={problem ? 'text-error' : 'text-muted'}>{status}</span>
      </p>
      {(!live || problem) && (
        <span className={styles.bar} aria-hidden="true">
          <span className={styles.fill} style={{ width: `${Math.round(progress * 100)}%` }} />
        </span>
      )}
    </div>
  );
}
