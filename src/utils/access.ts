import { ThemeId } from '@/theme';

/**
 * What each tier may do.
 *
 * The app is fully usable for free: every one of the 114 surahs can be learnt and
 * reviewed, without a daily cap. Premium sells comfort (themes, reciters,
 * progress) and capacity (three surahs learnt at once), never content.
 */

/** The only reciter available without Premium. */
export const FREE_RECITER_ID = 'mishary';
/** The only theme available without Premium. */
export const FREE_THEME: ThemeId = 'teal';

export const FREE_MAX_LEARNING_SURAHS = 1;
export const PREMIUM_MAX_LEARNING_SURAHS = 3;

export const FREE_FREEZE_ALLOWANCE = 1;
export const PREMIUM_FREEZE_ALLOWANCE = 3;

export interface Capabilities {
  /** How many surahs can be in the `learning` state at the same time. */
  maxLearningSurahs: number;
  /** Choose among all reciters instead of being pinned to Mishary. */
  allReciters: boolean;
  /** Choose among all themes instead of being pinned to teal. */
  allThemes: boolean;
  /** See the Progress tab: charts, history and badges. */
  stats: boolean;
  /** Monthly streak freezes. */
  freezeAllowance: number;
}

export function capabilities(hasFullAccess: boolean): Capabilities {
  return hasFullAccess
    ? {
        maxLearningSurahs: PREMIUM_MAX_LEARNING_SURAHS,
        allReciters: true,
        allThemes: true,
        stats: true,
        freezeAllowance: PREMIUM_FREEZE_ALLOWANCE,
      }
    : {
        maxLearningSurahs: FREE_MAX_LEARNING_SURAHS,
        allReciters: false,
        allThemes: false,
        stats: false,
        freezeAllowance: FREE_FREEZE_ALLOWANCE,
      };
}

export interface SessionAccess {
  isBonus?: boolean;
  freezeAllowance?: number;
  /** Which of the active learning surahs to work on today. */
  learningSurah?: number;
}

export function sessionAccess(
  hasFullAccess: boolean,
  isBonus = false,
  learningSurah?: number,
): SessionAccess {
  return {
    isBonus,
    learningSurah,
    freezeAllowance: capabilities(hasFullAccess).freezeAllowance,
  };
}

export function freezeAllowanceFor(hasFullAccess: boolean) {
  return capabilities(hasFullAccess).freezeAllowance;
}

/** The reciter to actually play with, given the tier. */
export function effectiveReciter(hasFullAccess: boolean, preferred: string) {
  return hasFullAccess ? preferred : FREE_RECITER_ID;
}

/** The theme to actually render, given the tier. */
export function effectiveTheme(hasFullAccess: boolean, preferred: ThemeId) {
  return hasFullAccess ? preferred : FREE_THEME;
}

/**
 * `configured === false` means no billing/cloud backend is wired up at all (a
 * local dev run, or — the dangerous case — a release build shipped without its
 * EXPO_PUBLIC_* vars). The app then runs fully unlocked, so this is deliberately
 * the only place that decision is made. scripts/check-env.mjs fails a release
 * build that would hit this path.
 */
export function hasFullAccess(configured: boolean, isPremium: boolean) {
  return !configured || isPremium;
}
