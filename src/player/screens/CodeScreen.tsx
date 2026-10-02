import { useId, useState } from 'react';
import { normalizeRoomCode, ROOM_CODE_LENGTH } from '../../engine/roomCode';
import { TextInput } from '../../ui/components/TextField';
import { UI_COPY } from '../../ui/copy';
import { Form, Heading, Hero, PrimaryAction, Split } from '../components/Layout';
import styles from './CodeScreen.module.css';

const P = UI_COPY.play;

/** No room yet: type the code from the shared screen. */
export function CodeScreen({ onSubmit }: { onSubmit: (code: string) => void }) {
  const [code, setCode] = useState('');
  const ids = { code: useId(), hint: useId() };
  const complete = code.length === ROOM_CODE_LENGTH;
  return (
    <Split centered aside={<Hero />}>
      <Form
        onSubmit={(e) => {
          e.preventDefault();
          if (complete) onSubmit(code);
        }}
      >
        <Heading>{P.enterCode}</Heading>
        <label htmlFor={ids.code} className="visually-hidden">
          {UI_COPY.landing.join}
        </label>
        <TextInput
          id={ids.code}
          fieldSize="code"
          className={styles.code}
          value={code}
          onChange={(e) => setCode(normalizeRoomCode(e.target.value))}
          autoCapitalize="characters"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          inputMode="text"
          enterKeyHint="go"
          aria-describedby={ids.hint}
          autoFocus
        />
        <span id={ids.hint} className="text-hint">
          {P.codeHint}
        </span>
        <PrimaryAction type="submit" disabled={!complete}>
          {P.go}
        </PrimaryAction>
        <a className={styles.hostLink} href="/host">
          {P.hostInstead}
        </a>
      </Form>
    </Split>
  );
}
