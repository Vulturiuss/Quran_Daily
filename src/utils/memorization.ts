import { UserSurahProgress, Verse } from '@/types';
import { dateKey } from '@/utils/date';

/**
 * The memorisation loop.
 *
 * Traditional hifz rests on three pillars, and they are not folklore — they match
 * what is known about how memory consolidates:
 *
 *  - **sabaq**, the new lesson;
 *  - **sabqi**, what was learnt in the last few days, revisited EVERY day;
 *  - **manzil**, the consolidated old material, cycled slowly.
 *
 * The app had the first and the last. It had nothing in between — and the middle
 * one is the one that matters, because forgetting is steepest in the first days.
 * A surah being learnt was reviewed at no point until it was finished: on
 * Al-Baqara at two verses a day, that is 143 days without ever revisiting a
 * verse. By the time the app declared it "known", the first 280 verses were long
 * gone.
 *
 * This module is that missing middle, plus the two things that make the signal
 * real: verses are linked to the one before them (a hafiz does not fail on a
 * verse, they fail on the *seam* between two), and a surah is not declared known
 * until it has actually been recited whole.
 */

/** How many verses of sabqi to replay before the new ones. Enough to matter, few enough to stay short. */
export const MAX_SABQI_VERSES = 8;
/** Verses learnt within this many days are still fragile and are replayed daily. */
export const SABQI_WINDOW_DAYS = 7;

/** Words revealed before a verse counts as not recalled. */
const HARD_REVEALS = 1;
const FORGOT_REVEALS = 3;

/**
 * The verses to re-recite before learning new ones.
 *
 * Weak verses first — the ones failed during the final check are the whole reason
 * the surah was sent back — then everything learnt inside the window, in
 * recitation order, because that is how it will have to come out.
 */
export function selectSabqi(
  progress: UserSurahProgress | undefined,
  now = new Date(),
  max = MAX_SABQI_VERSES,
): number[] {
  if (!progress || progress.versesLearned === 0) return [];

  const learnedAt = progress.learnedAt ?? {};
  const cutoff = dateKey(new Date(now.getTime() - SABQI_WINDOW_DAYS * 86_400_000));

  const recent = Object.entries(learnedAt)
    .filter(([, day]) => day >= cutoff)
    .map(([verse]) => Number(verse));

  const weak = progress.weakVerses ?? [];
  // A weak verse is replayed even once it has aged out of the window: it is weak
  // precisely because time did not fix it.
  const selected = [...new Set([...weak, ...recent])]
    .filter((verse) => verse <= progress.versesLearned)
    .sort((a, b) => a - b);

  if (selected.length <= max) return selected;

  // Over budget: keep every weak verse, then fill with the most recent ones —
  // dropping the oldest, which are the closest to being consolidated anyway.
  const weakSet = new Set(weak);
  const mandatory = selected.filter((verse) => weakSet.has(verse));
  const optional = selected.filter((verse) => !weakSet.has(verse));
  const room = Math.max(0, max - mandatory.length);

  return [...mandatory, ...optional.slice(-room)].sort((a, b) => a - b);
}

/**
 * The tail of the previous verse, shown as the cue.
 *
 * This is `rabt`, the linking. Verses learnt in isolation produce islands: you
 * can know a hundred verses one by one and be unable to recite the surah, because
 * nothing ever asked you to cross from one to the next.
 */
export function linkingCue(previous: Verse | undefined, words = 3) {
  if (!previous) return undefined;
  const parts = previous.textArabic.trim().split(/\s+/).filter(Boolean);
  return parts.slice(-words).join(' ');
}

/**
 * Which words of a verse to hide. Deterministic for a given verse, so the same
 * verse does not reshuffle on every render.
 *
 * The first word is never hidden: it is the prompt you recite from.
 */
