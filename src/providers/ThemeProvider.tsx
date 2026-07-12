import { createContext, ReactNode, useContext, useMemo } from 'react';

import { useSubscription } from '@/providers/SubscriptionProvider';
import { getPalette, Palette, ThemeId } from '@/theme';
import { useQuranStore } from '@/store/useQuranStore';
import { capabilities, effectiveTheme, hasFullAccess } from '@/utils/access';

interface ThemeContextValue {
  theme: ThemeId;
  colors: Palette;
  /** False on the free tier: the picker is shown, but locked behind the paywall. */
  canChangeTheme: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const preferred = useQuranStore((state) => state.profile.theme);
  const { configured, isPremium } = useSubscription();
  const canChangeTheme = capabilities(
    hasFullAccess(configured, isPremium),
  ).allThemes;

  // The chosen theme is kept in the profile even without Premium, so it comes
  // back as soon as the user subscribes — it is simply not rendered until then.
  const theme = effectiveTheme(canChangeTheme, preferred);

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
