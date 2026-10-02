import { useCallback, useEffect, useMemo, useState } from 'react';
import { pickScene, SCENES } from '../../scenes/registry';
import type { SceneModule } from '../../scenes/Scene';

/**
 * Lazy-loads the round scene (3D Deck, or the flat fallback for reduced motion /
 * no WebGL). The host shell paints first; `ready` flips once the scene has drawn.
 */
export function useScene(reducedMotion: boolean) {
  const id = useMemo(() => pickScene(reducedMotion), [reducedMotion]);
  const [module, setModule] = useState<SceneModule | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let live = true;
    void SCENES[id]().then((m) => live && setModule(m));
    return () => {
      live = false;
    };
  }, [id]);
  const onReady = useCallback(() => setReady(true), []);
  return { Scene: module?.default, rendersOwnerName: module?.rendersOwnerName ?? false, ready, onReady };
}
