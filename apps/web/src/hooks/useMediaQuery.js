import { useSyncExternalStore } from 'react';

// Live boolean for a CSS media query, e.g. useMediaQuery('(min-width: 768px)').
export function useMediaQuery(query) {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(query);
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}
