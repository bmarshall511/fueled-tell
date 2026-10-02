import type { PlayerView } from '../../engine/redact';
import { PlayerChip } from '../../ui/components/PlayerChip';
import { UI_COPY } from '../../ui/copy';
import { formatScore, ordinal } from '../../ui/lib/format';
import { Centered, Heading, Split } from '../components/Layout';
import type { ScreenProps } from './types';
import styles from './FinalScreen.module.css';

/** Game over: your place, the winner, and the full standings (or just thanks, unscored). */
export function FinalScreen({ view, pack }: Omit<ScreenProps, 'game'>) {
  const finale = pack.copy.finale;
  if (view.settings.scoring === 'none') {
    return (
      <Centered>
        <p className="text-label">{finale}</p>
        <Heading>{UI_COPY.thanks}</Heading>
      </Centered>
    );
  }
  const standings = view.standings ?? [];
  const mine = standings.find((s) => s.playerId === view.me);
  const winners = standings.filter((s) => s.place === 1).map((s) => nameOf(view, s.playerId));
  return (
    <Split actionsFirst aside={<Standings view={view} />}>
      <p className="text-label">{finale}</p>
      {mine && (
        <>
          <Heading>{`${UI_COPY.youPlaced} ${ordinal(mine.place)}`}</Heading>
          <p className="text-body text-muted">
            {formatScore(mine.score)} {UI_COPY.points} · {mine.correct} {UI_COPY.correctGuesses} · {mine.fooled} {UI_COPY.fooled}
          </p>
        </>
      )}
      {winners.length > 0 && (
        <div className={`chamfer ${styles.winner}`}>
          <span className={styles.winnerLabel}>{UI_COPY.winnerIs}</span>
          <span className={styles.winnerName}>{winners.join(' & ')}</span>
        </div>
      )}
    </Split>
  );
}

const nameOf = (view: PlayerView, id: string) => view.players.find((p) => p.id === id)?.name;

function Standings({ view }: { view: PlayerView }) {
  return (
    <section>
      <h2 className="text-subhead">{UI_COPY.standings}</h2>
      <ol className={styles.standings}>
        {(view.standings ?? []).map((s) => {
          const p = view.players.find((x) => x.id === s.playerId);
          if (!p) return null;
          return (
            <li key={s.playerId} className={`${styles.row} ${s.playerId === view.me ? styles.me : ''}`}>
              <span className={styles.place}>{ordinal(s.place)}</span>
              <PlayerChip player={p} size="phone" />
              <span className={styles.score}>
                {formatScore(s.score)} {UI_COPY.points}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
