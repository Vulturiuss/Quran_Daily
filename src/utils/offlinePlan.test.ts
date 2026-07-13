import assert from 'node:assert/strict';
import test from 'node:test';

import type { UserSurahProgress } from '@/types';
import { offlineKeep, offlinePurge, offlineTargets } from './offlinePlan';

const NOW = new Date('2026-07-12T09:00:00.000Z');

function at(days: number) {
  return new Date(NOW.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}

function item(
  surahNumber: number,
  overrides: Partial<UserSurahProgress>,
): UserSurahProgress {
  return {
    surahNumber,
    status: 'known',
    versesLearned: 0,
    totalVerses: 10,
    reviewIntervalDays: 1,
    easeFactor: 2.5,
    reviewCount: 0,
    ...overrides,
  };
}

function library(...items: UserSurahProgress[]) {
  return Object.fromEntries(items.map((entry) => [entry.surahNumber, entry]));
}

test('what is being learnt comes first, then what is about to be reviewed', () => {
  const progress = library(
    item(2, { status: 'learning', updatedAt: at(-1) }),
    item(36, { status: 'verifying', updatedAt: at(-3) }),
    // Due in two days: fetched ahead of time, not on the morning it is asked for.
    item(67, { nextReviewAt: at(2), lastReviewedAt: at(-5) }),
    // Overdue: the most urgent of the reviews.
    item(112, { nextReviewAt: at(-1), lastReviewedAt: at(-8) }),
  );

  assert.deepEqual(offlineTargets(progress, NOW), [2, 36, 112, 67]);
});

test('a review a month away is not downloaded, and a locked surah never is', () => {
  const progress = library(
    item(18, { nextReviewAt: at(30), lastReviewedAt: at(-1) }),
    item(55, { status: 'locked', updatedAt: at(-1) }),
  );

  assert.deepEqual(offlineTargets(progress, NOW), []);
});

test('a surah reviewed in the last two weeks keeps its audio', () => {
  // Deleting it the day after its review, only to fetch it again a few days
  // later, would trade bandwidth for nothing.
  const progress = library(item(18, { nextReviewAt: at(30), lastReviewedAt: at(-3) }));

  assert.deepEqual(offlineKeep(progress, NOW), [18]);
  assert.deepEqual(offlinePurge([18], progress, NOW), []);
});

test('what has stopped being relevant leaves the disk', () => {
  const progress = library(
    item(2, { status: 'learning', updatedAt: at(-1) }),
    // Reviewed long ago and not due for a month: past its grace period.
    item(18, { nextReviewAt: at(25), lastReviewedAt: at(-40) }),
    // Given up on: demoted out of learning, so nothing will play it.
    item(55, { status: 'locked', updatedAt: at(-2) }),
  );

  // 99 is not in the library at all — a leftover from a reset, or an older plan.
  assert.deepEqual(offlinePurge([2, 18, 55, 99], progress, NOW), [18, 55, 99]);
});
