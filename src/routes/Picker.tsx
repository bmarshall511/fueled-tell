import { tokens } from '../tokens/tokens';
import { UI_COPY } from '../ui/copy';
import { BuiltBy, FueledLockup } from '../ui/Logo';
import { useDocumentTitle } from '../ui/useHostChrome';
import styles from './Picker.module.css';

/** The game in order. Each step links the host screen and/or the phone screen for that moment. */
const FLOW = [
  {
    title: 'Create a game',
    who: 'Host laptop',
    blurb: 'Pick a pack, paste everyone’s entries (or let players submit live), choose timer and scoring.',
    links: [{ href: '/create', label: 'Setup' }],
  },
  {
    title: 'Lobby',
    who: 'Shared screen + phones',
    blurb: 'The room code and QR go up on the call. Players join on their phones and appear as they arrive.',
    links: [
      { href: '/create?screen=lobby', label: 'Host lobby' },
      { href: '/play', label: 'Phone: join' },
    ],
  },
  {
    title: 'Rounds',
    who: 'Shared screen + phones',
    blurb: 'Each entry is dealt to the big screen and shown on phones. Players guess; chips land as guesses come in.',
    links: [
      { href: '/deck', label: 'Host round' },
      { href: '/play?screen=pick', label: 'Phone: guess' },
      { href: '/play?screen=yours', label: 'Phone: it’s yours' },
    ],
  },
  {
    title: 'Reveal',
    who: 'Shared screen + phones',
    blurb: 'The card flips to the owner. Correct chips stay, the rest slide off. Phones show if you got it.',
    links: [
      { href: '/deck?at=reveal', label: 'Host reveal' },
      { href: '/play?screen=waiting', label: 'Phone: waiting' },
    ],
  },
  {
    title: 'Final standings',
    who: 'Shared screen + phones',
    blurb: 'Podium, places (ties share), awards. Each phone shows your place and the winner.',
    links: [
      { href: '/deck?at=finale', label: 'Host podium' },
      { href: '/play?screen=final', label: 'Phone: your place' },
    ],
  },
];

const ALTERNATES = [
  { href: '/orbit', name: 'Orbit', blurb: 'Entries as planets around the Fueled emblem.' },
  { href: '/signal', name: 'Signal', blurb: 'A particle field that assembles the entry.' },
];

export default function Picker() {
  useDocumentTitle(`Mockups · ${UI_COPY.appName}`);
  return (
    <main className={styles.picker}>
      <header className={styles.header}>
        <FueledLockup height="40px" />
        <BuiltBy height={`${tokens.size.builtbyPage}px`} />
      </header>

      <h1 className={styles.title}>{UI_COPY.appName}</h1>
      <p className={styles.sub}>
        A guess-whose-it-is party game for video calls. One laptop shares its screen; everyone plays on their phone.
      </p>

      <a className={`chamfer ${styles.hero}`} href="/demo">
        <span className={styles.heroKicker}>Start here</span>
        <span className={styles.heroTitle}>Watch a game run, host and phone side by side</span>
        <span className={styles.blurb}>Synced live. Join on the phone, start on the host, and play a few rounds.</span>
      </a>

      <h2 className={styles.h2}>The flow, step by step</h2>
      <ol className={styles.flow}>
        {FLOW.map((step, i) => (
          <li key={step.title} className={`chamfer ${styles.step}`}>
            <span className={styles.num} aria-hidden="true">
              {i + 1}
            </span>
            <div className={styles.stepBody}>
              <h3 className={styles.name}>{step.title}</h3>
              <span className={styles.who}>{step.who}</span>
              <p className={styles.blurb}>{step.blurb}</p>
            </div>
            <ul className={styles.links}>
              {step.links.map((l) => (
                <li key={l.href}>
                  <a className={`chamfer ${styles.link}`} href={l.href}>
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>

      <h2 className={styles.h2}>Concepts we didn’t pick</h2>
      <ul className={styles.alts}>
        {ALTERNATES.map((a) => (
          <li key={a.href}>
            <a className={`chamfer ${styles.alt}`} href={a.href}>
              <span className={styles.name}>{a.name}</span>
              <span className={styles.blurb}>{a.blurb}</span>
            </a>
          </li>
        ))}
      </ul>

      <p className={styles.hint}>
        Host keys: {UI_COPY.shortcuts}. Add ?timer=15 for faster rounds, ?at=finale to jump to the podium, ?motion=reduced to
        test reduced motion.
      </p>
    </main>
  );
}
