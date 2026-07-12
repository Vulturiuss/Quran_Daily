export type ThemeId =
  | 'teal'
  | 'pink'
  | 'blue'
  | 'dark'
  | 'light'
  | 'gold'
  | 'grey';

/** Whether the theme paints light text on a dark ground, or the reverse. */
export type ThemeScheme = 'dark' | 'light';

/**
 * Colour literals belong in this file and nowhere else.
 *
 * Screens used to hardcode their own `rgba(...)` values — cards were a forest
 * green, the ornamental gradient was a dark green, the vignette too — so picking
 * the pink or blue theme repainted the background and left everything on top of
 * it green. `src/theme.test.ts` now fails the build if a colour literal appears
 * anywhere else under src/, which is what keeps a new theme from being half
 * applied.
 *
 * Adding a theme = adding one ThemeSeed below. Every structural colour is
 * derived from it.
 */

// --- colour maths -----------------------------------------------------------

function channels(hex: string): [number, number, number] {
  const value = hex.replace('#', '');
  const full =
    value.length === 3
      ? value
          .split('')
          .map((char) => char + char)
          .join('')
      : value;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

/** Mixes a colour towards black. `amount` of 0 keeps it, 1 makes it black. */
function darken(hex: string, amount: number) {
  const [r, g, b] = channels(hex);
  const factor = 1 - Math.min(1, Math.max(0, amount));
  const to = (channel: number) => Math.round(channel * factor);
  return `#${[to(r), to(g), to(b)]
    .map((channel) => channel.toString(16).padStart(2, '0'))
    .join('')}`;
}

/** The single way to build a translucent colour, so alphas follow the theme. */
export function withAlpha(hex: string, alpha: number) {
  const [r, g, b] = channels(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

// --- theme definition -------------------------------------------------------

interface ThemeSeed {
  /**
   * Light text on a dark ground, or the reverse. This is not cosmetic: neutral
   * veils, hairlines and the ornamental wash are built from `ink`, which flips
   * with the scheme. A light theme built as if it were dark would render its
   * hairlines white-on-white — invisible.
   */
  scheme: ThemeScheme;
  /** Dominant background. */
  background: string;
  /** Deepest shade, used behind everything and for the splash. */
  backgroundDeep: string;
  /** Base for cards, sheets, vignettes and the ornamental gradients. */
  cardTint: string;
  /** Main text colour. Dark ink on a light theme. */
  text: string;
  textMuted: string;
  textFaint: string;
}

export interface Palette {
  scheme: ThemeScheme;
  /**
   * The colour every neutral veil, hairline and track is built from: white on a
   * dark theme, dark ink on a light one. Use `withAlpha(colors.ink, a)` instead
   * of `colors.white` for anything that must stay visible on both.
   */
  ink: string;
  background: string;
  backgroundDeep: string;
  surface: string;
  surfaceElevated: string;
  surfaceMuted: string;
  /** Card, stat-card and icon-button background. */
  card: string;
  /** Slightly more opaque variant for floating controls. */
  cardStrong: string;
  /** Darkening veil over the ornamental pattern. */
  vignette: string;
  /** Hairline between verses on paper-toned cards. */
  divider: string;
  ornamentGradient: readonly [string, string, string];
  shareGradient: readonly [string, string, string];
  cardGradient: readonly [string, string, string];
  gold: string;
  goldSoft: string;
  goldPale: string;
  goldDeep: string;
  goldBright: string;
  text: string;
  textMuted: string;
  textFaint: string;
  success: string;
  warning: string;
  error: string;
  border: string;
  borderStrong: string;
  overlay: string;
  shadow: string;
  white: string;
  /** Google's brand blue, for the "G" on the sign-in button. Never themed. */
  brandGoogle: string;
}

// The warm accent and the status colours are intentionally constant across
// themes (see design-system.md): only the dominant mood shifts.
const GOLD = '#D4A373';
const GOLD_BRIGHT = '#E8CC6B';
const TEXT = '#F5F5F0';
const WHITE = '#FFFFFF';

const INK_DARK = '#14120F';

const sharedTokens = {
  gold: GOLD,
  goldSoft: GOLD,
  goldPale: GOLD,
  goldDeep: GOLD,
  goldBright: GOLD_BRIGHT,
  success: '#81C784',
  warning: '#E7B768',
  error: '#E57373',
  border: withAlpha(GOLD, 0.28),
  borderStrong: withAlpha(GOLD, 0.48),
  shadow: '#000000',
  white: WHITE,
  brandGoogle: '#4285F4',
};

function buildPalette(seed: ThemeSeed): Palette {
  const { scheme, background, backgroundDeep, cardTint, text, textMuted, textFaint } =
    seed;
  const light = scheme === 'light';
  const ink = light ? INK_DARK : WHITE;

  return {
    ...sharedTokens,
    scheme,
    ink,
    background,
    backgroundDeep,
    surface: background,
    surfaceElevated: background,
    surfaceMuted: background,
    text,
    textMuted,
    textFaint,
    card: withAlpha(cardTint, 0.94),
    cardStrong: withAlpha(cardTint, 0.95),
    // On a light theme the ornamental pattern has to be washed out with light,
    // not darkened — darkening it would leave a muddy grey behind the content.
    vignette: light
      ? withAlpha(cardTint, 0.55)
      : withAlpha(darken(cardTint, 0.6), 0.35),
    divider: withAlpha(ink, 0.12),
    overlay: withAlpha(backgroundDeep, 0.62),
    ornamentGradient: light
      ? [withAlpha(cardTint, 0.35), withAlpha(cardTint, 0.75), withAlpha(cardTint, 0.95)]
      : [
          withAlpha(darken(cardTint, 0.7), 0.18),
          withAlpha(cardTint, 0.7),
          withAlpha(darken(cardTint, 0.55), 0.94),
        ],
    shareGradient: light
      ? [withAlpha(cardTint, 0.7), withAlpha(cardTint, 0.85), withAlpha(cardTint, 0.95)]
      : [
          withAlpha(darken(cardTint, 0.62), 0.72),
          withAlpha(darken(cardTint, 0.3), 0.76),
          withAlpha(cardTint, 0.86),
        ],
    cardGradient: [background, background, backgroundDeep],
  };
}

// `cardTint` for teal reproduces the forest green the cards already used, so the
// default theme is unchanged; every other theme derives its own.
const seeds: Record<ThemeId, ThemeSeed> = {
  teal: {
    scheme: 'dark',
    background: '#0F766E',
    backgroundDeep: '#134E4A',
    cardTint: '#19382A',
    text: TEXT,
    textMuted: '#B9CDBF',
    textFaint: '#7F9A88',
  },
  pink: {
    scheme: 'dark',
    background: '#9D2360',
    backgroundDeep: '#5C1238',
    cardTint: '#3E1029',
    text: TEXT,
    textMuted: '#E8B9CE',
    textFaint: '#B4789B',
  },
  blue: {
    scheme: 'dark',
    background: '#0E4C86',
    backgroundDeep: '#082C4F',
    cardTint: '#0D2A46',
    text: TEXT,
    textMuted: '#AFCBE8',
    textFaint: '#6E96BE',
  },
  dark: {
    scheme: 'dark',
    background: '#1C1C1E',
    backgroundDeep: '#0E0E10',
    cardTint: '#26262A',
    text: TEXT,
    textMuted: '#B2B2B8',
    textFaint: '#7A7A80',
  },
  light: {
    scheme: 'light',
    background: '#FBF8F3',
    backgroundDeep: '#EFE8DC',
    cardTint: '#FFFFFF',
    text: '#1E1B17',
    textMuted: '#5E574C',
    textFaint: '#918A7D',
  },
  gold: {
    scheme: 'dark',
    background: '#8A6B33',
    backgroundDeep: '#57431E',
    cardTint: '#3F3117',
    text: '#FBF3E4',
    textMuted: '#E4D0AB',
    textFaint: '#B39B70',
  },
  grey: {
    scheme: 'dark',
    background: '#4B4F55',
    backgroundDeep: '#2B2E33',
    cardTint: '#35383D',
    text: '#F2F2F0',
    textMuted: '#C0C3C7',
    textFaint: '#8A8E93',
  },
};

const palettes = Object.fromEntries(
  Object.entries(seeds).map(([id, seed]) => [id, buildPalette(seed)]),
) as Record<ThemeId, Palette>;

export function getPalette(theme: ThemeId | undefined | null): Palette {
  return palettes[theme ?? 'teal'] ?? palettes.teal;
}

export const themeOptions: { id: ThemeId; label: string }[] = [
  { id: 'teal', label: 'Teal' },
  { id: 'pink', label: 'Rose' },
  { id: 'blue', label: 'Bleu' },
  { id: 'dark', label: 'Sombre' },
  { id: 'light', label: 'Clair' },
  { id: 'gold', label: 'Doré' },
  { id: 'grey', label: 'Gris' },
];

/**
 * Static default palette. Only for the pre-hydration splash in app/_layout.tsx
 * and for native config that cannot read React state (notification colour).
 * Everything rendered inside the app must use useTheme().
 */
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
