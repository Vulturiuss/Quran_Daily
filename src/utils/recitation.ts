/**
 * Word-level recitation highlighting.
 *
 * Quran.com serves per-word timings for some reciters (Mishary, the free voice,
 * among them) as `audio.segments`: rows of [wordIndex, order, startMs, endMs].
 * This turns those rows into one start/end per displayed word, and maps a
 * playback position onto the word being recited right now.
 *
 * It is deliberately a delight, never a dependency: a verse whose timings are
 * absent or do not line up with its words renders without a highlight, and the
 * audio itself is untouched.
 */

export interface WordTiming {
  /** Milliseconds from the start of the verse's audio. */
  start: number;
  end: number;
}

/** The words a verse's highlight will colour, one by one. */
export function splitArabicWords(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}

/**
 * Turns Quran.com's raw `segments` into one timing per word index.
 *
 * A word can be split across several rows sharing its index, so the earliest
 * start and latest end win. Only the last two numbers of a row are read as
 * [start, end], which tolerates the extra leading columns the API sometimes adds.
 * Malformed rows are skipped rather than trusted; a word index the API never
 * mentions becomes a zero-length gap so the array stays dense and indexable.
 */
export function parseSegments(raw: unknown): WordTiming[] {
  if (!Array.isArray(raw)) return [];

  const byIndex: WordTiming[] = [];
  for (const row of raw) {
    if (!Array.isArray(row) || row.length < 3) continue;
    const wordIndex = Number(row[0]);
    const start = Number(row[row.length - 2]);
    const end = Number(row[row.length - 1]);
    if (
      !Number.isInteger(wordIndex) ||
      wordIndex < 0 ||
      wordIndex > 10000 ||
      !Number.isFinite(start) ||
      !Number.isFinite(end) ||
      end < start
    ) {
      continue;
    }
    const existing = byIndex[wordIndex];
    byIndex[wordIndex] = existing
      ? {
          start: Math.min(existing.start, start),
          end: Math.max(existing.end, end),
        }
      : { start, end };
  }

  for (let i = 0; i < byIndex.length; i += 1) {
    if (!byIndex[i]) byIndex[i] = { start: 0, end: 0 };
  }
  return byIndex;
}

/**
 * Whether a set of timings lines up with the words actually displayed.
 *
 * Only an exact one-timing-per-word match is trusted. On long verses the API's
 * word count can drift from ours (Ayat al-Kursi: 50 timings for 58 displayed
 * words), and a partial set would light the wrong word halfway through — worse
 * than no highlight at all. A mismatch makes the caller fall back to plain text,
 * which still covers every short surah exactly, i.e. essentially all of what gets
 * memorised.
 */
export function segmentsFitWords(
  timings: WordTiming[],
  wordCount: number,
): boolean {
  return wordCount > 0 && timings.length === wordCount;
}

/**
 * The word being recited at `positionMs`, or -1 before the first word starts.
 *
 * The last started word stays active until the next one begins, so the highlight
 * never flickers off in the silence between words. Zero-length gaps (words the
 * API skipped) can never become active. Timings arrive in start order.
 */
export function activeWordIndex(
  timings: WordTiming[],
  positionMs: number,
): number {
  let active = -1;
  for (let i = 0; i < timings.length; i += 1) {
    const timing = timings[i];
    if (timing.end <= timing.start) continue;
    if (positionMs >= timing.start) active = i;
    else break;
  }
  return active;
}
