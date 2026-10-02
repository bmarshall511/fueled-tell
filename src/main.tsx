import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import './tokens/tokens.css';
import './ui/base.css';

const Landing = lazy(() => import('./routes/Landing'));
const Host = lazy(() => import('./routes/Host'));
const Play = lazy(() => import('./routes/Play'));
const Demo = lazy(() => import('./routes/Demo'));

/** A pathname switch is all the routing four pages need. */
function Route() {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  if (path === '/host') return <Host />;
  if (path === '/play') return <Play />;
  if (path === '/demo') return <Demo />;
  return <Landing />;
}

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <Suspense fallback={null}>
      <Route />
    </Suspense>
  </StrictMode>,
);
