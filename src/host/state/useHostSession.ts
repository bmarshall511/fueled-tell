import { useCallback, useEffect, useRef, useState } from 'react';
import { createGame, gameReducer, markAllDisconnected, type GameAction, type RosterRow } from '../../engine/game';
import { makeId } from '../../engine/random';
import { isRoomCode, makeRoomCode } from '../../engine/roomCode';
import type { Settings } from '../../engine/types';
import { GAME } from '../../content';
import { loadSession, saveSession, type HostSession } from './storage';

/** `?room=K7QF` forces a room code (local demos and tests). */
const forcedRoom = () => {
  const code = new URLSearchParams(window.location.search).get('room')?.toUpperCase();
  return code && isRoomCode(code) ? code : null;
};

/**
 * The host's saved game: state + room code, persisted to localStorage so a
 * refresh resumes. All game changes go through `dispatch` (the pure reducer).
 */
export function useHostSession() {
  // After a reload nobody is connected until their phone reconnects (or they'd block auto-lock forever).
  const [session, setSession] = useState<HostSession | null>(() => {
    const s = loadSession();
    return s ? { ...s, state: markAllDisconnected(s.state) } : null;
  });

  // A tab that found its room already hosted elsewhere must not overwrite that game's saved session.
  const savingBlocked = useRef(false);
  useEffect(() => {
    if (!savingBlocked.current) saveSession(session);
  }, [session]);

  const dispatch = useCallback((action: GameAction) => {
    setSession((s) => (s ? { ...s, state: gameReducer(s.state, action) } : s));
  }, []);

  /** Setup -> lobby. */
  const create = useCallback((rows: RosterRow[], settings: Partial<Settings>) => {
    const game = gameReducer(createGame(GAME, settings), { type: 'setRoster', rows, ids: rows.map(() => makeId('p')) });
    setSession({ version: 1, roomCode: forcedRoom() ?? makeRoomCode(), state: game });
  }, []);

  const end = useCallback(() => setSession(null), []);
  const replace = useCallback((s: HostSession) => setSession(s), []);

  /** The room is hosted elsewhere: stop saving until this tab takes a code of its own. */
  const blockSaving = useCallback(() => {
    savingBlocked.current = true;
  }, []);

  /** Pick a fresh room code (and own this game from here on). */
  const newRoomCode = useCallback(() => {
    savingBlocked.current = false;
    setSession((s) => (s ? { ...s, roomCode: makeRoomCode() } : s));
  }, []);

  return { session, dispatch, create, end, replace, blockSaving, newRoomCode };
}
