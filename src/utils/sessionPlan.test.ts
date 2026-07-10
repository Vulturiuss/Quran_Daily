import assert from 'node:assert/strict';
import test from 'node:test';

import { UserProfile, UserSurahProgress } from '@/types';
import { buildSessionPreview } from './sessionPlan';

const profile: UserProfile = {
  displayName: 'Amin',
  dailyGoalMinutes: 5,
  dailyGoalReviews: 2,
  dailyGoalVerses: 2,
  notificationTime: '20:00',
  notificationsEnabled: false,
  preferredReciter: 'mishary',
  showReviewTransliteration: false,
  showReviewTranslation: false,
};

function progress(
  surahNumber: number,
  overrides: Partial<UserSurahProgress>,
): UserSurahProgress {
  return {
    surahNumber,
    status: 'known',
    versesLearned: 4,
    totalVerses: 4,
    reviewIntervalDays: 1,
    easeFactor: 2.5,
    reviewCount: 1,
    ...overrides,
  };
}

test('builds tomorrow preview from due reviews and remaining verses', () => {
  const result = buildSessionPreview(
    {
      112: progress(112, { nextReviewAt: '2026-06-16T08:00:00.000Z' }),
      113: progress(113, { nextReviewAt: '2026-06-17T08:00:00.000Z' }),
      103: progress(103, {
        status: 'learning',
        versesLearned: 2,
        totalVerses: 3,
      }),
    },
    profile,
    new Date('2026-06-16T12:00:00.000Z'),
  );

  assert.deepEqual(result, {
    estimatedMinutes: 4,
    learningVerseEnd: 3,
    learningVerseStart: 3,
    reviewCount: 1,
    reviewSurahNumbers: [112],
    versesCount: 1,
    learningSurah: 103,
  });
});

test('filters premium content from a free daily preview', () => {
  const result = buildSessionPreview(
    {
      2: progress(2, { nextReviewAt: '2026-06-15T08:00:00.000Z' }),
      112: progress(112, { nextReviewAt: '2026-06-15T08:00:00.000Z' }),
      3: progress(3, {
        status: 'learning',
        versesLearned: 1,
        totalVerses: 4,
      }),
    },
    profile,
    new Date('2026-06-16T12:00:00.000Z'),
    3,
    [1, 108, 112, 113, 114],
  );

  assert.deepEqual(result, {
    estimatedMinutes: 2,
    learningVerseEnd: undefined,
    learningVerseStart: undefined,
    reviewCount: 1,
    reviewSurahNumbers: [112],
    versesCount: 0,
    learningSurah: undefined,
  });
});
