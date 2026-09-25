import { useContext } from 'react';
import { ThemeContext } from '../lib/theme';

export function useTheme() {
  return useContext(ThemeContext);
}
