import { useCallback, useRef } from 'react';
import { nextStep } from '../../engine/game';
import { useBots } from './useBots';
import { useHostRoom } from './useHostRoom';
import { useHostSession } from './useHostSession';
import { useRoundTimers } from './useRoundTimers';

/**
 * The host's browser is the server. This composes the saved session, the network
 * room, the round timers and (in demos) the bots into one handle for the UI.
 */
export function useHostGame() {
  const session = useHostSession();
  const state = session.session?.state ?? null;
  const roomCode = session.session?.roomCode ?? null;
  const room = useHostRoom(state, roomCode, session.dispatch, session.blockSaving);
  useRoundTimers(state, session.dispatch);
  useBots(state, session.dispatch);

  // Space / the main button: whatever the next step is.
  const stateRef = useRef(state);
  stateRef.current = state;
  const advance = useCallback(() => {
    const action = stateRef.current && nextStep(stateRef.current, Date.now());
    if (action) session.dispatch(action);
  }, [session.dispatch]);

  // Ending tells the phones first, so they can say the game is over instead of trying to reconnect.
  const end = useCallback(() => {
    room.announceEnd();
    session.end();
  }, [room, session]);

  return {
    session: session.session,
    state,
    roomCode,
    link: room.link,
    linkError: room.linkError,
    dispatch: session.dispatch,
    create: session.create,
    end,
    replace: session.replace,
    newRoomCode: session.newRoomCode,
    advance,
  };
}

export type HostGame = ReturnType<typeof useHostGame>;
