import { ReviewRating, UserSurahProgress } from '@/types';
import { addDays, dateKey } from '@/utils/date';

const MIN_EASE = 1.3;
const MAX_INTERVAL = 180;

export function calculateNextReview(
  progress: UserSurahProgress,
  rating: ReviewRating,
  now = new Date(),
): UserSurahProgress {
  let interval = progress.reviewIntervalDays || 1;
  // Clamped both ways: a corrupt or merged snapshot can carry an ease below the
  // floor, and the `good` branch only nudges up by 0.05, so without this the
  // documented [1.3, 3.0] range would not hold on that path.
  let easeFactor = Math.min(3, Math.max(MIN_EASE, progress.easeFactor || 2.5));
  const reviewCount = progress.reviewCount || 0;

  if (rating === 'good') {
    // A freshly-learnt surah (default 1-day interval) graduates to 2 days on its
    // first good review. But onboarding schedules declared-known surahs out to
    // 14 days with reviewCount 0 — those must grow by ease like any other, not
    // collapse back to 2 and flood the queue on their first review.
    interval =
      reviewCount === 0 && interval <= 1 ? 2 : Math.round(interval * easeFactor);
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
    reviewCount: reviewCount + 1,
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
  // Compare by local day, not by clock time. `addDays` keeps the original hour,
  // so a review scheduled at 20:05 must still be due at 08:00 on its day — a
  // timestamp comparison would keep hiding it until 20:05 and silently stretch
  // every interval by a day for anyone who reviews a little earlier each time.
  return dateKey(new Date(progress.nextReviewAt)) <= dateKey(now);
}

export function sortByReviewPriority(items: UserSurahProgress[]) {
  return [...items].sort((a, b) => {
    const aTime = a.nextReviewAt ? new Date(a.nextReviewAt).getTime() : 0;
    const bTime = b.nextReviewAt ? new Date(b.nextReviewAt).getTime() : 0;
    return aTime - bTime;
  });
}
