import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { ThemeContext, THEME_KEY, getStoredTheme, systemPrefersDark } from '../../lib/theme';
import { playThemeSound } from '../../lib/themeSound';

const applyTheme = (resolved) => {
  const root = document.documentElement;
  root.classList.toggle('dark', resolved === 'dark');
  root.style.colorScheme = resolved;
};

const resolve = (theme, systemDark) => (theme === 'system' ? (systemDark ? 'dark' : 'light') : theme);

// Plain colour fade, used when the ripple can't run.
const fadeColors = () => {
  const root = document.documentElement;
  root.classList.add('theme-transition');
  window.setTimeout(() => root.classList.remove('theme-transition'), 250);
};

// Reveals the new theme as a ripple spreading from `origin`, like a pebble dropped in water. See .theme-ripple in index.css.
const ripple = (origin, update) => {
  const root = document.documentElement;
  const x = origin?.x ?? window.innerWidth / 2;
  const y = origin?.y ?? window.innerHeight / 2;
  // Far enough to pass the furthest corner, plus the trailing wave bands.
  const reach = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)) + 120;

  root.style.setProperty('--ripple-x', `${x}px`);
  root.style.setProperty('--ripple-y', `${y}px`);
  root.style.setProperty('--ripple-max', `${reach}px`);
  root.classList.add('theme-ripple');

  const transition = document.startViewTransition(update);
  transition.finished.finally(() => root.classList.remove('theme-ripple'));
};

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getStoredTheme);
  const [systemDark, setSystemDark] = useState(systemPrefersDark);
  const resolvedRef = useRef(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e) => setSystemDark(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const resolvedTheme = resolve(theme, systemDark);
  resolvedRef.current = resolvedTheme;

  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  // `origin` is the viewport point the ripple starts from, usually the centre of the clicked control.
  const setTheme = useCallback((next, origin) => {
    const nextResolved = resolve(next, systemPrefersDark());
    const changes = nextResolved !== resolvedRef.current;
    playThemeSound(nextResolved, { soft: !changes });

    const commit = () => {
      setThemeState(next);
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch {
        // Storage may be unavailable (private mode); theme still applies for this session.
      }
    };

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!changes) {
      commit();
    } else if (document.startViewTransition && !reducedMotion) {
      ripple(origin, () => {
        flushSync(commit);
        applyTheme(nextResolved);
      });
    } else {
      fadeColors();
      commit();
    }
  }, []);

  const value = useMemo(() => ({ theme, resolvedTheme, setTheme }), [theme, resolvedTheme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
