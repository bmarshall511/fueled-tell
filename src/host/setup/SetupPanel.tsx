import type { ReactNode } from 'react';
import { BuiltBy } from '../../ui/components/Logo';
import { Segmented } from '../../ui/components/Segmented';
import { Switch } from '../../ui/components/Switch';
import { UI_COPY } from '../../ui/copy';
import { MiniStage } from './MiniStage';
import styles from './SetupPanel.module.css';

const S = UI_COPY.setup;
const TIMERS = [20, 30, 45, 60, 90] as const;

interface SetupPanelProps {
  previewText: string | null;
  total: number;
  timerSec: number;
  onTimer: (sec: number) => void;
  hostOnly: boolean;
  onHostOnly: (on: boolean) => void;
  /** Readiness and the main action (moves to the pinned dock on small screens). */
  go: ReactNode;
  /** Load a saved game, or cancel an edit: always here. */
  secondary: ReactNode;
}

/** The studio's side panel: a live preview, the game settings, and the way forward. Sticky on wide screens. */
export function SetupPanel({ previewText, total, timerSec, onTimer, hostOnly, onHostOnly, go, secondary }: SetupPanelProps) {
  return (
    <aside className={`spot ${styles.panel}`}>
      <MiniStage text={previewText} total={total} timerSec={timerSec} />
      <Segmented
        label={S.timer}
        showLabel
        options={TIMERS.map((t) => ({ value: t, label: `${t}${S.seconds}` }))}
        value={timerSec}
        onChange={onTimer}
      />
      <Switch label={S.hostOnly} hint={S.hostOnlyHint} checked={hostOnly} onChange={onHostOnly} />
      <hr className={styles.rule} />
      <div className={styles.go}>{go}</div>
      <div className={styles.secondary}>{secondary}</div>
      <BuiltBy size="compact" className={styles.builtBy} />
    </aside>
  );
}
