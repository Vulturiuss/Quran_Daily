/**
 * Turns one spoken recitation of a whole surah into per-verse, per-word verdicts
 * the review screen can paint.
 *
 * The speech engine hands back a flat stream of words for the entire recitation,
 * with no verse boundaries. `matchRecitation` aligns that stream against the
 * concatenated verse text and returns exactly one verdict per expected word, in
 * order — so slicing it back by each verse's word count reattaches the verdicts
 * to their verses.
 *
 * Partial recitation is the norm, not an error: someone reviewing Al-Baqara says
 * the first few verses and stops. Everything after the last word they actually
 * reached is `unreached` (rendered neutral, never red) and is left out of the
 * score, so stopping early reads as "not yet", not as a wall of mistakes.
 */

import { splitArabicWords } from '@/utils/recitation';
import { matchRecitation } from '@/utils/recitationMatch';

export type SpokenVerdict = 'correct' | 'substituted' | 'missing' | 'unreached';

export interface CheckedWord {
  /** The expected word in its display spelling (Uthmani), never normalised. */
  text: string;
  verdict: SpokenVerdict;
}

export interface VerseExpectation {
  verseNumber: number;
  textArabic: string;
}

export interface RecitationReview {
  /** Coloured words per verse, keyed by verse number. */
  byVerse: Record<number, CheckedWord[]>;
  /** Words heard that matched no expected word. */
  extra: string[];
  /** Expected words the reciter reached — up to and including the last engaged one. */
  reachedWords: number;
  correctWords: number;
  /** correctWords / reachedWords, in [0, 1]. Zero when nothing was reached. */
  score: number;
}

export function buildRecitationReview(
  verses: VerseExpectation[],
  spoken: string[],
): RecitationReview {
  const perVerse = verses.map((v) => ({
    verseNumber: v.verseNumber,
    words: splitArabicWords(v.textArabic),
  }));
  const flatExpected = perVerse.flatMap((v) => v.words);
  const match = matchRecitation(flatExpected, spoken);

  // `match.words` carries one entry per expected word, in order. The reciter
  // engaged with a word if it came back correct or substituted; a trailing run
  // of `missing` after the last engaged word is simply where they stopped.
  let lastEngaged = -1;
  match.words.forEach((w, i) => {
    if (w.verdict !== 'missing') lastEngaged = i;
  });
  const reachedWords = lastEngaged + 1;

  const byVerse: Record<number, CheckedWord[]> = {};
  let cursor = 0;
  let correctWords = 0;
  for (const v of perVerse) {
    byVerse[v.verseNumber] = v.words.map((text, k) => {
      const flatIndex = cursor + k;
      if (flatIndex >= reachedWords) {
        return { text, verdict: 'unreached' as const };
      }
      const verdict = match.words[flatIndex]?.verdict ?? 'missing';
      if (verdict === 'correct') correctWords += 1;
      return { text, verdict };
    });
    cursor += v.words.length;
  }

  const score = reachedWords === 0 ? 0 : correctWords / reachedWords;
  return { byVerse, extra: match.extra, reachedWords, correctWords, score };
}
