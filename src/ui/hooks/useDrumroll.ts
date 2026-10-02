import { useEffect, useRef, useState } from 'react';
import { RULES } from '../../engine/rules';

const STEPS = 3;

export interface DrumrollCues {
  /** Each count (0, 1, 2 for "3, 2, 1"). */
  onStep?: (step: number) => void;
  /** The moment the count reaches zero. */
  onDone?: () => void;
}

/**
 * The shared reveal drumroll: counts 3-2-1 over `RULES.drumrollMs` from when the
 * reveal started (host clock on the host; elapsed-at-receipt on phones), then
 * reports done. `elapsedAtStart` must be stable for one reveal (memoize it on the
 * reveal's start time). Cues (e.g. sounds) are optional so phones run it silently.
 */
export function useDrumroll(active: boolean, elapsedAtStart: number, cues: DrumrollCues = {}): { count: number | null; done: boolean } {
  // Starts at 0 for every reveal (never carries over the previous one's "done").
  const [elapsed, setElapsed] = useState(0);
  const cuesRef = useRef(cues);
  cuesRef.current = cues;
  useEffect(() => {
    if (!active) return setElapsed(0);
    const start = performance.now() - elapsedAtStart;
    let raf = 0;
    let lastStep = -1;
    const tick = () => {
      const e = performance.now() - start;
      setElapsed(e);
      const step = Math.floor((e / RULES.drumrollMs) * STEPS);
      if (step !== lastStep && step < STEPS) cuesRef.current.onStep?.(step);
      if (step >= STEPS && lastStep < STEPS) cuesRef.current.onDone?.();
      lastStep = step;
      if (e < RULES.drumrollMs) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, elapsedAtStart]);
  if (!active) return { count: null, done: false };
  const done = elapsed >= RULES.drumrollMs;
  return { count: done ? null : STEPS - Math.floor((elapsed / RULES.drumrollMs) * STEPS), done };
}
