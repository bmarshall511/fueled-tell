import { useEffect, useMemo, useState } from 'react';
import { transitioned, withViewTransition } from '../ui/lib/viewTransition';
import { HostEggs } from './components/HostEggs';
import { GameScreen } from './game/GameScreen';
import { Lobby } from './lobby/Lobby';
import { Setup } from './setup/Setup';
import { useHostGame } from './state/useHostGame';
import { unlock } from './sound';

/**
 * /host: the device whose screen is shared. Setup (private) -> Lobby (shared)
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
    void import('../content/sample-entries.json').then((m) => create(m.default, { timerSec: 30 }));
  }, [state, create]);

  // Actions that move between setup, lobby and the game animate the whole screen (round steps don't).
  const screens = useMemo(
    () => ({
      ...host,
      create: transitioned(host.create),
      end: transitioned(host.end),
      advance: state?.phase === 'lobby' ? transitioned(host.advance) : host.advance,
      dispatch: (a: Parameters<typeof host.dispatch>[0]) => (a.type === 'restart' ? transitioned(host.dispatch)(a) : host.dispatch(a)),
    }),
    [host, state?.phase],
  );
  const edit = transitioned(() => setEditing(true));
  // Only editing an open lobby needs its own transition; a new game already animates via `create`.
  const doneEditing = () => editing && withViewTransition(() => setEditing(false));

  const screen =
    !state || editing ? (
      <Setup host={screens} onDone={doneEditing} />
    ) : state.phase === 'lobby' ? (
      <Lobby host={screens} onEdit={edit} />
    ) : (
      <GameScreen host={screens} />
    );
  return (
    <>
      {screen}
      <HostEggs phase={editing ? null : (state?.phase ?? null)} />
    </>
  );
}
