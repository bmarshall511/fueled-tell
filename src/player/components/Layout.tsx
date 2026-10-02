import type { ComponentProps, ReactNode } from 'react';
import { Button } from '../../ui/components/Button';
import { UI_COPY } from '../../ui/copy';
import styles from './Layout.module.css';

/** A screen's title. Focusable so the shell can move focus to it on screen changes. */
export function Heading({ children, accent }: { children: ReactNode; accent?: boolean }) {
  return (
    <h1 tabIndex={-1} className={`${styles.heading} ${accent ? styles.accent : ''}`}>
      {children}
    </h1>
  );
}

export const Centered = ({ children }: { children: ReactNode }) => <section className={styles.centered}>{children}</section>;

interface SplitProps {
  aside: ReactNode;
  children: ReactNode;
  /** On phones, show the actions above the aside (e.g. "You're in" before the roster). */
  actionsFirst?: boolean;
  /** Wide screens: vertically center both columns (short screens like code entry). */
  centered?: boolean;
}

/** One column on phones; context left, actions right on wide screens. */
export function Split({ aside, children, actionsFirst, centered }: SplitProps) {
  return (
    <div className={`${styles.split} ${actionsFirst ? styles.actionsFirst : ''} ${centered ? styles.splitCentered : ''}`}>
      <div className={styles.aside}>{aside}</div>
      <section className={styles.actions}>{children}</section>
    </div>
  );
}

/** A vertical form column. */
export const Form = (props: Omit<ComponentProps<'form'>, 'className'>) => <form {...props} className={styles.form} />;

/** The screen's main button: full width at the bottom on phones, under the content on wide screens. */
export const PrimaryAction = (props: Omit<ComponentProps<typeof Button>, 'className'>) => <Button {...props} className={styles.cta} />;

/** The app name and tagline: the aside on wide screens, hidden on phones (the bar has the brand). */
export function Hero() {
  return (
    <div className={styles.hero}>
      <p className={styles.heroName}>{UI_COPY.appName}</p>
      <p className="text-body text-muted">{UI_COPY.tagline}</p>
    </div>
  );
}

/** A soft pulsing tile for "waiting on someone else" states. */
export const Pulse = () => <span className={`chamfer-all ${styles.pulse}`} aria-hidden="true" />;

/** A label over a player chip ("Your guess", "It was"). */
export function Labelled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <p className={styles.labelled}>
      <span className="text-label">{label}</span>
      {children}
    </p>
  );
}
