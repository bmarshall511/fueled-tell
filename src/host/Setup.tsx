import { useEffect, useId, useState } from 'react';
import { validateRows } from '../engine/intake';
import { RULES } from '../engine/rules';
import type { Intake, ScoringMode } from '../engine/types';
import { PACKS, packById } from '../packs';
import { tokens } from '../tokens/tokens';
import { Button } from '../ui/Button';
import { UI_COPY } from '../ui/copy';
import { BuiltBy, FueledLockup } from '../ui/Logo';
import { Segmented } from '../ui/Segmented';
import { useDocumentTitle } from '../ui/useHostChrome';
import { EntriesEditor, newRow, type DraftRow } from './EntriesEditor';
import { asSession, readJsonFile } from './storage';
import type { HostGame } from './useHostGame';
import styles from './screens.module.css';

const S = UI_COPY.setup;
const TIMERS = [20, 30, 45, 60, 90];
const SCORING: ScoringMode[] = ['competitive', 'light', 'none'];
const DRAFT_KEY = 'tell:setup-draft';

interface Draft {
  packId: string;
  intake: Intake;
  rows: DraftRow[];
  timerSec: number;
  scoring: ScoringMode;
  hostOnly: boolean;
}

function loadDraft(): Draft | null {
  try {
    const d = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? 'null') as Draft | null;
    return d && Array.isArray(d.rows) ? { ...d, rows: d.rows.map((r) => newRow(r.name, r.text)) } : null;
  } catch {
    return null;
  }
}

/** Draft from the current lobby, when editing an open game. */
function draftFromGame(host: HostGame): Draft | null {
  const s = host.state;
  if (!s) return null;
  const rows = s.entries.map((e) => newRow(s.players.find((p) => p.id === e.ownerId)?.name ?? '', e.text));
  return { packId: s.packId, intake: s.settings.intake, rows, timerSec: s.settings.timerSec, scoring: s.settings.scoring, hostOnly: s.settings.hostOnly };
}

