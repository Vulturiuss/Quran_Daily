import { ReviewRating, UserSurahProgress } from '@/types';
import { addDays } from '@/utils/date';

const MIN_EASE = 1.3;
const MAX_INTERVAL = 180;

export function calculateNextReview(
  progress: UserSurahProgress,
  rating: ReviewRating,
  now = new Date(),
): UserSurahProgress {
  let interval = progress.reviewIntervalDays || 1;
  let easeFactor = progress.easeFactor || 2.5;

  if (rating === 'good') {
    interval = progress.reviewCount === 0 ? 2 : Math.round(interval * easeFactor);
    easeFactor = Math.min(3, easeFactor + 0.05);
  } else if (rating === 'hard') {
    interval = Math.max(1, Math.round(interval / 2));
    easeFactor = Math.max(MIN_EASE, easeFactor - 0.15);
  } else {
    interval = 1;
    easeFactor = Math.max(MIN_EASE, easeFactor - 0.25);
  }

  interval = Math.min(MAX_INTERVAL, interval);

  return {
    ...progress,
    lastReviewedAt: now.toISOString(),
    nextReviewAt: addDays(now, interval).toISOString(),
    reviewIntervalDays: interval,
    easeFactor,
    reviewCount: progress.reviewCount + 1,
  };
}

/**
 * Applies a review to the schedule, but never lets a bonus review of a surah
 * that was not yet due push its due date further away. Without this, a diligent
 * user chaining bonus sessions kept multiplying every interval by the ease
 * factor until all of them hit the 180-day cap — and then had nothing to review
 * for months, which is the exact opposite of what the extra work should earn.
 * A `forgot`/`hard` rating still pulls the review in, whatever the due state.
 */
export function scheduleAfterReview(
  progress: UserSurahProgress,
  rating: ReviewRating,
  now = new Date(),
): UserSurahProgress {
  const next = calculateNextReview(progress, rating, now);
  if (isDue(progress, now)) return next;

  const currentDue = progress.nextReviewAt
    ? new Date(progress.nextReviewAt).getTime()
    : 0;
  const nextDue = new Date(next.nextReviewAt!).getTime();
  if (nextDue <= currentDue) return next;

  return {
    ...progress,
    lastReviewedAt: now.toISOString(),
    easeFactor: next.easeFactor,
    reviewCount: progress.reviewCount + 1,
  };
}

export function isDue(progress: UserSurahProgress, now = new Date()) {
  if (progress.status !== 'known') return false;
  if (!progress.nextReviewAt) return true;
  return new Date(progress.nextReviewAt).getTime() <= now.getTime();
}

export function sortByReviewPriority(items: UserSurahProgress[]) {
  return [...items].sort((a, b) => {
    const aTime = a.nextReviewAt ? new Date(a.nextReviewAt).getTime() : 0;
    const bTime = b.nextReviewAt ? new Date(b.nextReviewAt).getTime() : 0;
    return aTime - bTime;
  });
}
