import { useThree } from '@react-three/fiber';
import { MathUtils } from 'three';
import { stageFor, type StageLayout } from '../../ui/lib/stage';

/** Shared camera so every scene maps stage pixels to world units the same way. */
export const CAMERA = { fov: 40, distance: 10 } as const;

/**
 * The host stage layout for the canvas size, plus a converter from reference
 * stage pixels to world units at z = 0. Matches the HUD's --stage scaling, so
 * 3D objects and HTML overlays line up in landscape and portrait.
 */
export function useStage(): { layout: StageLayout; toWorld: (px: number) => number } {
  const { size } = useThree();
  const layout = stageFor(size.width, size.height);
  const worldPerScreenPx = (2 * CAMERA.distance * Math.tan(MathUtils.degToRad(CAMERA.fov / 2))) / size.height;
  const worldPerRefPx = worldPerScreenPx * layout.scale;
  return { layout, toWorld: (px) => px * worldPerRefPx };
}

/** Frame-rate independent easing toward a target; snaps when motion is reduced. */
export const approach = (current: number, target: number, dt: number, reducedMotion: boolean, lambda = 6) =>
  reducedMotion ? target : MathUtils.damp(current, target, lambda, dt);
