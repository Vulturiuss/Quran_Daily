import { ThemeId } from '@/theme';
import type { SessionKind } from '@/types';

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
  /**
   * Keep the recitation on the phone. This gates *bandwidth*, never the text:
   * streaming stays free and unlimited on every tier, and the 114 surahs are read
   * offline by anyone. What Premium buys is not depending on the network.
   */
  offlineAudio: boolean;
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
        offlineAudio: true,
        freezeAllowance: PREMIUM_FREEZE_ALLOWANCE,
      }
    : {
        maxLearningSurahs: FREE_MAX_LEARNING_SURAHS,
        allReciters: false,
        allThemes: false,
        stats: false,
        offlineAudio: false,
        freezeAllowance: FREE_FREEZE_ALLOWANCE,
      };
}

export interface SessionAccess {
  isBonus?: boolean;
  freezeAllowance?: number;
  /** Which of the active learning surahs to work on today. */
  learningSurah?: number;
  /**
   * What the session contains. The home screen runs the whole routine (`daily`);
   * the Réviser and Apprendre tabs run only their own half. They used to both
   * launch the same session, so the two tabs were two doors into the same room.
   */
  kind?: SessionKind;
}

export function sessionAccess(
  hasFullAccess: boolean,
  isBonus = false,
  learningSurah?: number,
  kind: SessionKind = 'daily',
): SessionAccess {
  return {
    isBonus,
    learningSurah,
    kind,
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
