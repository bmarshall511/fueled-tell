import { useEffect, useState } from 'react';
import { withViewTransition } from '../lib/viewTransition';

/** Returns `key`, but swaps it inside a View Transition so screen changes animate natively. */
export function useScreenTransition(key: string): string {
  const [shown, setShown] = useState(key);
  useEffect(() => {
    if (key !== shown) withViewTransition(() => setShown(key));
  }, [key, shown]);
  return shown;
}
