import type { UserSurahProgress } from '@/types';

/**
 * What deserves to sit on the phone's disk.
 *
 * The whole Quran is about a gigabyte per reciter, so "download everything" is
 * not an option — and it does not need to be. The app already knows what matters:
 * the one to three surahs being learnt, and the ones the SRS is about to ask for.
 * That is a few dozen megabytes, chosen without the user having to ask.
 *
 * The other half of the job is deletion. Storage that grows in silence is the
 * reason audio apps get uninstalled, so what stops being relevant leaves the disk
 * — after a grace period, because a surah reviewed last week will very likely be
 * asked for again, and re-downloading it is a worse trade than keeping it.
 */

/** A surah due for review is fetched ahead of time, not on the morning it is due. */
export const OFFLINE_REVIEW_HORIZON_DAYS = 3;

/** How long a surah's audio survives after it stops being relevant. */
export const OFFLINE_GRACE_DAYS = 14;

const DAY_MS = 24 * 60 * 60 * 1000;

function isActive(item: UserSurahProgress) {
  return item.status === 'learning' || item.status === 'verifying';
}

function dueWithin(item: UserSurahProgress, now: Date, days: number) {
  if (item.status !== 'known') return false;
  if (!item.nextReviewAt) return true;
  return new Date(item.nextReviewAt).getTime() <= now.getTime() + days * DAY_MS;
}

function reviewTime(item: UserSurahProgress) {
  const stamp = item.nextReviewAt ?? item.updatedAt;
  return stamp ? new Date(stamp).getTime() : 0;
}

/**
 * The surahs whose recitation should be on disk, most urgent first.
 *
 * Being learnt comes before being reviewed: that is where a missing file is felt
 * every single day.
 */
export function offlineTargets(
  progress: Record<number, UserSurahProgress>,
  now = new Date(),
): number[] {
  const items = Object.values(progress);

  const active = items
    .filter(isActive)
    .sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''));

  const due = items
    .filter((item) => dueWithin(item, now, OFFLINE_REVIEW_HORIZON_DAYS))
    .sort((a, b) => reviewTime(a) - reviewTime(b));

  return [...active, ...due].map((item) => item.surahNumber);
}

/**
 * What may stay on disk: everything worth downloading, plus the surahs reviewed
 * in the last two weeks. A `known` surah whose next review is a month away is not
 * a target, but deleting it the day after its review — to fetch it again a few
 * days later — would only trade bandwidth for nothing.
 */
export function offlineKeep(
  progress: Record<number, UserSurahProgress>,
  now = new Date(),
): number[] {
  const keep = new Set(offlineTargets(progress, now));

  for (const item of Object.values(progress)) {
    if (item.status !== 'known') continue;
    const reviewedAt = item.lastReviewedAt ?? item.updatedAt;
    if (!reviewedAt) continue;
    const age = now.getTime() - new Date(reviewedAt).getTime();
    if (age >= 0 && age <= OFFLINE_GRACE_DAYS * DAY_MS) keep.add(item.surahNumber);
  }

  return [...keep];
}

/**
 * Of what is on disk, what has stopped being relevant. A surah with no progress
 * entry at all — abandoned, reset, or downloaded under an older plan — is purged
 * too: nothing in the app will ever play it again.
 */
export function offlinePurge(
  downloaded: number[],
  progress: Record<number, UserSurahProgress>,
  now = new Date(),
): number[] {
  const keep = new Set(offlineKeep(progress, now));
  return downloaded.filter((surahNumber) => !keep.has(surahNumber));
}
