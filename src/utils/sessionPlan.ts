import { UserProfile, UserSurahProgress } from '@/types';
import { isDue, sortByReviewPriority } from '@/utils/srs';

export interface SessionPreview {
  estimatedMinutes: number;
  learningVerseEnd?: number;
  learningVerseStart?: number;
  reviewCount: number;
  reviewSurahNumbers: number[];
  versesCount: number;
  learningSurah?: number;
}

/**
 * Mirrors what startDailySession would build, for the home screen preview. No
 * surah is gated on any tier, so the only bound is the user's own daily goal.
 * `learningSurah` picks among the surahs learnt in parallel (Premium); without
 * it the most recently touched one is used, which is what the session defaults to.
 */
export function buildSessionPreview(
  progress: Record<number, UserSurahProgress>,
  profile: UserProfile,
  at: Date,
  learningSurah?: number,
): SessionPreview {
  const items = Object.values(progress);
  const due = sortByReviewPriority(
    items.filter((item) => item.status === 'known' && isDue(item, at)),
  );
  const selectedReviews = due.slice(0, profile.dailyGoalReviews);
  const active = items
    .filter((item) => item.status === 'learning')
    .sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''));
  const learning =
    active.find((item) => item.surahNumber === learningSurah) ?? active[0];
  const remainingVerses = learning
    ? Math.max(0, learning.totalVerses - learning.versesLearned)
    : 0;
  const versesCount = Math.min(profile.dailyGoalVerses, remainingVerses);
  const estimatedSeconds =
    selectedReviews.reduce((total, item) => total + item.totalVerses * 30, 0) +
    versesCount * 120;

  return {
    estimatedMinutes: Math.max(1, Math.ceil(estimatedSeconds / 60)),
    learningVerseEnd:
      learning && versesCount > 0
        ? learning.versesLearned + versesCount
        : undefined,
    learningVerseStart:
      learning && versesCount > 0
        ? learning.versesLearned + 1
        : undefined,
    reviewCount: selectedReviews.length,
    reviewSurahNumbers: selectedReviews.map((item) => item.surahNumber),
    versesCount,
    learningSurah: learning?.surahNumber,
  };
}
