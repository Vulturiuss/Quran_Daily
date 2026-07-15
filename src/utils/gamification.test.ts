import assert from 'node:assert/strict';
import test from 'node:test';

import {
  advanceDailyStreak,
  calculateSessionXP,
  createDefaultStats,
  findUnlockedBadges,
  isPerfectReviewSession,
  normalizeStats,
  pendingStreakRepair,
  reconcileMissedStreak,
  streakMilestoneXP,
} from './gamification';
import { badges } from '@/data/badges';

test('weekly XP and freezes reset on their calendar boundaries', () => {
  const stats = createDefaultStats(new Date(2026, 4, 25, 12));
  stats.weeklyXP = 340;
  stats.freezeCount = 0;

  const normalized = normalizeStats(stats, 3, new Date(2026, 5, 15, 12));

  assert.equal(normalized.weeklyXP, 0);
  assert.equal(normalized.freezeCount, 3);
  assert.equal(normalized.freezeAllowance, 3);
});

test('a consumed freeze is not handed back when the allowance changes mid-month', () => {
  // The premium flag resolves asynchronously, so on every launch the allowance
  // goes 3 -> 1 -> 3. Refilling on that transition made premium streaks
  // unbreakable: the freezes came back for free on each boot.
  const now = new Date(2026, 6, 12, 12);
  const stored = createDefaultStats(now);
  stored.freezeAllowance = 3;
  stored.freezeCount = 1; // two freezes already spent this month

  const afterBoot = normalizeStats(stored, 1, now); // subscription not resolved yet
  const afterPremium = normalizeStats(afterBoot, 3, now); // premium resolves

  assert.equal(afterBoot.freezeCount, 1, 'a smaller allowance only clamps');
  assert.equal(afterPremium.freezeCount, 1, 'the spent freezes stay spent');
  assert.equal(afterPremium.freezeAllowance, 3);
});

test('one missed day consumes a freeze and preserves the streak', () => {
  const stats = createDefaultStats(new Date(2026, 5, 15, 12));
  stats.currentStreak = 8;

  const reconciled = reconcileMissedStreak(
    stats,
    '2026-06-13',
    1,
    new Date(2026, 5, 15, 12),
  );

  assert.equal(reconciled.currentStreak, 8);
  assert.equal(reconciled.freezeCount, 0);
  assert.equal(reconciled.lastFreezeUsedAt, '2026-06-14');
});

test('completing after a protected missed day advances the streak', () => {
  const stats = createDefaultStats(new Date(2026, 5, 15, 12));
  stats.currentStreak = 8;
  stats.freezeCount = 0;
  stats.lastFreezeUsedAt = '2026-06-14';

  const result = advanceDailyStreak(
    stats,
    '2026-06-13',
    '2026-06-15',
    1,
    new Date(2026, 5, 15, 12),
  );

  assert.equal(result.stats.currentStreak, 9);
  assert.equal(result.freezeUsed, true);
});

test('one missed day offers a repair the user can still act on', () => {
  const now = new Date(2026, 5, 15, 12);
  const stats = createDefaultStats(now);
  stats.currentStreak = 47;

  const repair = pendingStreakRepair(stats, '2026-06-13', now);

  assert.deepEqual(repair, {
    missedDate: '2026-06-14',
    streakAtRisk: 47,
    canRepair: true,
  });
});

test('the repair stays offered once the freeze has been consumed for that day', () => {
  // The store spends the freeze silently as soon as the app opens, so by the time
  // the home screen renders the balance is already 0. If that hid the message, the
  // user would never learn that today's session is what saves their streak.
  const now = new Date(2026, 5, 15, 12);
  const stats = createDefaultStats(now);
  stats.currentStreak = 47;
  stats.freezeCount = 0;
  stats.lastFreezeUsedAt = '2026-06-14';

  const repair = pendingStreakRepair(stats, '2026-06-13', now);

  assert.equal(repair?.canRepair, true);
  assert.equal(repair?.streakAtRisk, 47);
});

