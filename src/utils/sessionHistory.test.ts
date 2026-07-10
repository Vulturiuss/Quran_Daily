import assert from 'node:assert/strict';
import test from 'node:test';

import { SessionEntry } from '../types';
import {
  aggregateSessionRecord,
  appendSessionEntry,
  mergeSessionRecords,
} from './sessionHistory';

function entry(id: string, completedAt: string, xpEarned: number): SessionEntry {
  return {
    id,
    completedAt,
    durationSeconds: 60,
    xpEarned,
    surahsReviewed: 1,
    versesLearned: 1,
    isPerfect: true,
    sessionCount: 1,
    perfectSessionCount: 1,
  };
}

test('appends bonus sessions without losing the first session of the day', () => {
  const first = aggregateSessionRecord('2026-06-15', [
    entry('session-a', '2026-06-15T08:00:00.000Z', 70),
  ]);
  const combined = appendSessionEntry(
    first,
    '2026-06-15',
    entry('session-b', '2026-06-15T20:00:00.000Z', 50),
  );

  assert.equal(combined.xpEarned, 120);
  assert.equal(combined.sessionCount, 2);
  assert.equal(combined.sessions?.length, 2);
});

test('merges concurrent same-day sessions and deduplicates shared entries', () => {
  const shared = entry('session-a', '2026-06-15T08:00:00.000Z', 70);
  const local = aggregateSessionRecord('2026-06-15', [
    shared,
    entry('session-b', '2026-06-15T12:00:00.000Z', 50),
  ]);
  const remote = aggregateSessionRecord('2026-06-15', [
    shared,
    entry('session-c', '2026-06-15T18:00:00.000Z', 40),
  ]);

  const merged = mergeSessionRecords(local, remote);

  assert.equal(merged.xpEarned, 160);
  assert.equal(merged.sessionCount, 3);
  assert.equal(merged.sessions?.length, 3);
});
