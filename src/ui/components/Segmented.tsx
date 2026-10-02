import { useId } from 'react';
import styles from './Segmented.module.css';

interface SegmentedProps<T extends string | number> {
  label: string;
  showLabel?: boolean;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}

/** Native radio group styled as a segmented control (arrow keys and screen readers for free). */
export function Segmented<T extends string | number>({ label, showLabel, options, value, onChange }: SegmentedProps<T>) {
  const name = useId();
  return (
    <fieldset className={styles.wrap}>
      <legend className={showLabel ? styles.label : 'visually-hidden'}>{label}</legend>
      <div className={styles.segmented}>
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
