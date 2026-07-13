import { getSurah } from '@/data/surahs';
import { UserSurahProgress } from '@/types';
import { dateKey } from '@/utils/date';

/**
 * The Ramadan objective.
 *
 * It is the year's peak — in acquisition, in engagement, and in willingness to
 * pay. It is also the one moment when someone who has never memorised anything
 * decides that this year, they will. An app that meets them there keeps them
 * afterwards; one that treats Ramadan like any other month does not.
 *
 * Gregorian dates are used rather than a Hijri library: the observed start of
 * Ramadan is a local, sighting-dependent decision, and a wrong date shown with
 * confidence would be worse than a table maintained by hand. These are the widely
 * published estimates; they are meant to be corrected.
 */
const RAMADAN_WINDOWS: { year: number; start: string; end: string }[] = [
  { year: 1447, start: '2026-02-17', end: '2026-03-19' },
  { year: 1448, start: '2027-02-06', end: '2027-03-08' },
  { year: 1449, start: '2028-01-27', end: '2028-02-25' },
  { year: 1450, start: '2029-01-15', end: '2029-02-13' },
];

/** How many days before it starts we begin to talk about it. */
const LEAD_DAYS = 14;

export interface RamadanWindow {
  hijriYear: number;
  start: string;
  end: string;
  totalDays: number;
  /** Days elapsed, 0 before it starts. */
  dayNumber: number;
  daysRemaining: number;
  hasStarted: boolean;
  /** Within the run-up: worth announcing, not yet worth counting. */
  isApproaching: boolean;
}

function daysBetween(from: string, to: string) {
  const a = new Date(`${from}T12:00:00Z`).getTime();
  const b = new Date(`${to}T12:00:00Z`).getTime();
  return Math.round((b - a) / 86_400_000);
}

export function currentRamadan(now = new Date()): RamadanWindow | undefined {
  const today = dateKey(now);

  for (const window of RAMADAN_WINDOWS) {
    const untilStart = daysBetween(today, window.start);
    const untilEnd = daysBetween(today, window.end);
    if (untilEnd < 0) continue;
    if (untilStart > LEAD_DAYS) continue;

    const totalDays = daysBetween(window.start, window.end) + 1;
    const hasStarted = untilStart <= 0;

    return {
      hijriYear: window.year,
      start: window.start,
      end: window.end,
      totalDays,
      dayNumber: hasStarted ? daysBetween(window.start, today) + 1 : 0,
      daysRemaining: Math.max(0, untilEnd + 1),
      hasStarted,
      isApproaching: !hasStarted,
    };
  }

  return undefined;
}

export interface RamadanGoal {
  /** The surahs the user set out to memorise this Ramadan. */
  surahNumbers: number[];
  startedAt: string;
}

export interface RamadanProgress {
  surahsDone: number;
  surahsTotal: number;
  versesLearned: number;
  versesTotal: number;
  /** 0..1 */
  progress: number;
  /** Verses per day needed from here to finish on time. 0 when already done. */
  versesPerDayNeeded: number;
  onTrack: boolean;
}

export function ramadanProgress(
  goal: RamadanGoal,
  progressMap: Record<number, UserSurahProgress>,
  window: RamadanWindow,
): RamadanProgress {
  let versesLearned = 0;
  let versesTotal = 0;
  let surahsDone = 0;

  for (const surahNumber of goal.surahNumbers) {
    const item = progressMap[surahNumber];
    if (!item) continue;
    versesTotal += item.totalVerses;
    const learned = item.status === 'known' ? item.totalVerses : item.versesLearned;
    versesLearned += learned;
    if (item.status === 'known') surahsDone += 1;
  }

  const remaining = Math.max(0, versesTotal - versesLearned);
  const daysLeft = Math.max(1, window.daysRemaining);
  const versesPerDayNeeded = remaining === 0 ? 0 : remaining / daysLeft;

  // "On track" is measured against the pace the goal actually demands, not against
  // a scolding ideal: if what is left still fits in the days left, they are fine.
  const elapsed = Math.max(1, window.dayNumber);
  const expected = versesTotal * (elapsed / window.totalDays);

  return {
    surahsDone,
    surahsTotal: goal.surahNumbers.length,
    versesLearned,
    versesTotal,
    progress: versesTotal > 0 ? versesLearned / versesTotal : 0,
    versesPerDayNeeded: Number(versesPerDayNeeded.toFixed(1)),
    onTrack: versesLearned >= expected || remaining === 0,
  };
}

/** Juz Amma — the 37 short surahs beginners actually set out to do. */
export const JUZ_AMMA_SURAHS = Array.from({ length: 37 }, (_, index) => 78 + index);

/** The last ten surahs — the shortest honest goal there is. */
export const LAST_TEN_SURAHS = Array.from({ length: 10 }, (_, index) => 105 + index);

/**
 * The goal's surahs as `ramadanProgress` needs to see them.
 *
 * A surah nobody has opened yet has no entry in the progress map at all, and the
 * computation skips what it cannot see — on the day the goal is set, which is
 * every surah, it would read "0 verses of 0" and ask for a pace of zero. Filling
 * the blanks with the real verse counts is what makes the objective mean anything
 * before the first verse is learnt.
 */
export function goalProgressMap(
  surahNumbers: readonly number[],
  progress: Record<number, UserSurahProgress>,
): Record<number, UserSurahProgress> {
  const map: Record<number, UserSurahProgress> = {};

  for (const surahNumber of surahNumbers) {
    const existing = progress[surahNumber];
    if (existing) {
      map[surahNumber] = existing;
      continue;
    }
    const surah = getSurah(surahNumber);
    if (!surah) continue;
    map[surahNumber] = {
      surahNumber,
      status: 'locked',
      versesLearned: 0,
      totalVerses: surah.totalVerses,
      reviewIntervalDays: 1,
      easeFactor: 2.5,
      reviewCount: 0,
    };
  }

  return map;
}

/** How many verses a set of surahs actually holds. */
export function goalVerseCount(surahNumbers: readonly number[]) {
  return surahNumbers.reduce(
    (total, surahNumber) => total + (getSurah(surahNumber)?.totalVerses ?? 0),
    0,
  );
}
