import type { ThemeId } from '@/theme';

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
  showReviewTransliteration: boolean;
  showReviewTranslation: boolean;
  theme: ThemeId;
  learningQueue: number[];
}

export interface UserStats {
  currentStreak: number;
  longestStreak: number;
  totalXP: number;
  weeklyXP: number;
  weekStart: string;
  totalSessions: number;
  perfectSessions: number;
  consecutivePerfectSessions: number;
  totalMinutes: number;
  freezeCount: number;
  freezeAllowance: number;
  freezeRefillMonth: string;
  lastFreezeUsedAt?: string;
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
  sessionCount?: number;
  perfectSessionCount?: number;
  sessions?: SessionEntry[];
}

export interface SessionEntry {
  id: string;
  completedAt: string;
  durationSeconds: number;
  xpEarned: number;
  surahsReviewed: number;
  versesLearned: number;
  isPerfect: boolean;
  sessionCount: number;
  perfectSessionCount: number;
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
  isBonus?: boolean;
  freezeAllowance?: number;
  completedSurah?: number;
}

export interface SessionSummary {
  xpEarned: number;
  surahsReviewed: number;
  versesLearned: number;
  durationSeconds: number;
  isPerfect: boolean;
  isBonus: boolean;
  freezeUsed: boolean;
  completedSurah?: number;
  xpBreakdown: {
    reviews: number;
    verses: number;
    surahCompletion: number;
    dailyCompletion: number;
    perfectSession: number;
    streakMilestone: number;
  };
  unlockedBadgeIds: string[];
}

export interface SyncMeta {
  dirty: boolean;
  cloudUserId?: string;
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

export type FamilyRole = 'parent' | 'child';

export interface FamilyContext {
  familyId: string;
  familyName: string;
  role: FamilyRole;
  inviteCode?: string;
  memberCount: number;
  parentCount: number;
  childCount: number;
  maxChildren: number;
  maxMembers: number;
  ownerDisplayName: string;
  active: boolean;
}

export interface FamilyMemberSummary {
  userId: string;
  displayName: string;
  role: FamilyRole;
  isOwner: boolean;
  joinedAt: string;
  currentStreak: number;
  longestStreak: number;
  totalXP: number;
  totalSessions: number;
  totalMinutes: number;
  knownSurahs: number;
  versesLearned: number;
  learningSurah?: number;
  learningVersesLearned: number;
  learningTotalVerses: number;
  history: SessionRecord[];
  todayCompleted: boolean;
  todayReviews: number;
  todayVersesLearned: number;
  todayXPEarned: number;
  lastSessionDate?: string;
  snapshotUpdatedAt?: string;
}
