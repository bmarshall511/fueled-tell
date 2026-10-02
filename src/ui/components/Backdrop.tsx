import { usePageVisible } from '../hooks/usePageVisible';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import styles from './Backdrop.module.css';

/**
 * The fueled.com glow: three soft blobs drifting behind the page.
 * `vivid` for landing, lobby and finale; `calm` (low and dim) wherever text must stay
 * crisp on a screen share, and on phones. Paused when the tab is hidden; still with reduced motion.
 * On pages it also reacts to the mouse: a glow trails the pointer and the blobs shift in parallax.
 */
interface BackdropProps {
  tone?: 'vivid' | 'calm';
  /** Follow and parallax the mouse (pages); off on the shared host screen, where the cursor is on the call. */
  interactive?: boolean;
}

export function Backdrop({ tone = 'vivid', interactive = true }: BackdropProps) {
  const visible = usePageVisible();
  const still = usePrefersReducedMotion();
  return (
    <div
      className={`${styles.backdrop} ${tone === 'calm' ? styles.calm : ''} ${interactive ? styles.interactive : ''} ${still || !visible ? styles.still : ''}`}
      aria-hidden="true"
    >
      <i className={styles.pink} />
      <i className={styles.violet} />
      <i className={styles.lilac} />
      {interactive && <i className={styles.follow} />}
    </div>
  );
}
