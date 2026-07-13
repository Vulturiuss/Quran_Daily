import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { getSurah } from '@/data/surahs';
import { getVerses } from '@/data/verses';
import {
  ActiveSession,
  CloudSnapshot,
  PendingSession,
  ReviewRating,
  SessionRecord,
  SessionSummary,
  SyncMeta,
  UserProfile,
  UserStats,
  UserSurahProgress,
} from '@/types';
import { addDays, dateKey } from '@/utils/date';
import { countableSeconds } from '@/utils/effort';
import {
  advanceDailyStreak,
  calculateSessionXP,
  createDefaultStats,
  findUnlockedBadges,
  isPerfectReviewSession,
  normalizeStats,
  reconcileMissedStreak,
} from '@/utils/gamification';
import { healLearningState } from '@/utils/learningQueue';
import {
  selectSabqi,
  verificationOutcome,
  verificationQueue,
  verseGrade,
} from '@/utils/memorization';
import {
  appendSessionEntry,
  normalizeSessionRecord,
} from '@/utils/sessionHistory';
import { isDue, scheduleAfterReview, sortByReviewPriority } from '@/utils/srs';

const defaultProfile: UserProfile = {
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
  offlineAudioAuto: true,
};

const defaultSyncMeta: SyncMeta = {
  dirty: false,
};

// Wall-clock time between "session started" and "session flushed" is not time
// spent reciting: a session left open overnight would otherwise add ~840 minutes
// to the user's total. One hour is well above any real daily goal (max 15 min).
const MAX_SESSION_SECONDS = 3600;

// A long offline stretch should not grow the queue without bound. Oldest first.
const MAX_PENDING_SESSIONS = 200;

function changedNow(previous?: SyncMeta): SyncMeta {
  return {
    dirty: true,
    cloudUserId: previous?.cloudUserId,
    lastLocalChangeAt: new Date().toISOString(),
    lastSyncedAt: previous?.lastSyncedAt,
  };
}

function normalizeProfile(profile?: Partial<UserProfile>): UserProfile {
  return {
    ...defaultProfile,
    ...profile,
    // A profile stored before offline audio existed — or a cloud snapshot written
    // by an older device — carries no flag at all. Spreading it as-is would leave
    // `undefined`, which reads as "off": the feature would be silently disabled
    // for every existing user.
    offlineAudioAuto: profile?.offlineAudioAuto ?? defaultProfile.offlineAudioAuto,
  };
}

function makeProgress(
  surahNumber: number,
  status: UserSurahProgress['status'],
  updatedAt = new Date().toISOString(),
): UserSurahProgress {
  const surah = getSurah(surahNumber);
  if (!surah) throw new Error(`Unknown surah ${surahNumber}`);
  return {
    surahNumber,
    status,
    versesLearned: status === 'known' ? surah.totalVerses : 0,
    totalVerses: surah.totalVerses,
    reviewIntervalDays: 1,
    easeFactor: 2.5,
    reviewCount: 0,
    updatedAt,
  };
}

interface OnboardingInput {
  displayName: string;
  knownSurahs: number[];
  learningSurah: number;
  goalMinutes: UserProfile['dailyGoalMinutes'];
  dailyGoalVerses: number;
  dailyGoalReviews: number;
  notificationTime: string;
  notificationsEnabled: boolean;
}

// No surah is gated any more, so a session is only parameterised by which of the
// active learning surahs it works on. See src/utils/access.ts.
import type { SessionAccess } from '@/utils/access';

