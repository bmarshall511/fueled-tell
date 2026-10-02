import type { ReactNode } from 'react';
import { stageCssVars, useStageLayout } from '../../ui/lib/stage';
import styles from './HostStage.module.css';

interface HostStageProps {
  children: ReactNode;
  className?: string;
  busy?: boolean;
}

/**
 * Root of every shared-screen view (lobby, game, finale): sets the stage scale
 * (--stage, --item-w, ...) and orientation that the HUD and the 3D scene share.
 */
export function HostStage({ children, className, busy }: HostStageProps) {
  const layout = useStageLayout();
  return (
    <main
      className={`${styles.stage} ${className ?? ''}`}
      style={stageCssVars(layout)}
      data-orientation={layout.orientation}
      aria-busy={busy || undefined}
    >
      {children}
    </main>
  );
}
