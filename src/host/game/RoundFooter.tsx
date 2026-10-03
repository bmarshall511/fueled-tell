import { expectedGuessers } from '../../engine/game';
import { revealMoments } from '../../engine/moments';
import type { RevealSummary } from '../../engine/scoring';
import type { GameState, GameCopy, Player, PlayerId } from '../../engine/types';
import { UI_COPY } from '../../ui/copy';
import { GuessTicker } from './GuessTicker';
import { HostTally } from './HostTally';
import { playersById, RevealPanel } from './RevealPanel';
import styles from './RoundFooter.module.css';

interface RoundFooterProps {
  state: GameState;
  copy: GameCopy;
  /** Drumroll number while counting down, else null. */
  drumroll: number | null;
  revealed: { owner: Player; summary: RevealSummary } | null;
  /** The scene already shows the owner's name, so the panel shouldn't repeat it. */
  sceneShowsOwner: boolean;
  onToggleTally: (id: PlayerId) => void;
}

/** Bottom of the shared screen: the question and guess count, the drumroll, or the reveal. */
export function RoundFooter({ state, copy, drumroll, revealed, sceneShowsOwner, onToggleTally }: RoundFooterProps) {
  const hostOnly = state.settings.hostOnly;

  if (drumroll !== null) {
    return (
      <p className={`t-display ${styles.drumroll}`} aria-hidden="true">
        <span className="t-label">{UI_COPY.drumroll}</span> {drumroll}
      </p>
    );
  }

  if (revealed) {
    const { owner, summary } = revealed;
    const moments = revealMoments(state);
    return (
      <RevealPanel
        lightningIds={moments?.lightning ?? []}
        leadIn={copy.reveal}
        owner={owner}
        ratioCorrect={summary.ratioCorrect}
        correctPlayers={playersById(state.players, summary.correctPlayerIds)}
        showName={!sceneShowsOwner}
        guessedLabel={UI_COPY.guessedRight}
        nobodyLabel={UI_COPY.nobody}
      >
        {hostOnly ? (
          <HostTally
            players={state.players.filter((p) => p.id !== owner.id)}
            correctIds={summary.correctPlayerIds}
            onToggle={onToggleTally}
          />
        ) : undefined}
      </RevealPanel>
    );
  }

  return (
    <>
      <p className={`t-title text-glow ${styles.question}`}>{copy.question}</p>
      {hostOnly ? (
        <p className={`t-title ${styles.shout}`}>{UI_COPY.game.shout}</p>
      ) : (
        <GuessTicker
          received={state.guesses.length}
          expected={Math.max(expectedGuessers(state).length, state.guesses.length)}
          label={UI_COPY.guesses}
        />
      )}
    </>
  );
}
