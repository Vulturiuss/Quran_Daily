import { createContext, ReactNode, useContext, useMemo } from 'react';

import { getPalette, Palette, ThemeId } from '@/theme';
import { useQuranStore } from '@/store/useQuranStore';

interface ThemeContextValue {
  theme: ThemeId;
  colors: Palette;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useQuranStore((state) => state.profile.theme);
  const value = useMemo<ThemeContextValue>(
    () => ({ theme, colors: getPalette(theme) }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}
