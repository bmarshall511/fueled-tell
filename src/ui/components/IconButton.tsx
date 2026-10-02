import type { ComponentProps } from 'react';
import { Button } from './Button';
import { Icon, type IconName } from './Icon';
import styles from './IconButton.module.css';

type IconButtonProps = Omit<ComponentProps<typeof Button>, 'children' | 'shortcut' | 'variant'> & {
  icon: IconName;
  /** Accessible name, also shown in the tooltip. */
  label: string;
  shortcut?: string;
  /** Where the tooltip opens (above by default; below for controls at the top of a page). */
  tip?: 'above' | 'below';
};

/** A round glass button with just an icon, and a tooltip (label + shortcut) on hover and keyboard focus. */
export function IconButton({ icon, label, shortcut, tip = 'above', className, ...rest }: IconButtonProps) {
  return (
    <Button variant="secondary" aria-label={label} aria-keyshortcuts={shortcut} className={`${styles.icon} ${className ?? ''}`} {...rest}>
      <span className={styles.glyph}>
        <Icon name={icon} />
      </span>
      <span className={`${styles.tip} ${styles[tip]}`} aria-hidden="true">
        {label}
        {shortcut && <kbd className={styles.key}>{shortcut}</kbd>}
      </span>
    </Button>
  );
}
