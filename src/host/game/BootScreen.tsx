import { useEffect, useState } from 'react';
import { tokens } from '../../tokens/tokens';
import { UI_COPY } from '../../ui/copy';
import { BuiltBy, FueledWordmark } from '../../ui/components/Logo';
import styles from './BootScreen.module.css';

interface BootScreenProps {
  /** True once whatever we're waiting for (e.g. the 3D scene) is ready. */
  ready: boolean;
  title?: string;
}

/**
 * Branded boot screen: a rounded deck riffles while the heavy chunk loads,
 * then the deck squares up and the screen wipes away on the DOM lab diagonal.
 * Stays at least `duration.bootMin` once shown so it never just flickers.
 */
export function BootScreen({ ready, title = UI_COPY.appName }: BootScreenProps) {
  const [shownAt] = useState(() => performance.now());
  const [state, setState] = useState<'booting' | 'leaving' | 'gone'>('booting');

  useEffect(() => {
    if (!ready || state !== 'booting') return;
    const wait = Math.max(0, tokens.duration.bootMin - (performance.now() - shownAt));
    const id = window.setTimeout(() => setState('leaving'), wait);
    return () => window.clearTimeout(id);
  }, [ready, state, shownAt]);

  useEffect(() => {
    if (state !== 'leaving') return;
    const id = window.setTimeout(() => setState('gone'), tokens.duration.slow * 1.5);
    return () => window.clearTimeout(id);
  }, [state]);

  if (state === 'gone') return null;
  return (
    <div className={`${styles.boot} ${state === 'leaving' ? styles.leaving : ''}`}>
      <div className={styles.deck} aria-hidden="true">
        <span className={`${styles.card} ${styles.c3}`} />
        <span className={`${styles.card} ${styles.c2}`} />
        <span className={`${styles.card} ${styles.c1}`} />
      </div>
      <h1 className={`t-display ${styles.title}`}>{title}</h1>
      {/* Only the status line is announced (not the title and logos around it). */}
      <p className={`t-label ${styles.status}`} role="status">
        {UI_COPY.loading}
        <span className={styles.dots} aria-hidden="true">
          <span>.</span>
          <span>.</span>
          <span>.</span>
        </span>
      </p>
      <span className={styles.bar} aria-hidden="true">
        <span />
      </span>
      <footer className={styles.footer}>
        <FueledWordmark size="stage" />
        <BuiltBy size="stage" />
      </footer>
    </div>
  );
}
