import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import './tokens/tokens.css';
import './ui/styles/base.css';
import './ui/styles/transitions.css';
import { ErrorBoundary } from './ui/components/ErrorBoundary';
import { startPointerFx } from './ui/lib/pointerFx';

const Landing = lazy(() => import('./landing/Landing'));
const Host = lazy(() => import('./host/HostApp'));
const Play = lazy(() => import('./player/PlayerApp'));
const Demo = lazy(() => import('./demo/Demo'));

/** A pathname switch is all the routing four pages need. */
function Route() {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  if (path === '/host') return <Host />;
  if (path === '/play') return <Play />;
  if (path === '/demo') return <Demo />;
  return <Landing />;
}

startPointerFx();

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <ErrorBoundary>
      <Suspense fallback={null}>
        <Route />
      </Suspense>
    </ErrorBoundary>
  </StrictMode>,
);
