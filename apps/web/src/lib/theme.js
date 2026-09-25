import { createContext } from 'react';

export const THEME_KEY = 'theme';
export const THEMES = ['system', 'light', 'dark'];

export const ThemeContext = createContext({
  theme: 'system',
  resolvedTheme: 'dark',
  setTheme: () => {},
});

export const getStoredTheme = () => {
  try {
    const t = localStorage.getItem(THEME_KEY);
    return THEMES.includes(t) ? t : 'system';
  } catch {
    return 'system';
  }
};

export const systemPrefersDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;
