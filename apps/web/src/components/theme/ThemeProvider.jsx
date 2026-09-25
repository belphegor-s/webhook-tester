import { useCallback, useEffect, useMemo, useState } from 'react';
import { ThemeContext, THEME_KEY, getStoredTheme, systemPrefersDark } from '../../lib/theme';

const applyTheme = (resolved) => {
  const root = document.documentElement;
  root.classList.toggle('dark', resolved === 'dark');
  root.style.colorScheme = resolved;
};

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getStoredTheme);
  const [systemDark, setSystemDark] = useState(systemPrefersDark);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e) => setSystemDark(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const resolvedTheme = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;

  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  const setTheme = useCallback((next) => {
    // Briefly enable colour transitions so the switch feels smooth.
    const root = document.documentElement;
    root.classList.add('theme-transition');
    window.setTimeout(() => root.classList.remove('theme-transition'), 250);

    setThemeState(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // Storage may be unavailable (private mode); theme still applies for this session.
    }
  }, []);

  const value = useMemo(() => ({ theme, resolvedTheme, setTheme }), [theme, resolvedTheme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
