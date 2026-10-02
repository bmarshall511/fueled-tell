import { Canvas, type CanvasProps } from '@react-three/fiber';
import { useContext } from 'react';
import { usePageVisible } from '../ui/hooks';
import { tokens } from '../tokens/tokens';
import { SceneReadyContext } from './sceneReady';

/**
 * Shared R3F canvas: DPR capped at 2, render loop paused while the tab is hidden.
 * Decorative only: hidden from assistive tech; all meaning lives in the HTML overlay.
 */
export function SceneCanvas({ children, ...rest }: CanvasProps) {
  const visible = usePageVisible();
  const onReady = useContext(SceneReadyContext);
  return (
    <div aria-hidden="true" style={{ position: 'absolute', inset: 0 }}>
      <Canvas
        dpr={[1, 2]}
        frameloop={visible ? 'always' : 'never'}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        style={{ position: 'absolute', inset: 0, background: tokens.color.bg }}
        onCreated={() => requestAnimationFrame(onReady)}
        {...rest}
      >
        {children}
      </Canvas>
    </div>
  );
}
