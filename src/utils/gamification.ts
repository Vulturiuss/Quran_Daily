import { SessionRecord, UserStats } from '@/types';
import {
  addDays,
  dateKey,
  dayDifference,
  monthKey,
  weekStartKey,
} from '@/utils/date';

export const levels = [
  { level: 1, name: 'Débutant', arabic: 'مبتدئ', xp: 0 },
  { level: 2, name: 'Récitant', arabic: 'قارئ', xp: 200 },
  { level: 3, name: 'Apprenant', arabic: 'متعلم', xp: 600 },
  { level: 4, name: 'Mémorisateur', arabic: 'حافظ', xp: 1500 },
  { level: 5, name: 'Gardien', arabic: 'حارس', xp: 3000 },
  { level: 6, name: 'Maître', arabic: 'أستاذ', xp: 6000 },
  { level: 7, name: 'Lumière', arabic: 'نور', xp: 12000 },
  { level: 8, name: 'Gardien du Coran', arabic: 'حافظ القرآن', xp: 25000 },
];

export interface BadgeContext {
  knownCount: number;
  completedAt?: Date;
  durationSeconds?: number;
}

export function createDefaultStats(now = new Date()): UserStats {
  return {
    currentStreak: 0,
    longestStreak: 0,
    totalXP: 0,
    weeklyXP: 0,
    weekStart: weekStartKey(now),
    totalSessions: 0,
    perfectSessions: 0,
    consecutivePerfectSessions: 0,
    totalMinutes: 0,
    freezeCount: 1,
    freezeAllowance: 1,
    freezeRefillMonth: monthKey(now),
    badges: [],
  };
}

export function normalizeStats(
  stats: Partial<UserStats> | undefined,
  freezeAllowance = stats?.freezeAllowance ?? 1,
  now = new Date(),
): UserStats {
  const defaults = createDefaultStats(now);
  const allowance = Math.max(1, freezeAllowance);
  const currentMonth = monthKey(now);
  const currentWeek = weekStartKey(now);
  const storedMonth = stats?.freezeRefillMonth ?? currentMonth;
  const storedWeek = stats?.weekStart ?? currentWeek;

  return {
    ...defaults,
    ...stats,
    weeklyXP: storedWeek === currentWeek ? (stats?.weeklyXP ?? 0) : 0,
    weekStart: currentWeek,
    consecutivePerfectSessions: stats?.consecutivePerfectSessions ?? 0,
    // Freezes refill on a month boundary and nowhere else. Refilling whenever the
    // allowance *changed* meant every app launch handed them back: the premium
    // flag resolves asynchronously, so the allowance flips 3 -> 1 -> 3 on each
    // boot, which made a premium streak effectively unbreakable. A shrinking
    // allowance just clamps the balance instead.
    freezeCount:
      storedMonth !== currentMonth
        ? allowance
        : Math.min(allowance, Math.max(0, stats?.freezeCount ?? allowance)),
    freezeAllowance: allowance,
    freezeRefillMonth: currentMonth,
    badges: stats?.badges ?? [],
  };
}

function previousDayKey(today: string) {
  return dateKey(addDays(new Date(`${today}T12:00:00`), -1));
}

export function reconcileMissedStreak(
  stats: UserStats,
  lastCompletedDate: string | undefined,
  freezeAllowance: number,
  now = new Date(),
): UserStats {
  const normalized = normalizeStats(stats, freezeAllowance, now);
  if (!lastCompletedDate || normalized.currentStreak <= 0) return normalized;

  const today = dateKey(now);
  const gap = dayDifference(lastCompletedDate, today);
  if (gap <= 1) return normalized;

  const missedDate = previousDayKey(today);
  if (gap === 2) {
    if (normalized.lastFreezeUsedAt === missedDate) return normalized;
    if (normalized.freezeCount > 0) {
      return {
        ...normalized,
        freezeCount: normalized.freezeCount - 1,
        lastFreezeUsedAt: missedDate,
      };
    }
  }

  return {
    ...normalized,
    currentStreak: 0,
  };
}

