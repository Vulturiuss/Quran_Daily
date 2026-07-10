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

export function buildSessionPreview(
  progress: Record<number, UserSurahProgress>,
  profile: UserProfile,
  at: Date,
  maxReviews = profile.dailyGoalReviews,
  allowedSurahNumbers?: readonly number[],
): SessionPreview {
  const allowed = allowedSurahNumbers
    ? new Set(allowedSurahNumbers)
    : undefined;
  const items = Object.values(progress).filter(
    (item) => !allowed || allowed.has(item.surahNumber),
  );
  const due = sortByReviewPriority(
    items.filter((item) => item.status === 'known' && isDue(item, at)),
  );
  const selectedReviews = due.slice(0, maxReviews);
  const learning = items.find((item) => item.status === 'learning');
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
