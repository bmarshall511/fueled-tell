import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import './tokens/tokens.css';
import './ui/styles/base.css';
import './ui/styles/transitions.css';
import { ErrorBoundary } from './ui/components/ErrorBoundary';
import { UI_COPY } from './ui/copy';
import { sayHello } from './ui/lib/eggs';
import { startPointerFx } from './ui/lib/pointerFx';
import { registerSW } from 'virtual:pwa-register';

const Landing = lazy(() => import('./landing/Landing'));
const Host = lazy(() => import('./host/HostApp'));
const Play = lazy(() => import('./player/PlayerApp'));
const Demo = lazy(() => import('./demo/Demo'));
const NotFound = lazy(() => import('./notfound/NotFound'));

/** A pathname switch is all the routing these pages need. Anything else is the 404 "round". */
function Route() {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  if (path === '/host') return <Host />;
  if (path === '/play') return <Play />;
  if (path === '/demo') return <Demo />;
  if (path === '/' || path === '/index.html') return <Landing />;
  return <NotFound />;
}

startPointerFx();
sayHello(UI_COPY.repo);
// Offline cache: when a new version is deployed, switch to it as soon as it's downloaded (a reload),
// so nobody keeps running an old build from the cache. A game in progress survives the reload.
registerSW({ immediate: true });

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <ErrorBoundary>
      <Suspense fallback={null}>
        <Route />
      </Suspense>
    </ErrorBoundary>
  </StrictMode>,
);