export function maskedWordIndices(verse: Verse, ratio = 0.4): number[] {
  const words = verse.textArabic.trim().split(/\s+/).filter(Boolean);
  if (words.length <= 2) return [];

  const maskable = words.length - 1;
  const target = Math.min(maskable, Math.max(1, Math.round(maskable * ratio)));

  // A seeded shuffle: deterministic (so the mask is stable across renders and
  // reproducible in tests) and, crucially, TERMINATING.
  //
  // This used to be a "cheap" walk of `cursor += step` over the positions. It
  // only ever reached n / gcd(step, n) of them, so whenever the target exceeded
  // that, the loop could never fill it and spun forever — freezing the app on
  // 959 of the 6236 verses, including 2:2. A hang, not a wrong mask.
  const order = Array.from({ length: maskable }, (_, index) => index + 1);
  let seed = verse.surahNumber * 1000 + verse.verseNumber;
  const next = () => {
    // mulberry32: a small, well-behaved PRNG. Any seeded generator would do; what
    // matters is that the selection is a shuffle, not a search that can fail.
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(next() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }

  return order.slice(0, target).sort((a, b) => a - b);
}

/**
 * Turns the number of words the user had to reveal into a rating.
 *
 * This is the point of the masked-word test: the grade is *measured*, not
 * declared. "Hide the text, then tell us you knew it" is the illusion of knowing —
 * re-reading feels like mastery and does not survive recall — and it fed the SRS
 * noise instead of signal.
 */
export function ratingFromReveals(reveals: number) {
  if (reveals >= FORGOT_REVEALS) return 'forgot' as const;
  if (reveals >= HARD_REVEALS) return 'hard' as const;
  return 'good' as const;
}

/**
 * The grade for one recalled verse.
 *
 * `recalled` is the user's own claim, and it must be an ACTIVE one. The first
 * version had a single "Récité" button and counted the words revealed — but
 * revealing is optional, so doing nothing scored full marks: wait out the timer,
 * tap once, and the surah was certified memorised. The default outcome was the
 * best one, reachable by inaction. That is the very "I know it, trust me" this
 * was meant to replace.
 *
 * Revealing still overrides the claim downwards — you cannot uncover half the
 * verse and call it recited. Without speech recognition, an honest self-report is
 * the ceiling; what matters is that it is a report, not a default.
 */
export function verseGrade(reveals: number, recalled: boolean) {
  const measured = ratingFromReveals(reveals);
  if (!recalled) return measured === 'good' ? ('hard' as const) : measured;
  return measured;
}

/**
 * A surah used to be declared "known" the moment each of its verses had been seen
 * once — and it then entered the SRS on that false premise, poisoning every
 * interval downstream. It now has to be recited whole first; whatever was failed
 * comes back as weak verses, and the surah stays in learning until it is clean.
 */
export function verificationOutcome(failedVerses: number[]) {
  return failedVerses.length === 0
    ? ({ status: 'known' as const, weakVerses: [] })
    : ({ status: 'learning' as const, weakVerses: [...failedVerses].sort((a, b) => a - b) });
}

/**
 * Which verses the next final recitation covers.
 *
 * The first pass is the whole surah — that is the point. But a *re-take* only
 * covers what actually failed. Making someone recite all 286 verses of Al-Baqara
 * again because they hesitated on two is not rigour, it is a reason to uninstall:
 * the third time they "fail", they do not conclude that they are progressing,
 * they conclude that they are failing at the Quran. Rigour without mercy is
 * churn.
 *
 * The rest of the surah already proved itself; the sabqi keeps it warm.
 */
export function verificationQueue(progress: UserSurahProgress): number[] {
  const weak = progress.weakVerses ?? [];
  if (weak.length > 0) {
    return [...weak].sort((a, b) => a - b);
  }
  return Array.from({ length: progress.totalVerses }, (_, index) => index + 1);
}

/** How solidly a surah is held: 1 when nothing is weak. */
export function surahSolidity(progress: UserSurahProgress) {
  if (progress.totalVerses === 0) return 0;
  const weak = (progress.weakVerses ?? []).length;
  return Math.max(0, Math.min(1, 1 - weak / progress.totalVerses));
}
