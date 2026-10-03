import { useLayoutEffect, useRef, useState } from 'react';

/**
 * Shrinks content (via CSS `zoom`) until it fits its box's height, so a shared screen never
 * hides anything below the fold. Returns refs for the box and the content, and the zoom to
 * apply to the content. Never grows past 1; below `min` the box scrolls instead.
 */
export function useFitToHeight<B extends HTMLElement, C extends HTMLElement>(min: number) {
  const box = useRef<B>(null);
  const content = useRef<C>(null);
  const [fit, setFit] = useState(1);
  const fitRef = useRef(fit);
  fitRef.current = fit;

  useLayoutEffect(() => {
    const b = box.current;
    const c = content.current;
    if (!b || !c) return;
    const measure = () => {
      const cs = getComputedStyle(b);
      const room = b.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      const used = c.getBoundingClientRect().height;
      if (room <= 0 || used <= 0) return;
      const next = Math.max(min, Math.min(1, (fitRef.current * room) / used));
      if (Math.abs(next - fitRef.current) > 0.005) setFit(next);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(b);
    ro.observe(c);
    return () => ro.disconnect();
  }, [min]);

  return { box, content, fit };
}
