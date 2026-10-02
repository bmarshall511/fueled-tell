import { useEffect, useState } from 'react';

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

/** True when the OS asks for reduced motion, or the URL has ?motion=reduced (for testing). */
export function usePrefersReducedMotion(): boolean {
  const media = useMediaQuery('(prefers-reduced-motion: reduce)');
  return media || new URLSearchParams(window.location.search).get('motion') === 'reduced';
}

/** Non-hook check for code that runs outside React (e.g. starting a view transition). */
export const prefersReducedMotion = (): boolean => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
