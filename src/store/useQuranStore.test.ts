import assert from 'node:assert/strict';
import test from 'node:test';

// Must come before the store: it installs the localStorage shim that the
// persist middleware writes through under node. See the module for why.
import '@/testing/storageStub';

import { createDefaultStats } from '@/utils/gamification';
import { addDays, dateKey } from '@/utils/date';

import { selectLearningSurahs, useQuranStore } from './useQuranStore';

const YESTERDAY = dateKey(addDays(new Date(), -1));

function reset() {
  useQuranStore.setState({
    onboardingCompleted: true,
    progress: {},
    stats: createDefaultStats(),
    history: [],
    pendingSessions: [],
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
      activeSeconds: 0
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

test('a free user learns one surah at a time: a new pick replaces the old', () => {
  reset();
  useQuranStore.getState().setLearningSurah(112, 1);
  useQuranStore.getState().setLearningSurah(113, 1);

  const { progress } = useQuranStore.getState();
  assert.equal(progress[113].status, 'learning');
  assert.equal(progress[112].status, 'locked', 'the previous one steps aside');
});

test('a premium user learns up to three surahs in parallel', () => {
  reset();
  useQuranStore.getState().setLearningSurah(112, 3);
  useQuranStore.getState().setLearningSurah(113, 3);
  useQuranStore.getState().setLearningSurah(114, 3);

  const active = selectLearningSurahs(useQuranStore.getState());
  assert.deepEqual(
    active.map((item) => item.surahNumber).sort(),
    [112, 113, 114],
    'all three stay active',
  );
});

test('a fourth surah pushes out the least recently touched one', () => {
  reset();
  [112, 113, 114].forEach((number) =>
    useQuranStore.getState().setLearningSurah(number, 3),
  );
  useQuranStore.getState().setLearningSurah(103, 3);

  const state = useQuranStore.getState();
  const active = selectLearningSurahs(state).map((item) => item.surahNumber);
  assert.equal(active.length, 3, 'still capped at three');
  assert.ok(active.includes(103), 'the new one is active');
  assert.equal(state.progress[112].status, 'locked', 'the oldest stepped aside');
});

test('the session works on the chosen surah among those learnt in parallel', () => {
  reset();
  useQuranStore.getState().setLearningSurah(112, 3);
  useQuranStore.getState().setLearningSurah(113, 3);

  useQuranStore.getState().startDailySession({ learningSurah: 112 });

  assert.equal(
    useQuranStore.getState().activeSession?.learningSurah,
    112,
    'not simply the most recent one',
  );
});

test('losing Premium brings the parallel surahs back down to one', () => {
  reset();
  [112, 113, 114].forEach((number) =>
    useQuranStore.getState().setLearningSurah(number, 3),
  );

  useQuranStore.getState().enforceLearningLimit(1);

  const state = useQuranStore.getState();
  const active = selectLearningSurahs(state).map((item) => item.surahNumber);
  assert.deepEqual(active, [114], 'only the most recent stays active');
  assert.equal(state.progress[112].status, 'locked');
  assert.equal(state.progress[113].status, 'locked');
});

test('a demoted surah keeps its progress', () => {
  reset();
  useQuranStore.getState().setLearningSurah(112, 3);
  useQuranStore.setState((current) => ({
    progress: {
      ...current.progress,
      112: { ...current.progress[112], versesLearned: 3 },
    },
  }));
  useQuranStore.getState().setLearningSurah(113, 3);

  useQuranStore.getState().enforceLearningLimit(1);

  assert.equal(useQuranStore.getState().progress[112].status, 'locked');
  assert.equal(
    useQuranStore.getState().progress[112].versesLearned,
    3,
    'the verses already memorised are not lost',
  );
});

test('enforcing a limit that is already met changes nothing', () => {
  reset();
  useQuranStore.getState().setLearningSurah(112, 3);
  const before = useQuranStore.getState().progress;

  useQuranStore.getState().enforceLearningLimit(3);

  assert.equal(useQuranStore.getState().progress, before, 'same reference');
});

test('an untouched session retargets to the surah the user just picked', () => {
  reset();
  useQuranStore.getState().setLearningSurah(112, 3);
  useQuranStore.getState().setLearningSurah(113, 3);

  // Opened on 113 (most recent), not started.
  useQuranStore.getState().startDailySession();
  assert.equal(useQuranStore.getState().activeSession?.learningSurah, 113);

  // The user selects 112 in the Apprendre tab and taps start again.
  useQuranStore.getState().startDailySession({ learningSurah: 112 });

  assert.equal(
    useQuranStore.getState().activeSession?.learningSurah,
    112,
    'the session follows the choice instead of silently staying on 113',
  );
});

test('a session already under way is not thrown away by a new start', () => {
  reset();
  useQuranStore.getState().setLearningSurah(112, 3);
  useQuranStore.getState().setLearningSurah(113, 3);
  useQuranStore.getState().startDailySession({ learningSurah: 113 });
  useQuranStore.getState().learnCurrentVerse();
  const learned = useQuranStore.getState().activeSession?.versesLearned;

  useQuranStore.getState().startDailySession({ learningSurah: 112 });

  const session = useQuranStore.getState().activeSession;
  assert.equal(session?.learningSurah, 113, 'work in progress wins over the switch');
  assert.equal(session?.versesLearned, learned, 'and its progress is intact');
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
      activeSeconds: 60
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
      activeSeconds: 30
    },
  });

  const summary = useQuranStore.getState().completeDailySession();

  assert.ok(summary);
  // The session was open for 14 hours but only 30 seconds were spent on the text.
  // Wall clock used to be the recorded duration, which handed out hours of
  // "recitation" to anyone who left the app open.
  assert.equal(
    summary!.durationSeconds,
    30,
    'the time actually spent is recorded, not the time the app was open',
  );
  assert.equal(useQuranStore.getState().stats.totalMinutes, 1);
});

test('a session tapped through earns no recitation time', () => {
  reset();
  useQuranStore.setState({
    activeSession: {
      date: dateKey(),
      startedAt: new Date().toISOString(),
      reviewQueue: [],
      reviewIndex: 0,
      ratings: [],
      verseStart: 0,
      versesTarget: 3,
      versesLearned: 3,
      activeSeconds: 0, // three verses "validated" instantly
    },
  });

  const summary = useQuranStore.getState().completeDailySession();

  assert.equal(summary?.durationSeconds, 0, 'no time claimed, none credited');
});

test('a completed session is queued for the server to judge', () => {
  reset();
  useQuranStore.setState({
    activeSession: {
      date: dateKey(),
      startedAt: new Date(Date.now() - 120_000).toISOString(),
      reviewQueue: [],
      reviewIndex: 0,
      ratings: [],
      verseStart: 0,
      versesTarget: 1,
      versesLearned: 1,
      activeSeconds: 45,
    },
  });

  const summary = useQuranStore.getState().completeDailySession();
  const [pending] = useQuranStore.getState().pendingSessions;

  assert.ok(pending, 'queued rather than posted, so an offline session survives');
  assert.equal(pending.activeSeconds, 45);
  assert.equal(pending.versesLearned, 1);
  assert.equal(pending.xpEarned, summary?.xpEarned);

  useQuranStore.getState().clearPendingSessions([pending.id]);
  assert.deepEqual(useQuranStore.getState().pendingSessions, [], 'cleared once accepted');
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
      activeSeconds: 30
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
