import { usePageVisible } from '../hooks/usePageVisible';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import styles from './Backdrop.module.css';

/**
 * The fueled.com glow: three soft blobs drifting behind the page.
 * `vivid` for landing, lobby and finale; `calm` (low and dim) wherever text must stay
 * crisp on a screen share, and on phones. Paused when the tab is hidden; still with reduced motion.
 */
export function Backdrop({ tone = 'vivid' }: { tone?: 'vivid' | 'calm' }) {
  const visible = usePageVisible();
  const still = usePrefersReducedMotion();
  return (
    <div className={`${styles.backdrop} ${styles[tone]} ${still || !visible ? styles.still : ''}`} aria-hidden="true">
      <i className={styles.pink} />
      <i className={styles.violet} />
      <i className={styles.lilac} />
    </div>
  );
}
