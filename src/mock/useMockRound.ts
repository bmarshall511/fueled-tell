import { useCallback, useEffect, useMemo, useReducer } from 'react';
import { createRound, currentEntryId, roundReducer, type RoundAction } from '../engine/round';
import type { Entry, GamePhase, Guess, RoundState } from '../engine/types';
import { computeStandings } from '../engine/scoring';
import { MOCK_ENTRIES, MOCK_ME_ID, MOCK_PACK, MOCK_PLAYERS } from './data';
import { isDemo, useDemoChannel } from './demoSync';
import { seeded, shuffle } from './random';

/** Mock pacing (behavior, not design). `?timer=20` overrides the pack timer. */
const MOCK = {
  showingMs: 3500,
  autoLockDelayMs: 900,
  /** Simulated guesses land between these fractions of the timer. */
  guessWindow: [0.06, 0.5] as const,
  correctChance: 0.45,
};

function timerMs(): number {
  const override = Number(new URLSearchParams(window.location.search).get('timer'));
  return (override > 0 ? override : MOCK_PACK.timerSec) * 1000;
}

/** Deterministic simulated guesses for an entry: who guesses whom, and when (ms into guessing). */
function simulateGuesses(entry: Entry, index: number, durationMs: number): { guess: Guess; at: number }[] {
  const rand = seeded(index + 11);
  const [from, to] = MOCK.guessWindow;
  // In the /demo walkthrough the phone mockup guesses for MOCK_ME_ID itself.
  const simulated = MOCK_PLAYERS.filter((p) => p.id !== entry.ownerId && !(isDemo() && p.id === MOCK_ME_ID));
  return simulated.map((p) => {
    const correct = rand() < MOCK.correctChance;
    const decoys = MOCK_PLAYERS.filter((d) => d.id !== p.id && d.id !== entry.ownerId);
    const ownerId = correct ? entry.ownerId : (decoys[Math.floor(rand() * decoys.length)]?.id ?? entry.ownerId);
    return { guess: { playerId: p.id, entryId: entry.id, ownerId }, at: durationMs * (from + rand() * (to - from)) };
  });
}

/** Plays one entry from showing through reveal with every simulated guess. */
function playThrough(reducer: (s: RoundState, a: RoundAction) => RoundState, state: RoundState, durationMs: number): RoundState {
  const entry = MOCK_ENTRIES.find((e) => e.id === currentEntryId(state)) as Entry;
  let s = reducer(state, { type: 'beginGuessing', now: Date.now(), durationMs });
  simulateGuesses(entry, s.index, durationMs).forEach(({ guess }) => (s = reducer(s, { type: 'guess', guess })));
  return reducer(reducer(s, { type: 'lock' }), { type: 'reveal' });
}

/** `?at=guessing|locked|reveal|finale&item=3` deep-links into a phase (for reviews and screenshots). */
function initialState(reducer: (s: RoundState, a: RoundAction) => RoundState, durationMs: number): RoundState {
  const params = new URLSearchParams(window.location.search);
  let state = createRound(shuffle(MOCK_ENTRIES.map((e) => e.id), seeded(7)));
  state = { ...state, index: Math.max(0, Math.min(state.order.length - 1, Number(params.get('item') ?? 1) - 1)) };
  const at = params.get('at') as GamePhase | null;
  if (!at || at === 'showing') return state;
  if (at === 'finale') {
    state = { ...state, index: 0 };
    while (state.phase !== 'finale') state = reducer(playThrough(reducer, state, durationMs), { type: 'next' });
    return state;
  }
  const entry = MOCK_ENTRIES.find((e) => e.id === currentEntryId(state)) as Entry;
  state = reducer(state, { type: 'beginGuessing', now: Date.now(), durationMs });
  if (at === 'guessing') return state;
  simulateGuesses(entry, state.index, durationMs).forEach(({ guess }) => (state = reducer(state, { type: 'guess', guess })));
  state = reducer(state, { type: 'lock' });
  return at === 'reveal' ? reducer(state, { type: 'reveal' }) : state;
}

