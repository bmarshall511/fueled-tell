import type { SceneModule } from './Scene';

/** Lazy loaders: Three.js is only fetched when a host route mounts a scene. */
export const SCENES = {
  orbit: () => import('./orbit/OrbitScene'),
  signal: () => import('./signal/SignalScene'),
  deck: () => import('./deck/DeckScene'),
} satisfies Record<string, () => Promise<SceneModule>>;

export type SceneId = keyof typeof SCENES;
