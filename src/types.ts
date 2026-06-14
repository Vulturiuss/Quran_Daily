export type SurahStatus = 'locked' | 'learning' | 'known';
export type ReviewRating = 'good' | 'hard' | 'forgot';

export interface Surah {
  number: number;
  name: string;
  nameTranslit: string;
  nameFr: string;
  totalVerses: number;
  revelationType: 'meccan' | 'medinan';
}

export interface Verse {
  surahNumber: number;
  verseNumber: number;
  verseKey: string;
  juzNumber: number;
  pageNumber: number;
  textArabic: string;
  textTranslit: string;
  textFr: string;
  audioUrl?: string;
}

export interface UserSurahProgress {
  surahNumber: number;
  status: SurahStatus;
  versesLearned: number;
  totalVerses: number;
  lastReviewedAt?: string;
  nextReviewAt?: string;
  reviewIntervalDays: number;
  easeFactor: number;
  reviewCount: number;
  updatedAt?: string;
}

export interface UserProfile {
  displayName: string;
  dailyGoalMinutes: 3 | 5 | 10 | 15;
  dailyGoalVerses: number;
  dailyGoalReviews: number;
  notificationTime: string;
  notificationsEnabled: boolean;
  preferredReciter: string;
}

export interface UserStats {
  currentStreak: number;
  longestStreak: number;
  totalXP: number;
  weeklyXP: number;
  totalSessions: number;
  perfectSessions: number;
  totalMinutes: number;
  badges: string[];
}

export interface SessionRecord {
  date: string;
  completedAt: string;
  durationSeconds: number;
  xpEarned: number;
  surahsReviewed: number;
  versesLearned: number;
  isPerfect: boolean;
}

export interface ActiveSession {
  date: string;
  startedAt: string;
  reviewQueue: number[];
  reviewIndex: number;
  ratings: ReviewRating[];
  learningSurah?: number;
  verseStart: number;
  versesTarget: number;
  versesLearned: number;
  xpEarned: number;
}

export interface SessionSummary {
  xpEarned: number;
  surahsReviewed: number;
  versesLearned: number;
  durationSeconds: number;
  isPerfect: boolean;
  unlockedBadgeIds: string[];
}

export interface SyncMeta {
  dirty: boolean;
  lastLocalChangeAt?: string;
  lastSyncedAt?: string;
}

export interface CloudSnapshot {
  schemaVersion: 1;
  updatedAt: string;
  onboardingCompleted: boolean;
  profile: UserProfile;
  progress: Record<number, UserSurahProgress>;
  stats: UserStats;
  history: SessionRecord[];
}
