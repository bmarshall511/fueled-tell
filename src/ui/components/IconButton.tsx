import type { ComponentProps } from 'react';
import { Button } from './Button';
import { Icon, type IconName } from './Icon';
import styles from './IconButton.module.css';

type IconButtonProps = Omit<ComponentProps<typeof Button>, 'children' | 'shortcut' | 'variant'> & {
  icon: IconName;
  /** Accessible name; also the tooltip (with the shortcut, if any). */
  label: string;
  shortcut?: string;
};

/** A round glass button with just an icon. The label is announced and shown as a tooltip. */
export function IconButton({ icon, label, shortcut, className, ...rest }: IconButtonProps) {
  return (
    <Button
      variant="secondary"
      aria-label={label}
      title={shortcut ? `${label} (${shortcut})` : label}
      aria-keyshortcuts={shortcut}
      className={`${styles.icon} ${className ?? ''}`}
      {...rest}
    >
      <Icon name={icon} />
    </Button>
  );
}
