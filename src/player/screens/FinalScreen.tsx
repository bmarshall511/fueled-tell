import { enigma } from '../../engine/moments';
import type { PlayerView } from '../../engine/redact';
import type { Standing } from '../../engine/scoring';
import { PlayerChip } from '../../ui/components/PlayerChip';
import { gameCopy } from '../../content';
import { UI_COPY } from '../../ui/copy';
import { formatScore, listNames, ordinal, plural } from '../../ui/lib/format';
import { Heading, Split } from '../components/Layout';
import type { ScreenProps } from './types';
import styles from './FinalScreen.module.css';

/** Game over: your place, the winner, and the full standings. */
export function FinalScreen({ view }: Pick<ScreenProps, 'view'>) {
  const copy = gameCopy(view.settings);
  const finale = copy.finale;
  const standings = view.standings ?? [];
  const mine = standings.find((s) => s.playerId === view.me);
  const winners = standings.flatMap((s) => (s.place === 1 ? (nameOf(view, s.playerId) ?? []) : []));
  const enigmaIds = enigma(standings)?.playerIds ?? [];
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
      {mine && <Highlight mine={mine} isEnigma={enigmaIds.includes(view.me)} nouns={[copy.item, copy.items]} />}
      {winners.length > 0 && (
        <div className={styles.winner}>
          <span className={styles.winnerLabel}>{UI_COPY.winnerIs}</span>
          <span className={styles.winnerName}>{listNames(winners)}</span>
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
              <PlayerChip player={p} size="phone" truncate />
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

const H = UI_COPY.eggs.highlight;

/** Your one-line highlight of the game: the Enigma, people fooled, or correct guesses. */
function Highlight({ mine, isEnigma, nouns }: { mine: Standing; isEnigma: boolean; nouns: readonly [string, string] }) {
  const line = isEnigma
    ? `${H.enigma} ${plural(mine.fooled, UI_COPY.eggs.enigmaPeople)}.`
    : mine.fooled >= mine.correct && mine.fooled > 0
      ? `${H.fooled} ${plural(mine.fooled, UI_COPY.eggs.enigmaPeople)}.`
      : mine.correct > 0
        ? `${H.spotted} ${plural(mine.correct, [nouns[0].toLowerCase(), nouns[1].toLowerCase()])}.`
        : H.none;
  return <p className={styles.highlight}>{line}</p>;
}
