import { useCallback, useEffect, useRef, useState } from 'react';
import { tokens } from '../../tokens/tokens';

/** How long to wait for the host before giving up and letting the player try again. */
const GIVE_UP_MS = tokens.duration.slow * 15;

/**
 * Tracks an action the host has to confirm (join, lock in a guess, send an entry):
 * `start()` when sent; `busy` until `acked` turns true (or the wait gives up);
 * then `done` briefly, for the button's check.
 */
export function useAck(acked: boolean) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const giveUp = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!busy || !acked) return;
    clearTimeout(giveUp.current);
    setBusy(false);
    setDone(true);
    const t = setTimeout(() => setDone(false), tokens.duration.reveal);
    return () => clearTimeout(t);
  }, [busy, acked]);
  useEffect(() => () => clearTimeout(giveUp.current), []);

  const start = () => {
    setDone(false);
    setBusy(true);
    clearTimeout(giveUp.current);
    giveUp.current = setTimeout(() => setBusy(false), GIVE_UP_MS);
  };
  const cancel = useCallback(() => setBusy(false), []);
  return { busy, done, start, cancel };
}
