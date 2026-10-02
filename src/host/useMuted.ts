import { useCallback, useState } from 'react';
import { isMuted, setMuted } from './sound';

/** The host's sound on/off state (persisted by the sound module) and a toggle. */
export function useMuted(): [boolean, () => void] {
  const [muted, setState] = useState(isMuted);
  const toggle = useCallback(() => {
    setMuted(!isMuted());
    setState(isMuted());
  }, []);
  return [muted, toggle];
}
