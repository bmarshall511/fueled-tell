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

/** How close the game is to ready: a line of status and a progress bar. */
export function ReadyMeter({ ready, total, needed, live, problem }: ReadyMeterProps) {
  const short = Math.max(0, needed - ready);
  const status = problem ?? (live ? M.live : short > 0 ? `${short} ${M.needed}` : M.allSet);
  // Progress toward a playable game: share of entries that are fine while some need fixing, else toward the minimum.
  const progress = problem ? ready / Math.max(total, 1) : live ? 1 : Math.min(1, ready / needed);
  const pct = Math.round(progress * 100);
  return (
    <div className={styles.meter}>
      <p className={styles.line} aria-live="polite">
        <span>
          {total > ready ? `${ready} ${M.of} ${total}` : ready} {M.ready}
        </span>
        <span className={problem ? 'text-error' : 'text-muted'}>{status}</span>
      </p>
      <span className={styles.bar} aria-hidden="true">
        <span className={styles.fill} style={{ width: `${pct}%` }} />
      </span>
    </div>
  );
}
