import type { SceneModule } from './Scene';

/**
 * Lazy loaders: Three.js is only fetched when the host mounts the 3D scene.
 * `flat` is the 2D fallback (reduced motion, no WebGL, or `?scene=flat`) and loads no Three.js.
 */
export const SCENES = {
  deck: () => import('./deck/DeckScene'),
  flat: () => import('./flat/FlatScene'),
} satisfies Record<string, () => Promise<SceneModule>>;

export type SceneId = keyof typeof SCENES;

function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') ?? c.getContext('webgl'));
  } catch {
    return false;
  }
}

export function pickScene(reducedMotion: boolean): SceneId {
  const forced = new URLSearchParams(window.location.search).get('scene');
  if (forced === 'flat' || forced === 'deck') return forced;
  return reducedMotion || !hasWebGL() ? 'flat' : 'deck';
}
