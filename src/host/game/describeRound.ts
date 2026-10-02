import type { RevealSummary } from '../../engine/scoring';
import type { Entry, GameState, GameCopy, Player } from '../../engine/types';
import { UI_COPY } from '../../ui/copy';

interface RoundContext {
  state: GameState;
  copy: GameCopy;
  progress: string;
  entry: Entry | undefined;
  /** Only once the drumroll has finished. */
  revealed: { owner: Player; summary: RevealSummary } | null;
}

/** What the screen-reader live region says at each step of a round. */
export function describeRound({ state, copy, progress, entry, revealed }: RoundContext): string {
  switch (state.phase) {
    case 'showing':
      return entry ? `${progress}. ${entry.text}` : '';
    case 'guessing':
      return state.settings.hostOnly ? `${copy.question} ${UI_COPY.game.shout}` : copy.question;
    case 'locked':
      return `${UI_COPY.lock}. ${state.guesses.length} ${UI_COPY.guesses}.`;
    case 'reveal':
      return revealed
        ? `${copy.reveal} ${revealed.owner.name}. ${Math.round(revealed.summary.ratioCorrect * 100)}% ${UI_COPY.guessedRight}.`
        : '';
    default:
      return '';
  }
}
