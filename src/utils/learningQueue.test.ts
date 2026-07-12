import assert from 'node:assert/strict';
import test from 'node:test';

import { UserProfile, UserSurahProgress } from '../types';
import { healLearningState } from './learningQueue';

const profile: UserProfile = {
  displayName: 'Amin',
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
};

function progressOf(partial: Partial<UserSurahProgress> & { surahNumber: number }) {
  return {
    status: 'learning' as const,
    versesLearned: 0,
    totalVerses: 4,
    reviewIntervalDays: 1,
    easeFactor: 2.5,
    reviewCount: 0,
    ...partial,
  };
}

test('a fully learnt surah stuck on "learning" is marked known and hands over', () => {
  // Exactly the corrupted state the bug left behind: 112 finished (4/4) but still
  // "learning", pinned at 100%, with itself still queued behind 113.
  const healed = healLearningState({
    progress: {
      112: progressOf({ surahNumber: 112, versesLearned: 4, totalVerses: 4 }),
    },
    profile: { ...profile, learningQueue: [112, 113] },
  });

  assert.equal(healed.progress[112].status, 'known');
  assert.ok(healed.progress[112].nextReviewAt, 'it becomes reviewable');
  assert.equal(healed.progress[113].status, 'learning', '113 takes over');
  assert.deepEqual(healed.profile.learningQueue, []);
  assert.equal(healed.progress[113].totalVerses, 5, 'An-Nas has 5 verses, not 0');
});

test('the queue drops the surah currently being learnt', () => {
  const healed = healLearningState({
    progress: { 112: progressOf({ surahNumber: 112, versesLearned: 1 }) },
    profile: { ...profile, learningQueue: [112, 113] },
  });

  assert.equal(healed.progress[112].status, 'learning', 'still in progress');
  assert.deepEqual(healed.profile.learningQueue, [113], 'no longer queued behind itself');
});

test('the queue drops surahs already known', () => {
  const healed = healLearningState({
    progress: {
      112: progressOf({ surahNumber: 112, versesLearned: 1 }),
      113: progressOf({ surahNumber: 113, status: 'known', versesLearned: 5, totalVerses: 5 }),
    },
    profile: { ...profile, learningQueue: [113, 114] },
  });

  assert.deepEqual(healed.profile.learningQueue, [114]);
});

test('healthy state is returned untouched', () => {
  const state = {
    progress: { 112: progressOf({ surahNumber: 112, versesLearned: 2 }) },
    profile: { ...profile, learningQueue: [113] },
  };

  const healed = healLearningState(state);

  assert.equal(healed.progress, state.progress, 'same reference, nothing rebuilt');
  assert.equal(healed.profile, state.profile);
});
