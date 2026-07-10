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
import {
  appendSessionEntry,
  normalizeSessionRecord,
} from '@/utils/sessionHistory';
import { calculateNextReview, isDue, sortByReviewPriority } from '@/utils/srs';

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
};

const defaultSyncMeta: SyncMeta = {
  dirty: false,
};

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

interface SessionAccess {
  maxReviews?: number;
  allowedSurahNumbers?: readonly number[];
  isBonus?: boolean;
  freezeAllowance?: number;
}

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
  setLearningSurah: (surahNumber: number) => void;
  markSurahKnown: (surahNumber: number) => void;
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

      setLearningSurah: (surahNumber) =>
        set((state) => {
          const next = { ...state.progress };
          const updatedAt = new Date().toISOString();
          Object.values(next).forEach((item) => {
            if (item.status === 'learning') {
              next[item.surahNumber] = {
                ...item,
                status: 'locked',
                updatedAt,
              };
            }
          });
          const existing = next[surahNumber];
          next[surahNumber] = existing
            ? { ...existing, status: 'learning', updatedAt }
            : makeProgress(surahNumber, 'learning', updatedAt);
          return {
            progress: next,
            syncMeta: {
              dirty: true,
              lastLocalChangeAt: updatedAt,
              lastSyncedAt: state.syncMeta.lastSyncedAt,
            },
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
            syncMeta: {
              dirty: true,
              lastLocalChangeAt: updatedAt,
              lastSyncedAt: state.syncMeta.lastSyncedAt,
            },
          };
        }),

      startDailySession: (access) => {
        const state = get();
        if (state.activeSession?.date === dateKey()) return;

        const allowedSurahs = access?.allowedSurahNumbers
          ? new Set(access.allowedSurahNumbers)
          : undefined;
        const known = Object.values(state.progress).filter(
          (item) =>
            item.status === 'known' &&
            (!allowedSurahs || allowedSurahs.has(item.surahNumber)),
        );
        const due = sortByReviewPriority(known.filter((item) => isDue(item)));
        const notDue = sortByReviewPriority(known.filter((item) => !isDue(item)));
        const reviewCandidates = access?.isBonus ? [...due, ...notDue] : due;
        const reviewQueue = reviewCandidates
          .slice(
            0,
            Math.min(
              state.profile.dailyGoalReviews,
              access?.maxReviews ?? state.profile.dailyGoalReviews,
            ),
          )
          .map((item) => item.surahNumber);
        const learning = Object.values(state.progress).find(
          (item) =>
            item.status === 'learning' &&
            (!allowedSurahs || allowedSurahs.has(item.surahNumber)),
        );
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
                ...calculateNextReview(item, rating),
                updatedAt,
              },
            },
            activeSession: {
              ...session,
              reviewIndex: session.reviewIndex + 1,
              ratings: [...session.ratings, rating],
            },
            syncMeta: {
              dirty: true,
              lastLocalChangeAt: updatedAt,
              lastSyncedAt: state.syncMeta.lastSyncedAt,
            },
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

          return {
            progress: {
              ...state.progress,
              [surahNumber]: {
                ...current,
                versesLearned,
                status: completed ? 'known' : 'learning',
                nextReviewAt: completed ? updatedAt : current.nextReviewAt,
                updatedAt,
              },
            },
            activeSession: {
              ...session,
              versesLearned: session.versesLearned + 1,
              completedSurah: completedNow ? surahNumber : session.completedSurah,
            },
            syncMeta: {
              dirty: true,
              lastLocalChangeAt: updatedAt,
              lastSyncedAt: state.syncMeta.lastSyncedAt,
            },
          };
        }),

      completeDailySession: () => {
        const state = get();
        const session = state.activeSession;
        if (!session) return undefined;

        const durationSeconds = Math.max(
          30,
          Math.round((Date.now() - new Date(session.startedAt).getTime()) / 1000),
        );
        const completedAt = new Date();
        const isPerfect = isPerfectReviewSession(
          session.reviewQueue.length,
          session.ratings,
        );
        const today = dateKey();
        const existingRecord = state.history.find((record) => record.date === today);
        const existingToday = Boolean(existingRecord);
        const isBonus = session.isBonus || existingToday;
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

      applyCloudSnapshot: (snapshot, syncedAt, cloudUserId) =>
        set({
          onboardingCompleted: snapshot.onboardingCompleted,
          onboardingAccountPending: false,
          profile: normalizeProfile(snapshot.profile),
          progress: snapshot.progress,
          stats: normalizeStats(snapshot.stats, snapshot.stats.freezeAllowance ?? 1),
          history: snapshot.history.map(normalizeSessionRecord),
          syncMeta: {
            dirty: false,
            cloudUserId,
            lastLocalChangeAt: snapshot.updatedAt,
            lastSyncedAt: syncedAt,
          },
        }),

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
      version: 4,
      migrate: (persistedState, version) => {
        const state = persistedState as Partial<QuranState>;
        const now = new Date();
        const migratedHistory = (state.history ?? []).map(normalizeSessionRecord);
        return {
          ...state,
          onboardingAccountPending: state.onboardingAccountPending ?? false,
          profile: normalizeProfile(state.profile),
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

export const selectLearningProgress = (state: QuranState) =>
  Object.values(state.progress).find((item) => item.status === 'learning');
