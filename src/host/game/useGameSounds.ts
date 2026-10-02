import { useEffect, useRef } from 'react';
import type { GameState } from '../../engine/types';
import { tokens } from '../../tokens/tokens';
import { sound } from '../sound';

/** Sound cues driven by state changes, so keyboard, buttons and timers all sound the same. */
export function useGameSounds(s: GameState): void {
  const prev = useRef({ phase: s.phase, index: s.index, guesses: s.guesses.length });
  useEffect(() => {
    const p = prev.current;
    if (s.phase === 'showing' && (p.phase !== 'showing' || p.index !== s.index)) window.setTimeout(sound.deal, tokens.duration.base);
    if (s.phase === 'guessing' && s.guesses.length > p.guesses) sound.chip();
    if (s.phase === 'locked' && p.phase === 'guessing') sound.lock();
    if (s.phase === 'finale' && p.phase !== 'finale') sound.fanfare();
    prev.current = { phase: s.phase, index: s.index, guesses: s.guesses.length };
  }, [s.phase, s.index, s.guesses.length]);
}
