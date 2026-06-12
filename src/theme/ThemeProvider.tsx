import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { useStore } from '@/store';

import { dark, light, type ThemeTokens } from './tokens';

interface ThemeContextValue {
  tokens: ThemeTokens;
  mode: 'dark' | 'light';
}

const ThemeContext = createContext<ThemeContextValue>({
  tokens: dark,
  mode: 'dark',
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const setting = useStore((s) => s.settings.theme);
  const system = useColorScheme();
  const mode: 'dark' | 'light' =
    setting === 'system' ? (system === 'light' ? 'light' : 'dark') : setting;
  const value = useMemo<ThemeContextValue>(
    () => ({ tokens: mode === 'light' ? light : dark, mode }),
    [mode],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function useTokens() {
  return useContext(ThemeContext).tokens;
}
