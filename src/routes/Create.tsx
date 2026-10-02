import { useEffect, useId, useMemo, useRef, useState, type CSSProperties } from 'react';
import { parseEntries } from '../engine/intake';
import type { Pack, ScoringMode } from '../engine/types';
import { MOCK_ENTRIES, MOCK_PLAYERS, MOCK_ROOM_CODE, PACKS } from '../mock/data';
import { isDemo } from '../mock/demoSync';
import { seeded } from '../mock/random';
import { tokens } from '../tokens/tokens';
import { Button } from '../ui/Button';
import { CodeChip } from '../ui/CodeChip';
import { UI_COPY } from '../ui/copy';
import { BuiltBy, FueledLockup, FueledWordmark } from '../ui/Logo';
import { PlayerChip } from '../ui/PlayerChip';
import { stageCssVars, useStageLayout } from '../ui/stage';
import { useDocumentTitle } from '../ui/useHostChrome';
import styles from './Create.module.css';

const C = UI_COPY.create;
const TIMERS = [30, 45, 60, 90];
const SCORING: ScoringMode[] = ['competitive', 'light', 'none'];
const MIN_ENTRIES = 3;
/** Mock pacing: a player joins the lobby every so often. */
const JOIN_EVERY_MS = 1100;

const SAMPLE = MOCK_ENTRIES.map((e) => `${MOCK_PLAYERS.find((p) => p.id === e.ownerId)?.name ?? ''} | ${e.text}`).join('\n');

