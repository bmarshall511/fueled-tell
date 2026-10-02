import type { ReactNode } from 'react';
import { UI_COPY } from '../../ui/copy';
import { BuiltBy } from '../../ui/components/Logo';
import { JoinTag } from './JoinTag';
import styles from './HostControls.module.css';

interface HostControlsProps {
  children: ReactNode;
  /** Show "Join at … [code]" beside the endorsement (omit in the lobby, which shows it big, and host-only games). */
  roomCode?: string | null;
  className?: string;
}

/**
 * The host's bottom bar: the DOM lab endorsement, the room code, and the action buttons.
 * Buttons marked `data-optional` hide in portrait (they're also in the menu);
 * `data-desktop-only` hides on touch screens.
 */
export function HostControls({ children, roomCode, className }: HostControlsProps) {
  return (
    <nav className={`${styles.controls} ${className ?? ''}`} aria-label={UI_COPY.hostControls}>
      <span className={styles.info}>
        <BuiltBy size="stage" />
        {roomCode && <JoinTag code={roomCode} />}
      </span>
      <span className={styles.buttons}>{children}</span>
    </nav>
  );
}
