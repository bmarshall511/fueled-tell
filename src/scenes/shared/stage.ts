import { useThree } from '@react-three/fiber';
import { MathUtils } from 'three';
import { tokens } from '../../tokens/tokens';

/** Shared camera so every scene maps stage pixels to world units the same way. */
export const CAMERA = { fov: 40, distance: 10 } as const;

/**
 * Converts host-stage pixels (1920x1080 reference) into world units at z = 0,
 * matching the HUD's --stage scaling so 3D objects and HTML overlays line up.
 */
export function useStageToWorld(): (px: number) => number {
  const { size } = useThree();
  const { stageWidth, stageHeight } = tokens.size;
  const fit = Math.min(1, size.width / size.height / (stageWidth / stageHeight));
  const worldPerPx = ((2 * CAMERA.distance * Math.tan(MathUtils.degToRad(CAMERA.fov / 2))) / stageHeight) * fit;
  return (px) => px * worldPerPx;
}

/** Frame-rate independent easing toward a target; snaps when motion is reduced. */
export const approach = (current: number, target: number, dt: number, reducedMotion: boolean, lambda = 6) =>
  reducedMotion ? target : MathUtils.damp(current, target, lambda, dt);
