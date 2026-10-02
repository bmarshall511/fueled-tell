import { useEffect, useState } from 'react';
import { packById } from '../packs';
import { useDocumentTitle } from '../ui/hooks/useDocumentTitle';
import { useScreenTransition } from '../ui/hooks/useScreenTransition';
import { PlayerShell } from './components/PlayerShell';
import { kindOf, screenFor, type ScreenKind } from './screenFor';
import { CodeScreen } from './screens/CodeScreen';
import { ConnectingScreen } from './screens/ConnectingScreen';
import { FinalScreen } from './screens/FinalScreen';
import { JoinScreen } from './screens/JoinScreen';
import { LobbyScreen } from './screens/LobbyScreen';
import { PickScreen } from './screens/PickScreen';
import { ResultScreen } from './screens/ResultScreen';
import { WaitingScreen } from './screens/WaitingScreen';
import { YoursScreen } from './screens/YoursScreen';
import { usePlayerGame } from './usePlayerGame';

/** /play: the player app. Phones first, but a proper two-column layout on desktop. Never loads Three.js. */
/** Screens that get the full glow; the rest keep it calm so the entry and names read cleanly. */
const VIVID: readonly ScreenKind[] = ['code', 'join', 'final'];

export default function PlayerApp() {
  const game = usePlayerGame();
  const { view, identity } = game;
  const [changing, setChanging] = useState(false);
  const itemId = view?.item?.id;
  useEffect(() => setChanging(false), [itemId]);
  useDocumentTitle(identity.room ?? undefined);

  const target = screenFor({ room: identity.room, status: game.status, view, joined: game.joined, changing });
  // The transition only delays the swap: render whichever screen is currently showing.
  const shownKey = useScreenTransition(target.key);
  const kind = kindOf(shownKey);
  const pack = packById(view?.packId ?? '');

  const renderScreen = () => {
    if (kind === 'code') return <CodeScreen onSubmit={game.setRoom} />;
    if (!view || kind === 'connecting' || kind === 'notFound')
      return <ConnectingScreen room={identity.room ?? ''} notFound={kind === 'notFound'} onChangeCode={game.leaveRoom} />;
    const props = { view, game, pack };
    switch (kind) {
      case 'join':
        return <JoinScreen {...props} />;
      case 'lobby':
        return <LobbyScreen {...props} />;
      case 'pick':
        return <PickScreen {...props} onLocked={() => setChanging(false)} />;
      case 'waiting':
        return <WaitingScreen {...props} onChange={() => setChanging(true)} />;
      case 'yours':
        return <YoursScreen {...props} />;
      case 'result':
        return <ResultScreen {...props} />;
      case 'final':
        return <FinalScreen {...props} />;
    }
  };

  return (
    <PlayerShell
      screenKey={shownKey}
      me={view?.players.find((p) => p.id === view.me)}
      room={identity.room}
      reconnecting={game.status === 'reconnecting' && !!view}
      backdrop={VIVID.includes(kind) ? 'vivid' : 'calm'}
    >
      {renderScreen()}
    </PlayerShell>
  );
}
