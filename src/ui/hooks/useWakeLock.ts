import { useEffect } from 'react';

/** Keeps the screen awake while mounted (Screen Wake Lock API, where supported). */
export function useWakeLock(): void {
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    const acquire = async () => {
      try {
        if (document.visibilityState === 'visible') lock = await navigator.wakeLock?.request('screen');
      } catch {
        /* unsupported or denied: harmless */
      }
    };
    void acquire();
    document.addEventListener('visibilitychange', acquire);
    return () => {
      document.removeEventListener('visibilitychange', acquire);
      void lock?.release();
    };
  }, []);
}
