import quranData from '@/data/quran.json';
import { Verse } from '@/types';

export const versesBySurah = quranData as Record<string, Verse[]>;

export function getVerses(surahNumber?: number) {
  return surahNumber ? versesBySurah[String(surahNumber)] ?? [] : [];
}

export function getVerse(surahNumber?: number, verseNumber?: number) {
  if (!surahNumber || !verseNumber) return undefined;
  return getVerses(surahNumber)[verseNumber - 1];
}
