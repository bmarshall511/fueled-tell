import { UI_COPY } from '../copy';
import styles from './RoomTag.module.css';

/** The room code as a small inline tag (phone bar, host bottom bar, setup). */
export function RoomTag({ code, size = 'phone' }: { code: string; size?: 'phone' | 'stage' }) {
  return (
    <span className={`chamfer-all ${styles.tag} ${styles[size]}`} role="img" aria-label={`${UI_COPY.roomCode} ${code.split('').join(' ')}`}>
      {code}
    </span>
  );
}
