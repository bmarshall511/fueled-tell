import type { ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  size?: 'host' | 'phone';
  /** Keyboard shortcut hint shown on host buttons, e.g. "Space". */
  shortcut?: string;
}

export function Button({ variant = 'primary', size = 'phone', shortcut, className, children, ...rest }: ButtonProps) {
  return (
    <button type="button" className={`chamfer ${styles.button} ${styles[variant]} ${styles[size]} ${className ?? ''}`} {...rest}>
      {children}
      {shortcut && <kbd className={styles.kbd}>{shortcut}</kbd>}
    </button>
  );
}
