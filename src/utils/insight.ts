import { SessionRecord, UserSurahProgress } from '@/types';
import { addDays, dateKey } from '@/utils/date';
import { surahSolidity } from '@/utils/memorization';

/**
 * What the app knows about your memory, and nobody else does.
 *
 * Premium currently sells comfort — themes, reciters, parallel surahs. Comfort is
 * hard to sell, because you can always do without it. But the memorisation loop
 * now produces something no free competitor has: which verses are fragile, how
 * solidly each surah is held, how fast you actually consolidate.
 *
 * "Your Al-Baqara holds at 72%. Your 8 fragile verses sit on pages 4 and 5. At
 * your current pace it will be consolidated on 12 March." — that is worth paying
 * for. Knowing where you really stand is not a nicety.
 */

export interface SurahInsight {
  surahNumber: number;
  solidity: number;
  weakVerses: number[];
  versesLearned: number;
  totalVerses: number;
}

export interface MemorizationInsight {
  /** Surahs held least solidly first: what to work on, in order. */
  fragile: SurahInsight[];
  /** Verses per day, averaged over the recent history. 0 when unknown. */
  pace: number;
  /** When the surah being learnt will be fully seen, at the current pace. */
  projectedCompletion?: string;
  /** Total verses still fragile across everything memorised. */
  weakVerseCount: number;
  /** Average minutes actually spent per active day. */
  minutesPerActiveDay: number;
}

const PACE_WINDOW_DAYS = 14;

export function buildInsight(
  progress: Record<number, UserSurahProgress>,
  history: SessionRecord[],
  now = new Date(),
): MemorizationInsight {
  const items = Object.values(progress);

  const fragile = items
    .filter(
      (item) =>
        (item.status === 'known' || item.status === 'learning') &&
        (item.weakVerses ?? []).length > 0,
    )
    .map<SurahInsight>((item) => ({
      surahNumber: item.surahNumber,
      solidity: surahSolidity(item),
      weakVerses: [...(item.weakVerses ?? [])].sort((a, b) => a - b),
      versesLearned: item.versesLearned,
      totalVerses: item.totalVerses,
    }))
    .sort((a, b) => a.solidity - b.solidity);

  const cutoff = dateKey(addDays(now, -PACE_WINDOW_DAYS));
  const recent = history.filter((record) => record.date >= cutoff);
  const versesRecently = recent.reduce(
    (total, record) => total + record.versesLearned,
    0,
  );
  // Averaged over the window, not over active days: the question is "how fast do
  // I actually move", and the days you skip are part of the answer.
  const pace = versesRecently / PACE_WINDOW_DAYS;

  const minutesRecently = recent.reduce(
    (total, record) => total + Math.round(record.durationSeconds / 60),
    0,
  );
  const activeDays = recent.filter((record) => record.durationSeconds > 0).length;

  const learning = items.find((item) => item.status === 'learning');
  const remaining = learning
    ? Math.max(0, learning.totalVerses - learning.versesLearned)
    : 0;
  const projectedCompletion =
    learning && remaining > 0 && pace > 0
      ? dateKey(addDays(now, Math.ceil(remaining / pace)))
      : undefined;

  return {
    fragile,
    pace: Number(pace.toFixed(2)),
    projectedCompletion,
    weakVerseCount: fragile.reduce(
      (total, item) => total + item.weakVerses.length,
      0,
    ),
    minutesPerActiveDay:
      activeDays > 0 ? Math.round(minutesRecently / activeDays) : 0,
  };
}
