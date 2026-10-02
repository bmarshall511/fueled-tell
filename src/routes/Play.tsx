import { useState } from 'react';
import type { PlayerId } from '../engine/types';
import { MOCK_ENTRIES, MOCK_PACK, MOCK_PLAYERS, MOCK_ROOM_CODE } from '../mock/data';
import { Button } from '../ui/Button';
import { CodeChip } from '../ui/CodeChip';
import { UI_COPY } from '../ui/copy';
import { BuiltBy, FueledWordmark } from '../ui/Logo';
import { NameGrid } from '../ui/NameGrid';
import { PlayerChip } from '../ui/PlayerChip';
import styles from './Play.module.css';

type Screen = 'join' | 'pick' | 'waiting' | 'yours';
const SCREENS: Screen[] = ['join', 'pick', 'waiting', 'yours'];

/** The mock phone player. */
const ME = MOCK_PLAYERS[4] ?? MOCK_PLAYERS[0]!;
const ROUND = { index: 2, total: MOCK_ENTRIES.length };

/** Phone mockup. Deliberately free of Three.js: imports only ui/, engine types and mock data. */
export default function Play() {
  const [screen, setScreen] = useState<Screen>(() => {
    const s = new URLSearchParams(window.location.search).get('screen') as Screen | null;
    return s && SCREENS.includes(s) ? s : 'join';
  });
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [pick, setPick] = useState<PlayerId | null>(() => (screen === 'join' ? null : (MOCK_PLAYERS[1]?.id ?? null)));
  const picked = MOCK_PLAYERS.find((p) => p.id === pick);
  const others = MOCK_PLAYERS.filter((p) => p.id !== ME.id);

  return (
    <div className={styles.page}>
      <nav className={styles.mockNav} aria-label="Mockup states">
        <span>Mockup state:</span>
        {SCREENS.map((s) => (
          <button key={s} type="button" aria-pressed={s === screen} onClick={() => setScreen(s)}>
            {s}
          </button>
        ))}
      </nav>

      <main className={`chamfer ${styles.phone}`}>
        <header className={styles.top}>
          <FueledWordmark height="20px" />
          {screen !== 'join' && <span className={styles.meta}>{ME.name}</span>}
        </header>

        {screen === 'join' && (
          <form
            className={styles.stack}
            onSubmit={(e) => {
              e.preventDefault();
              setScreen('pick');
            }}
          >
            <h1 className={styles.display}>{MOCK_PACK.name}</h1>
            <label className={styles.field}>
              <span className={styles.label}>{UI_COPY.roomCode}</span>
              <input
                className={`chamfer ${styles.input} ${styles.code}`}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 4))}
                placeholder={MOCK_ROOM_CODE}
                autoCapitalize="characters"
                autoComplete="off"
                inputMode="text"
              />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>{UI_COPY.yourName}</span>
              <input
                className={`chamfer ${styles.input}`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={ME.name}
                autoComplete="given-name"
              />
            </label>
            <Button type="submit" className={styles.cta}>
              {UI_COPY.join}
            </Button>
          </form>
        )}

        {screen === 'pick' && (
          <section className={styles.stack}>
            <p className={styles.label}>
              {MOCK_PACK.copy.item} {ROUND.index + 1} {UI_COPY.of} {ROUND.total}
            </p>
            <h1 className={styles.title}>{MOCK_PACK.copy.question}</h1>
            <NameGrid players={others} selectedId={pick} onSelect={setPick} />
            <Button className={styles.cta} disabled={!pick} onClick={() => setScreen('waiting')}>
              {UI_COPY.lockGuess}
            </Button>
          </section>
        )}

        {screen === 'waiting' && (
          <section className={`${styles.stack} ${styles.center}`}>
            <span className={`chamfer-all ${styles.pulse}`} aria-hidden="true" />
            <h1 className={styles.title}>{MOCK_PACK.copy.waiting}</h1>
            {picked && <PlayerChip player={picked} size="phone" />}
          </section>
        )}

        {screen === 'yours' && (
          <section className={`${styles.stack} ${styles.center} ${styles.yours}`}>
            <p className={styles.label}>
              {MOCK_PACK.copy.item} {ROUND.index + 1} {UI_COPY.of} {ROUND.total}
            </p>
            <h1 className={styles.display}>{MOCK_PACK.copy.yours}</h1>
          </section>
        )}

        <footer className={styles.footer}>
          {screen !== 'join' ? <CodeChip code={MOCK_ROOM_CODE} /> : <span />}
          <BuiltBy height="12px" />
        </footer>
      </main>
    </div>
  );
}
