import { FREE_SURAH_NUMBERS } from '@/services/subscription';

export const FREE_MAX_REVIEWS = 3;
export const FREE_FREEZE_ALLOWANCE = 1;
export const PREMIUM_FREEZE_ALLOWANCE = 3;

export interface SessionAccess {
  maxReviews?: number;
  allowedSurahNumbers?: readonly number[];
  isBonus?: boolean;
  freezeAllowance?: number;
}

/**
 * The single definition of what a tier may do in a session. It used to be
 * inlined in three screens plus GamificationProvider, and the copies had already
 * drifted: the screens granted 3 streak freezes to anyone with full access while
 * the provider granted 3 only to `isPremium`, so the allowance flipped on every
 * launch and the freezes kept refilling.
 */
export function sessionAccess(hasFullAccess: boolean, isBonus = false): SessionAccess {
  return hasFullAccess
    ? { isBonus, freezeAllowance: PREMIUM_FREEZE_ALLOWANCE }
    : {
        isBonus,
        maxReviews: FREE_MAX_REVIEWS,
        allowedSurahNumbers: FREE_SURAH_NUMBERS,
        freezeAllowance: FREE_FREEZE_ALLOWANCE,
      };
}

export function freezeAllowanceFor(hasFullAccess: boolean) {
  return hasFullAccess ? PREMIUM_FREEZE_ALLOWANCE : FREE_FREEZE_ALLOWANCE;
}

/**
 * `configured === false` means no billing/cloud backend is wired up at all (a
 * local dev run, or — the dangerous case — a release build shipped without its
 * EXPO_PUBLIC_* vars). The app then runs fully unlocked, so this is deliberately
 * the only place that decision is made.
 */
export function hasFullAccess(configured: boolean, isPremium: boolean) {
  return !configured || isPremium;
}
