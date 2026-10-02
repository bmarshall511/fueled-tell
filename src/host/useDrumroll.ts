import { useEffect, useState } from 'react';
import { RULES } from '../engine/rules';
import { sound } from '../ui/sound';

const STEPS = 3;

/**
 * The shared reveal drumroll: counts 3-2-1 over `RULES.drumrollMs` from when
 * the reveal started (host clock on the host; elapsed-at-receipt on phones),
 * then reports done. Returns the number to show, or null when finished.
 */
export function useDrumroll(active: boolean, elapsedAtStart: number, withSound: boolean): { count: number | null; done: boolean } {
  const [elapsed, setElapsed] = useState(elapsedAtStart);
  useEffect(() => {
    if (!active) return;
    const start = performance.now() - elapsedAtStart;
    let raf = 0;
    let lastStep = -1;
    const tick = () => {
      const e = performance.now() - start;
      setElapsed(e);
      const step = Math.floor((e / RULES.drumrollMs) * STEPS);
      if (withSound && step !== lastStep && step < STEPS) sound.tick(step);
      if (withSound && step >= STEPS && lastStep < STEPS) sound.flip();
      lastStep = step;
      if (e < RULES.drumrollMs) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, elapsedAtStart, withSound]);
  if (!active) return { count: null, done: false };
  const done = elapsed >= RULES.drumrollMs;
  return { count: done ? null : STEPS - Math.floor((elapsed / RULES.drumrollMs) * STEPS), done };
}
