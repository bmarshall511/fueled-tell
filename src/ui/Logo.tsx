import domLab from '../../assets/brand/DOMlab-logo-white.svg?mono';
import fueledWordmark from '../../assets/brand/fueled-wordmark-white.svg?mono';
import fueledLockupWhite from '../../assets/brand/fueled-lockup-white.svg';
import styles from './Logo.module.css';

interface MonoLogoProps {
  /** Height in CSS units; width follows the artwork's aspect ratio. */
  height: string;
  className?: string;
}

function MonoSvg({ markup, label, height, className }: MonoLogoProps & { markup: string; label: string }) {
  return (
    <span
      role="img"
      aria-label={label}
      className={`${styles.mono} ${className ?? ''}`}
      style={{ height }}
      dangerouslySetInnerHTML={{ __html: markup.replace('<svg', '<svg aria-hidden="true" focusable="false"') }}
    />
  );
}

/** DOM lab wordmark in currentColor. */
export const DomLabLogo = (props: MonoLogoProps) => <MonoSvg markup={domLab} label="DOM lab" {...props} />;

/** Fueled wordmark in currentColor. Never apply secondary colors to it. */
export const FueledWordmark = (props: MonoLogoProps) => <MonoSvg markup={fueledWordmark} label="Fueled" {...props} />;

/** Horizontal Fueled lockup with the color emblem. Never stack it vertically. */
export const FueledLockup = ({ height, className }: MonoLogoProps) => (
  <img src={fueledLockupWhite} alt="Fueled" className={className} style={{ height, width: 'auto' }} />
);

/** "built by DOM lab" endorsement. */
export function BuiltBy({ height, className }: MonoLogoProps) {
  return (
    <span className={`${styles.builtBy} ${className ?? ''}`} style={{ fontSize: `calc(${height} * 0.42)` }}>
      <span>built by</span>
      <DomLabLogo height={height} className={styles.domlab} />
    </span>
  );
}
