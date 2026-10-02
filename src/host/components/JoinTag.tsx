import { UI_COPY } from '../../ui/copy';
import { displayUrl, joinUrl } from '../joinUrl';
import styles from './JoinTag.module.css';

/** One quiet capsule, "Join at tell.example/play  K7QF", so latecomers and dropped phones can get back in. */
export function JoinTag({ code }: { code: string }) {
  return (
    <p className={styles.join}>
      <span className={styles.text}>
        {UI_COPY.lobby.joinAt} <span className={styles.url}>{displayUrl(joinUrl(code))}</span>
      </span>
      <span className={`vt-room-code ${styles.code}`} role="img" aria-label={`${UI_COPY.roomCode} ${code.split('').join(' ')}`}>
        {code}
      </span>
    </p>
  );
}
