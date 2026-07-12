import { Surah, Verse } from '@/types';

/**
 * How long a verse or a review must plausibly take, and how much of the time
 * actually spent on it we are willing to count.
 *
 * Two problems, one measure:
 *
 * - **Speed-running.** Nothing stopped a user — a child being followed by their
 *   parents, typically — from tapping "Valider" twenty times without reading a
 *   word. The session was still credited, and since the wall-clock duration was
 *   floored at 30 s it even earned the sub-3-minute badge. Below, `minVerseSeconds`
 *   is the floor the UI enforces before the button unlocks.
 * - **Idling.** The old duration was pure wall clock, so leaving the app open
 *   during lunch added an hour of "recitation" to the stats. Time is now counted
 *   per item and capped, so idle time cannot inflate it.
 *
 * The result is a figure that means something: the time actually spent on the
 * text. It is what the family dashboard shows a parent, and what a Premium user
 * sees as their real recitation time.
 */

/** Never count more than this on a single verse or surah: beyond it, the user is idle. */
export const MAX_ITEM_SECONDS = 180;

const VERSE_SECONDS_PER_WORD = 0.8;
const MIN_VERSE_FLOOR = 4;
const MIN_VERSE_CEILING = 45;

const REVIEW_SECONDS_PER_VERSE = 1.5;
const MIN_REVIEW_FLOOR = 8;
// Capped low on purpose. Holding the rating buttons for two minutes on a long
// surah punished the honest user far more than the one rushing: the gate only has
// to make a zero-second review impossible. What actually protects a parent is the
// *measured* time — a review rushed in ten seconds is credited as ten seconds, and
// a child who rushes everything simply shows up as having spent no time.
const MIN_REVIEW_CEILING = 10;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * The shortest time in which a verse can honestly be studied. Proportional to its
 * length, so a two-word verse is not held back as long as a forty-word one.
 */
export function minVerseSeconds(verse: Pick<Verse, 'textArabic'> | undefined) {
  if (!verse) return MIN_VERSE_FLOOR;
  return Math.round(
    clamp(
      wordCount(verse.textArabic) * VERSE_SECONDS_PER_WORD,
      MIN_VERSE_FLOOR,
      MIN_VERSE_CEILING,
    ),
  );
}

/** The shortest time in which a surah can honestly be recited from memory. */
export function minReviewSeconds(surah: Pick<Surah, 'totalVerses'> | undefined) {
  if (!surah) return MIN_REVIEW_FLOOR;
  return Math.round(
    clamp(
      surah.totalVerses * REVIEW_SECONDS_PER_VERSE,
      MIN_REVIEW_FLOOR,
      MIN_REVIEW_CEILING,
    ),
  );
}

/** What a single item contributes to the session's active time. */
export function countableSeconds(dwellSeconds: number) {
  return clamp(Math.round(dwellSeconds), 0, MAX_ITEM_SECONDS);
}

/**
 * The lower bound the server uses to decide whether a submitted session is
 * possible at all. Deliberately more permissive than the UI floors above: the
 * client already enforces the real thresholds, and rejecting an honest session
 * over a rounding difference or a slow clock would be far worse than letting a
 * slightly fast one through.
 */
export const SERVER_MIN_SECONDS_PER_VERSE = 3;
export const SERVER_MIN_SECONDS_PER_REVIEW = 5;

export function isPlausibleSession(input: {
  activeSeconds: number;
  versesLearned: number;
  surahsReviewed: number;
}) {
  const floor =
    input.versesLearned * SERVER_MIN_SECONDS_PER_VERSE +
    input.surahsReviewed * SERVER_MIN_SECONDS_PER_REVIEW;

  return (
    input.activeSeconds >= floor &&
    input.activeSeconds <= MAX_ITEM_SECONDS * (input.versesLearned + input.surahsReviewed)
  );
}
