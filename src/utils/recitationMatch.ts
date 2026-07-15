import { normalizeArabic } from '@/utils/arabicNormalize';

/**
 * Compares a recitation (what the speech engine heard) against the verse the user
 * was meant to say, word by word.
 *
 * You always know the target text, so this is constrained matching, not open
 * transcription: a Levenshtein alignment at the word level classifies each
 * expected word as recited, wrong, or skipped, and flags anything extra that was
 * said. The verdict feeds the green/red highlight and a lenient score — never a
 * hard pass/fail, so a good recitation with one slip still reads as a good
 * recitation.
 */

export type WordVerdict = 'correct' | 'substituted' | 'missing';

export interface WordMatch {
  /** The expected word, kept in its original spelling for display. */
  expected: string;
  /** What was heard in its place, when something was. */
  spoken?: string;
  verdict: WordVerdict;
}

export interface RecitationMatch {
  words: WordMatch[];
  /** Words heard that do not correspond to any expected word. */
  extra: string[];
  correctCount: number;
  /** correctCount / expected length, in [0, 1]. Empty target scores 1. */
  score: number;
}

type Op = 'match' | 'sub' | 'del' | 'ins';

/**
 * Word-level edit distance with traceback. `expected`/`spoken` keep their display
 * spelling; comparison runs on the normalised skeleton so vowelling and hamza
 * variants never count as mistakes.
 */
export function matchRecitation(
  expected: string[],
  spoken: string[],
): RecitationMatch {
  const e = expected.map(normalizeArabic);
  const s = spoken.map(normalizeArabic);
  const m = e.length;
  const n = s.length;

  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array<number>(n + 1).fill(0),
  );
  for (let i = 0; i <= m; i += 1) dp[i][0] = i;
  for (let j = 0; j <= n; j += 1) dp[0][j] = j;
  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      const cost = e[i - 1] === s[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j - 1] + cost,
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
      );
    }
  }

  const ops: { op: Op; i: number; j: number }[] = [];
  let i = m;
  let j = n;
  while (i > 0 || j > 0) {
    if (
      i > 0 &&
      j > 0 &&
      e[i - 1] === s[j - 1] &&
      dp[i][j] === dp[i - 1][j - 1]
    ) {
      ops.push({ op: 'match', i, j });
      i -= 1;
      j -= 1;
    } else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) {
      ops.push({ op: 'sub', i, j });
      i -= 1;
      j -= 1;
    } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      ops.push({ op: 'del', i, j });
      i -= 1;
    } else {
      ops.push({ op: 'ins', i, j });
      j -= 1;
    }
  }
  ops.reverse();

  const words: WordMatch[] = [];
  const extra: string[] = [];
  for (const { op, i: oi, j: oj } of ops) {
    if (op === 'match') {
      words.push({ expected: expected[oi - 1], spoken: spoken[oj - 1], verdict: 'correct' });
    } else if (op === 'sub') {
      words.push({ expected: expected[oi - 1], spoken: spoken[oj - 1], verdict: 'substituted' });
    } else if (op === 'del') {
      words.push({ expected: expected[oi - 1], verdict: 'missing' });
    } else {
      extra.push(spoken[oj - 1]);
    }
  }

  const correctCount = words.filter((w) => w.verdict === 'correct').length;
  const score = m === 0 ? 1 : correctCount / m;
  return { words, extra, correctCount, score };
}