export interface QuranState {
  hydrated: boolean;
  onboardingCompleted: boolean;
  onboardingAccountPending: boolean;
  profile: UserProfile;
  progress: Record<number, UserSurahProgress>;
  stats: UserStats;
  history: SessionRecord[];
  syncMeta: SyncMeta;
  activeSession?: ActiveSession;
  lastSummary?: SessionSummary;
  /** Completed sessions not yet accepted by the server. Survives being offline. */
  pendingSessions: PendingSession[];
  clearPendingSessions: (ids: string[]) => void;
  setHydrated: (value: boolean) => void;
  finishAccountOnboarding: () => void;
  refreshGamification: (freezeAllowance: number) => void;
  completeOnboarding: (input: OnboardingInput) => void;
  updateProfile: (input: Partial<UserProfile>) => void;
  /**
   * Promotes a surah to `learning`. Up to `maxLearningSurahs` can be active at
   * once (1 for free, 3 with Premium); beyond that the least recently touched
   * one steps aside.
   */
  setLearningSurah: (surahNumber: number, maxLearningSurahs?: number) => void;
  /**
   * Brings the number of surahs being learnt back down to the tier's limit,
   * keeping the most recently active ones. Called when the subscription resolves:
   * without it a lapsed subscriber kept their three parallel surahs forever — and
   * regained a slot every time one was finished, since the queue promotes another.
   */
  enforceLearningLimit: (maxLearningSurahs: number) => void;
  markSurahKnown: (surahNumber: number) => void;
  markSurahForgotten: (surahNumber: number) => void;
  addToLearningQueue: (surahNumber: number) => void;
  removeFromLearningQueue: (surahNumber: number) => void;
  reorderLearningQueue: (surahNumber: number, direction: 'up' | 'down') => void;
  startDailySession: (access?: SessionAccess) => void;
  /** `dwellSeconds` is the time actually spent on this item; see utils/effort.ts. */
  rateCurrentReview: (rating: ReviewRating, dwellSeconds?: number) => void;
  learnCurrentVerse: (dwellSeconds?: number) => void;
  /**
   * `reveals` = hidden words the user had to uncover; `recalled` = their explicit
   * claim to have recited it. Both are needed: revealing nothing must not be a
   * pass by default, and claiming a clean recital must not survive having
   * uncovered half the verse.
   */
  rateSabqiVerse: (reveals: number, recalled: boolean, dwellSeconds?: number) => void;
  startVerification: (surahNumber: number) => void;
  recordVerificationVerse: (
    reveals: number,
    recalled: boolean,
    dwellSeconds?: number,
  ) => void;
  completeVerification: () => void;
  completeDailySession: () => SessionSummary | undefined;
  clearActiveSession: () => void;
  applyCloudSnapshot: (
    snapshot: CloudSnapshot,
    syncedAt: string,
    cloudUserId: string,
  ) => void;
  resetForCloudUser: (cloudUserId: string) => void;
  resetApp: () => void;
}

