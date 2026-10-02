import { BuiltBy, FueledWordmark } from '../../ui/components/Logo';
import styles from './HostBrand.module.css';

/** Top-left of the shared screen: the Fueled wordmark with the DOM lab endorsement beside it. */
export function HostBrand() {
  return (
    <span className={styles.brand}>
      <FueledWordmark size="stage" className="vt-brand" />
      <span className={styles.rule} aria-hidden="true" />
      <BuiltBy size="stage" />
    </span>
  );
}
