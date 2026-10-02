import { useCallback, useEffect, useState } from 'react';

/** Fullscreen state and a toggle (the host presents in a shared tab). */
export function useFullscreen(): [boolean, () => void] {
  const [on, setOn] = useState(() => document.fullscreenElement !== null);
  useEffect(() => {
    const onChange = () => setOn(document.fullscreenElement !== null);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);
  const toggle = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.().catch(() => {});
  }, []);
  return [on, toggle];
}
