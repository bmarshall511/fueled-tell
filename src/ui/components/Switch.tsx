import styles from './Switch.module.css';

interface SwitchProps {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/** An on/off switch (a native checkbox with role="switch"), with a label and optional hint. */
export function Switch({ label, hint, checked, onChange }: SwitchProps) {
  return (
    <label className={styles.toggle}>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className={`chamfer ${styles.track}`} aria-hidden="true" />
      <span>
        <span className={styles.label}>{label}</span>
        {hint && <span className="text-hint">{hint}</span>}
      </span>
    </label>
  );
}
