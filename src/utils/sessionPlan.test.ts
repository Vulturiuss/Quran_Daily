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
  theme: 'teal',
  learningQueue: [],
  offlineAudioAuto: true,
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
    // Nothing was learnt inside the sabqi window here, and no surah is waiting for
    // its final recitation — but the preview reports both, so the home screen can
    // stop announcing "2 verses" for a session that starts with eight replays.
    sabqiCount: 0,
    awaitingVerification: undefined,
    learningSurah: 103,
  });
});

test('no surah is gated: every due surah counts towards the preview', () => {
  // Surah 2 (Al-Baqara) used to be Premium-only and was filtered out of a free
  // user's preview. Nothing is gated any more — the only bound is the daily goal,
  // which is 2 reviews here.
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
  );

  assert.equal(result.reviewCount, 2, 'both due surahs are reviewable');
  assert.deepEqual(
    [...result.reviewSurahNumbers].sort((a, b) => a - b),
    [2, 112],
  );
  assert.equal(result.learningSurah, 3, 'the learning surah is not gated either');
  assert.equal(result.versesCount, 2, 'the full daily goal of 2 verses');
});

test('with several surahs learnt in parallel, the preview follows the chosen one', () => {
  const state = {
    3: progress(3, {
      status: 'learning',
      versesLearned: 1,
      totalVerses: 4,
      updatedAt: '2026-06-16T09:00:00.000Z',
    }),
    103: progress(103, {
      status: 'learning',
      versesLearned: 0,
      totalVerses: 3,
      updatedAt: '2026-06-16T10:00:00.000Z',
    }),
  };
  const at = new Date('2026-06-16T12:00:00.000Z');

  assert.equal(
    buildSessionPreview(state, profile, at).learningSurah,
    103,
    'defaults to the most recently touched surah',
  );
  assert.equal(
    buildSessionPreview(state, profile, at, 3).learningSurah,
    3,
    'follows the explicit choice',
  );
});
