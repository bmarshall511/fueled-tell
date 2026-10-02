import { UI_COPY } from '../copy';
import styles from './CodeChip.module.css';

/** Room code, one rounded tile per character. `hero` is the lobby's headline code. */
export function CodeChip({ code, size = 'phone' }: { code: string; size?: 'host' | 'phone' | 'hero' }) {
  return (
    <span className={`${styles.code} ${styles[size]}`} role="img" aria-label={`${UI_COPY.roomCode} ${code.split('').join(' ')}`}>
      {code.split('').map((ch, i) => (
        <span key={i} className={styles.tile} aria-hidden="true">
          {ch}
        </span>
      ))}
    </span>
  );
}
