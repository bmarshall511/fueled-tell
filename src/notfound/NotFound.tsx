import { useEffect, useState } from 'react';
import { tokens } from '../tokens/tokens';
import { Backdrop } from '../ui/components/Backdrop';
import { BrandHeader } from '../ui/components/BrandHeader';
import { Button } from '../ui/components/Button';
import { UI_COPY } from '../ui/copy';
import { useDocumentTitle } from '../ui/hooks/useDocumentTitle';
import styles from './NotFound.module.css';

const N = UI_COPY.notFound;

/** 404, played like a round: the card asks whose page it is, then flips to the answer. */
export default function NotFound() {
  useDocumentTitle(N.title);
  const [flipped, setFlipped] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setFlipped(true), tokens.duration.entrance);
    return () => window.clearTimeout(t);
  }, []);
  return (
    <main className={`page ${styles.page}`}>
      <Backdrop />
      <BrandHeader />
      <section className={styles.stage}>
        <h1 className="visually-hidden">{N.title}</h1>
        <p className="text-label">{N.kicker}</p>
        <button
          type="button"
          className={`${styles.card} ${flipped ? styles.flipped : ''}`}
          onClick={() => setFlipped((f) => !f)}
          aria-label={flipped ? N.answer : N.question}
        >
          <span className={styles.front} aria-hidden="true">
            {N.question}
          </span>
          <span className={`glow-fill ${styles.back}`} aria-hidden="true">
            {N.answer}
          </span>
        </button>
        <p className="visually-hidden" aria-live="polite">
          {flipped ? N.answer : N.question}
        </p>
        <Button onClick={() => window.location.assign('/')}>{N.back}</Button>
      </section>
    </main>
  );
}
