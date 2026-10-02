import { Icon } from '../../ui/components/Icon';
import { FueledLockup } from '../../ui/components/Logo';
import { RoomTag } from '../../ui/components/RoomTag';
import { UI_COPY } from '../../ui/copy';
import styles from './SetupBar.module.css';

const S = UI_COPY.setup;

/** Setup's top bar: brand, what you're doing, the open room (when editing), and a reminder that this page is private. */
export function SetupBar({ editing, roomCode }: { editing: boolean; roomCode: string | null }) {
  return (
    <header className={styles.bar}>
      <a href="/" className={styles.home} aria-label={`${UI_COPY.appName} home`}>
        <FueledLockup size="compact" className="vt-brand" />
      </a>
      <span className={styles.rule} aria-hidden="true" />
      <span className={styles.title}>{editing ? S.editTitle : S.title}</span>
      {editing && roomCode && <RoomTag code={roomCode} />}
      <span className={styles.privacy}>
        <Icon name="private" />
        <span className={styles.long}>{S.privacy}</span>
        <span className={styles.short}>{S.privacyShort}</span>
      </span>
    </header>
  );
}
