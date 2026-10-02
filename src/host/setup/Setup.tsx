import { validateRows } from '../../engine/intake';
import { RULES } from '../../engine/rules';
import type { ScoringMode } from '../../engine/types';
import { GAME } from '../../content';
import { Backdrop } from '../../ui/components/Backdrop';
import { BrandHeader } from '../../ui/components/BrandHeader';
import { Button } from '../../ui/components/Button';
import { Notice } from '../../ui/components/Notice';
import { RoomTag } from '../../ui/components/RoomTag';
import { Segmented } from '../../ui/components/Segmented';
import { Switch } from '../../ui/components/Switch';
import { UI_COPY } from '../../ui/copy';
import { useDocumentTitle } from '../../ui/hooks/useDocumentTitle';
import type { HostGame } from '../state/useHostGame';
import { filledRows } from './draftRows';
import { EntriesEditor } from './EntriesEditor';
import { LoadSavedGame } from './LoadSavedGame';
import { SetupStep } from './SetupStep';
import { useSetupDraft } from './useSetupDraft';
import styles from './Setup.module.css';

const S = UI_COPY.setup;
const TIMERS = [20, 30, 45, 60, 90];
const SCORING: ScoringMode[] = ['competitive', 'none'];

/** Host setup (not for sharing: it shows who wrote what). Creates the game, or edits the open lobby. */
export function Setup({ host, onDone }: { host: HostGame; onDone?: () => void }) {
  const { draft, editing, set, clearSaved } = useSetupDraft(host.state);
  useDocumentTitle(S.title);

  const rows = filledRows(validateRows(draft.rows, GAME.entry.maxLength));
  const problems = rows.filter((r) => r.issues.length > 0);
  const live = draft.intake === 'live' && !draft.hostOnly;
  const ready = (live || rows.length >= RULES.minEntries) && problems.length === 0;

  const submit = () => {
    if (!ready) return;
    const clean = rows.map((r) => ({ name: r.name, text: r.text }));
    const settings = {
      timerSec: draft.timerSec,
      scoring: draft.scoring,
      hostOnly: draft.hostOnly,
      intake: draft.hostOnly ? ('host' as const) : draft.intake,
      maxLength: GAME.entry.maxLength,
    };
    if (editing) {
      host.dispatch({ type: 'updateSettings', settings });
      host.dispatch({ type: 'setRoster', rows: clean, ids: clean.map((_, i) => `p_${Date.now().toString(36)}${i}`) });
    } else {
      host.create(clean, settings);
      clearSaved();
    }
    onDone?.();
  };

  let step = 0;
  return (
    <main className={`page ${styles.setup}`}>
      <Backdrop />
      <BrandHeader />
      <h1 className={`text-headline ${styles.title}`}>{editing ? S.save : S.title}</h1>
      {editing && host.roomCode && !host.state?.settings.hostOnly && (
        <p className={`text-label ${styles.room}`}>
          {UI_COPY.roomCode} <RoomTag code={host.roomCode} />
        </p>
      )}
      <p className={`text-lede ${styles.intro}`}>{S.intro}</p>
      <Notice className={styles.warning}>{S.shareWarning}</Notice>

      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <SetupStep number={++step} title={S.stepEntries}>
          {!draft.hostOnly && (
            <Segmented
              label={S.stepEntries}
              options={[
                { value: 'host', label: S.intakeHost },
                { value: 'live', label: S.intakeLive },
              ]}
              value={draft.intake}
              onChange={(v) => set('intake', v)}
            />
          )}
          {live && <p className="text-hint">{S.liveHint}</p>}
          <EntriesEditor rows={draft.rows} onChange={(r) => set('rows', r)} maxLength={GAME.entry.maxLength} itemNoun={GAME.copy.item} />
        </SetupStep>

        <SetupStep number={++step} title={S.stepSettings}>
          <div className={styles.settings}>
            <Segmented
              label={S.timer}
              showLabel
              options={TIMERS.map((t) => ({ value: t, label: `${t}${S.seconds}` }))}
              value={draft.timerSec}
              onChange={(v) => set('timerSec', v)}
            />
            <Segmented
              label={S.scoring}
              showLabel
              options={SCORING.map((m) => ({ value: m, label: S.scoringModes[m] }))}
              value={draft.scoring}
              onChange={(v) => set('scoring', v)}
            />
            <Switch label={S.hostOnly} hint={S.hostOnlyHint} checked={draft.hostOnly} onChange={(v) => set('hostOnly', v)} />
          </div>
        </SetupStep>

        <div className={styles.submit}>
          {!editing && <LoadSavedGame onLoad={host.replace} />}
          {!ready && (
            <p className="text-hint" aria-live="polite">
              {problems.length ? S.fixFirst : S.needMore}
            </p>
          )}
          {editing && onDone && (
            <Button variant="secondary" onClick={onDone}>
              {UI_COPY.editor.cancel}
            </Button>
          )}
          <Button type="submit" disabled={!ready}>
            {editing ? S.save : S.open}
          </Button>
        </div>
      </form>
    </main>
  );
}
