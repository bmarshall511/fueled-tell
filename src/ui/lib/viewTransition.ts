import { flushSync } from 'react-dom';
import { prefersReducedMotion } from '../hooks/usePrefersReducedMotion';

type ViewTransition = { finished: Promise<void>; ready: Promise<void>; updateCallbackDone: Promise<void> };
type WithTransitions = Document & { startViewTransition?: (update: () => void) => ViewTransition };

/**
 * Runs a React state update inside a native View Transition (the browser snapshots the old
 * screen, applies the update synchronously, then animates to the new one). Falls back to a
 * plain update when unsupported, when the tab is hidden, or with reduced motion.
 */
export function withViewTransition(update: () => void): void {
  const doc = document as WithTransitions;
  if (!doc.startViewTransition || document.visibilityState !== 'visible' || prefersReducedMotion()) return update();
  const t = doc.startViewTransition(() => flushSync(update));
  // A newer transition can supersede this one (rapid state changes); that's fine.
  [t.finished, t.ready, t.updateCallbackDone].forEach((p) => p.catch(() => {}));
}

/** Wraps a callback so calling it transitions the screen. */
export const transitioned =
  <A extends unknown[]>(fn: (...args: A) => void) =>
  (...args: A) =>
    withViewTransition(() => fn(...args));
