import { useEffect, useRef } from 'react';

/**
 * Fits a textarea's height to its content whenever `value` changes, and again
 * when its width changes (rotation, resize). Pass `null` to disable.
 */
export function useAutoGrow(value: string | null) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || value === null) return;
    const fit = () => {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [value]);
  return ref;
}
