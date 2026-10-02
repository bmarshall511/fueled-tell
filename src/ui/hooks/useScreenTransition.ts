import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { prefersReducedMotion } from './usePrefersReducedMotion';

type ViewTransition = { finished: Promise<void>; ready: Promise<void>; updateCallbackDone: Promise<void> };

/**
 * Returns `key`, but swaps it inside a View Transition so screen changes animate
 * natively. Skipped when unsupported, when the tab is hidden, or with reduced motion.
 */
export function useScreenTransition(key: string): string {
  const [shown, setShown] = useState(key);
  useEffect(() => {
    if (key === shown) return;
    const doc = document as Document & { startViewTransition?: (cb: () => void) => ViewTransition };
    if (!doc.startViewTransition || document.visibilityState !== 'visible' || prefersReducedMotion()) return setShown(key);
    const t = doc.startViewTransition(() => flushSync(() => setShown(key)));
    // A newer transition can supersede this one (rapid state changes); that's fine.
    [t.finished, t.ready, t.updateCallbackDone].forEach((p) => p.catch(() => {}));
  }, [key, shown]);
  return shown;
}
