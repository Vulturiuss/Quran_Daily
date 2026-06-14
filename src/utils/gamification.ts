import { UserStats } from '@/types';

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

export function findUnlockedBadges(stats: UserStats, knownCount: number) {
  const unlocked = new Set(stats.badges);
  const candidates: Array<[boolean, string]> = [
    [stats.totalSessions >= 1, 'first_session'],
    [stats.currentStreak >= 3, 'streak_3'],
    [stats.currentStreak >= 7, 'streak_7'],
    [stats.currentStreak >= 30, 'streak_30'],
    [knownCount >= 1, 'surah_1'],
    [knownCount >= 10, 'surah_10'],
    [stats.totalXP >= 1000, 'xp_1000'],
    [stats.perfectSessions >= 10, 'perfect_10'],
  ];
  return candidates.filter(([matches, id]) => matches && !unlocked.has(id)).map(([, id]) => id);
}
