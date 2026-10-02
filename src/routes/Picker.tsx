import { BuiltBy, FueledLockup } from '../ui/Logo';
import styles from './Picker.module.css';

const LINKS = [
  { href: '/orbit', name: 'Orbit', blurb: 'Entries are planets around the Fueled emblem. Guesses fly in as particles.' },
  { href: '/signal', name: 'Signal', blurb: 'A particle field that assembles the entry, then reorganizes into the owner.' },
  { href: '/deck', name: 'Deck', blurb: 'Weighty 3D cards. Deal, flip, chips stack up. The restrained one.' },
  { href: '/play', name: 'Phone', blurb: 'The player screen: join, guess, wait, and "this one\'s yours".' },
];

export default function Picker() {
  return (
    <main className={styles.picker}>
      <header className={styles.header}>
        <FueledLockup height="40px" />
        <BuiltBy height="20px" />
      </header>
      <h1 className={styles.title}>Whose Is It? Mockups</h1>
      <p className={styles.sub}>Three host concepts, one phone screen. Same tokens, same primitives, same round loop.</p>
      <ul className={styles.list}>
        {LINKS.map((l) => (
          <li key={l.href}>
            <a className={`chamfer ${styles.card}`} href={l.href}>
              <span className={styles.name}>{l.name}</span>
              <span className={styles.blurb}>{l.blurb}</span>
              <span className={styles.path}>{l.href}</span>
            </a>
          </li>
        ))}
      </ul>
      <p className={styles.hint}>Host keys: Space = next step, L = lock, R = reveal. Add ?timer=15 for faster rounds, ?motion=reduced to test reduced motion.</p>
    </main>
  );
}
