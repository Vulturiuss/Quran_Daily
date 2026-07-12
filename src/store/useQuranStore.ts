import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { getSurah } from '@/data/surahs';
import { getVerses } from '@/data/verses';
import {
  ActiveSession,
  CloudSnapshot,
  ReviewRating,
  SessionRecord,
  SessionSummary,
  SyncMeta,
  UserProfile,
  UserStats,
  UserSurahProgress,
} from '@/types';
import { addDays, dateKey } from '@/utils/date';
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
};

const defaultSyncMeta: SyncMeta = {
  dirty: false,
};

// Wall-clock time between "session started" and "session flushed" is not time
// spent reciting: a session left open overnight would otherwise add ~840 minutes
// to the user's total. One hour is well above any real daily goal (max 15 min).
const MAX_SESSION_SECONDS = 3600;

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
  markSurahKnown: (surahNumber: number) => void;
  markSurahForgotten: (surahNumber: number) => void;
  addToLearningQueue: (surahNumber: number) => void;
  removeFromLearningQueue: (surahNumber: number) => void;
  reorderLearningQueue: (surahNumber: number, direction: 'up' | 'down') => void;
  startDailySession: (access?: SessionAccess) => void;
  rateCurrentReview: (rating: ReviewRating) => void;
  learnCurrentVerse: () => void;
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
          // Queueing the surah currently being learnt, or one already memorised,
          // only creates a queue entry that can never be promoted.
          const status = state.progress[surahNumber]?.status;
          if (status === 'learning' || status === 'known') return state;
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
        if (
          stale &&
          stale.date !== dateKey() &&
          (stale.reviewIndex > 0 || stale.versesLearned > 0)
        ) {
          // An unfinished session from a previous day would otherwise be
          // silently discarded below, forfeiting its XP/streak credit and
          // making that day look missed for streak-freeze purposes.
          get().completeDailySession();
        }

        const state = get();
        if (state.activeSession?.date === dateKey()) return;

        // Every surah is reviewable on every tier: the only bound is the user's
        // own daily goal.
        const known = Object.values(state.progress).filter(
          (item) => item.status === 'known',
        );
        const due = sortByReviewPriority(known.filter((item) => isDue(item)));
        const notDue = sortByReviewPriority(known.filter((item) => !isDue(item)));
        const reviewCandidates = access?.isBonus ? [...due, ...notDue] : due;
        const reviewQueue = reviewCandidates
          .slice(0, state.profile.dailyGoalReviews)
          .map((item) => item.surahNumber);

        // With several surahs active, the session works on the one the user
        // picked; otherwise on the only (or most recently touched) one.
        const activeLearning = Object.values(state.progress)
          .filter((item) => item.status === 'learning')
          .sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''));
        const learning =
          activeLearning.find((item) => item.surahNumber === access?.learningSurah) ??
          activeLearning[0];
        const availableVerses = getVerses(learning?.surahNumber);
        const verseStart = learning?.versesLearned ?? 0;
        const versesTarget = Math.max(
          0,
          Math.min(state.profile.dailyGoalVerses, availableVerses.length - verseStart),
        );

        set({
          activeSession: {
            date: dateKey(),
            startedAt: new Date().toISOString(),
            reviewQueue,
            reviewIndex: 0,
            ratings: [],
            learningSurah: learning?.surahNumber,
            verseStart,
            versesTarget,
            versesLearned: 0,
            isBonus: access?.isBonus ?? false,
            freezeAllowance: access?.freezeAllowance ?? 1,
          },
          lastSummary: undefined,
        });
      },

      rateCurrentReview: (rating) =>
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
            },
            syncMeta: changedNow(state.syncMeta),
          };
        }),

      learnCurrentVerse: () =>
        set((state) => {
          const session = state.activeSession;
          const surahNumber = session?.learningSurah;
          if (!session || !surahNumber || session.versesLearned >= session.versesTarget) {
            return state;
          }

          const current = state.progress[surahNumber] ?? makeProgress(surahNumber, 'learning');
          const versesLearned = Math.min(current.totalVerses, current.versesLearned + 1);
          const completed = versesLearned >= current.totalVerses;
          const completedNow = completed && current.status !== 'known';
          const updatedAt = new Date().toISOString();

          const nextProgress: Record<number, UserSurahProgress> = {
            ...state.progress,
            [surahNumber]: {
              ...current,
              versesLearned,
              status: completed ? 'known' : 'learning',
              nextReviewAt: completed ? updatedAt : current.nextReviewAt,
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
              completedSurah: completedNow ? surahNumber : session.completedSurah,
            },
            syncMeta: changedNow(state.syncMeta),
          };
        }),

      completeDailySession: () => {
        const state = get();
        const session = state.activeSession;
        if (!session) return undefined;

        // A session where nothing was reviewed and nothing was learned earns no
        // credit. Without this, a user whose queue is empty and whose surah is
        // finished can open the empty session screen and tap "Terminer" for a
        // free streak day, 50 XP and the sub-3-minute badge.
        if (session.reviewIndex === 0 && session.versesLearned === 0) {
          set({ activeSession: undefined, lastSummary: undefined });
          return undefined;
        }

        const durationSeconds = Math.min(
          MAX_SESSION_SECONDS,
          Math.max(
            30,
            Math.round((Date.now() - new Date(session.startedAt).getTime()) / 1000),
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
          reviews: session.reviewIndex,
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
          surahsReviewed: session.reviewIndex,
          versesLearned: session.versesLearned,
          isPerfect,
          sessionCount: 1,
          perfectSessionCount: isPerfect ? 1 : 0,
        });
        const summary: SessionSummary = {
          xpEarned,
          surahsReviewed: session.reviewIndex,
          versesLearned: session.versesLearned,
          durationSeconds,
          isPerfect,
          isBonus,
          freezeUsed: streakResult.freezeUsed,
          completedSurah: session.completedSurah,
          xpBreakdown,
          unlockedBadgeIds,
        };

        set({
          stats: nextStats,
          history: existingToday
            ? state.history.map((item) => (item.date === today ? record : item))
            : [record, ...state.history],
          syncMeta: changedNow(state.syncMeta),
          activeSession: undefined,
          lastSummary: summary,
        });
        return summary;
      },

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
      version: 6,
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
