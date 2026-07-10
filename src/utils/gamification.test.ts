import assert from 'node:assert/strict';
import test from 'node:test';

import {
  advanceDailyStreak,
  calculateSessionXP,
  createDefaultStats,
  findUnlockedBadges,
  isPerfectReviewSession,
  normalizeStats,
  reconcileMissedStreak,
  streakMilestoneXP,
} from './gamification';

test('weekly XP and freezes reset on their calendar boundaries', () => {
  const stats = createDefaultStats(new Date(2026, 4, 25, 12));
  stats.weeklyXP = 340;
  stats.freezeCount = 0;

  const normalized = normalizeStats(stats, 3, new Date(2026, 5, 15, 12));

  assert.equal(normalized.weeklyXP, 0);
  assert.equal(normalized.freezeCount, 3);
  assert.equal(normalized.freezeAllowance, 3);
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
