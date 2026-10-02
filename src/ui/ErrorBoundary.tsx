import { Component, type ReactNode } from 'react';
import { UI_COPY } from './copy';
import styles from './ErrorBoundary.module.css';

interface State {
  failed: boolean;
}

/**
 * Last line of defense: if a screen crashes, show a way back instead of a blank page.
 * Game state lives in localStorage (host) and on the host (phones), so a reload recovers.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  override state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  override componentDidCatch(error: unknown) {
    console.error('Tell crashed:', error);
  }

  override render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className={styles.crash} role="alert">
        <h1 className={styles.title}>{UI_COPY.crash.title}</h1>
        <p className={styles.body}>{UI_COPY.crash.body}</p>
        <button type="button" className={`chamfer ${styles.button}`} onClick={() => window.location.reload()}>
          {UI_COPY.crash.reload}
        </button>
      </main>
    );
  }
}
