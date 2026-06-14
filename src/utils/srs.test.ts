import assert from 'node:assert/strict';
import test from 'node:test';

import { calculateNextReview, isDue } from './srs';
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
