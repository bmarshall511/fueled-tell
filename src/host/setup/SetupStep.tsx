import type { ReactNode } from 'react';
import styles from './SetupStep.module.css';

/** A numbered section of the setup form. */
export function SetupStep({ number, title, children }: { number: number; title: string; children: ReactNode }) {
  return (
    <fieldset className={styles.step}>
      <legend className={styles.legend}>
        <span className={`chamfer-all ${styles.num}`}>{number}</span>
        {title}
      </legend>
      {children}
    </fieldset>
  );
}