test('without any freeze left the missed day cannot be repaired', () => {
  const now = new Date(2026, 5, 15, 12);
  const stats = createDefaultStats(now);
  stats.currentStreak = 47;
  stats.freezeCount = 0;

  const repair = pendingStreakRepair(stats, '2026-06-13', now);

  assert.equal(repair?.canRepair, false);
});

test('nothing to repair when no day was missed, or when too many were', () => {
  const now = new Date(2026, 5, 15, 12);
  const stats = createDefaultStats(now);
  stats.currentStreak = 47;

  // Yesterday's session was done: today is simply the next day.
  assert.equal(pendingStreakRepair(stats, '2026-06-14', now), undefined);
  // Today is already done.
  assert.equal(pendingStreakRepair(stats, '2026-06-15', now), undefined);
  // Three days gone: a single freeze cannot bridge that, and promising it would
  // be a lie the next screen would have to take back.
  assert.equal(pendingStreakRepair(stats, '2026-06-11', now), undefined);
  // No history, no streak: nothing is at risk.
  assert.equal(pendingStreakRepair(stats, undefined, now), undefined);
  assert.equal(
    pendingStreakRepair({ ...stats, currentStreak: 0 }, '2026-06-13', now),
    undefined,
  );
});

test('streak milestone XP follows the specification', () => {
  assert.equal(streakMilestoneXP(7), 100);
  assert.equal(streakMilestoneXP(30), 500);
  assert.equal(streakMilestoneXP(8), 0);
});

test('daily and bonus sessions receive the exact XP rules', () => {
  const daily = calculateSessionXP({
    reviews: 2,
    verses: 2,
    completedSurah: true,
    isDaily: true,
    isPerfect: true,
    streak: 7,
  });
  const bonus = calculateSessionXP({
    reviews: 2,
    verses: 2,
    completedSurah: true,
    isDaily: false,
    isPerfect: true,
    streak: 7,
  });

  assert.equal(daily.total, 460);
  assert.equal(bonus.total, 310);
  assert.equal(bonus.breakdown.dailyCompletion, 0);
  assert.equal(bonus.breakdown.streakMilestone, 0);
});

test('a perfect session requires at least one completed review', () => {
  assert.equal(isPerfectReviewSession(0, []), false);
  assert.equal(isPerfectReviewSession(2, ['good', 'good']), true);
  assert.equal(isPerfectReviewSession(2, ['good', 'hard']), false);
});

test('unlocks the complete regularity, memorization and special badge rules', () => {
  const stats = createDefaultStats(new Date(2026, 5, 15, 6));
  stats.totalSessions = 20;
  stats.currentStreak = 100;
  stats.consecutivePerfectSessions = 10;

  const unlocked = findUnlockedBadges(stats, {
    knownCount: 50,
    completedAt: new Date(2026, 5, 15, 6, 30),
    durationSeconds: 120,
  });

  assert.ok(unlocked.includes('streak_100'));
  assert.ok(unlocked.includes('surah_50'));
  assert.ok(unlocked.includes('fajr'));
  assert.ok(unlocked.includes('lightning'));
  assert.ok(unlocked.includes('perfect_10'));
});

test('every badge the awarder can emit exists in the catalogue, and vice-versa', () => {
  const maxStats = {
    ...createDefaultStats(),
    totalSessions: 1,
    currentStreak: 365,
    consecutivePerfectSessions: 10,
    badges: [] as string[],
  };
  // Two calls because fajr (<7h) and isha (>=22h) are mutually exclusive.
  const morning = findUnlockedBadges(maxStats, {
    knownCount: 114,
    completedAt: new Date(2026, 0, 1, 6, 0, 0),
    durationSeconds: 1,
  });
  const night = findUnlockedBadges(maxStats, {
    knownCount: 114,
    completedAt: new Date(2026, 0, 1, 22, 0, 0),
    durationSeconds: 1,
  });

  const emittable = new Set([...morning, ...night]);
  const catalogue = new Set(badges.map((badge) => badge.id));

  assert.deepEqual(
    [...emittable].sort(),
    [...catalogue].sort(),
    'findUnlockedBadges and src/data/badges.ts must define the exact same ids — a mismatch renders a blank badge',
  );
});