/** Drives the pure round reducer with timers and simulated players guessing. */
export function useMockRound() {
  const reducer = useMemo(() => roundReducer(MOCK_ENTRIES), []);
  const durationMs = useMemo(timerMs, []);
  const [state, dispatch] = useReducer(reducer, undefined, () => initialState(reducer, durationMs));
  const entry = MOCK_ENTRIES.find((e) => e.id === currentEntryId(state)) as Entry;
  const expectedGuesses = MOCK_PLAYERS.length - 1; // the owner can't guess

  // showing -> guessing after the entrance moment
  useEffect(() => {
    if (state.phase !== 'showing') return;
    const id = window.setTimeout(
      () => dispatch({ type: 'beginGuessing', now: Date.now(), durationMs }),
      MOCK.showingMs,
    );
    return () => window.clearTimeout(id);
  }, [state.phase, state.index, durationMs]);

  // guessing: simulated guesses trickle in, timer locks at the deadline
  useEffect(() => {
    if (state.phase !== 'guessing') return;
    const timeouts = simulateGuesses(entry, state.index, durationMs).map(({ guess, at }) =>
      window.setTimeout(() => dispatch({ type: 'guess', guess }), at),
    );
    timeouts.push(window.setTimeout(() => dispatch({ type: 'lock' }), durationMs));
    return () => timeouts.forEach((id) => window.clearTimeout(id));
  }, [state.phase, state.index, entry, durationMs]);

  // everyone's in: lock early
  const allIn = state.phase === 'guessing' && state.guesses.length >= expectedGuesses;
  useEffect(() => {
    if (!allIn) return;
    const id = window.setTimeout(() => dispatch({ type: 'lock' }), MOCK.autoLockDelayMs);
    return () => window.clearTimeout(id);
  }, [allIn]);

  /** One key for the whole loop (Space): whatever the next step is. */
  const advance = useCallback(() => {
    switch (state.phase) {
      case 'showing':
        return dispatch({ type: 'beginGuessing', now: Date.now(), durationMs });
      case 'guessing':
        return dispatch({ type: 'lock' });
      case 'locked':
        return dispatch({ type: 'reveal' });
      case 'reveal':
        return dispatch({ type: 'next' });
      case 'finale':
        return undefined;
    }
  }, [state.phase, durationMs]);

  // Demo sync: tell the phone what's happening; accept its guess.
  const send = useDemoChannel((msg) => {
    if (msg.type === 'guess') {
      dispatch({ type: 'guess', guess: { playerId: MOCK_ME_ID, entryId: entry.id, ownerId: msg.ownerId } });
    }
    if (msg.type === 'hello') broadcast();
  });
  const broadcast = () => {
    const mine = entry.ownerId === MOCK_ME_ID;
    const myGuess = state.guesses.find((g) => g.playerId === MOCK_ME_ID);
    send({
      type: 'state',
      phase: state.phase,
      index: state.index,
      total: state.order.length,
      text: entry.text,
      mine,
      result: state.phase === 'reveal' ? { ownerId: entry.ownerId, correct: myGuess ? myGuess.ownerId === entry.ownerId : null } : null,
      standings:
        state.phase === 'finale'
          ? computeStandings(MOCK_ENTRIES, state.history, MOCK_PLAYERS.map((p) => p.id), MOCK_PACK.points)
          : null,
    });
  };
  // Re-broadcast on every state change (the whole redacted snapshot, like the real protocol).
  useEffect(broadcast, [state, entry]);

  const reveal = useCallback(() => dispatch({ type: 'reveal' }), []);
  const lock = useCallback(() => dispatch({ type: 'lock' }), []);

  return { state, entry, durationMs, expectedGuesses, advance, lock, reveal };
}
