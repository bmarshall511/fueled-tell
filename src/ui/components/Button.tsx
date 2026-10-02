import type { ButtonHTMLAttributes, PointerEvent } from 'react';
import { Icon } from './Icon';
import { prefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import styles from './Button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'host' | 'phone';
  /** Keyboard shortcut hint shown on host buttons, e.g. "Space". */
  shortcut?: string;
  /** Waiting on something (e.g. the host to confirm): a spinner replaces the label, presses are ignored. */
  busy?: boolean;
  /** Just finished: a brief gradient check. The caller clears it. */
  done?: boolean;
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
export function Button({
  variant = 'primary',
  size = 'phone',
  shortcut,
  busy,
  done,
  className,
  children,
  onPointerDown,
  onClick,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`${styles.button} ${styles[variant]} ${styles[size]} ${busy ? styles.busy : ''} ${done ? styles.done : ''} ${className ?? ''}`}
      aria-busy={busy || undefined}
      onPointerDown={(e) => {
        if (!busy) ripple(e);
        onPointerDown?.(e);
      }}
      onClick={(e) => {
        if (busy || done) return e.preventDefault();
        onClick?.(e);
      }}
      {...rest}
    >
      <span className={styles.fx} aria-hidden="true" />
      <span className={styles.label}>
        {children}
        {shortcut && <kbd className={styles.kbd}>{shortcut}</kbd>}
      </span>
      {busy && <span className={styles.spinner} aria-hidden="true" />}
      {done && (
        <span className={styles.check} aria-hidden="true">
          <Icon name="check" />
        </span>
      )}
    </button>
  );
}
