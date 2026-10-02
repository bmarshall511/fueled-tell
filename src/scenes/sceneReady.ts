import { createContext } from 'react';

/**
 * The host listens on this to know when the 3D scene has drawn (to drop the boot
 * screen). Lives in its own module so the host shell can import it without
 * pulling Three.js / R3F into the shell chunk.
 */
export const SceneReadyContext = createContext<() => void>(() => {});
