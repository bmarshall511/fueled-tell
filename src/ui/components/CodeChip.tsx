import { isLuckyCode } from '../../engine/roomCode';
import { UI_COPY } from '../copy';
import styles from './CodeChip.module.css';

/** Room code, one rounded tile per character. `hero` is the lobby's headline code. */
export function CodeChip({ code, size = 'phone', className }: { code: string; size?: 'host' | 'phone' | 'hero'; className?: string }) {
  const lucky = size === 'hero' && isLuckyCode(code);
  return (
    <span
      className={`${styles.code} ${styles[size]} ${lucky ? styles.lucky : ''} ${className ?? ''}`}
      role="img"
      aria-label={`${UI_COPY.roomCode} ${code.split('').join(' ')}`}
    >
      {code.split('').map((ch, i) => (
        <span key={i} className={styles.tile} style={{ ['--i' as string]: i }} aria-hidden="true">
          {ch}
        </span>
      ))}
    </span>
  );
}
