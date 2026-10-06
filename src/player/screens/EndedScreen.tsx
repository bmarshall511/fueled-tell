import { Button } from '../../ui/components/Button';
import { UI_COPY } from '../../ui/copy';
import { Centered, Heading } from '../components/Layout';

const P = UI_COPY.play;

/** The host ended the game: say so (instead of trying to reconnect), with a way to join another. */
export function EndedScreen({ onDone }: { onDone: () => void }) {
  return (
    <Centered>
      <Heading>{P.ended}</Heading>
      <p className="text-body text-muted">{P.endedBody}</p>
      <Button variant="secondary" onClick={onDone}>
        {P.joinAnother}
      </Button>
    </Centered>
  );
}
