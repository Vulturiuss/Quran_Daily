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
import { dateKey, dayDifference } from '@/utils/date';
import { findUnlockedBadges } from '@/utils/gamification';
import { calculateNextReview, isDue, sortByReviewPriority } from '@/utils/srs';

const defaultProfile: UserProfile = {
  displayName: 'Amin',
  dailyGoalMinutes: 5,
  dailyGoalVerses: 2,
  dailyGoalReviews: 2,
  notificationTime: '20:00',
  notificationsEnabled: false,
  preferredReciter: 'mishary',
};

const defaultStats: UserStats = {
  currentStreak: 0,
  longestStreak: 0,
  totalXP: 0,
  weeklyXP: 0,
  totalSessions: 0,
  perfectSessions: 0,
  totalMinutes: 0,
  badges: [],
};

const defaultSyncMeta: SyncMeta = {
  dirty: false,
};

function changedNow(previous?: SyncMeta): SyncMeta {
  return {
    dirty: true,
    lastLocalChangeAt: new Date().toISOString(),
    lastSyncedAt: previous?.lastSyncedAt,
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
}

export interface QuranState {
  hydrated: boolean;
  onboardingCompleted: boolean;
  profile: UserProfile;
  progress: Record<number, UserSurahProgress>;
  stats: UserStats;
  history: SessionRecord[];
  syncMeta: SyncMeta;
  activeSession?: ActiveSession;
  lastSummary?: SessionSummary;
  setHydrated: (value: boolean) => void;
  completeOnboarding: (input: OnboardingInput) => void;
  updateProfile: (input: Partial<UserProfile>) => void;
  setLearningSurah: (surahNumber: number) => void;
  markSurahKnown: (surahNumber: number) => void;
  startDailySession: (access?: SessionAccess) => void;
  rateCurrentReview: (rating: ReviewRating) => void;
  learnCurrentVerse: () => void;
  completeDailySession: () => SessionSummary | undefined;
  clearActiveSession: () => void;
  applyCloudSnapshot: (snapshot: CloudSnapshot, syncedAt: string) => void;
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
      profile: defaultProfile,
      progress: {},
      stats: defaultStats,
      history: [],
      syncMeta: defaultSyncMeta,

      setHydrated: (value) => set({ hydrated: value }),

      completeOnboarding: (input) => {
        const progress: Record<number, UserSurahProgress> = {};
        const updatedAt = new Date().toISOString();
        input.knownSurahs.forEach((number) => {
          progress[number] = makeProgress(number, 'known', updatedAt);
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
          stats: defaultStats,
          history: [],
          syncMeta: {
            dirty: true,
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
        const reviewQueue = [...due, ...notDue]
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
            xpEarned: 0,
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
              xpEarned: session.xpEarned + 10,
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
              xpEarned: session.xpEarned + 20,
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
        const xpEarned = session.xpEarned + 50;
        const isPerfect = session.ratings.every((rating) => rating === 'good');
        const today = dateKey();
        const existingToday = state.history.some((record) => record.date === today);
        const previous = sortedHistory(state.history).find((record) => record.date !== today);
        const gap = previous ? dayDifference(previous.date, today) : undefined;
        const currentStreak = existingToday
          ? state.stats.currentStreak
          : gap === 1
            ? state.stats.currentStreak + 1
            : 1;

        const nextStats: UserStats = {
          ...state.stats,
          currentStreak,
          longestStreak: Math.max(state.stats.longestStreak, currentStreak),
          totalXP: state.stats.totalXP + xpEarned,
          weeklyXP: state.stats.weeklyXP + xpEarned,
          totalSessions: state.stats.totalSessions + (existingToday ? 0 : 1),
          perfectSessions: state.stats.perfectSessions + (!existingToday && isPerfect ? 1 : 0),
          totalMinutes: state.stats.totalMinutes + Math.max(1, Math.round(durationSeconds / 60)),
        };
        const knownCount = Object.values(state.progress).filter(
          (item) => item.status === 'known',
        ).length;
        const unlockedBadgeIds = findUnlockedBadges(nextStats, knownCount);
        nextStats.badges = [...nextStats.badges, ...unlockedBadgeIds];

        const record: SessionRecord = {
          date: today,
          completedAt: new Date().toISOString(),
          durationSeconds,
          xpEarned,
          surahsReviewed: session.reviewIndex,
          versesLearned: session.versesLearned,
          isPerfect,
        };
        const summary: SessionSummary = {
          xpEarned,
          surahsReviewed: session.reviewIndex,
          versesLearned: session.versesLearned,
          durationSeconds,
          isPerfect,
          unlockedBadgeIds,
        };

        set({
          stats: nextStats,
          history: existingToday ? state.history : [record, ...state.history],
          syncMeta: changedNow(state.syncMeta),
          activeSession: undefined,
          lastSummary: summary,
        });
        return summary;
      },

      clearActiveSession: () => set({ activeSession: undefined }),

      applyCloudSnapshot: (snapshot, syncedAt) =>
        set({
          onboardingCompleted: snapshot.onboardingCompleted,
          profile: snapshot.profile,
          progress: snapshot.progress,
          stats: snapshot.stats,
          history: snapshot.history,
          syncMeta: {
            dirty: false,
            lastLocalChangeAt: snapshot.updatedAt,
            lastSyncedAt: syncedAt,
          },
        }),

      resetApp: () =>
        set((state) => ({
          onboardingCompleted: false,
          profile: defaultProfile,
          progress: {},
          stats: defaultStats,
          history: [],
          syncMeta: changedNow(state.syncMeta),
          activeSession: undefined,
          lastSummary: undefined,
        })),
    }),
    {
      name: 'quran-daily-state',
      storage: createJSONStorage(() => AsyncStorage),
      version: 2,
      migrate: (persistedState, version) => {
        const state = persistedState as Partial<QuranState>;
        if (version < 2 && state.onboardingCompleted) {
          return {
            ...state,
            syncMeta: {
              dirty: true,
              lastLocalChangeAt: new Date().toISOString(),
            },
          };
        }
        return {
          ...state,
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
