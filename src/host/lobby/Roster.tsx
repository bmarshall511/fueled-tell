import type { GameState, Player } from '../../engine/types';
import { UI_COPY } from '../../ui/copy';
import { playerColorVar } from '../../ui/lib/playerColor';
import styles from './Roster.module.css';

const L = UI_COPY.lobby;

interface RosterProps {
  state: GameState;
  summary: string;
  onRemove: (player: Player) => void;
}

/** Everyone in the game, with join / entry status, and a remove control on each chip. */
export function Roster({ state, summary, onRemove }: RosterProps) {
  const hostOnly = state.settings.hostOnly;
  const live = state.settings.intake === 'live';
  const nobodyYet = !hostOnly && !state.players.some((p) => p.claimed && p.connected);
  return (
    <section className={styles.roster} aria-label={summary}>
      <p className={`t-label ${styles.count}`} aria-live="polite">
        {summary}
      </p>
      <ul className={styles.list}>
        {state.players.map((p) => (
          <li key={p.id} className={styles.item}>
            <RosterChip
              player={p}
              away={!hostOnly && !(p.claimed && p.connected)}
              status={!hostOnly && !p.claimed ? L.notJoined : undefined}
              entry={live && !hostOnly ? state.entries.some((e) => e.ownerId === p.id) : undefined}
              onRemove={() => onRemove(p)}
            />
          </li>
        ))}
        {nobodyYet && <li className={`t-label ${styles.waiting}`}>{L.waitingFor}</li>}
      </ul>
    </section>
  );
}

interface RosterChipProps {
  player: Player;
  /** Not connected right now (dimmed). */
  away: boolean;
  status?: string;
  /** Live intake: whether their entry is in. */
  entry?: boolean;
  onRemove: () => void;
}

/** A player's name chip; the remove control is a divided segment at its end. */
function RosterChip({ player, away, status, entry, onRemove }: RosterChipProps) {
  return (
    <span className={`chamfer ${styles.chip} ${away ? styles.away : ''}`}>
      <span className={styles.dot} style={{ background: playerColorVar(player.colorIndex) }} aria-hidden="true" />
      {/* Name and status tags wrap as a group, so the chip always fits the screen. */}
      <span className={styles.text}>
        <span className={styles.name}>{player.name}</span>
        {status && <span className={styles.tag}>{status}</span>}
        {entry !== undefined && <span className={`${styles.tag} ${entry ? styles.tagOn : ''}`}>{entry ? L.submitted : L.noEntry}</span>}
      </span>
      <button
        type="button"
        className={styles.remove}
        aria-label={`${L.remove} ${player.name}`}
        title={`${L.remove} ${player.name}`}
        onClick={onRemove}
      >
        <span aria-hidden="true">×</span>
      </button>
    </span>
  );
}
