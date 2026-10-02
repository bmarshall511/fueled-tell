import type { ReactNode } from 'react';
import { UI_COPY } from '../../ui/copy';
import { JoinTag } from './JoinTag';
import styles from './HostControls.module.css';

interface HostControlsProps {
  children: ReactNode;
  /** Show the join capsule on the left (omit in the lobby, which shows it big, and in host-only games). */
  roomCode?: string | null;
  className?: string;
}

/**
 * The host's bottom bar: the join capsule, then the actions on the right.
 * Buttons marked `data-desktop-only` hide on touch screens and in portrait (they're also in the menu).
 */
export function HostControls({ children, roomCode, className }: HostControlsProps) {
  return (
    <nav className={`${styles.controls} ${className ?? ''}`} aria-label={UI_COPY.hostControls}>
      {roomCode && <JoinTag code={roomCode} />}
      <span className={styles.buttons}>{children}</span>
    </nav>
  );
}