/** Host setup (not for sharing: it shows who wrote what). Creates the game, or edits the open lobby. */
export function Setup({ host, onDone }: { host: HostGame; onDone?: () => void }) {
  const editing = host.state?.phase === 'lobby';
  // Read once on mount: later edits are local until saved.
  const [initial] = useState(() => (editing ? draftFromGame(host) : loadDraft()));
  const [packId, setPackId] = useState(initial?.packId ?? PACKS[0]!.id);
  const pack = packById(packId);
  const [intake, setIntake] = useState<Intake>(initial?.intake ?? 'host');
  const [rows, setRows] = useState<DraftRow[]>(initial?.rows ?? []);
  const [timerSec, setTimerSec] = useState(initial?.timerSec ?? pack.timerSec);
  const [scoring, setScoring] = useState<ScoringMode>(initial?.scoring ?? pack.scoring);
  const [hostOnly, setHostOnly] = useState(initial?.hostOnly ?? false);
  const [loadError, setLoadError] = useState(false);
  const fileId = useId();
  useDocumentTitle(`${S.title} · ${UI_COPY.appName}`);

  useEffect(() => {
    if (editing) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ packId, intake, rows, timerSec, scoring, hostOnly } satisfies Draft));
    } catch {
      /* draft not saved */
    }
  }, [editing, packId, intake, rows, timerSec, scoring, hostOnly]);

  const validated = validateRows(rows, pack.entry.maxLength);
  const filled = validated.filter((r) => r.name.trim() || r.text.trim());
  const problems = filled.filter((r) => r.issues.length > 0);
  const enough = intake === 'live' && !hostOnly ? true : filled.length >= RULES.minEntries;
  const ready = enough && problems.length === 0;

  const choosePack = (id: string) => {
    const p = packById(id);
    setPackId(id);
    setTimerSec(p.timerSec);
    setScoring(p.scoring);
  };

  const submit = () => {
    if (!ready) return;
    const clean = filled.map((r) => ({ name: r.name, text: r.text }));
    const settings = { timerSec, scoring, hostOnly, intake: hostOnly ? ('host' as const) : intake, maxLength: pack.entry.maxLength };
    if (editing) {
      host.dispatch({ type: 'updateSettings', settings });
      host.dispatch({ type: 'setRoster', rows: clean, ids: clean.map((_, i) => `p_${Date.now().toString(36)}${i}`) });
    } else {
      host.create(packId, clean, settings);
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        /* ignore */
      }
    }
    onDone?.();
  };

  return (
    <main className={styles.setup}>
      <header className={styles.header}>
        <FueledLockup height="36px" />
        <BuiltBy height={`${tokens.size.builtbyPage}px`} />
      </header>

      <h1 className={styles.title}>{editing ? S.save : S.title}</h1>
      <p className={styles.intro}>{S.intro}</p>
      <p className={`chamfer ${styles.warning}`}>{S.shareWarning}</p>

      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        {!editing && (
          <fieldset className={styles.step}>
            <legend className={styles.legend}>
              <span className={styles.num}>1</span>
              {S.stepPack}
            </legend>
            <div className={styles.packs}>
              {PACKS.map((p) => (
                <label key={p.id} className={`chamfer ${styles.pack}`}>
                  <input type="radio" name="pack" className="visually-hidden" checked={p.id === packId} onChange={() => choosePack(p.id)} />
                  <span className={styles.packName}>{p.name}</span>
                  <span className={styles.packPrompt}>{p.prompt}</span>
                  <span className={styles.packMeta}>
                    {p.timerSec}
                    {S.seconds} · {S.scoringModes[p.scoring]}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <fieldset className={styles.step}>
          <legend className={styles.legend}>
            <span className={styles.num}>{editing ? 1 : 2}</span>
            {S.stepEntries}
          </legend>
          {!hostOnly && (
            <Segmented
              label={S.stepEntries}
              options={[
                { value: 'host', label: S.intakeHost },
                { value: 'live', label: S.intakeLive },
              ]}
              value={intake}
              onChange={setIntake}
            />
          )}
          {intake === 'live' && !hostOnly && <p className={styles.hint}>{S.liveHint}</p>}
          <EntriesEditor rows={rows} onChange={setRows} maxLength={pack.entry.maxLength} itemNoun={pack.copy.item} />
        </fieldset>

        <fieldset className={styles.step}>
          <legend className={styles.legend}>
            <span className={styles.num}>{editing ? 2 : 3}</span>
            {S.stepSettings}
          </legend>
          <div className={styles.settings}>
            <Segmented
              label={S.timer}
              showLabel
              options={TIMERS.map((t) => ({ value: t, label: `${t}${S.seconds}` }))}
              value={timerSec}
              onChange={setTimerSec}
            />
            <Segmented label={S.scoring} showLabel options={SCORING.map((m) => ({ value: m, label: S.scoringModes[m] }))} value={scoring} onChange={setScoring} />
            <label className={styles.toggle}>
              <input type="checkbox" role="switch" checked={hostOnly} onChange={(e) => setHostOnly(e.target.checked)} />
              <span className={`chamfer ${styles.switch}`} aria-hidden="true" />
              <span>
                <span className={styles.toggleLabel}>{S.hostOnly}</span>
                <span className={styles.hint}>{S.hostOnlyHint}</span>
              </span>
            </label>
          </div>
        </fieldset>

        <div className={styles.submit}>
          {!editing && (
            <label className={`chamfer ${styles.fileLink}`} htmlFor={fileId}>
              {S.loadFile}
              <input
                id={fileId}
                type="file"
                accept="application/json,.json"
                className="visually-hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  e.target.value = '';
                  if (!f) return;
                  const s = asSession(await readJsonFile(f).catch(() => null));
                  setLoadError(!s);
                  if (s) host.replace(s);
                }}
              />
            </label>
          )}
          {loadError && (
            <p className={styles.error} role="alert">
              {S.loadError}
            </p>
          )}
          {!ready && (
            <p className={styles.hint} aria-live="polite">
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
