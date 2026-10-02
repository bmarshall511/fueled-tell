import { RoomTag } from '../../ui/components/RoomTag';
import { UI_COPY } from '../../ui/copy';
import { displayUrl, joinUrl } from '../joinUrl';
import styles from './JoinTag.module.css';

/** "Join at tell.example/play [K7QF]": the room stays on screen for latecomers and dropped phones. */
export function JoinTag({ code }: { code: string }) {
  return (
    <p className={`t-label ${styles.join}`}>
      <span>
        {UI_COPY.lobby.joinAt} <span className={styles.url}>{displayUrl(joinUrl(code))}</span>
      </span>
      <RoomTag code={code} size="stage" />
    </p>
  );
}
