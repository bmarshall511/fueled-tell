import { useEffect, useId, useState } from 'react';
import { TextInput } from '../../ui/components/TextField';
import { UI_COPY } from '../../ui/copy';
import { Form, Heading, Hero, PrimaryAction, Split } from '../components/Layout';
import { useAck } from '../../ui/hooks/useAck';
import { haptics } from '../haptics';
import type { ScreenProps } from './types';
import styles from './JoinScreen.module.css';

const P = UI_COPY.play;

/** In the room, not seated: claim a name the host entered, or type a new one. */
export function JoinScreen({ view, game }: ScreenProps) {
  const [name, setName] = useState(game.identity.name);
  const ids = { name: useId(), err: useId(), claim: useId() };
  const unclaimed = view.players.filter((p) => !p.claimed);
  const err = game.error ? P.errors[game.error] : null;
  // Busy until the host seats us; an error (name taken) ends the wait instead.
  const seat = useAck(game.joined);
  const { cancel } = seat;
  useEffect(() => {
    if (err) cancel();
  }, [err, cancel]);
  return (
    <Split centered aside={<Hero />}>
      <Heading>{P.whoAreYou}</Heading>
      {unclaimed.length > 0 && (
        <section aria-labelledby={ids.claim}>
          <h2 id={ids.claim} className="text-subhead">
            {P.claimHint}
          </h2>
          <ul className={styles.claims}>
            {unclaimed.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  className={`spot ${styles.claim}`}
                  onClick={() => {
                    haptics.tap();
                    seat.start();
                    game.join(p.name, p.id);
                  }}
                >
                  {p.name}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      <Form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          haptics.tap();
          seat.start();
          game.join(name);
        }}
      >
        <label htmlFor={ids.name} className="text-label">
          {unclaimed.length ? P.orNew : P.yourName}
        </label>
        <TextInput
          id={ids.name}
          fieldSize="title"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="nickname"
          enterKeyHint="go"
          maxLength={32}
          required
          aria-invalid={!!err}
          aria-describedby={err ? ids.err : undefined}
        />
        <p id={ids.err} className={`text-body text-error ${styles.error}`} role="alert">
          {err}
        </p>
        <PrimaryAction type="submit" busy={seat.busy}>
          {P.joinBtn}
        </PrimaryAction>
      </Form>
    </Split>
  );
}
