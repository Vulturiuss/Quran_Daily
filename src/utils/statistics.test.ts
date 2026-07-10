import assert from 'node:assert/strict';
import test from 'node:test';

import { SessionRecord } from '@/types';
import { buildActivitySeries, summarizeActivity } from './statistics';

const history: SessionRecord[] = [
  {
    date: '2026-06-15',
    completedAt: '2026-06-15T08:00:00.000Z',
    durationSeconds: 300,
    xpEarned: 120,
    surahsReviewed: 2,
    versesLearned: 1,
    isPerfect: true,
    sessionCount: 2,
    perfectSessionCount: 1,
  },
  {
    date: '2026-06-13',
    completedAt: '2026-06-13T08:00:00.000Z',
    durationSeconds: 120,
    xpEarned: 70,
    surahsReviewed: 1,
    versesLearned: 0,
    isPerfect: false,
  },
];

test('builds a continuous seven-day activity series', () => {
  const series = buildActivitySeries(history, 7, new Date(2026, 5, 15, 12));

  assert.equal(series.length, 7);
  assert.equal(series[0].date, '2026-06-09');
  assert.equal(series[4].xp, 70);
  assert.equal(series[6].sessions, 2);
});

test('summarizes sessions, active days, minutes and XP without losing bonus sessions', () => {
  const summary = summarizeActivity(
    buildActivitySeries(history, 7, new Date(2026, 5, 15, 12)),
  );

  assert.deepEqual(summary, {
    activeDays: 2,
    xp: 190,
    sessions: 3,
    minutes: 7,
    perfectSessions: 1,
  });
});
