import type { ButtonHTMLAttributes, PointerEvent } from 'react';
import { prefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import styles from './Button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'host' | 'phone';
  /** Keyboard shortcut hint shown on host buttons, e.g. "Space". */
  shortcut?: string;
}

/** A ripple from the press point, drawn in the button's own effects layer. */
function ripple(e: PointerEvent<HTMLButtonElement>) {
  const layer = e.currentTarget.querySelector(`.${styles.fx}`);
  if (!layer || e.currentTarget.disabled || prefersReducedMotion()) return;
  const box = e.currentTarget.getBoundingClientRect();
  const dot = document.createElement('span');
  dot.className = styles.ripple ?? '';
  dot.style.left = `${e.clientX - box.left}px`;
  dot.style.top = `${e.clientY - box.top}px`;
  dot.addEventListener('animationend', () => dot.remove());
  layer.appendChild(dot);
}

/**
 * Pill button. White for the main action, glass for the rest. Feedback is light and color
 * only: a sweep and gradient ring on hover, a ring on keyboard focus, a ripple on press.
 */
export function Button({ variant = 'primary', size = 'phone', shortcut, className, children, onPointerDown, ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      className={`${styles.button} ${styles[variant]} ${styles[size]} ${className ?? ''}`}
      onPointerDown={(e) => {
        ripple(e);
        onPointerDown?.(e);
      }}
      {...rest}
    >
      <span className={styles.fx} aria-hidden="true" />
      {children}
      {shortcut && <kbd className={styles.kbd}>{shortcut}</kbd>}
    </button>
  );
}
