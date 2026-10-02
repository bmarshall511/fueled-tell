import { BuiltBy, FueledLockup } from './Logo';
import styles from './BrandHeader.module.css';

/** Page header: the Fueled lockup with the DOM lab endorsement (landing, setup, demo). */
export function BrandHeader() {
  return (
    <header className={styles.header}>
      <FueledLockup size="page" className="vt-brand" />
      <BuiltBy size="page" />
    </header>
  );
}
