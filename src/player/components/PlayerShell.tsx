import { useEffect, useRef, type ReactNode, type RefObject } from 'react';
import type { PublicPlayer } from '../../engine/redact';
import { BuiltBy, FueledWordmark } from '../../ui/components/Logo';
import { Notice } from '../../ui/components/Notice';
import { PlayerChip } from '../../ui/components/PlayerChip';
import { UI_COPY } from '../../ui/copy';
import styles from './PlayerShell.module.css';

interface PlayerShellProps {
  /** Changes on every screen change (focus moves to the new heading). */
  screenKey: string;
  me?: PublicPlayer;
  room: string | null;
  reconnecting: boolean;
  children: ReactNode;
}

/** The phone app frame: brand bar (you + room), reconnect notice, the screen, the endorsement. */
export function PlayerShell({ screenKey, me, room, reconnecting, children }: PlayerShellProps) {
  const main = useRef<HTMLElement>(null);
  useFocusHeadingOnChange(main, screenKey);
  return (
    <div className={styles.app}>
      <header className={styles.bar}>
        <a href="/" className={styles.brand} aria-label={`${UI_COPY.appName} home`}>
          <FueledWordmark size="compact" />
          <span className={styles.appName}>{UI_COPY.appName}</span>
        </a>
        <span className={styles.who}>
          {me && <PlayerChip player={me} size="phone" />}
          {room && (
            <span className={`chamfer-all ${styles.room}`} aria-label={`${UI_COPY.lobby.joinAt} ${room.split('').join(' ')}`}>
              {room}
            </span>
          )}
        </span>
      </header>
      {reconnecting && (
        <Notice role="status" className={styles.notice}>
          {UI_COPY.play.reconnecting}
        </Notice>
      )}
      <main ref={main} className={styles.main}>
        {children}
      </main>
      <footer className={styles.footer}>
        <BuiltBy size="compact" />
      </footer>
    </div>
  );
}

/** Screen readers announce each new screen: move focus to its heading (not on first load). */
function useFocusHeadingOnChange(container: RefObject<HTMLElement | null>, key: string) {
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    container.current?.querySelector<HTMLElement>('h1')?.focus();
  }, [container, key]);
}
