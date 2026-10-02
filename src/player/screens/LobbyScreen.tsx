import { useId, useState } from 'react';
import { useAck } from '../../ui/hooks/useAck';
import type { PlayerView } from '../../engine/redact';
import { PlayerChip } from '../../ui/components/PlayerChip';
import { TextArea } from '../../ui/components/TextField';
import { GAME } from '../../content';
import { UI_COPY } from '../../ui/copy';
import { Form, Heading, PrimaryAction, Split } from '../components/Layout';
import { haptics } from '../haptics';
import type { ScreenProps } from './types';
import styles from './LobbyScreen.module.css';

const P = UI_COPY.play;

/** Seated, waiting for the host. In live intake, write your entry here. */
export function LobbyScreen({ view, game }: ScreenProps) {
  return (
    <Split actionsFirst aside={<WhoIsHere view={view} />}>
      <Heading>{P.youreIn}</Heading>
      <p className="text-body text-muted">{P.lobbyWait}</p>
      {view.settings.intake === 'live' && (
        <EntryForm view={view} onSubmit={game.submit} prompt={GAME.prompt} placeholder={GAME.copy.item} />
      )}
    </Split>
  );
}

function WhoIsHere({ view }: { view: PlayerView }) {
  const here = view.players.filter((p) => p.claimed && p.connected);
  return (
    <section>
      <h2 className="text-subhead">
        {P.here} ({here.length})
      </h2>
      <ul className={styles.chips}>
        {here.map((p) => (
          <li key={p.id}>
            <PlayerChip player={p} size="phone" />
          </li>
        ))}
      </ul>
    </section>
  );
}

interface EntryFormProps {
  view: PlayerView;
  onSubmit: (text: string) => void;
  prompt: string;
  placeholder: string;
}

function EntryForm({ view, onSubmit, prompt, placeholder }: EntryFormProps) {
  const [text, setText] = useState(view.myEntry ?? '');
  const ids = { text: useId(), count: useId() };
  const max = view.settings.maxLength;
  const len = text.trim().length;
  const valid = len > 0 && len <= max;
  const sent = useAck(view.myEntry !== null && view.myEntry === text.trim());
  return (
    <Form
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        haptics.tap();
        sent.start();
        onSubmit(text);
      }}
    >
      <label htmlFor={ids.text} className="text-label">
        {P.yourEntry}: {prompt}
      </label>
      <TextArea
        id={ids.text}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        placeholder={placeholder}
        aria-describedby={ids.count}
      />
      <span id={ids.count} className={`text-hint ${len > max ? 'text-error' : ''}`}>
        {len}/{max}
      </span>
      {view.myEntry && <p className="text-body text-ok">{P.sent}</p>}
      <PrimaryAction type="submit" busy={sent.busy} done={sent.done} disabled={!sent.done && (!valid || text.trim() === view.myEntry)}>
        {view.myEntry ? P.update : P.submit}
      </PrimaryAction>
    </Form>
  );
}
