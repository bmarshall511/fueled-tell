import { useRef, useState } from 'react';
import { GAME, gameCopy } from '../../content';
import { validateRows } from '../../engine/intake';
import { RULES } from '../../engine/rules';
import legends from '../../content/legends.json';
import sampleEntries from '../../content/sample-entries.json';
import { announce } from '../../ui/lib/eggs';
import { Backdrop } from '../../ui/components/Backdrop';
import { Button } from '../../ui/components/Button';
import { UI_COPY } from '../../ui/copy';
import { useDocumentTitle } from '../../ui/hooks/useDocumentTitle';
import { plural } from '../../ui/lib/format';
import type { HostGame } from '../state/useHostGame';
import { Composer } from './Composer';
import { filledRows, newRow, type DraftRow } from './draftRows';
import { LoadSavedGame } from './LoadSavedGame';
import { pasteListInto } from './pasteDetect';
import { PasteSheet } from './PasteSheet';
import { PeopleList } from './PeopleList';
import { ReadyMeter } from './ReadyMeter';
import { SetupBar } from './SetupBar';
import { SetupPanel } from './SetupPanel';
import { StartChoices } from './StartChoices';
import { useSetupDraft } from './useSetupDraft';
import styles from './Setup.module.css';

const S = UI_COPY.setup;
const E = UI_COPY.editor;
const MAX = GAME.entry.maxLength;

/**
 * Host setup, as a studio: who's playing is the main stage; the preview, settings and the way
 * forward sit in a sticky panel (a pinned dock on phones). Private: it shows who wrote what.
 * Creates the game, or edits the open lobby.
 */
export function Setup({ host, onDone }: { host: HostGame; onDone?: () => void }) {
  const { draft, editing, set, clearSaved } = useSetupDraft(host.state);
  useDocumentTitle(editing ? S.editTitle : S.title);
  const [pasting, setPasting] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  const validated = validateRows(draft.rows, MAX);
  const people = filledRows(validated);
  const problems = people.filter((r) => r.issues.length > 0);
  const ready = people.length - problems.length;
  const live = draft.intake === 'live' && !draft.hostOnly;
  const canOpen = (live || people.length >= RULES.minEntries) && problems.length === 0;
  const empty = draft.rows.length === 0;
  const copy = gameCopy(draft);

  const setRows = (rows: DraftRow[]) => set('rows', rows);
  const onPaste = pasteListInto(setPasting);
  const startComposing = () => {
    setComposing(true);
    requestAnimationFrame(() => nameRef.current?.focus());
  };

  const submit = () => {
    if (!canOpen) return;
    const clean = people.map((r) => ({ name: r.name, text: r.text }));
    const settings = {
      timerSec: draft.timerSec,
      hostOnly: draft.hostOnly,
      intake: live ? ('live' as const) : ('host' as const),
      maxLength: MAX,
      topic: draft.topic,
      customPrompt: draft.customPrompt.trim(),
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

  // Readiness and the main action: in the panel on wide screens, pinned to the bottom on small ones.
  const go = (
    <>
      <ReadyMeter
        ready={ready}
        total={people.length}
        needed={RULES.minEntries}
        live={live}
        problem={problems.length ? plural(problems.length, E.needsFix) : null}
      />
      <Button type="submit" className={styles.open} disabled={!canOpen}>
        {editing ? S.save : S.open}
      </Button>
    </>
  );
  const secondary =
    editing && onDone ? (
      <Button variant="outline" onClick={onDone}>
        {E.cancel}
      </Button>
    ) : (
      <LoadSavedGame onLoad={host.replace} />
    );

  return (
    <main className={`page ${styles.setup}`}>
      <Backdrop />
      <SetupBar editing={editing} roomCode={editing ? host.roomCode : null} />
      <form
        className={styles.studio}
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className={styles.main}>
          <div className={styles.hello}>
            <h1 className={styles.heading}>
              {S.headingLead} <span className="text-glow">{S.headingGlow}</span>
            </h1>
            <p className="text-lede">{S.lede}</p>
          </div>

          {empty && !composing && !live ? (
            <StartChoices
              onPaste={() => setPasting('')}
              onOneByOne={startComposing}
              onLive={draft.hostOnly ? undefined : () => set('intake', 'live')}
              onSample={() => setRows(sampleEntries.map((s) => newRow(s.name, s.text)))}
            />
          ) : (
            <>
              {live && <p className={styles.liveInfo}>{S.liveInfo}</p>}
              <Composer
                ref={nameRef}
                itemNoun={copy.item}
                onPaste={onPaste}
                onAdd={(name, text) => setRows([...filledRows(draft.rows), newRow(name, text)])}
                onSecret={() => {
                  setRows([...filledRows(draft.rows), ...legends.map((l) => newRow(l.name, l.text))]);
                  announce(UI_COPY.eggs.found);
                }}
              />
              <div className={styles.toolbar}>
                <Button variant="secondary" onClick={() => setPasting('')}>
                  {E.paste}
                </Button>
                {!draft.hostOnly && (
                  <Button variant="secondary" aria-pressed={live} onClick={() => set('intake', live ? 'host' : 'live')}>
                    {S.liveToggle}
                  </Button>
                )}
                <Button
                  variant="secondary"
                  onClick={() => setRows([...filledRows(draft.rows), ...sampleEntries.map((s) => newRow(s.name, s.text))])}
                >
                  {E.sample}
                </Button>
                {!empty && (
                  <Button variant="secondary" onClick={() => window.confirm(E.clearConfirm) && setRows([])}>
                    {E.clear}
                  </Button>
                )}
              </div>
              <PeopleList
                rows={validated}
                maxLength={MAX}
                itemNoun={copy.item}
                onPaste={onPaste}
                onUpdate={(key, patch) => setRows(draft.rows.map((r) => (r.key === key ? { ...r, ...patch } : r)))}
                onRemove={(key) => setRows(draft.rows.filter((r) => r.key !== key))}
              />
            </>
          )}
        </div>

        <SetupPanel
          previewText={people[0]?.text ?? null}
          total={people.length}
          copy={copy}
          topic={draft.topic}
          onTopic={(t) => set('topic', t)}
          customPrompt={draft.customPrompt}
          onCustomPrompt={(p) => set('customPrompt', p)}
          timerSec={draft.timerSec}
          onTimer={(t) => set('timerSec', t)}
          hostOnly={draft.hostOnly}
          onHostOnly={(on) => set('hostOnly', on)}
          go={go}
          secondary={secondary}
        />

        {/* Phones and narrow windows: readiness and the main action stay pinned to the bottom. */}
        <div className={styles.dock}>{go}</div>
      </form>

      {pasting !== null && (
        <PasteSheet
          initial={pasting}
          maxLength={MAX}
          onClose={() => setPasting(null)}
          onApply={(parsed, mode) => {
            const incoming = parsed.map((p) => newRow(p.name, p.text));
            setRows([...(mode === 'add' ? filledRows(draft.rows) : []), ...incoming]);
            setPasting(null);
          }}
        />
      )}
    </main>
  );
}
