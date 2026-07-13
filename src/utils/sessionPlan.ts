import { UserProfile, UserSurahProgress } from '@/types';
import { selectSabqi } from '@/utils/memorization';
import { isDue, sortByReviewPriority } from '@/utils/srs';

export interface SessionPreview {
  estimatedMinutes: number;
  learningVerseEnd?: number;
  learningVerseStart?: number;
  reviewCount: number;
  reviewSurahNumbers: number[];
  versesCount: number;
  /** Verses to replay before any new one. */
  sabqiCount: number;
  /** A surah fully seen, waiting to be recited whole. */
  awaitingVerification?: number;
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
  // The session replays the recent verses before teaching new ones, so the preview
  // has to say so — it used to announce "2 verses" for a session that actually
  // starts with up to eight, and the home screen declared the day done when the
  // only thing left was the sabqi.
  const sabqiCount = selectSabqi(learning, at).length;
  // A surah that has been fully seen is waiting for its final recitation. It is
  // neither `learning` nor `known`, so it fell through every count — the home
  // screen said "all caught up" while the real work of the day sat in another tab.
  const awaitingVerification = items.find((item) => item.status === 'verifying');

  const estimatedSeconds =
    selectedReviews.reduce((total, item) => total + item.totalVerses * 30, 0) +
    sabqiCount * 25 +
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
    sabqiCount,
    awaitingVerification: awaitingVerification?.surahNumber,
    learningSurah: learning?.surahNumber,
  };
}
