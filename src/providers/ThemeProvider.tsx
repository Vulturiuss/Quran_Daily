import { createContext, ReactNode, useContext, useMemo } from 'react';

import { useAccess } from '@/hooks/useAccess';
import { getPalette, Palette, ThemeId } from '@/theme';
import { useQuranStore } from '@/store/useQuranStore';
import { effectiveTheme } from '@/utils/access';

interface ThemeContextValue {
  theme: ThemeId;
  colors: Palette;
  /** False on the free tier: the picker is shown, but locked behind the paywall. */
  canChangeTheme: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const preferred = useQuranStore((state) => state.profile.theme);
  const { allThemes: canChangeTheme, resolved } = useAccess();

  // Render optimistically while the subscription resolves: applying the free
  // palette first would repaint the whole app — the navigator background
  // included — and then flip back, so a subscriber sees their theme flash to the
  // default on every launch. A free user's profile still holds the default here,
  // because the picker sends them to the paywall instead of storing a choice.
  const theme = effectiveTheme(canChangeTheme || !resolved, preferred);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, colors: getPalette(theme), canChangeTheme }),
    [canChangeTheme, theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}
