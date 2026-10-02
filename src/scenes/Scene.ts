import type { ComponentType } from 'react';
import type { GameCopy, Player, PlayerId, RoundPhase } from '../engine/types';

/** The active entry as the host screen may show it: no owner before reveal. */
export interface SceneItem {
  id: string;
  text: string;
  index: number;
  total: number;
}

/** A guess as the scene sees it. `ownerId` is only present once revealed. */
export interface SceneGuess {
  playerId: PlayerId;
  ownerId?: PlayerId;
}

export interface SceneReveal {
  ownerId: PlayerId;
  correctPlayerIds: PlayerId[];
  ratioCorrect: number;
}

/**
 * The one interface every scene implements. Scenes are presentational: they get
 * a redacted snapshot and render it; they never drive the round.
 */
export interface SceneProps {
  phase: RoundPhase;
  item: SceneItem;
  players: readonly Player[];
  guesses: readonly SceneGuess[];
  reveal: SceneReveal | null;
  copy: GameCopy;
  reducedMotion: boolean;
}

export interface SceneModule {
  default: ComponentType<SceneProps>;
  /** True if the scene draws the owner's name itself, so the HUD can skip it. */
  rendersOwnerName?: boolean;
}
