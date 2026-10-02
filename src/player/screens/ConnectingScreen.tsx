import { Button } from '../../ui/components/Button';
import { CodeChip } from '../../ui/components/CodeChip';
import { UI_COPY } from '../../ui/copy';
import { Centered, Heading, Pulse } from '../components/Layout';

const P = UI_COPY.play;

/** Looking for the room (or it isn't there). Always offers a way back to the code. */
export function ConnectingScreen({ room, notFound, onChangeCode }: { room: string; notFound?: boolean; onChangeCode: () => void }) {
  return (
    <Centered>
      {!notFound && <Pulse />}
      <Heading>{notFound ? P.notFound : P.connecting}</Heading>
      <CodeChip code={room} />
      <Button variant="secondary" onClick={onChangeCode}>
        {P.changeCode}
      </Button>
    </Centered>
  );
}
