import { useEffect, useState } from 'react';
import { GameScreen } from '../host/GameScreen';
import { Lobby } from '../host/Lobby';
import { Setup } from '../host/Setup';
import { useHostGame } from '../host/useHostGame';
import { unlock } from '../ui/sound';

/**
 * /host: the laptop that shares its screen. Setup (private) -> Lobby (shared)
 * -> rounds -> finale. The session lives in localStorage, so a refresh resumes.
 */
export default function Host() {
  const host = useHostGame();
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    const onGesture = () => unlock();
    window.addEventListener('pointerdown', onGesture, { once: true });
    return () => window.removeEventListener('pointerdown', onGesture);
  }, []);

  // `?sample=1` (demo): skip setup with the sample entries.
  const { state, create } = host;
  useEffect(() => {
    if (state || !new URLSearchParams(window.location.search).has('sample')) return;
    void import('../packs/sample-entries.json').then((m) => create('true-story', m.default, { timerSec: 30 }));
  }, [state, create]);

  if (!state || editing) return <Setup host={host} onDone={() => setEditing(false)} />;
  if (state.phase === 'lobby') return <Lobby host={host} onEdit={() => setEditing(true)} />;
  return <GameScreen host={host} />;
}
