import { useEffect, useState } from 'react';
import { CONNECT_TIMEOUT_MS } from '../../transport/protocol';
import { Button } from '../../ui/components/Button';
import { CodeChip } from '../../ui/components/CodeChip';
import { UI_COPY } from '../../ui/copy';
import { Centered, Heading, Pulse } from '../components/Layout';

const P = UI_COPY.play;

/** Looking for the room (or it isn't there). Always offers a way back to the code. */
export function ConnectingScreen({ room, notFound, onChangeCode }: { room: string; notFound?: boolean; onChangeCode: () => void }) {
  // The broker can be slow, so a wrong or finished code can't be told apart right away: after a moment, say what to check.
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setSlow(true), CONNECT_TIMEOUT_MS);
    return () => window.clearTimeout(id);
  }, [room]);
  return (
    <Centered>
      {!notFound && <Pulse />}
      <Heading>{notFound ? P.notFound : P.connecting}</Heading>
      {notFound ? (
        <p className="text-body text-muted">{P.notFoundHint}</p>
      ) : (
        slow && (
          <p className="text-body text-muted" role="status">
            {P.slow}
          </p>
        )
      )}
      <CodeChip code={room} />
      <Button variant="secondary" onClick={onChangeCode}>
        {P.changeCode}
      </Button>
    </Centered>
  );
}
