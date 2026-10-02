import { Button } from '../../ui/components/Button';
import { Notice } from '../../ui/components/Notice';
import { UI_COPY } from '../../ui/copy';
import type { HostGame } from '../state/useHostGame';

const L = UI_COPY.lobby;

/** Shown when the room couldn't open: the reason, and the ways out. */
export function RoomProblem({ host }: { host: HostGame }) {
  const taken = host.linkError === 'taken';
  return (
    <Notice role="alert" size="stage">
      <span>{taken ? L.takenError : L.networkError}</span>
      {taken ? (
        <Button variant="outline" onClick={host.newRoomCode}>
          {L.newCode}
        </Button>
      ) : (
        <Button variant="outline" onClick={() => window.location.reload()}>
          {L.retry}
        </Button>
      )}
      <Button variant="outline" onClick={() => host.dispatch({ type: 'updateSettings', settings: { hostOnly: true } })}>
        {L.useHostOnly}
      </Button>
    </Notice>
  );
}