function sortedHistory(history: SessionRecord[]) {
  return [...history].sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Whether anything at all was done in this session. It has to count every kind of
 * work: replaying sabqi verses and reciting a surah whole are work too, and the
 * guards that decide whether a session may be discarded used to look only at
 * reviews and new verses — so a whole day of sabqi could be silently thrown away.
 */
export function sessionHasWork(session: ActiveSession) {
  return (
    session.reviewIndex > 0 ||
    session.versesLearned > 0 ||
    session.sabqiIndex > 0 ||
    session.verifyIndex > 0
  );
}

export const useQuranStore = create<QuranState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      onboardingCompleted: false,
      onboardingAccountPending: false,
      profile: defaultProfile,
      progress: {},
      stats: createDefaultStats(),
      history: [],
      pendingSessions: [],
      syncMeta: defaultSyncMeta,

      setHydrated: (value) => set({ hydrated: value }),
      finishAccountOnboarding: () => set({ onboardingAccountPending: false }),

      refreshGamification: (freezeAllowance) =>
        set((state) => {
          const lastCompletedDate = sortedHistory(state.history)[0]?.date;
          const nextStats = reconcileMissedStreak(
            state.stats,
            lastCompletedDate,
            freezeAllowance,
          );
          if (JSON.stringify(nextStats) === JSON.stringify(state.stats)) return state;
          return {
            stats: nextStats,
            syncMeta: changedNow(state.syncMeta),
          };
        }),

      completeOnboarding: (input) => {
        const progress: Record<number, UserSurahProgress> = {};
        const updatedAt = new Date().toISOString();
        const baseDate = new Date(updatedAt);
        const cloudUserId = get().syncMeta.cloudUserId;
        input.knownSurahs.forEach((number, index) => {
          const daysUntilReview = Math.min(14, index + 1);
          progress[number] = {
            ...makeProgress(number, 'known', updatedAt),
            nextReviewAt: addDays(baseDate, daysUntilReview).toISOString(),
            reviewIntervalDays: daysUntilReview,
          };
        });
        if (!progress[input.learningSurah]) {
          progress[input.learningSurah] = makeProgress(
            input.learningSurah,
            'learning',
            updatedAt,
          );
        }

        set({
          onboardingCompleted: true,
          onboardingAccountPending: true,
          profile: {
            ...defaultProfile,
            displayName: input.displayName.trim() || defaultProfile.displayName,
            dailyGoalMinutes: input.goalMinutes,
            dailyGoalVerses: input.dailyGoalVerses,
            dailyGoalReviews: input.dailyGoalReviews,
            notificationTime: input.notificationTime,
            notificationsEnabled: input.notificationsEnabled,
          },
          progress,
          stats: createDefaultStats(),
          history: [],
      pendingSessions: [],
          syncMeta: {
            dirty: true,
            cloudUserId,
            lastLocalChangeAt: updatedAt,
          },
          activeSession: undefined,
          lastSummary: undefined,
        });
      },

      updateProfile: (input) =>
        set((state) => ({
          profile: { ...state.profile, ...input },
          syncMeta: changedNow(state.syncMeta),
        })),

      enforceLearningLimit: (maxLearningSurahs) =>
        set((state) => {
          const limit = Math.max(1, maxLearningSurahs);
          const active = Object.values(state.progress)
            .filter((item) => item.status === 'learning')
            .sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''));
          const excess = active.slice(limit);
          if (excess.length === 0) return state;

          const updatedAt = new Date().toISOString();
          const next = { ...state.progress };
          excess.forEach((item) => {
            // Demoted, not erased: versesLearned is kept, so the surah resumes
            // where it left off if the user subscribes again or picks it back up.
            next[item.surahNumber] = { ...item, status: 'locked', updatedAt };
          });

          return {
            progress: next,
            syncMeta: changedNow(state.syncMeta),
          };
        }),

      setLearningSurah: (surahNumber, maxLearningSurahs = 1) =>
        set((state) => {
          const next = { ...state.progress };
          const limit = Math.max(1, maxLearningSurahs);

          // Keep the most recently activated surahs, up to the tier's limit; the
          // oldest step aside. That makes a free user's single slot behave like
          // "switch surah", while a premium user simply fills their three slots.
          const active = Object.values(next)
            .filter(
              (item) => item.status === 'learning' && item.surahNumber !== surahNumber,
            )
            .sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''));

          // `updatedAt` doubles as the activation order, so it has to be strictly
          // increasing: two activations within the same millisecond would
          // otherwise make "the oldest" arbitrary, and evict the wrong surah.
          const latest = active.reduce(
            (max, item) => Math.max(max, Date.parse(item.updatedAt ?? '') || 0),
            0,
          );
          const updatedAt = new Date(Math.max(Date.now(), latest + 1)).toISOString();

          active.slice(limit - 1).forEach((item) => {
            next[item.surahNumber] = { ...item, status: 'locked', updatedAt };
          });

          const existing = next[surahNumber];
          next[surahNumber] = existing
            ? { ...existing, status: 'learning', updatedAt }
            : makeProgress(surahNumber, 'learning', updatedAt);
          return {
            progress: next,
            // It is now the active surah, so it has no business still queueing
            // behind itself.
            profile: {
              ...state.profile,
              learningQueue: state.profile.learningQueue.filter(
                (number) => number !== surahNumber,
              ),
            },
            syncMeta: changedNow(state.syncMeta),
          };
        }),

      markSurahKnown: (surahNumber) =>
        set((state) => {
          const updatedAt = new Date().toISOString();
          return {
            progress: {
              ...state.progress,
              [surahNumber]: {
                ...(state.progress[surahNumber] ??
                  makeProgress(surahNumber, 'known', updatedAt)),
                status: 'known',
                versesLearned: getSurah(surahNumber)?.totalVerses ?? 0,
                nextReviewAt: updatedAt,
                updatedAt,
              },
            },
            syncMeta: changedNow(state.syncMeta),
          };
        }),

      markSurahForgotten: (surahNumber) =>
        set((state) => {
          const existing = state.progress[surahNumber];
          if (!existing || existing.status !== 'known') return state;
          const updatedAt = new Date().toISOString();
          return {
            progress: {
              ...state.progress,
              [surahNumber]: makeProgress(surahNumber, 'locked', updatedAt),
            },
            syncMeta: changedNow(state.syncMeta),
          };
        }),

      addToLearningQueue: (surahNumber) =>
        set((state) => {
          if (state.profile.learningQueue.includes(surahNumber)) return state;
          // Queueing the surah currently being learnt, one awaiting its final
          // recitation, or one already memorised only creates a queue entry that
          // can never be promoted.
          const status = state.progress[surahNumber]?.status;
          if (status === 'learning' || status === 'verifying' || status === 'known') {
            return state;
          }
          return {
            profile: {
              ...state.profile,
              learningQueue: [...state.profile.learningQueue, surahNumber],
            },
            syncMeta: changedNow(state.syncMeta),
          };
        }),

      removeFromLearningQueue: (surahNumber) =>
        set((state) => ({
          profile: {
            ...state.profile,
            learningQueue: state.profile.learningQueue.filter(
              (number) => number !== surahNumber,
            ),
          },
          syncMeta: changedNow(state.syncMeta),
        })),

      reorderLearningQueue: (surahNumber, direction) =>
        set((state) => {
          const queue = [...state.profile.learningQueue];
          const index = queue.indexOf(surahNumber);
          const swapWith = direction === 'up' ? index - 1 : index + 1;
          if (index === -1 || swapWith < 0 || swapWith >= queue.length) return state;
          [queue[index], queue[swapWith]] = [queue[swapWith], queue[index]];
          return {
            profile: { ...state.profile, learningQueue: queue },
            syncMeta: changedNow(state.syncMeta),
          };
        }),

      startDailySession: (access) => {
        const stale = get().activeSession;
        if (stale && stale.date !== dateKey() && sessionHasWork(stale)) {
          // An unfinished session from a previous day would otherwise be
          // silently discarded below, forfeiting its XP/streak credit and
          // making that day look missed for streak-freeze purposes.
          get().completeDailySession();
        }

        const state = get();
        const today = state.activeSession;
        if (today?.date === dateKey()) {
          // A session already opened today is normally resumed as-is. The one
          // exception: nothing has been done in it yet and the user is explicitly
          // asking for a different surah among the ones they learn in parallel.
          // Returning here regardless meant the app kept working on the previous
          // surah while showing the one they had just picked.
          const wantsAnotherSurah =
            access?.learningSurah !== undefined &&
            access.learningSurah !== today.learningSurah;
          if (sessionHasWork(today) || !wantsAnotherSurah) return;
        }

        const kind = access?.kind ?? 'daily';
        const wantsReviews = kind === 'daily' || kind === 'review';
        const wantsLearning = kind === 'daily' || kind === 'learn';

        // Every surah is reviewable on every tier: the only bound is the user's
        // own daily goal.
        const known = Object.values(state.progress).filter(
          (item) => item.status === 'known',
        );
        const due = sortByReviewPriority(known.filter((item) => isDue(item)));
        const notDue = sortByReviewPriority(known.filter((item) => !isDue(item)));
        const reviewCandidates = access?.isBonus ? [...due, ...notDue] : due;
        const reviewQueue = wantsReviews
          ? reviewCandidates
              .slice(0, state.profile.dailyGoalReviews)
              .map((item) => item.surahNumber)
          : [];

        // With several surahs active, the session works on the one the user
        // picked; otherwise on the only (or most recently touched) one.
        const activeLearning = Object.values(state.progress)
          .filter((item) => item.status === 'learning')
          .sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''));
        const learning = wantsLearning
          ? activeLearning.find((item) => item.surahNumber === access?.learningSurah) ??
            activeLearning[0]
          : undefined;
        const availableVerses = getVerses(learning?.surahNumber);
        const verseStart = learning?.versesLearned ?? 0;
        const versesTarget = Math.max(
          0,
          Math.min(state.profile.dailyGoalVerses, availableVerses.length - verseStart),
        );
        // The missing pillar: what was learnt in the last days is replayed before
        // anything new. Without it a surah was never revisited until it was
        // finished — 143 days on Al-Baqara at two verses a day.
        const sabqiQueue = wantsLearning ? selectSabqi(learning) : [];

        set({
          activeSession: {
            kind,
            date: dateKey(),
            startedAt: new Date().toISOString(),
            reviewQueue,
            reviewIndex: 0,
            ratings: [],
            learningSurah: learning?.surahNumber,
            sabqiQueue,
            sabqiIndex: 0,
            verifyIndex: 0,
            verifyFailed: [],
            verseStart,
            versesTarget,
            versesLearned: 0,
            isBonus: access?.isBonus ?? false,
            freezeAllowance: access?.freezeAllowance ?? 1,
            activeSeconds: 0,
          },
          lastSummary: undefined,
        });
      },

      rateCurrentReview: (rating, dwellSeconds = 0) =>
        set((state) => {
          const session = state.activeSession;
          if (!session) return state;
          const surahNumber = session.reviewQueue[session.reviewIndex];
          const item = state.progress[surahNumber];
          if (!item) return state;
          const updatedAt = new Date().toISOString();

          return {
            progress: {
              ...state.progress,
              [surahNumber]: {
                ...scheduleAfterReview(item, rating),
                updatedAt,
              },
            },
            activeSession: {
              ...session,
              reviewIndex: session.reviewIndex + 1,
              ratings: [...session.ratings, rating],
              activeSeconds:
                (session.activeSeconds ?? 0) + countableSeconds(dwellSeconds),
            },
            syncMeta: changedNow(state.syncMeta),
          };
        }),

      /**
       * One sabqi verse replayed. `reveals` is how many hidden words the user had
       * to uncover — a measured grade, not a declared one. A verse recited clean
       * stops being weak; one that had to be uncovered becomes weak, so it keeps
       * coming back until it holds.
       */
      rateSabqiVerse: (reveals, recalled, dwellSeconds = 0) =>
        set((state) => {
          const session = state.activeSession;
          const surahNumber = session?.learningSurah;
          if (!session || !surahNumber) return state;
          const verseNumber = session.sabqiQueue[session.sabqiIndex];
          if (verseNumber === undefined) return state;

          const current = state.progress[surahNumber];
          if (!current) return state;

          const rating = verseGrade(reveals, recalled);
          const weak = new Set(current.weakVerses ?? []);
          if (rating === 'good') {
            weak.delete(verseNumber);
          } else {
            weak.add(verseNumber);
          }

          return {
            progress: {
              ...state.progress,
              [surahNumber]: {
                ...current,
                weakVerses: [...weak].sort((a, b) => a - b),
                updatedAt: new Date().toISOString(),
              },
            },
            activeSession: {
              ...session,
              sabqiIndex: session.sabqiIndex + 1,
              activeSeconds:
                (session.activeSeconds ?? 0) + countableSeconds(dwellSeconds),
            },
            syncMeta: changedNow(state.syncMeta),
          };
        }),

      startVerification: (surahNumber) =>
        set((state) => {
          const current = state.progress[surahNumber];
          const existing = state.activeSession;

          // Resume rather than restart. Al-Baqara is 286 verses: forcing the whole
          // thing again from verse 1 because the user had to stop is how a final
          // check becomes something people never attempt twice.
          if (
            existing?.kind === 'verify' &&
            existing.verifySurah === surahNumber &&
            existing.verifyIndex > 0
          ) {
            return { activeSession: existing, lastSummary: undefined };
          }

          // A re-take only covers what failed. The rest of the surah already
          // proved itself, and the sabqi keeps it warm.
          const queue = current ? verificationQueue(current) : [];

          return {
            activeSession: {
              kind: 'verify',
              date: dateKey(),
              startedAt: new Date().toISOString(),
              reviewQueue: [],
              reviewIndex: 0,
              ratings: [],
              sabqiQueue: [],
              sabqiIndex: 0,
              verifySurah: surahNumber,
              verifyQueue: queue,
              verifyIndex: 0,
              verifyFailed: [],
              verseStart: 0,
              versesTarget: 0,
              versesLearned: 0,
              activeSeconds: 0,
            },
            lastSummary: undefined,
          };
        }),

      recordVerificationVerse: (reveals, recalled, dwellSeconds = 0) =>
        set((state) => {
          const session = state.activeSession;
          if (!session || session.verifySurah === undefined) return state;
          // The verse being recited comes from the queue — which on a re-take
          // holds only the weak verses, not 1..N.
          const verseNumber = session.verifyQueue?.[session.verifyIndex];
          if (verseNumber === undefined) return state;
          const failed = verseGrade(reveals, recalled) !== 'good';

          return {
            activeSession: {
              ...session,
              verifyIndex: session.verifyIndex + 1,
              verifyFailed: failed
                ? [...session.verifyFailed, verseNumber]
                : session.verifyFailed,
              activeSeconds:
                (session.activeSeconds ?? 0) + countableSeconds(dwellSeconds),
            },
          };
        }),

      /**
       * The final recitation is over. A clean one is what makes a surah `known`
       * and lets it into the SRS; anything failed sends it back to learning with
       * its weak verses named, so the sabqi drills exactly what did not hold.
       */
      completeVerification: () =>
        set((state) => {
          const session = state.activeSession;
          const surahNumber = session?.verifySurah;
          if (!session || surahNumber === undefined) return state;
          const current = state.progress[surahNumber];
          if (!current) return state;

          const outcome = verificationOutcome(session.verifyFailed);
          const updatedAt = new Date().toISOString();

          return {
            progress: {
              ...state.progress,
              [surahNumber]: {
                ...current,
                status: outcome.status,
                weakVerses: outcome.weakVerses,
                nextReviewAt:
                  outcome.status === 'known' ? updatedAt : current.nextReviewAt,
                updatedAt,
              },
            },
            activeSession: {
              ...session,
              // The celebration and the 200 XP belong here — to the surah actually
              // recited whole — and nowhere else.
              completedSurah:
                outcome.status === 'known' ? surahNumber : session.completedSurah,
            },
            syncMeta: changedNow(state.syncMeta),
          };
        }),

      learnCurrentVerse: (dwellSeconds = 0) =>
        set((state) => {
          const session = state.activeSession;
          const surahNumber = session?.learningSurah;
          if (!session || !surahNumber || session.versesLearned >= session.versesTarget) {
            return state;
          }

          const current = state.progress[surahNumber] ?? makeProgress(surahNumber, 'learning');
          const versesLearned = Math.min(current.totalVerses, current.versesLearned + 1);
          const seenEveryVerse = versesLearned >= current.totalVerses;
          // Seeing every verse once is not knowing the surah. It now goes to
          // `verifying` and has to be recited whole before the SRS ever gets hold
          // of it — declaring it `known` here certified something false, and every
          // interval computed downstream inherited the lie.
          const completedNow = seenEveryVerse && current.status === 'learning';
          const updatedAt = new Date().toISOString();

          const nextProgress: Record<number, UserSurahProgress> = {
            ...state.progress,
            [surahNumber]: {
              ...current,
              versesLearned,
              status: seenEveryVerse ? 'verifying' : 'learning',
              // Which day each verse was learnt on: this is what the sabqi window
              // reads to know what is still fragile.
              learnedAt: {
                ...(current.learnedAt ?? {}),
                [versesLearned]: dateKey(),
              },
              updatedAt,
            },
          };

          // When the active surah is just completed, auto-promote the next queued
          // surah to 'learning' so the user never lands on an empty session plan.
          //
          // The queue can legitimately contain the surah being learnt (the user
          // queued it, then also tapped "apprendre") or one already known. Both
          // must be dropped rather than promoted: promoting the surah we have
          // just finished flipped it straight back to 'learning' with
          // versesLearned === totalVerses, leaving it pinned at 100% forever and
          // never advancing to the next one.
          let nextQueue = state.profile.learningQueue;
          if (completedNow) {
            const promotable = nextQueue.filter(
              (number) =>
                number !== surahNumber && nextProgress[number]?.status !== 'known',
            );
            const [promoted, ...rest] = promotable;
            nextQueue = rest;
            if (promoted !== undefined) {
              nextProgress[promoted] = {
                ...(nextProgress[promoted] ?? makeProgress(promoted, 'learning', updatedAt)),
                status: 'learning',
                updatedAt,
              };
            }
          }

          return {
            progress: nextProgress,
            profile:
              nextQueue === state.profile.learningQueue
                ? state.profile
                : { ...state.profile, learningQueue: nextQueue },
            activeSession: {
              ...session,
              versesLearned: session.versesLearned + 1,
              // NOT `completedSurah` here. Seeing the last verse once only sends
              // the surah to its final check — celebrating "surah memorised" and
              // paying the 200 XP at this point would certify exactly what the
              // final check exists to stop certifying. It is awarded when the
              // recitation is passed (see completeVerification).
              awaitingVerification: completedNow ? surahNumber : undefined,
              activeSeconds:
                (session.activeSeconds ?? 0) + countableSeconds(dwellSeconds),
            },
            syncMeta: changedNow(state.syncMeta),
          };
        }),

      completeDailySession: () => {
        const state = get();
        const session = state.activeSession;
        if (!session) return undefined;

        // A session where nothing was reviewed, learnt or recited earns no credit.
        // Without this, a user whose queue is empty and whose surah is finished
        // can open the empty session screen and tap "Terminer" for a free streak
        // day, 50 XP and the sub-3-minute badge.
        if (!sessionHasWork(session)) {
          set({ activeSession: undefined, lastSummary: undefined });
          return undefined;
        }

        // A surah reviewed, a verse replayed in sabqi and a whole surah recited are
        // three different units, and they must not be conflated. Reporting sabqi
        // verses as surah reviews made the server refuse honest work (a sabqi verse
        // cannot meet a review's time floor); reporting a 286-verse recitation as a
        // single review made it refuse that too (one item cannot hold 47 minutes).
        const creditedReviews =
          session.reviewIndex + (session.verifyIndex > 0 ? 1 : 0);
        const recitedVerses = session.sabqiIndex + session.verifyIndex;

        // Time actually spent on the text, accumulated item by item and capped
        // per item — not wall clock. Leaving the app open used to earn an hour of
        // "recitation", and a session tapped through in five seconds still earned
        // the 30-second floor. Bounded by the wall clock all the same, so a
        // tampered accumulator cannot claim more time than the session lasted.
        const elapsedSeconds = Math.round(
          (Date.now() - new Date(session.startedAt).getTime()) / 1000,
        );
        const durationSeconds = Math.max(
          0,
          Math.min(
            MAX_SESSION_SECONDS,
            session.activeSeconds ?? 0,
            elapsedSeconds,
          ),
        );
        const completedAt = new Date();
        const isPerfect = isPerfectReviewSession(
          session.reviewQueue.length,
          session.ratings,
        );
        // Credit the day the work was actually done, not the day we happen to be
        // flushing it: an abandoned session picked up the next morning must not
        // steal today's streak/XP credit (nor add its overnight idle time).
        const today = session.date;
        const existingRecord = state.history.find((record) => record.date === today);
        const existingToday = Boolean(existingRecord);
        // `session.isBonus` only controls which surahs are eligible for review
        // (see startDailySession); whether this session counts toward the daily
        // streak/XP depends solely on whether that day's credit was already earned.
        const isBonus = existingToday;
        const previous = sortedHistory(state.history).find((record) => record.date !== today);
        const freezeAllowance = session.freezeAllowance ?? state.stats.freezeAllowance ?? 1;
        const normalizedStats = normalizeStats(state.stats, freezeAllowance, completedAt);
        const streakResult = isBonus
          ? { stats: normalizedStats, freezeUsed: false }
          : advanceDailyStreak(
              normalizedStats,
              previous?.date,
              today,
              freezeAllowance,
              completedAt,
            );
        const sessionXP = calculateSessionXP({
          reviews: creditedReviews,
          verses: session.versesLearned,
          completedSurah: Boolean(session.completedSurah),
          isDaily: !isBonus,
          isPerfect,
          streak: streakResult.stats.currentStreak,
        });
        const xpBreakdown = sessionXP.breakdown;
        const xpEarned = sessionXP.total;

        const nextStats: UserStats = {
          ...streakResult.stats,
          totalXP: streakResult.stats.totalXP + xpEarned,
          weeklyXP: streakResult.stats.weeklyXP + xpEarned,
          totalSessions: streakResult.stats.totalSessions + 1,
          perfectSessions: streakResult.stats.perfectSessions + (isPerfect ? 1 : 0),
          consecutivePerfectSessions: isPerfect
            ? streakResult.stats.consecutivePerfectSessions + 1
            : 0,
          totalMinutes:
            streakResult.stats.totalMinutes +
            Math.max(1, Math.round(durationSeconds / 60)),
        };
        const knownCount = Object.values(state.progress).filter(
          (item) => item.status === 'known',
        ).length;
        const unlockedBadgeIds = findUnlockedBadges(nextStats, {
          knownCount,
          completedAt,
          durationSeconds,
        });
        nextStats.badges = [...nextStats.badges, ...unlockedBadgeIds];

        const record = appendSessionEntry(existingRecord, today, {
          id: session.startedAt,
          completedAt: completedAt.toISOString(),
          durationSeconds,
          xpEarned,
          surahsReviewed: creditedReviews,
          versesLearned: session.versesLearned,
          isPerfect,
          sessionCount: 1,
          perfectSessionCount: isPerfect ? 1 : 0,
        });
        const summary: SessionSummary = {
          xpEarned,
          surahsReviewed: creditedReviews,
          versesLearned: session.versesLearned,
          durationSeconds,
          isPerfect,
          isBonus,
          freezeUsed: streakResult.freezeUsed,
          completedSurah: session.completedSurah,
          awaitingVerification: session.awaitingVerification,
          // Carried whatever the outcome: the end screen has to be able to say
          // "Al-Falaq tient à 60 %, deux versets à raffermir" instead of falling
          // silent, which is what a failed check felt like.
          verifiedSurah: session.verifyIndex > 0 ? session.verifySurah : undefined,
          xpBreakdown,
          unlockedBadgeIds,
        };

        // Queued for the server, which is the only judge of what a parent sees.
        // Queued rather than posted directly so an offline session is not lost:
        // the app has to stay usable without a network.
        const pending: PendingSession = {
          id: session.startedAt,
          date: today,
          startedAt: session.startedAt,
          completedAt: completedAt.toISOString(),
          activeSeconds: durationSeconds,
          xpEarned,
          surahsReviewed: creditedReviews,
          recitedVerses,
          versesLearned: session.versesLearned,
          isPerfect,
        };

        set({
          stats: nextStats,
          history: existingToday
            ? state.history.map((item) => (item.date === today ? record : item))
            : [record, ...state.history],
          pendingSessions: [...state.pendingSessions, pending].slice(-MAX_PENDING_SESSIONS),
          syncMeta: changedNow(state.syncMeta),
          activeSession: undefined,
          lastSummary: summary,
        });
        return summary;
      },

      clearPendingSessions: (ids) =>
        set((state) => ({
          pendingSessions: state.pendingSessions.filter(
            (item) => !ids.includes(item.id),
          ),
        })),

      clearActiveSession: () => set({ activeSession: undefined }),

      applyCloudSnapshot: (snapshot, syncedAt, cloudUserId) => {
        // The snapshot can carry the stuck-at-100% state from a device that has
        // not been updated yet, so it is healed on the way in too.
        const healed = healLearningState({
          progress: snapshot.progress,
          profile: normalizeProfile(snapshot.profile),
        });
        set({
          onboardingCompleted: snapshot.onboardingCompleted,
          onboardingAccountPending: false,
          profile: healed.profile,
          progress: healed.progress,
          stats: normalizeStats(snapshot.stats, snapshot.stats.freezeAllowance ?? 1),
          history: snapshot.history.map(normalizeSessionRecord),
          syncMeta: {
            dirty: false,
            cloudUserId,
            lastLocalChangeAt: snapshot.updatedAt,
            lastSyncedAt: syncedAt,
          },
        });
      },

      resetForCloudUser: (cloudUserId) =>
        set({
          onboardingCompleted: false,
          onboardingAccountPending: false,
          profile: defaultProfile,
          progress: {},
          stats: createDefaultStats(),
          history: [],
      pendingSessions: [],
          syncMeta: {
            dirty: false,
            cloudUserId,
          },
          activeSession: undefined,
          lastSummary: undefined,
        }),

      resetApp: () =>
        set({
          onboardingCompleted: false,
          onboardingAccountPending: false,
          profile: defaultProfile,
          progress: {},
          stats: createDefaultStats(),
          history: [],
      pendingSessions: [],
          syncMeta: defaultSyncMeta,
          activeSession: undefined,
          lastSummary: undefined,
        }),
    }),
    {
      name: 'quran-daily-state',
      storage: createJSONStorage(() => AsyncStorage),
      // v6 heals learning state a queued-and-active surah could corrupt: it
      // promoted itself on completion and stayed pinned at 100%.
      // v7 adds the pending-session queue and the per-item active time. Sessions
      // recorded before it keep their wall-clock duration — the honest figure
      // starts from here rather than rewriting history.
      // v8 adds the memorisation loop: sabqi, the final recitation, and the
      // per-verse learning dates it reads. Surahs already marked `known` under the
      // old rule (every verse seen once) are left alone — sending a user's whole
      // library back for re-certification would be punishing them for a bug that
      // was ours.
      // v9 adds `offlineAudioAuto`. It defaults to true — see normalizeProfile,
      // which is what the migration below runs the profile through.
      version: 10,
      migrate: (persistedState, _version) => {
        const state = persistedState as Partial<QuranState>;
        const now = new Date();
        const migratedHistory = (state.history ?? []).map(normalizeSessionRecord);
        const healed = healLearningState({
          progress: state.progress ?? {},
          profile: normalizeProfile(state.profile),
        });
        return {
          ...state,
          onboardingAccountPending: state.onboardingAccountPending ?? false,
          profile: healed.profile,
          progress: healed.progress,
          stats: normalizeStats(state.stats, state.stats?.freezeAllowance ?? 1, now),
          history: migratedHistory,
          pendingSessions: state.pendingSessions ?? [],
          // A session persisted before the loop existed has none of its fields.
          activeSession: state.activeSession
            ? {
                ...state.activeSession,
                kind: state.activeSession.kind ?? 'daily',
                sabqiQueue: state.activeSession.sabqiQueue ?? [],
                sabqiIndex: state.activeSession.sabqiIndex ?? 0,
                verifyIndex: state.activeSession.verifyIndex ?? 0,
                verifyFailed: state.activeSession.verifyFailed ?? [],
                activeSeconds: state.activeSession.activeSeconds ?? 0,
              }
            : undefined,
          syncMeta: state.syncMeta ?? defaultSyncMeta,
        };
      },
      partialize: ({ hydrated: _hydrated, ...state }) => state,
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);

export const selectKnownCount = (state: QuranState) =>
  Object.values(state.progress).filter((item) => item.status === 'known').length;

/** Most recently touched first, so `[0]` is the surah a session defaults to. */
export const selectLearningSurahs = (state: QuranState) =>
  Object.values(state.progress)
    .filter((item) => item.status === 'learning')
    .sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''));

export const selectLearningProgress = (state: QuranState) =>
  selectLearningSurahs(state)[0];
