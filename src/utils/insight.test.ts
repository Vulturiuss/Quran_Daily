import assert from 'node:assert/strict';
import test from 'node:test';

import { SessionRecord, UserSurahProgress } from '../types';
import { addDays, dateKey } from './date';
import { buildInsight } from './insight';

const NOW = new Date('2026-07-13T10:00:00.000Z');

function progress(
  surahNumber: number,
  partial: Partial<UserSurahProgress>,
): UserSurahProgress {
  return {
    surahNumber,
    status: 'known',
    versesLearned: 10,
    totalVerses: 10,
    reviewIntervalDays: 3,
    easeFactor: 2.5,
    reviewCount: 2,
    ...partial,
  };
}

function record(dayOffset: number, versesLearned: number, minutes: number): SessionRecord {
  return {
    date: dateKey(addDays(NOW, dayOffset)),
    completedAt: NOW.toISOString(),
    durationSeconds: minutes * 60,
    xpEarned: 50,
    surahsReviewed: 1,
    versesLearned,
    isPerfect: false,
  };
}

test('the fragile surahs come first: what to work on, in order', () => {
  const insight = buildInsight(
    {
      2: progress(2, { totalVerses: 100, versesLearned: 100, weakVerses: [1, 2, 3] }),
      112: progress(112, { totalVerses: 4, versesLearned: 4, weakVerses: [2] }),
      113: progress(113, { totalVerses: 5, versesLearned: 5 }),
    },
    [],
    NOW,
  );

  // 112 holds at 75%, Al-Baqara at 97% — the small surah is the weaker one, and
  // that is exactly the sort of thing a user cannot see for themselves.
  assert.deepEqual(
    insight.fragile.map((item) => item.surahNumber),
    [112, 2],
  );
  assert.equal(insight.fragile[0].solidity, 0.75);
  assert.equal(insight.weakVerseCount, 4);
  assert.ok(
    !insight.fragile.some((item) => item.surahNumber === 113),
    'a surah with nothing weak is not a worry',
  );
});

test('the pace is measured over the window, skipped days included', () => {
  const insight = buildInsight(
    { 2: progress(2, { status: 'learning', totalVerses: 286, versesLearned: 10 }) },
    [record(-1, 2, 5), record(-2, 2, 5), record(-3, 3, 6)],
    NOW,
  );

  // 7 verses over a 14-day window: half a verse a day. Averaging over active days
  // only would flatter the user; the days they skipped are part of the answer.
  assert.equal(insight.pace, 0.5);
  assert.equal(insight.minutesPerActiveDay, 5);
});

test('the projection says when the surah in progress will be done', () => {
  const insight = buildInsight(
    { 112: progress(112, { status: 'learning', totalVerses: 4, versesLearned: 1 }) },
    [record(-1, 2, 5), record(-2, 2, 5), record(-3, 2, 5), record(-4, 2, 5)],
    NOW,
  );

  // 8 verses in 14 days -> 0.57/day; 3 verses left -> 6 days.
  assert.equal(insight.projectedCompletion, dateKey(addDays(NOW, 6)));
});

test('no history means no invented projection', () => {
  const insight = buildInsight(
    { 112: progress(112, { status: 'learning', totalVerses: 4, versesLearned: 1 }) },
    [],
    NOW,
  );

  assert.equal(insight.pace, 0);
  assert.equal(
    insight.projectedCompletion,
    undefined,
    'better to say nothing than to promise a date out of thin air',
  );
});
