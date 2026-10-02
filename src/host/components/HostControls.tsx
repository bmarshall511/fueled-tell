import type { ReactNode } from 'react';
import { UI_COPY } from '../../ui/copy';
import { BuiltBy } from '../../ui/components/Logo';
import styles from './HostControls.module.css';

/**
 * The host's bottom bar: the DOM lab endorsement and the action buttons.
 * Buttons marked `data-optional` hide in portrait (they're also in the menu);
 * `data-desktop-only` hides on touch screens.
 */
export function HostControls({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <nav className={`${styles.controls} ${className ?? ''}`} aria-label={UI_COPY.hostControls}>
      <BuiltBy size="stage" />
      <span className={styles.buttons}>{children}</span>
    </nav>
  );
}
