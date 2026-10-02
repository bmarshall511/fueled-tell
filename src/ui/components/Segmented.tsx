import { useId, useLayoutEffect, useRef } from 'react';
import styles from './Segmented.module.css';

interface SegmentedProps<T extends string | number> {
  label: string;
  showLabel?: boolean;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}

/** Keeps the sliding thumb under the checked option (and follows wraps and resizes). */
function useThumb(value: unknown) {
  const track = useRef<HTMLDivElement>(null);
  const thumb = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const el = track.current;
    if (!el) return;
    const place = () => {
      const on = el.querySelector<HTMLElement>('label:has(input:checked)');
      const t = thumb.current;
      if (!on || !t) return;
      t.style.width = `${on.offsetWidth}px`;
      t.style.height = `${on.offsetHeight}px`;
      t.style.translate = `${on.offsetLeft}px ${on.offsetTop}px`;
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(el);
    return () => ro.disconnect();
  }, [value]);
  return { track, thumb };
}

/** Native radio group styled as a segmented control, with a thumb that slides to the choice. */
export function Segmented<T extends string | number>({ label, showLabel, options, value, onChange }: SegmentedProps<T>) {
  const name = useId();
  const { track, thumb } = useThumb(value);
  return (
    <fieldset className={styles.wrap}>
      <legend className={showLabel ? styles.label : 'visually-hidden'}>{label}</legend>
      <div className={styles.segmented} ref={track}>
        <span className={styles.thumb} ref={thumb} aria-hidden="true" />
        {options.map((o) => (
          <label key={String(o.value)} className={styles.seg}>
            <input type="radio" name={name} className="visually-hidden" checked={o.value === value} onChange={() => onChange(o.value)} />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
