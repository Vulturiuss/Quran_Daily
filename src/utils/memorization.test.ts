import assert from 'node:assert/strict';
import test from 'node:test';

import quran from '../data/quran.json';
import { UserSurahProgress, Verse } from '../types';
import { dateKey } from './date';
import {
  linkingCue,
  MAX_SABQI_VERSES,
  maskedWordIndices,
  ratingFromReveals,
  selectSabqi,
  verificationOutcome,
  verseGrade,
} from './memorization';

const NOW = new Date('2026-07-13T10:00:00.000Z');

function day(offset: number) {
  return dateKey(new Date(NOW.getTime() + offset * 86_400_000));
}

function learning(partial: Partial<UserSurahProgress> = {}): UserSurahProgress {
  return {
    surahNumber: 2,
    status: 'learning',
    versesLearned: 10,
    totalVerses: 286,
    reviewIntervalDays: 1,
    easeFactor: 2.5,
    reviewCount: 0,
    ...partial,
  };
}

function verse(partial: Partial<Verse> = {}): Verse {
  return {
    surahNumber: 2,
    verseNumber: 5,
    verseKey: '2:5',
    juzNumber: 1,
    pageNumber: 2,
    textArabic: 'أُو۟لَٰٓئِكَ عَلَىٰ هُدًى مِّن رَّبِّهِمْ وَأُو۟لَٰٓئِكَ هُمُ ٱلْمُفْلِحُونَ',
    textTranslit: '',
    textFr: '',
    ...partial,
  };
}

// --- sabqi -----------------------------------------------------------------

test('the verses learnt in the last days come back every day', () => {
  const sabqi = selectSabqi(
    learning({
      learnedAt: { 8: day(-1), 9: day(-1), 10: day(0) },
    }),
    NOW,
  );

  assert.deepEqual(sabqi, [8, 9, 10], 'in recitation order, not by date');
});

test('a verse older than the window has consolidated and drops out', () => {
  const sabqi = selectSabqi(
    learning({
      learnedAt: { 1: day(-30), 9: day(-2), 10: day(-1) },
    }),
    NOW,
  );

  assert.deepEqual(sabqi, [9, 10], 'verse 1 is old enough to belong to the SRS now');
});

test('a verse failed during the final recitation comes back however old it is', () => {
  // This is the point of weak verses: time did not fix them, so the window must
  // not excuse them.
  const sabqi = selectSabqi(
    learning({
      learnedAt: { 1: day(-60), 10: day(-1) },
      weakVerses: [1],
    }),
    NOW,
  );

  assert.deepEqual(sabqi, [1, 10]);
});

test('sabqi stays short: weak verses are kept, the oldest fresh ones give way', () => {
  const learnedAt: Record<number, string> = {};
  for (let verseNumber = 1; verseNumber <= 20; verseNumber += 1) {
    learnedAt[verseNumber] = day(-1);
  }

  const sabqi = selectSabqi(
    learning({ versesLearned: 20, learnedAt, weakVerses: [2, 3] }),
    NOW,
  );

  assert.equal(sabqi.length, MAX_SABQI_VERSES, 'the session must stay short');
  assert.ok(sabqi.includes(2) && sabqi.includes(3), 'weak verses are never dropped');
  assert.ok(sabqi.includes(20), 'the most recent are kept over the oldest');
  assert.ok(!sabqi.includes(4), 'the oldest fresh ones give way');
});

test('nothing to replay before the first verse is ever learnt', () => {
  assert.deepEqual(selectSabqi(learning({ versesLearned: 0 }), NOW), []);
  assert.deepEqual(selectSabqi(undefined, NOW), []);
});

// --- linking ---------------------------------------------------------------

test('a verse is cued by the tail of the one before it', () => {
  const cue = linkingCue(verse({ textArabic: 'وَبِٱلْءَاخِرَةِ هُمْ يُوقِنُونَ' }), 2);
  assert.equal(cue, 'هُمْ يُوقِنُونَ', 'you fail on the seam, not on the verse');
  assert.equal(linkingCue(undefined), undefined, 'the first verse has no seam');
});

// --- recall test -----------------------------------------------------------

test('words are hidden, and the same verse always hides the same ones', () => {
  const target = verse();
  const first = maskedWordIndices(target);
  const second = maskedWordIndices(target);

  assert.deepEqual(first, second, 'stable across renders');
  assert.ok(first.length > 0);
  assert.ok(!first.includes(0), 'the first word is the prompt and stays visible');
});

test('a two-word verse is not worth masking', () => {
  assert.deepEqual(maskedWordIndices(verse({ textArabic: 'مُدْهَآمَّتَانِ فَبِأَىِّ' })), []);
});

test('masking terminates on every verse of the Quran', () => {
  // Not a paranoid test. The first implementation walked the positions with a
  // fixed step and looped until it had collected enough — but the walk only ever
  // reached n / gcd(step, n) of them, so on 959 verses (2:2 among them) it could
  // never collect enough and spun forever. The app froze, on the second day of
  // learning, on short surahs beginners start with.
  const verses = Object.values(quran as Record<string, Verse[]>).flat();
  assert.equal(verses.length, 6236);

  for (const item of verses) {
    const indices = maskedWordIndices(item);
    const words = item.textArabic.trim().split(/\s+/).filter(Boolean).length;

    assert.ok(
      indices.every((index) => index >= 1 && index < words),
      `${item.verseKey}: index out of range`,
    );
    assert.equal(
      new Set(indices).size,
      indices.length,
      `${item.verseKey}: duplicate index`,
    );
    if (words > 2) {
      assert.ok(indices.length > 0, `${item.verseKey}: nothing hidden`);
    }
  }
});

test('the grade is measured from what had to be revealed, not declared', () => {
  // Self-rating after hiding the text is the illusion of knowing. Counting the
  // words the user could not produce is a real signal, and it is what the SRS
  // now runs on.
  assert.equal(ratingFromReveals(0), 'good', 'recited without help');
  assert.equal(ratingFromReveals(1), 'hard');
  assert.equal(ratingFromReveals(2), 'hard');
  assert.equal(ratingFromReveals(3), 'forgot');
  assert.equal(ratingFromReveals(9), 'forgot');
});

test('doing nothing is no longer the best grade', () => {
  // The bug: revealing words was optional, so the user who revealed nothing got
  // 'good' — waiting out the timer and tapping "Récité" once certified a verse
  // that had never been recited. The grade now needs an ACTIVE claim, and saying
  // "j'ai bloqué" must be heard even when not a single word was uncovered.
  assert.notEqual(
    verseGrade(0, false),
    'good',
    'blocked is blocked, even with nothing revealed',
  );
  assert.equal(verseGrade(0, false), 'hard');
  assert.equal(verseGrade(0, true), 'good', 'recited clean, and said so');
});

test('claiming a clean recital does not survive having uncovered the verse', () => {
  // Self-report is the ceiling without speech recognition — but what was measured
  // still overrides it downwards.
  assert.equal(verseGrade(2, true), 'hard');
  assert.equal(verseGrade(4, true), 'forgot');
  assert.equal(verseGrade(4, false), 'forgot', 'and an honest failure stays a failure');
});

// --- final verification ----------------------------------------------------

test('a clean full recitation is what makes a surah known', () => {
  assert.deepEqual(verificationOutcome([]), { status: 'known', weakVerses: [] });
});

test('a failed recitation sends the surah back, with its weak verses named', () => {
  // It used to be declared known the moment every verse had been seen once — and
  // it entered the SRS on that false premise.
  assert.deepEqual(verificationOutcome([7, 3]), {
    status: 'learning',
    weakVerses: [3, 7],
  });
});
