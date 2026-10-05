import { useId, type ReactNode } from 'react';
import { GAME } from '../../content';
import type { GameCopy } from '../../engine/types';
import { TextInput } from '../../ui/components/TextField';
import { BuiltBy } from '../../ui/components/Logo';
import { Segmented } from '../../ui/components/Segmented';
import { Switch } from '../../ui/components/Switch';
import { UI_COPY } from '../../ui/copy';
import { MiniStage } from './MiniStage';
import styles from './SetupPanel.module.css';

const S = UI_COPY.setup;
const TIMERS = [20, 30, 45, 60, 90] as const;
/** A custom prompt is one line on the lobby screen. */
const PROMPT_MAX = 120;

interface SetupPanelProps {
  previewText: string | null;
  total: number;
  /** This game's copy, with the chosen topic's words. */
  copy: GameCopy;
  topic: string;
  onTopic: (id: string) => void;
  customPrompt: string;
  onCustomPrompt: (prompt: string) => void;
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
export function SetupPanel(props: SetupPanelProps) {
  const { previewText, total, copy, topic, onTopic, customPrompt, onCustomPrompt, timerSec, onTimer, hostOnly, onHostOnly, go, secondary } =
    props;
  const promptId = useId();
  const chosen = GAME.topics.find((t) => t.id === topic) ?? GAME.topics[0]!;
  return (
    <aside className={`spot ${styles.panel}`}>
      <MiniStage text={previewText} total={total} timerSec={timerSec} copy={copy} />
      <div className={styles.topic}>
        <Segmented
          label={S.topic}
          showLabel
          options={GAME.topics.map((t) => ({ value: t.id, label: t.label }))}
          value={chosen.id}
          onChange={onTopic}
        />
        {chosen.custom && (
          <>
            <label htmlFor={promptId} className="visually-hidden">
              {S.customPrompt}
            </label>
            <TextInput
              id={promptId}
              tone="sunken"
              value={customPrompt}
              onChange={(e) => onCustomPrompt(e.target.value)}
              placeholder={S.customPlaceholder}
              maxLength={PROMPT_MAX}
              autoComplete="off"
            />
          </>
        )}
      </div>
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
