import type { ThemeId } from '@/theme';

/**
 * `verifying`: every verse has been seen once, but the surah has not yet been
 * recited whole. It used to jump straight to `known` at that point, which
 * certified something false and fed the SRS on it.
 */
export type SurahStatus = 'locked' | 'learning' | 'verifying' | 'known';
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
  /** Verse number -> the day it was learnt. Drives the sabqi window. */
  learnedAt?: Record<number, string>;
  /** Verses failed during the final recitation. Replayed until they hold. */
  weakVerses?: number[];
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
  /**
   * Let the app keep the recitation of the surahs being worked on. On by default:
   * the point of the feature is that nobody has to ask for it.
   */
  offlineAudioAuto: boolean;
  /**
   * What the user set out to memorise this Ramadan. Absent the rest of the year,
   * and absent for anyone who did not ask for one — an objective nobody chose is
   * not an objective, it is a debt.
   */
  ramadanGoal?: {
    surahNumbers: number[];
    startedAt: string;
  };
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

/**
 * `daily` runs the whole routine (reviews then learning) — that is what the home
 * screen launches. The Réviser and Apprendre tabs launch only their own half:
 * they used to both call the same thing, so the two tabs were two doors into the
 * same room. `verify` is the final recitation of a finished surah.
 */
export type SessionKind = 'daily' | 'review' | 'learn' | 'verify';

export interface ActiveSession {
  kind: SessionKind;
  date: string;
  startedAt: string;
  reviewQueue: number[];
  reviewIndex: number;
  ratings: ReviewRating[];
  learningSurah?: number;
  /** Verses of the learning surah to re-recite before any new one (sabqi). */
  sabqiQueue: number[];
  sabqiIndex: number;
  /** The surah being recited, and the verses failed so far. */
  verifySurah?: number;
  /**
   * The verses this recitation covers. The whole surah the first time; on a
   * re-take, only the verses that failed — making someone recite Al-Baqara's 286
   * verses again because they hesitated on two is not rigour, it is churn.
   */
  verifyQueue?: number[];
  verifyIndex: number;
  verifyFailed: number[];
  verseStart: number;
  versesTarget: number;
  versesLearned: number;
  isBonus?: boolean;
  freezeAllowance?: number;
  /** Recited whole and passed. Earns the celebration and the completion XP. */
  completedSurah?: number;
  /**
   * Every verse has now been seen once, so the surah has moved to its final
   * check. Distinct from `completedSurah`: it is not memorised yet, and the end
   * screen must not say it is.
   */
  awaitingVerification?: number;
  /**
   * Time actually spent on the text, accumulated item by item and capped per
   * item. Not wall clock: leaving the app open must not earn recitation time,
   * and tapping through must not earn a session. This is what
   * `SessionRecord.durationSeconds` carries from now on.
   */
  activeSeconds: number;
}

/**
 * A completed session waiting to be sent to the server, which is the only judge
 * of whether it counts. Kept in a queue so an offline session is not lost — the
 * app must stay usable in the metro.
 */
export interface PendingSession {
  id: string;
  date: string;
  startedAt: string;
  completedAt: string;
  activeSeconds: number;
  xpEarned: number;
  surahsReviewed: number;
  /** Verses replayed in sabqi and in the final recitation — a different unit. */
  recitedVerses: number;
  versesLearned: number;
  isPerfect: boolean;
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
  /** Fully seen, now awaiting its final recitation. Not memorised — do not say so. */
  awaitingVerification?: number;
  /**
   * The surah whose final recitation this session ran, whatever its outcome. The
   * end screen needs it to speak about what did NOT hold — a check that leaves a
   * couple of weak verses is progress, and saying nothing at all reads as failure.
   */
  verifiedSurah?: number;
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
  /** Minutes actually spent on the text today, as accepted by the server. */
  todayMinutes: number;
  todayReviews: number;
  todayVersesLearned: number;
  todayXPEarned: number;
  lastSessionDate?: string;
  snapshotUpdatedAt?: string;
}
