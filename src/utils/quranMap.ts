import { versesBySurah } from '@/data/verses';
import { surahs } from '@/data/surahs';
import { UserSurahProgress } from '@/types';
import { surahSolidity } from '@/utils/memorization';

/**
 * The map of the Quran, filling up.
 *
 * What a user owns in this app today is a number — a streak, some XP. A number
 * can be lost, and the day it is lost there is nothing left to protect, so there
 * is no reason to stay. A map is different: it is not something you can fail, it
 * is something you build. Nobody uninstalls an app holding six months of their
 * spiritual life made visible.
 *
 * This is the artefact that turns "an app I use" into "my journey".
 */

export type MapState = 'untouched' | 'learning' | 'verifying' | 'known';

export interface SurahCell {
  number: number;
  nameTranslit: string;
  totalVerses: number;
  versesLearned: number;
  state: MapState;
  /** 0..1 — how much of the surah is memorised (not how solid it is). */
  progress: number;
  /** 0..1 — how well it holds: 1 when no verse is weak. */
  solidity: number;
}

export interface JuzCell {
  number: number;
  totalVerses: number;
  versesLearned: number;
  progress: number;
}

export interface QuranMap {
  surahs: SurahCell[];
  juz: JuzCell[];
  versesLearned: number;
  totalVerses: number;
  /** 0..1 across the whole Quran. */
  progress: number;
  surahsKnown: number;
}

/** verse count per juz, computed once from the corpus. */
const juzTotals = (() => {
  const totals = new Map<number, number>();
  for (const verses of Object.values(versesBySurah)) {
    for (const verse of verses) {
      totals.set(verse.juzNumber, (totals.get(verse.juzNumber) ?? 0) + 1);
    }
  }
  return totals;
})();

/**
 * Which juz the verses learnt in a surah belong to. Verses are memorised in
 * order, so the first `versesLearned` of the surah are the ones that count — a
 * surah can straddle two juz, and Al-Baqara alone spans three.
 */
function learnedByJuz(progress: Record<number, UserSurahProgress>) {
  const learned = new Map<number, number>();

  for (const [key, verses] of Object.entries(versesBySurah)) {
    const item = progress[Number(key)];
    if (!item) continue;
    const count =
      item.status === 'known' ? item.totalVerses : Math.min(item.versesLearned, verses.length);

    for (let index = 0; index < count; index += 1) {
      const juz = verses[index]?.juzNumber;
      if (juz === undefined) continue;
      learned.set(juz, (learned.get(juz) ?? 0) + 1);
    }
  }

  return learned;
}

export function buildQuranMap(
  progress: Record<number, UserSurahProgress>,
): QuranMap {
  const cells: SurahCell[] = surahs.map((surah) => {
    const item = progress[surah.number];
    const state: MapState = item?.status === 'known'
      ? 'known'
      : item?.status === 'verifying'
        ? 'verifying'
        : item?.status === 'learning'
          ? 'learning'
          : 'untouched';
    const versesLearned =
      state === 'known' ? surah.totalVerses : item?.versesLearned ?? 0;

    return {
      number: surah.number,
      nameTranslit: surah.nameTranslit,
      totalVerses: surah.totalVerses,
      versesLearned,
      state,
      progress: surah.totalVerses > 0 ? versesLearned / surah.totalVerses : 0,
      solidity: item ? surahSolidity(item) : 0,
    };
  });

  const learnedPerJuz = learnedByJuz(progress);
  const juz: JuzCell[] = Array.from({ length: 30 }, (_, index) => {
    const number = index + 1;
    const totalVerses = juzTotals.get(number) ?? 0;
    const versesLearned = learnedPerJuz.get(number) ?? 0;
    return {
      number,
      totalVerses,
      versesLearned,
      progress: totalVerses > 0 ? versesLearned / totalVerses : 0,
    };
  });

  const versesLearned = cells.reduce((total, cell) => total + cell.versesLearned, 0);
  const totalVerses = cells.reduce((total, cell) => total + cell.totalVerses, 0);

  return {
    surahs: cells,
    juz,
    versesLearned,
    totalVerses,
    progress: totalVerses > 0 ? versesLearned / totalVerses : 0,
    surahsKnown: cells.filter((cell) => cell.state === 'known').length,
  };
}
