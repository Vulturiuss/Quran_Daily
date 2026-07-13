import assert from 'node:assert/strict';
import test from 'node:test';

import { UserSurahProgress } from '../types';
import { currentRamadan, JUZ_AMMA_SURAHS, ramadanProgress } from './ramadan';

function progress(
  surahNumber: number,
  partial: Partial<UserSurahProgress>,
): UserSurahProgress {
  return {
    surahNumber,
    status: 'learning',
    versesLearned: 0,
    totalVerses: 10,
    reviewIntervalDays: 1,
    easeFactor: 2.5,
    reviewCount: 0,
    ...partial,
  };
}

test('nothing is announced outside the season', () => {
  assert.equal(currentRamadan(new Date('2026-08-01T12:00:00Z')), undefined);
});

test('the run-up is announced, but not yet counted', () => {
  const window = currentRamadan(new Date('2026-02-10T12:00:00Z'))!;

  assert.equal(window.isApproaching, true);
  assert.equal(window.hasStarted, false);
  assert.equal(window.dayNumber, 0, 'day 1 is when it starts, not before');
});

test('once it starts, the day is counted', () => {
  const window = currentRamadan(new Date('2026-02-17T12:00:00Z'))!;
  assert.equal(window.hasStarted, true);
  assert.equal(window.dayNumber, 1);

  const tenth = currentRamadan(new Date('2026-02-26T12:00:00Z'))!;
  assert.equal(tenth.dayNumber, 10);
  assert.equal(tenth.totalDays, 31);
});

test('the last day still counts, the day after does not', () => {
  assert.ok(currentRamadan(new Date('2026-03-19T12:00:00Z')));
  assert.equal(currentRamadan(new Date('2026-03-20T12:00:00Z')), undefined);
});

test('the pace needed is what is left, over the days that are left', () => {
  const window = currentRamadan(new Date('2026-02-17T12:00:00Z'))!; // day 1 of 31
  const result = ramadanProgress(
    { surahNumbers: [112, 113], startedAt: '2026-02-17' },
    {
      112: progress(112, { totalVerses: 4, versesLearned: 0 }),
      113: progress(113, { totalVerses: 5, versesLearned: 0 }),
    },
    window,
  );

  assert.equal(result.versesTotal, 9);
  assert.equal(result.versesLearned, 0);
  assert.ok(result.versesPerDayNeeded > 0 && result.versesPerDayNeeded < 1);
  assert.equal(result.surahsDone, 0);
});

test('a finished goal asks nothing more of the user', () => {
  const window = currentRamadan(new Date('2026-03-01T12:00:00Z'))!;
  const result = ramadanProgress(
    { surahNumbers: [112], startedAt: '2026-02-17' },
    { 112: progress(112, { status: 'known', totalVerses: 4, versesLearned: 4 }) },
    window,
  );

  assert.equal(result.progress, 1);
  assert.equal(result.surahsDone, 1);
  assert.equal(result.versesPerDayNeeded, 0, 'no pace to keep once it is done');
  assert.equal(result.onTrack, true);
});

test('Juz Amma is the 37 surahs a beginner actually sets out to do', () => {
  assert.equal(JUZ_AMMA_SURAHS.length, 37);
  assert.equal(JUZ_AMMA_SURAHS[0], 78, 'An-Naba');
  assert.equal(JUZ_AMMA_SURAHS.at(-1), 114, 'An-Nas');
});