/** Host "create a game" mockup: setup on the laptop, then the shareable lobby. No Three.js. */
export default function Create() {
  const [stage, setStage] = useState<'setup' | 'lobby'>(() =>
    new URLSearchParams(window.location.search).get('screen') === 'lobby' ? 'lobby' : 'setup',
  );
  const [pack, setPack] = useState<Pack>(PACKS[0]);
  const [intake, setIntake] = useState<'paste' | 'live'>('paste');
  const [text, setText] = useState(() => (stage === 'lobby' || isDemo() ? SAMPLE : ''));
  const [timerSec, setTimerSec] = useState(pack.timerSec);
  const [scoring, setScoring] = useState<ScoringMode>(pack.scoring);
  const [hostOnly, setHostOnly] = useState(false);
  useDocumentTitle(`${stage === 'lobby' ? MOCK_ROOM_CODE : C.title} · ${UI_COPY.appName}`);

  const parsed = useMemo(() => parseEntries(text, pack.entry.maxLength), [text, pack]);
  const ready = intake === 'live' || parsed.rows.length >= MIN_ENTRIES;
  const choosePack = (p: Pack) => {
    setPack(p);
    setTimerSec(p.timerSec);
    setScoring(p.scoring);
  };

  if (stage === 'lobby') return <Lobby pack={pack} entries={parsed.rows.length} onBack={() => setStage('setup')} />;

  return (
    <main className={styles.setup}>
      <header className={styles.header}>
        <FueledLockup height="36px" />
        <BuiltBy height={`${tokens.size.builtbyPage}px`} />
      </header>

      <h1 className={styles.title}>{C.title}</h1>
      <p className={styles.intro}>{C.intro}</p>

      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          if (ready) setStage('lobby');
        }}
      >
        <fieldset className={styles.step}>
          <legend className={styles.legend}>
            <span className={styles.num}>1</span>
            {C.stepPack}
          </legend>
          <div className={styles.packs}>
            {PACKS.map((p) => (
              <label key={p.id} className={`chamfer ${styles.pack}`}>
                <input
                  type="radio"
                  name="pack"
                  className="visually-hidden"
                  checked={p.id === pack.id}
                  onChange={() => choosePack(p)}
                />
                <span className={styles.packName}>{p.name}</span>
                <span className={styles.packPrompt}>{p.prompt}</span>
                <span className={styles.packMeta}>
                  {p.timerSec}
                  {C.seconds} · {C.scoringModes[p.scoring]}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className={styles.step}>
          <legend className={styles.legend}>
            <span className={styles.num}>2</span>
            {C.stepEntries}
          </legend>
          <Segmented
            label={C.stepEntries}
            options={[
              { value: 'paste', label: C.intakePaste },
              { value: 'live', label: C.intakeLive },
            ]}
            value={intake}
            onChange={setIntake}
          />
          {intake === 'paste' ? (
            <PasteEntries text={text} setText={setText} parsed={parsed} maxLength={pack.entry.maxLength} />
          ) : (
            <p className={styles.hint}>{C.liveHint}</p>
          )}
        </fieldset>

        <fieldset className={styles.step}>
          <legend className={styles.legend}>
            <span className={styles.num}>3</span>
            {C.stepSettings}
          </legend>
          <div className={styles.settings}>
            <Segmented
              label={C.timer}
              showLabel
              options={TIMERS.map((t) => ({ value: t, label: `${t}${C.seconds}` }))}
              value={timerSec}
              onChange={setTimerSec}
            />
            <Segmented
              label={C.scoring}
              showLabel
              options={SCORING.map((m) => ({ value: m, label: C.scoringModes[m] }))}
              value={scoring}
              onChange={setScoring}
            />
            <label className={styles.toggle}>
              <input type="checkbox" role="switch" checked={hostOnly} onChange={(e) => setHostOnly(e.target.checked)} />
              <span className={`chamfer ${styles.switch}`} aria-hidden="true" />
              <span>
                <span className={styles.toggleLabel}>{C.hostOnly}</span>
                <span className={styles.hint}>{C.hostOnlyHint}</span>
              </span>
            </label>
          </div>
        </fieldset>

        <div className={styles.submit}>
          {!ready && <p className={styles.hint}>{C.minimumHint}</p>}
          <Button type="submit" disabled={!ready}>
            {C.open}
          </Button>
        </div>
      </form>
    </main>
  );
}

interface SegmentedProps<T extends string | number> {
  label: string;
  showLabel?: boolean;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}

/** Native radio group styled as a segmented control. */
function Segmented<T extends string | number>({ label, showLabel, options, value, onChange }: SegmentedProps<T>) {
  const name = useId();
  return (
    <div role="radiogroup" aria-label={label} className={styles.segmentedWrap}>
      {showLabel && (
        <span className={styles.segLabel} aria-hidden="true">
          {label}
        </span>
      )}
      <div className={styles.segmented}>
        {options.map((o) => (
          <label key={String(o.value)} className={`chamfer ${styles.seg}`}>
            <input
              type="radio"
              name={name}
              className="visually-hidden"
              checked={o.value === value}
              onChange={() => onChange(o.value)}
            />
            {o.label}
          </label>
        ))}
      </div>
    </div>
  );
}

interface PasteProps {
  text: string;
  setText: (t: string) => void;
  parsed: ReturnType<typeof parseEntries>;
  maxLength: number;
}

function PasteEntries({ text, setText, parsed }: PasteProps) {
  const ids = { area: useId(), hint: useId(), status: useId() };
  return (
    <div className={styles.paste}>
      <div className={styles.field}>
        <label htmlFor={ids.area} className={styles.fieldLabel}>
          {C.pasteLabel}
        </label>
        <textarea
          id={ids.area}
          className={`chamfer ${styles.textarea}`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          spellCheck={false}
          aria-describedby={`${ids.hint} ${ids.status}`}
          placeholder={SAMPLE.split('\n').slice(0, 2).join('\n')}
        />
        <span id={ids.hint} className={styles.hint}>
          {C.pasteHint}
        </span>
        <div className={styles.pasteActions}>
          <Button variant="secondary" onClick={() => setText(SAMPLE)}>
            {C.useSample}
          </Button>
          <p id={ids.status} className={styles.count} aria-live="polite">
            <strong>{parsed.rows.length}</strong> {C.entriesReady}
          </p>
        </div>
        {parsed.errors.length > 0 && (
          <ul className={styles.errors}>
            {parsed.errors.map((e) => (
              <li key={e.line}>
                {C.lineError} {e.line} {UI_COPY.parseErrors[e.code]}
              </li>
            ))}
          </ul>
        )}
      </div>
      {parsed.rows.length > 0 && (
        <ol className={styles.preview} aria-label={C.entriesReady}>
          {parsed.rows.map((r) => (
            <li key={r.line} className={`chamfer ${styles.previewRow}`}>
              <span className={styles.previewName}>{r.name}</span>
              <span className={styles.previewText}>{r.text}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/** The lobby is what the room sees on the shared screen: big code, who's in, start. */
function Lobby({ pack, entries, onBack }: { pack: Pack; entries: number; onBack: () => void }) {
  const layout = useStageLayout();
  const [joined, setJoined] = useState(0);
  useEffect(() => {
    if (joined >= MOCK_PLAYERS.length) return;
    const id = window.setTimeout(() => setJoined((n) => n + 1), JOIN_EVERY_MS);
    return () => window.clearTimeout(id);
  }, [joined]);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus(), []);
  const joinUrl = `${window.location.host}/play`;

  return (
    <main className={styles.lobby} style={stageCssVars(layout) as CSSProperties} data-orientation={layout.orientation}>
      <header className={styles.lobbyTop}>
        <FueledWordmark height={`calc(${tokens.size.tapTarget * 0.6}px * var(--stage))`} />
        <span className="t-label">{pack.name}</span>
      </header>

      <section className={styles.lobbyMain}>
        <div className={styles.joinBlock}>
          <h1 ref={heading} tabIndex={-1} className={`t-label ${styles.joinAt}`}>
            {C.joinAt} <span className={styles.url}>{joinUrl}</span>
          </h1>
          <CodeChip code={MOCK_ROOM_CODE} size="host" />
          <p className={`t-body ${styles.prompt}`}>{pack.prompt}</p>
        </div>
        <figure className={styles.qrBlock}>
          <FakeQr seed={MOCK_ROOM_CODE} />
          <figcaption className={styles.hint}>{C.qrPending}</figcaption>
        </figure>
      </section>

      <section className={styles.roster} aria-live="polite" aria-label={`${joined} ${C.joined}`}>
        <p className={`t-label ${styles.rosterCount}`}>
          {joined} {C.joined} · {entries} {C.entriesReady}
        </p>
        <ul className={styles.rosterList}>
          {MOCK_PLAYERS.slice(0, joined).map((p) => (
            <li key={p.id} className={styles.rosterItem}>
              <PlayerChip player={p} />
            </li>
          ))}
          {joined < MOCK_PLAYERS.length && <li className={`t-label ${styles.waiting}`}>{C.waitingFor}</li>}
        </ul>
      </section>

      <nav className={styles.lobbyControls} aria-label={UI_COPY.hostControls}>
        <BuiltBy height={`max(${tokens.size.builtbyPage * 0.7}px, calc(${tokens.size.builtbyHost}px * var(--stage)))`} />
        <span className={styles.lobbyButtons}>
          <Button size="host" variant="secondary" onClick={onBack}>
            {C.back}
          </Button>
          <Button size="host" onClick={() => window.location.assign(`/deck${window.location.search.includes('demo') ? '?demo=1' : ''}`)}>
            {C.start}
          </Button>
        </span>
      </nav>
    </main>
  );
}

/** Decorative stand-in until the real QR (Phase 2 dependency). Clearly captioned as a placeholder. */
function FakeQr({ seed }: { seed: string }) {
  const cells = useMemo(() => {
    const rand = seeded([...seed].reduce((h, c) => h * 31 + c.charCodeAt(0), 7));
    const n = 21;
    /** The three corner finder squares: ring + core, like a real QR. */
    const finder = (x: number, y: number): boolean | null => {
      const fx = x < 7 ? x : x >= n - 7 ? x - (n - 7) : -1;
      const fy = y < 7 ? y : y >= n - 7 ? y - (n - 7) : -1;
      if (fx < 0 || fy < 0 || (x >= n - 7 && y >= n - 7)) return null;
      const ring = fx === 0 || fy === 0 || fx === 6 || fy === 6;
      const core = fx >= 2 && fx <= 4 && fy >= 2 && fy <= 4;
      return ring || core;
    };
    return Array.from({ length: n * n }, (_, i) => {
      const f = finder(i % n, Math.floor(i / n));
      if (f !== null) return f;
      return rand() < 0.48;
    });
  }, [seed]);
  return (
    <span className={`chamfer ${styles.qr}`} aria-hidden="true">
      {cells.map((on, i) => (
        <span key={i} className={on ? styles.qrOn : undefined} />
      ))}
    </span>
  );
}
