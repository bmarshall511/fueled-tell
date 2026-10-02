import { Canvas, type CanvasProps } from '@react-three/fiber';
import { usePageVisible } from '../ui/hooks';
import { tokens } from '../tokens/tokens';

/** Shared R3F canvas: DPR capped at 2, render loop paused while the tab is hidden. */
export function SceneCanvas({ children, ...rest }: CanvasProps) {
  const visible = usePageVisible();
  return (
    <Canvas
      dpr={[1, 2]}
      frameloop={visible ? 'always' : 'never'}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      style={{ position: 'absolute', inset: 0, background: tokens.color.bg }}
      {...rest}
    >
      {children}
    </Canvas>
  );
}
