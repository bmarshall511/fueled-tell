import { useCallback, useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** Offers "Install Tell" where the browser supports it (Chrome/Edge/Android). iOS uses Share > Add to Home Screen. */
export function useInstallPrompt(): { canInstall: boolean; install: () => void } {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvent(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setEvent(null);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);
  const install = useCallback(() => {
    if (!event) return;
    void event.prompt();
    void event.userChoice.finally(() => setEvent(null));
  }, [event]);
  return { canInstall: event !== null, install };
}
