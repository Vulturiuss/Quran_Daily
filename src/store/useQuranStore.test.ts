import assert from 'node:assert/strict';
import test from 'node:test';

// Must come before the store: it installs the localStorage shim that the
// persist middleware writes through under node. See the module for why.
import '@/testing/storageStub';

import { createDefaultStats } from '@/utils/gamification';
import { addDays, dateKey } from '@/utils/date';

import {
  migratePersistedState,
  selectLearningSurahs,
  useQuranStore,
} from './useQuranStore';

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
      kind: 'daily' as const,
      sabqiQueue: [],
      sabqiIndex: 0,
      verifyIndex: 0,
      verifyFailed: [],
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

  assert.equal(
    state.progress[112].status,
    'verifying',
    'every verse has been seen, so it awaits its final recitation — not "known"',
  );
  assert.equal(state.progress[113]?.status, 'learning', '113 takes over');
  assert.deepEqual(state.profile.learningQueue, [], 'both leave the queue');
});

test('seeing every verse once does not make a surah known', () => {
  learningState(112, 4, []);

  useQuranStore.getState().learnCurrentVerse();

  const progress = useQuranStore.getState().progress[112];
  assert.equal(progress.status, 'verifying');
  assert.equal(
    progress.nextReviewAt,
    undefined,
    'it must not enter the SRS on a promise it has not kept',
  );
});

test('a clean final recitation is what makes a surah known', () => {
  learningState(112, 4, []);
  useQuranStore.getState().learnCurrentVerse();

  useQuranStore.getState().startVerification(112);
  for (let verse = 0; verse < 4; verse += 1) {
    useQuranStore.getState().recordVerificationVerse(0, true, 20); // recited, no reveals
  }
  useQuranStore.getState().completeVerification();

  const progress = useQuranStore.getState().progress[112];
  assert.equal(progress.status, 'known');
  assert.deepEqual(progress.weakVerses, []);
  assert.ok(progress.nextReviewAt, 'now, and only now, it enters the SRS');
});

test('a failed recitation sends the surah back with its weak verses named', () => {
  learningState(112, 4, []);
  useQuranStore.getState().learnCurrentVerse();

  useQuranStore.getState().startVerification(112);
  useQuranStore.getState().recordVerificationVerse(0, true, 20); // verse 1: clean
  useQuranStore.getState().recordVerificationVerse(4, false, 20); // verse 2: blocked
  useQuranStore.getState().recordVerificationVerse(0, true, 20); // verse 3: clean
  useQuranStore.getState().recordVerificationVerse(3, false, 20); // verse 4: blocked
  useQuranStore.getState().completeVerification();

  const progress = useQuranStore.getState().progress[112];
  assert.equal(progress.status, 'learning', 'back to work, not certified');
  assert.deepEqual(progress.weakVerses, [2, 4], 'and the sabqi now knows what to drill');
});

test('sabqi replays the recent verses, and a clean one stops being weak', () => {
  reset();
  useQuranStore.setState({
    progress: {
      112: {
        surahNumber: 112,
        status: 'learning',
        versesLearned: 3,
        totalVerses: 4,
        reviewIntervalDays: 1,
        easeFactor: 2.5,
        reviewCount: 0,
        learnedAt: { 1: dateKey(), 2: dateKey(), 3: dateKey() },
        weakVerses: [2],
        updatedAt: new Date().toISOString(),
      },
    },
  });

  useQuranStore.getState().startDailySession({ kind: 'learn' });
  const session = useQuranStore.getState().activeSession;
  assert.deepEqual(
    session?.sabqiQueue,
    [1, 2, 3],
    'what was learnt in the last days comes back before anything new',
  );

  // Verse 1 recited clean, verse 2 (the weak one) recited clean too: nothing
  // uncovered AND the user says they recited it — both are needed now.
  useQuranStore.getState().rateSabqiVerse(0, true, 15);
  useQuranStore.getState().rateSabqiVerse(0, true, 15);

  assert.deepEqual(
    useQuranStore.getState().progress[112].weakVerses,
    [],
    'a weak verse that finally holds stops being weak',
  );
});