export function advanceDailyStreak(
  stats: UserStats,
  previousCompletedDate: string | undefined,
  today: string,
  freezeAllowance: number,
  now = new Date(),
) {
  let next = normalizeStats(stats, freezeAllowance, now);
  if (!previousCompletedDate) {
    return {
      stats: { ...next, currentStreak: 1, longestStreak: Math.max(1, next.longestStreak) },
      freezeUsed: false,
    };
  }

  const gap = dayDifference(previousCompletedDate, today);
  let currentStreak = 1;
  let freezeUsed = false;

  if (gap === 1) {
    currentStreak = next.currentStreak + 1;
  } else if (gap === 2) {
    const missedDate = previousDayKey(today);
    if (next.lastFreezeUsedAt === missedDate) {
      currentStreak = next.currentStreak + 1;
      freezeUsed = true;
    } else if (next.freezeCount > 0) {
      next = {
        ...next,
        freezeCount: next.freezeCount - 1,
        lastFreezeUsedAt: missedDate,
      };
      currentStreak = next.currentStreak + 1;
      freezeUsed = true;
    }
  }

  return {
    stats: {
      ...next,
      currentStreak,
      longestStreak: Math.max(next.longestStreak, currentStreak),
    },
    freezeUsed,
  };
}

export function streakMilestoneXP(streak: number) {
  const milestones: Record<number, number> = {
    3: 30,
    7: 100,
    30: 500,
    100: 1000,
    365: 5000,
  };
  return milestones[streak] ?? 0;
}

export function calculateSessionXP({
  reviews,
  verses,
  completedSurah,
  isDaily,
  isPerfect,
  streak,
}: {
  reviews: number;
  verses: number;
  completedSurah: boolean;
  isDaily: boolean;
  isPerfect: boolean;
  streak: number;
}) {
  const breakdown = {
    reviews: reviews * 10,
    verses: verses * 20,
    surahCompletion: completedSurah ? 200 : 0,
    dailyCompletion: isDaily ? 50 : 0,
    perfectSession: isPerfect ? 50 : 0,
    streakMilestone: isDaily ? streakMilestoneXP(streak) : 0,
  };
  return {
    breakdown,
    total: Object.values(breakdown).reduce((sum, value) => sum + value, 0),
  };
}

export function isPerfectReviewSession(
  reviewCount: number,
  ratings: readonly string[],
) {
  return (
    reviewCount > 0 &&
    ratings.length === reviewCount &&
    ratings.every((rating) => rating === 'good')
  );
}

export function getLevel(totalXP: number) {
  return [...levels].reverse().find((level) => totalXP >= level.xp) ?? levels[0];
}

export function getLevelProgress(totalXP: number) {
  const current = getLevel(totalXP);
  const next = levels.find((level) => level.level === current.level + 1);
  if (!next) return { current, next: undefined, progress: 1, remaining: 0 };
  const earnedInLevel = totalXP - current.xp;
  const span = next.xp - current.xp;
  return {
    current,
    next,
    progress: Math.min(1, earnedInLevel / span),
    remaining: next.xp - totalXP,
  };
}

export function findUnlockedBadges(stats: UserStats, context: BadgeContext) {
  const unlocked = new Set(stats.badges);
  const hour = context.completedAt?.getHours();
  const candidates: Array<[boolean, string]> = [
    [stats.totalSessions >= 1, 'first_session'],
    [stats.currentStreak >= 3, 'streak_3'],
    [stats.currentStreak >= 7, 'streak_7'],
    [stats.currentStreak >= 30, 'streak_30'],
    [stats.currentStreak >= 100, 'streak_100'],
    [stats.currentStreak >= 365, 'streak_365'],
    [context.knownCount >= 1, 'surah_1'],
    [context.knownCount >= 10, 'surah_10'],
    [context.knownCount >= 25, 'surah_25'],
    [context.knownCount >= 50, 'surah_50'],
    [context.knownCount >= 114, 'surah_114'],
    [hour !== undefined && hour < 7, 'fajr'],
    [hour !== undefined && hour >= 22, 'isha'],
    [(context.durationSeconds ?? Number.POSITIVE_INFINITY) < 180, 'lightning'],
    [stats.consecutivePerfectSessions >= 10, 'perfect_10'],
  ];
  return candidates
    .filter(([matches, id]) => matches && !unlocked.has(id))
    .map(([, id]) => id);
}

export function historySessionCount(record: SessionRecord) {
  return record.sessionCount ?? 1;
}

export function historyPerfectCount(record: SessionRecord) {
  return record.perfectSessionCount ?? (record.isPerfect ? 1 : 0);
}
