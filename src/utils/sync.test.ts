import assert from 'node:assert/strict';
import test from 'node:test';

import { CloudSnapshot } from '../types';
import { createDefaultStats } from './gamification';
import { mergeCloudSnapshots } from './sync';

function snapshot(updatedAt: string): CloudSnapshot {
  return {
    schemaVersion: 1,
    updatedAt,
    onboardingCompleted: true,
    profile: {
      displayName: updatedAt,
      dailyGoalMinutes: 5,
      dailyGoalVerses: 2,
      dailyGoalReviews: 2,
      notificationTime: '20:00',
      notificationsEnabled: false,
      preferredReciter: 'mishary',
      showReviewTransliteration: false,
      showReviewTranslation: false,
      theme: 'teal',
      learningQueue: [],
    },
    progress: {},
    stats: createDefaultStats(new Date('2026-06-14T12:00:00')),
    history: [],
  };
}

test('merge keeps the newest progress item and profile', () => {
  const local = snapshot('2026-06-14T12:00:00.000Z');
  const remote = snapshot('2026-06-14T11:00:00.000Z');
  local.progress[112] = {
    surahNumber: 112,
    status: 'known',
    versesLearned: 4,
    totalVerses: 4,
    reviewIntervalDays: 2,
    easeFactor: 2.5,
    reviewCount: 1,
    updatedAt: '2026-06-14T10:00:00.000Z',
  };
  remote.progress[112] = {
    ...local.progress[112],
    reviewCount: 3,
    updatedAt: '2026-06-14T11:30:00.000Z',
  };

  const merged = mergeCloudSnapshots(
    local,
    remote,
    '2026-06-14T13:00:00.000Z',
  );

  assert.equal(merged.profile.displayName, local.updatedAt);
  assert.equal(merged.progress[112].reviewCount, 3);
});

test('merge unions session history, concurrent sessions and badges', () => {
  const local = snapshot('2026-06-14T12:00:00.000Z');
  const remote = snapshot('2026-06-14T11:00:00.000Z');
  local.stats.badges = ['first-session'];
  remote.stats.badges = ['streak-7'];
  local.history = [
    {
      date: '2026-06-14',
      completedAt: '2026-06-14T12:00:00.000Z',
      durationSeconds: 120,
      xpEarned: 70,
      surahsReviewed: 1,
      versesLearned: 1,
      isPerfect: true,
    },
  ];
  remote.history = [
    {
      ...local.history[0],
      completedAt: '2026-06-14T11:00:00.000Z',
      xpEarned: 50,
    },
    {
      ...local.history[0],
      date: '2026-06-13',
      completedAt: '2026-06-13T12:00:00.000Z',
    },
  ];

  const merged = mergeCloudSnapshots(local, remote);

  assert.equal(merged.history.length, 2);
  assert.equal(merged.history[0].xpEarned, 120);
  assert.equal(merged.history[0].sessionCount, 2);
  assert.deepEqual(new Set(merged.stats.badges), new Set(['first-session', 'streak-7']));
  assert.equal(merged.stats.totalSessions, 3);
});

test('an incomplete local reset cannot erase an onboarded remote snapshot', () => {
  const local = snapshot('2026-06-14T13:00:00.000Z');
  const remote = snapshot('2026-06-14T12:00:00.000Z');
  local.onboardingCompleted = false;
  local.progress = {};
  local.history = [];
  remote.progress[112] = {
    surahNumber: 112,
    status: 'known',
    versesLearned: 4,
    totalVerses: 4,
    reviewIntervalDays: 2,
    easeFactor: 2.5,
    reviewCount: 1,
  };

  const merged = mergeCloudSnapshots(local, remote);

  assert.equal(merged.onboardingCompleted, true);
  assert.equal(merged.progress[112].status, 'known');
});
