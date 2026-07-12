export type ThemeId = 'teal' | 'pink' | 'blue';

export interface Palette {
  background: string;
  backgroundDeep: string;
  surface: string;
  surfaceElevated: string;
  surfaceMuted: string;
  gold: string;
  goldSoft: string;
  goldPale: string;
  goldDeep: string;
  text: string;
  textMuted: string;
  textFaint: string;
  success: string;
  warning: string;
  error: string;
  border: string;
  borderStrong: string;
  overlay: string;
  white: string;
}

// The warm accent (gold/success/warning/error/text) stays constant across themes —
// only the dominant background/surface mood shifts, so themes stay visually unified.
const sharedTokens = {
  gold: '#D4A373',
  goldSoft: '#D4A373',
  goldPale: '#D4A373',
  goldDeep: '#D4A373',
  text: '#F5F5F0',
  success: '#81C784',
  warning: '#E7B768',
  error: '#E57373',
  border: 'rgba(212, 163, 115, 0.28)',
  borderStrong: 'rgba(212, 163, 115, 0.48)',
  white: '#FFFFFF',
};

const palettes: Record<ThemeId, Palette> = {
  teal: {
    ...sharedTokens,
    background: '#0F766E',
    backgroundDeep: '#134E4A',
    surface: '#0F766E',
    surfaceElevated: '#0F766E',
    surfaceMuted: '#0F766E',
    textMuted: '#B9CDBF',
    textFaint: '#7F9A88',
    overlay: 'rgba(19, 78, 74, 0.62)',
  },
  pink: {
    ...sharedTokens,
    background: '#9D2360',
    backgroundDeep: '#5C1238',
    surface: '#9D2360',
    surfaceElevated: '#9D2360',
    surfaceMuted: '#9D2360',
    textMuted: '#E8B9CE',
    textFaint: '#B4789B',
    overlay: 'rgba(92, 18, 56, 0.62)',
  },
  blue: {
    ...sharedTokens,
    background: '#0E4C86',
    backgroundDeep: '#082C4F',
    surface: '#0E4C86',
    surfaceElevated: '#0E4C86',
    surfaceMuted: '#0E4C86',
    textMuted: '#AFCBE8',
    textFaint: '#6E96BE',
    overlay: 'rgba(8, 44, 79, 0.62)',
  },
};

export function getPalette(theme: ThemeId | undefined | null): Palette {
  return palettes[theme ?? 'teal'] ?? palettes.teal;
}

export const themeOptions: { id: ThemeId; label: string }[] = [
  { id: 'teal', label: 'Teal' },
  { id: 'pink', label: 'Rose' },
  { id: 'blue', label: 'Bleu' },
];

// Static default export — every screen not yet migrated to useTheme() keeps this (teal).
export const colors = palettes.teal;

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 44,
};

export const radius = {
  sm: 12,
  md: 18,
  lg: 24,
  xl: 30,
  pill: 999,
};

export const motion = {
  quick: 180,
  standard: 280,
};

export const layout = {
  contentMaxWidth: 620,
};

export const typography = {
  regular: 'Nunito_400Regular',
  medium: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  extraBold: 'Nunito_800ExtraBold',
  arabic: 'Amiri_400Regular',
  arabicBold: 'Amiri_700Bold',
};
