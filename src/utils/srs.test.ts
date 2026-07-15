import assert from 'node:assert/strict';
import test from 'node:test';

import { calculateNextReview, isDue, scheduleAfterReview } from './srs';
import { UserSurahProgress } from '../types';

const base: UserSurahProgress = {
  surahNumber: 112,
  status: 'known',
  versesLearned: 4,
  totalVerses: 4,
  reviewIntervalDays: 4,
  easeFactor: 2.5,
  reviewCount: 2,
};

test('good review expands the interval and slightly raises ease', () => {
  const next = calculateNextReview(base, 'good', new Date('2026-06-14T10:00:00Z'));
  assert.equal(next.reviewIntervalDays, 10);
  assert.equal(next.easeFactor, 2.55);
  assert.equal(next.reviewCount, 3);
});

test('forgotten review resets interval to one day', () => {
  const next = calculateNextReview(base, 'forgot', new Date('2026-06-14T10:00:00Z'));
  assert.equal(next.reviewIntervalDays, 1);
  assert.equal(next.easeFactor, 2.25);
});

test('known surah without a review date is due immediately', () => {
  assert.equal(isDue(base, new Date('2026-06-14T10:00:00Z')), true);
});

test('hard review halves the interval and lowers ease', () => {
  const next = calculateNextReview(base, 'hard', new Date('2026-06-14T10:00:00Z'));
  assert.equal(next.reviewIntervalDays, 2);
  assert.equal(next.easeFactor, 2.35);
  assert.equal(next.reviewCount, 3);
});

test('the interval never exceeds the 180 day cap', () => {
  const mature = { ...base, reviewIntervalDays: 150, easeFactor: 3 };
  const next = calculateNextReview(mature, 'good', new Date('2026-06-14T10:00:00Z'));
  assert.equal(next.reviewIntervalDays, 180);
});

const now = new Date('2026-06-14T10:00:00Z');
const notDue: UserSurahProgress = {
  ...base,
  reviewIntervalDays: 20,
  nextReviewAt: '2026-06-30T10:00:00Z',
  lastReviewedAt: '2026-06-10T10:00:00Z',
};

test('a bonus review of a surah that is not due never pushes it further out', () => {
  const next = scheduleAfterReview(notDue, 'good', now);

  assert.equal(next.nextReviewAt, notDue.nextReviewAt, 'due date is untouched');
  assert.equal(next.reviewIntervalDays, 20, 'interval is untouched');
  assert.equal(next.reviewCount, 3, 'the review still counts');
  assert.equal(next.easeFactor, 2.55, 'and still earns the ease bump');
});

test('forgetting a surah that is not due still pulls its review in', () => {
  const next = scheduleAfterReview(notDue, 'forgot', now);

  assert.equal(next.reviewIntervalDays, 1);
  assert.ok(
    new Date(next.nextReviewAt!) < new Date(notDue.nextReviewAt!),
    'a forgotten surah must come back sooner, bonus session or not',
  );
});

test('a due surah is scheduled normally', () => {
  const next = scheduleAfterReview(base, 'good', now);
  assert.equal(next.reviewIntervalDays, 10);
});

test('a review is due any time on its scheduled day, not only after its clock hour', () => {
  const progress: UserSurahProgress = { ...base, nextReviewAt: '2026-06-15T20:05:00' };
  // Same day, earlier hour than the one addDays preserved: still due.
  assert.equal(isDue(progress, new Date('2026-06-15T08:00:00')), true);
  // The evening before: not yet due.
  assert.equal(isDue(progress, new Date('2026-06-14T23:00:00')), false);
});

test('the first good review of an onboarding-scheduled surah grows its interval, not collapses it', () => {
  const onboardingKnown: UserSurahProgress = {
    ...base,
    reviewIntervalDays: 14,
    reviewCount: 0,
  };
  const next = calculateNextReview(onboardingKnown, 'good', new Date('2026-06-14T10:00:00Z'));
  assert.equal(next.reviewIntervalDays, 35, '14 * 2.5, not a hard-set 2');
});

test('the first good review of a freshly-learnt surah still graduates to 2 days', () => {
  const fresh: UserSurahProgress = { ...base, reviewIntervalDays: 1, reviewCount: 0 };
  const next = calculateNextReview(fresh, 'good', new Date('2026-06-14T10:00:00Z'));
  assert.equal(next.reviewIntervalDays, 2);
});