test('a verse the user had to uncover becomes weak', () => {
  reset();
  useQuranStore.setState({
    progress: {
      112: {
        surahNumber: 112,
        status: 'learning',
        versesLearned: 2,
        totalVerses: 4,
        reviewIntervalDays: 1,
        easeFactor: 2.5,
        reviewCount: 0,
        learnedAt: { 1: dateKey(), 2: dateKey() },
        updatedAt: new Date().toISOString(),
      },
    },
  });
  useQuranStore.getState().startDailySession({ kind: 'learn' });

  useQuranStore.getState().rateSabqiVerse(4, false, 15); // four words uncovered on verse 1

  assert.deepEqual(useQuranStore.getState().progress[112].weakVerses, [1]);
});

test('a verse the user admits blocking on becomes weak, even with nothing revealed', () => {
  // Revealing words is optional, so `reveals === 0` used to read as "recited
  // perfectly": tapping the single button after the timer scored full marks
  // without reciting anything. An admitted blank must now be heard.
  reset();
  useQuranStore.setState({
    progress: {
      112: {
        surahNumber: 112,
        status: 'learning',
        versesLearned: 2,
        totalVerses: 4,
        reviewIntervalDays: 1,
        easeFactor: 2.5,
        reviewCount: 0,
        learnedAt: { 1: dateKey(), 2: dateKey() },
        updatedAt: new Date().toISOString(),
      },
    },
  });
  useQuranStore.getState().startDailySession({ kind: 'learn' });

  useQuranStore.getState().rateSabqiVerse(0, false, 15); // nothing uncovered, but blocked

  assert.deepEqual(useQuranStore.getState().progress[112].weakVerses, [1]);
});

