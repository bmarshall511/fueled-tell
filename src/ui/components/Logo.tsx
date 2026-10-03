import domLab from '../../../assets/brand/DOMlab-logo-white.svg?mono';
import fueledWordmark from '../../../assets/brand/fueled-wordmark-white.svg?mono';
import fueledLockupWhite from '../../../assets/brand/fueled-lockup-white.svg';
import styles from './Logo.module.css';

/**
 * Logo sizes, all from tokens:
 * - `page`: landing, setup, demo
 * - `compact`: the player app bar
 * - `stage`: the host's shared screen (scales with the stage, never below compact)
 */
export type LogoSize = 'page' | 'compact' | 'stage';

const WORDMARK: Record<LogoSize, string> = {
  page: 'var(--size-logo-page)',
  compact: 'var(--size-logo-compact)',
  stage: 'max(var(--size-logo-compact), calc(var(--size-logo-host) * var(--stage)))',
};

const ENDORSEMENT: Record<LogoSize, string> = {
  page: 'var(--size-builtby-page)',
  compact: 'var(--size-builtby-compact)',
  stage: 'max(var(--size-builtby-compact), calc(var(--size-builtby-host) * var(--stage)))',
};

interface LogoProps {
  size: LogoSize;
  className?: string;
}

/** A single-color SVG logo rendered in currentColor (see the `?mono` Vite plugin). */
function MonoSvg({ markup, label, height, className }: { markup: string; label: string; height: string; className?: string }) {
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

/** Fueled wordmark in currentColor. Never apply secondary colors to it. */
export const FueledWordmark = ({ size, className }: LogoProps) => (
  <MonoSvg markup={fueledWordmark} label="Fueled" height={WORDMARK[size]} className={className} />
);

/** Horizontal Fueled lockup with the color emblem. Never stack it vertically. */
export const FueledLockup = ({ size, className }: LogoProps) => (
  <img src={fueledLockupWhite} alt="Fueled" className={`${styles.lockup} ${className ?? ''}`} style={{ height: WORDMARK[size] }} />
);

/** "built by DOM lab" endorsement. The DOM lab mark stays full text color: it's the endorsement. */
export function BuiltBy({ size, className }: LogoProps) {
  const height = ENDORSEMENT[size];
  return (
    <span className={`${styles.builtBy} ${className ?? ''}`} style={{ fontSize: `calc(${height} * 0.42)` }}>
      <span>built by</span>
      <MonoSvg markup={domLab} label="DOM lab" height={height} className={styles.domlab} />
    </span>
  );
}

/** The bolt from the Fueled emblem, in currentColor (keep it white or text color; never a secondary). */
export function FueledBolt({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="70 78 125 109" width="1em" height="1em" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M92.186 78.16h58.676l-22.003 52.274H70.184L92.186 78.16Z" />
      <path d="M135.572 114.187h59.029l-88.984 72.229 29.955-72.229Z" />
    </svg>
  );
}
