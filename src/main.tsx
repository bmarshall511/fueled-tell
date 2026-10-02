import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import './tokens/tokens.css';
import './ui/base.css';
import type { SceneId } from './scenes/registry';

const Picker = lazy(() => import('./routes/Picker'));
const Host = lazy(() => import('./routes/Host'));
const Play = lazy(() => import('./routes/Play'));
const Create = lazy(() => import('./routes/Create'));
const Demo = lazy(() => import('./routes/Demo'));

const HOST_ROUTES: Record<string, SceneId> = { '/orbit': 'orbit', '/signal': 'signal', '/deck': 'deck' };

/** A pathname switch is all the routing a four-page mockup needs. */
function Route() {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  const sceneId = HOST_ROUTES[path];
  if (sceneId) return <Host sceneId={sceneId} />;
  if (path === '/play') return <Play />;
  if (path === '/create') return <Create />;
  if (path === '/demo') return <Demo />;
  return <Picker />;
}

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <Suspense fallback={null}>
      <Route />
    </Suspense>
  </StrictMode>,
);