test('Réviser and Apprendre no longer launch the same session', () => {
  reset();
  useQuranStore.setState({
    progress: {
      112: {
        surahNumber: 112,
        status: 'known',
        versesLearned: 4,
        totalVerses: 4,
        reviewIntervalDays: 1,
        easeFactor: 2.5,
        reviewCount: 1,
      },
      113: {
        surahNumber: 113,
        status: 'learning',
        versesLearned: 1,
        totalVerses: 6,
        reviewIntervalDays: 1,
        easeFactor: 2.5,
        reviewCount: 0,
        updatedAt: new Date().toISOString(),
      },
    },
  });

  useQuranStore.getState().startDailySession({ kind: 'review' });
  const reviewOnly = useQuranStore.getState().activeSession;
  assert.ok(reviewOnly!.reviewQueue.length > 0, 'reviews');
  assert.equal(reviewOnly!.learningSurah, undefined, 'and nothing to learn');

  useQuranStore.getState().clearActiveSession();
  useQuranStore.getState().startDailySession({ kind: 'learn' });
  const learnOnly = useQuranStore.getState().activeSession;
  assert.deepEqual(learnOnly!.reviewQueue, [], 'no reviews');
  assert.equal(learnOnly!.learningSurah, 113, 'only the learning surah');

  useQuranStore.getState().clearActiveSession();
  useQuranStore.getState().startDailySession({ kind: 'daily' });
  const daily = useQuranStore.getState().activeSession;
  assert.ok(daily!.reviewQueue.length > 0, 'the home screen still runs both');
  assert.equal(daily!.learningSurah, 113);
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
      kind: 'daily' as const,
      sabqiQueue: [],
      sabqiIndex: 0,
      verifyIndex: 0,
      verifyFailed: [],
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
      kind: 'daily' as const,
      sabqiQueue: [],
      sabqiIndex: 0,
      verifyIndex: 0,
      verifyFailed: [],
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

test('a session tapped through earns nothing at all', () => {
  reset();
  const streakBefore = useQuranStore.getState().stats.currentStreak;
  useQuranStore.setState({
    activeSession: {
      kind: 'daily' as const,
      sabqiQueue: [],
      sabqiIndex: 0,
      verifyIndex: 0,
      verifyFailed: [],
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
  const state = useQuranStore.getState();

  // No time on the text means no work: no summary, no streak day, no queued
  // session, no history — the same as tapping "Terminer" on an empty screen.
  assert.equal(summary, undefined, 'zero-effort session earns no credit');
  assert.equal(state.stats.currentStreak, streakBefore, 'no streak day');
  assert.deepEqual(state.pendingSessions, [], 'nothing queued for the server');
  assert.equal(state.history.length, 0, 'no history record written');
  assert.equal(state.activeSession, undefined, 'the empty session is cleared');
});

test('a completed session is queued for the server to judge', () => {
  reset();
  useQuranStore.setState({
    activeSession: {
      kind: 'daily' as const,
      sabqiQueue: [],
      sabqiIndex: 0,
      verifyIndex: 0,
      verifyFailed: [],
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
      kind: 'daily' as const,
      sabqiQueue: [],
      sabqiIndex: 0,
      verifyIndex: 0,
      verifyFailed: [],
      date: dateKey(),
      // Started a couple of minutes ago: a real session, so the accumulated
      // 30s of effort is not clamped away by a zero elapsed time.
      startedAt: new Date(Date.now() - 120_000).toISOString(),
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

test('flushing a stale session takes the day before it as the streak baseline, not a newer record', () => {
  reset();
  const twoDaysAgo = dateKey(addDays(new Date(), -2));
  const threeDaysAgo = dateKey(addDays(new Date(), -3));
  const today = dateKey();
  useQuranStore.setState({
    // A newer completed day (today) exists alongside the day before the stale
    // session. The descending scan used to return `today` as the baseline.
    history: [
      {
        date: today,
        completedAt: `${today}T20:00:00.000Z`,
        durationSeconds: 300,
        xpEarned: 50,
        surahsReviewed: 1,
        versesLearned: 0,
        isPerfect: false,
      },
      {
        date: threeDaysAgo,
        completedAt: `${threeDaysAgo}T20:00:00.000Z`,
        durationSeconds: 300,
        xpEarned: 50,
        surahsReviewed: 1,
        versesLearned: 0,
        isPerfect: false,
      },
    ],
    stats: { ...createDefaultStats(), currentStreak: 10, longestStreak: 10 },
    activeSession: {
      kind: 'daily' as const,
      sabqiQueue: [],
      sabqiIndex: 0,
      verifyIndex: 0,
      verifyFailed: [],
      date: twoDaysAgo,
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

  useQuranStore.getState().completeDailySession();

  assert.equal(
    useQuranStore.getState().stats.currentStreak,
    11,
    'the streak advances from the prior day; a future record must not collapse it to 1',
  );
});

test('a queued session is stamped with its account, and an account switch drops it', () => {
  reset();
  useQuranStore.setState({ syncMeta: { dirty: false, cloudUserId: 'user-A' } });
  useQuranStore.setState({
    activeSession: {
      kind: 'daily' as const,
      sabqiQueue: [],
      sabqiIndex: 0,
      verifyIndex: 0,
      verifyFailed: [],
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

  useQuranStore.getState().completeDailySession();
  const [pending] = useQuranStore.getState().pendingSessions;
  assert.equal(pending.userId, 'user-A', 'stamped with the account that earned it');

  // Another existing account signs in on the same device.
  const snapshot = {
    schemaVersion: 1 as const,
    updatedAt: new Date().toISOString(),
    onboardingCompleted: true,
    profile: useQuranStore.getState().profile,
    progress: {},
    stats: createDefaultStats(),
    history: [],
  };
  useQuranStore
    .getState()
    .applyCloudSnapshot(snapshot, snapshot.updatedAt, 'user-B', true);

  assert.deepEqual(
    useQuranStore.getState().pendingSessions,
    [],
    "user A's queued session is never left for user B to send",
  );
});

test('an account switch drops an in-progress session so it cannot be credited to the new account', () => {
  reset();
  useQuranStore.setState({
    syncMeta: { dirty: false, cloudUserId: 'user-A' },
    activeSession: {
      kind: 'daily' as const,
      sabqiQueue: [],
      sabqiIndex: 0,
      verifyIndex: 0,
      verifyFailed: [],
      date: dateKey(),
      startedAt: new Date(Date.now() - 120_000).toISOString(),
      reviewQueue: [2],
      reviewIndex: 1,
      ratings: ['good'],
      verseStart: 0,
      versesTarget: 0,
      versesLearned: 0,
      activeSeconds: 45,
    },
  });

  const snapshot = {
    schemaVersion: 1 as const,
    updatedAt: new Date().toISOString(),
    onboardingCompleted: true,
    profile: useQuranStore.getState().profile,
    progress: {},
    stats: createDefaultStats(),
    history: [],
  };
  useQuranStore
    .getState()
    .applyCloudSnapshot(snapshot, snapshot.updatedAt, 'user-B', true);

  assert.equal(
    useQuranStore.getState().activeSession,
    undefined,
    "account A's in-progress session does not survive into account B",
  );

  // A same-account pull, by contrast, must leave a running session alone.
  reset();
  const running = {
    kind: 'daily' as const,
    sabqiQueue: [],
    sabqiIndex: 0,
    verifyIndex: 0,
    verifyFailed: [],
    date: dateKey(),
    startedAt: new Date().toISOString(),
    reviewQueue: [2],
    reviewIndex: 0,
    ratings: [],
    verseStart: 0,
    versesTarget: 0,
    versesLearned: 0,
    activeSeconds: 10,
  };
  useQuranStore.setState({
    syncMeta: { dirty: false, cloudUserId: 'user-A' },
    activeSession: running,
  });
  useQuranStore
    .getState()
    .applyCloudSnapshot(snapshot, snapshot.updatedAt, 'user-A', false);

  assert.ok(
    useQuranStore.getState().activeSession,
    'a same-account pull keeps the running session',
  );
});

test('migrating a pre-v7 payload keeps progress and history and backfills new fields', () => {
  const legacy = {
    onboardingCompleted: true,
    profile: { reciterId: 'ar.alafasy' },
    progress: {
      2: {
        surahNumber: 2,
        status: 'known',
        versesLearned: 180,
        totalVerses: 286,
        reviewIntervalDays: 14,
        easeFactor: 2.7,
        reviewCount: 40,
      },
    },
    stats: { totalXP: 500, currentStreak: 12 },
    history: [
      {
        date: '2026-07-01',
        completedAt: '2026-07-01T20:00:00.000Z',
        durationSeconds: 300,
        xpEarned: 60,
        surahsReviewed: 1,
        versesLearned: 2,
        isPerfect: false,
      },
    ],
    // No pendingSessions, no activeSession, no syncMeta — this is the old shape.
  };

  const migrated = migratePersistedState(legacy, 6);

  assert.equal(migrated.progress[2].versesLearned, 180, 'earned progress preserved');
  assert.equal(migrated.history.length, 1, 'history preserved');
  assert.equal(migrated.stats.totalXP, 500, 'monotonic stats carried');
  assert.deepEqual(migrated.pendingSessions, [], 'the pending queue is backfilled');
  assert.ok(migrated.syncMeta, 'sync meta is backfilled');
});

test('migrating an empty or undefined payload does not throw', () => {
  assert.doesNotThrow(() => migratePersistedState(undefined, 0));
  assert.doesNotThrow(() => migratePersistedState({}, 0));
  const migrated = migratePersistedState({}, 0);
  assert.equal(migrated.onboardingCompleted ?? false, false);
  assert.deepEqual(migrated.pendingSessions, []);
});

test('a pre-loop active session is healed rather than crashing hydrate', () => {
  const legacy = {
    onboardingCompleted: true,
    activeSession: {
      date: dateKey(),
      startedAt: new Date().toISOString(),
      reviewQueue: [2],
      reviewIndex: 0,
      ratings: [],
      verseStart: 0,
      versesTarget: 3,
      versesLearned: 0,
      // none of kind / sabqi* / verify* / activeSeconds existed yet
    },
  };

  const migrated = migratePersistedState(legacy, 7);

  assert.equal(migrated.activeSession?.kind, 'daily', 'kind backfilled');
  assert.deepEqual(migrated.activeSession?.sabqiQueue, []);
  assert.equal(migrated.activeSession?.verifyIndex, 0);
  assert.equal(migrated.activeSession?.activeSeconds, 0);
});
