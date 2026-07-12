import assert from 'node:assert/strict';
import test from 'node:test';

// Must come before the store: it installs the localStorage shim that the
// persist middleware writes through under node. See the module for why.
import '@/testing/storageStub';

import { createDefaultStats } from '@/utils/gamification';
import { addDays, dateKey } from '@/utils/date';

import { useQuranStore } from './useQuranStore';

const YESTERDAY = dateKey(addDays(new Date(), -1));

function reset() {
  useQuranStore.setState({
    onboardingCompleted: true,
    progress: {},
    stats: createDefaultStats(),
    history: [],
    activeSession: undefined,
    lastSummary: undefined,
    syncMeta: { dirty: false },
  });
}

function learningState(surahNumber: number, totalVerses: number, learningQueue: number[]) {
  reset();
  useQuranStore.setState({
    profile: { ...useQuranStore.getState().profile, learningQueue, dailyGoalVerses: 10 },
    progress: {
      [surahNumber]: {
        surahNumber,
        status: 'learning',
        versesLearned: totalVerses - 1,
        totalVerses,
        reviewIntervalDays: 1,
        easeFactor: 2.5,
        reviewCount: 0,
      },
    },
    activeSession: {
      date: dateKey(),
      startedAt: new Date().toISOString(),
      reviewQueue: [],
      reviewIndex: 0,
      ratings: [],
      learningSurah: surahNumber,
      verseStart: totalVerses - 1,
      versesTarget: 1,
      versesLearned: 0,
    },
  });
}

test('finishing a surah that is also queued does not re-promote itself', () => {
  // Surah 112 is the active learning surah AND sits in the queue (the user added
  // it to the queue, then also tapped "apprendre"). Promoting the head of the
  // queue used to overwrite the just-completed surah back to `learning` with
  // versesLearned === totalVerses: stuck at 100%, never advancing.
  learningState(112, 4, [112, 113]);

  useQuranStore.getState().learnCurrentVerse();
  const state = useQuranStore.getState();

  assert.equal(state.progress[112].status, 'known', '112 is finished, not learning');
  assert.equal(state.progress[113]?.status, 'learning', '113 takes over');
  assert.deepEqual(state.profile.learningQueue, [], 'both leave the queue');
});

test('a surah already known is skipped when promoting from the queue', () => {
  learningState(112, 4, [113]);
  useQuranStore.setState((current) => ({
    progress: {
      ...current.progress,
      113: {
        surahNumber: 113,
        status: 'known',
        versesLearned: 5,
        totalVerses: 5,
        reviewIntervalDays: 3,
        easeFactor: 2.5,
        reviewCount: 1,
      },
    },
    profile: { ...current.profile, learningQueue: [113, 114] },
  }));

  useQuranStore.getState().learnCurrentVerse();
  const state = useQuranStore.getState();

  assert.equal(state.progress[113].status, 'known', '113 stays known');
  assert.equal(state.progress[114]?.status, 'learning', '114 is promoted instead');
});

test('picking a surah to learn removes it from the queue', () => {
  reset();
  useQuranStore.setState((current) => ({
    profile: { ...current.profile, learningQueue: [113, 114] },
  }));

  useQuranStore.getState().setLearningSurah(113);

  assert.deepEqual(useQuranStore.getState().profile.learningQueue, [114]);
  assert.equal(useQuranStore.getState().progress[113].status, 'learning');
});

test('a session with nothing reviewed and nothing learned earns no credit', () => {
  reset();
  // No known surahs and no learning surah: the plan is empty.
  useQuranStore.getState().startDailySession();
  const session = useQuranStore.getState().activeSession;
  assert.equal(session?.reviewQueue.length, 0);
  assert.equal(session?.versesTarget, 0);

  const summary = useQuranStore.getState().completeDailySession();

  assert.equal(summary, undefined, 'no summary for an empty session');
  assert.deepEqual(useQuranStore.getState().history, [], 'no history record');
  assert.equal(useQuranStore.getState().stats.currentStreak, 0, 'no streak day');
  assert.equal(useQuranStore.getState().stats.totalXP, 0, 'no XP');
  assert.equal(useQuranStore.getState().activeSession, undefined);
});

test('an abandoned session is credited to the day it was worked, not today', () => {
  reset();
  useQuranStore.setState({
    progress: {
      112: {
        surahNumber: 112,
        status: 'learning',
        versesLearned: 0,
        totalVerses: 4,
        reviewIntervalDays: 1,
        easeFactor: 2.5,
        reviewCount: 0,
      },
    },
    activeSession: {
      date: YESTERDAY,
      startedAt: `${YESTERDAY}T20:00:00.000Z`,
      reviewQueue: [],
      reviewIndex: 0,
      ratings: [],
      learningSurah: 112,
      verseStart: 0,
      versesTarget: 2,
      versesLearned: 2,
    },
  });

  const summary = useQuranStore.getState().completeDailySession();
  const history = useQuranStore.getState().history;

  assert.ok(summary, 'the work done yesterday is still credited');
  assert.equal(history.length, 1);
  assert.equal(history[0].date, YESTERDAY, 'credited to yesterday, not today');
  assert.equal(summary?.isBonus, false, 'it earns the daily credit for that day');
});

test('an overnight session does not inflate the recorded duration', () => {
  reset();
  useQuranStore.setState({
    activeSession: {
      date: YESTERDAY,
      // Started 14 hours ago and only flushed now.
      startedAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
      reviewQueue: [],
      reviewIndex: 0,
      ratings: [],
      verseStart: 0,
      versesTarget: 1,
      versesLearned: 1,
    },
  });

  const summary = useQuranStore.getState().completeDailySession();

  assert.ok(summary);
  assert.ok(
    summary!.durationSeconds <= 3600,
    `duration ${summary!.durationSeconds}s should be clamped to one hour`,
  );
  assert.ok(useQuranStore.getState().stats.totalMinutes <= 60);
});

test("yesterday's leftover session does not steal today's daily credit", () => {
  reset();
  useQuranStore.setState({
    history: [
      {
        date: YESTERDAY,
        completedAt: `${YESTERDAY}T20:30:00.000Z`,
        durationSeconds: 300,
        xpEarned: 60,
        surahsReviewed: 0,
        versesLearned: 2,
        isPerfect: false,
      },
    ],
    stats: { ...createDefaultStats(), currentStreak: 1 },
    activeSession: {
      date: dateKey(),
      startedAt: new Date().toISOString(),
      reviewQueue: [],
      reviewIndex: 0,
      ratings: [],
      verseStart: 0,
      versesTarget: 1,
      versesLearned: 1,
    },
  });

  const summary = useQuranStore.getState().completeDailySession();

  assert.equal(summary?.isBonus, false, "today's real session is not a bonus");
  assert.equal(
    useQuranStore.getState().stats.currentStreak,
    2,
    'the streak advances from yesterday to today',
  );
});
