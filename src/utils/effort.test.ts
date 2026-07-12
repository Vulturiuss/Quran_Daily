import assert from 'node:assert/strict';
import test from 'node:test';

import {
  countableSeconds,
  isPlausibleSession,
  MAX_ITEM_SECONDS,
  minReviewSeconds,
  minVerseSeconds,
} from './effort';

test('a longer verse is held back longer than a short one', () => {
  const short = { textArabic: 'قُلْ هُوَ ٱللَّهُ أَحَدٌ' }; // 4 words
  const long = {
    textArabic:
      'وَإِذَا سَأَلَكَ عِبَادِى عَنِّى فَإِنِّى قَرِيبٌ أُجِيبُ دَعْوَةَ ٱلدَّاعِ إِذَا دَعَانِ فَلْيَسْتَجِيبُوا۟ لِى وَلْيُؤْمِنُوا۟ بِى لَعَلَّهُمْ يَرْشُدُونَ',
  };

  assert.ok(minVerseSeconds(short) < minVerseSeconds(long));
  assert.ok(minVerseSeconds(short) >= 4, 'never instant, even for a tiny verse');
  assert.ok(minVerseSeconds(long) <= 45, 'never absurdly long either');
});

test('a review can never be instant, and never blocks for long', () => {
  // The gate exists to make a zero-second review impossible, not to hold an
  // honest reciter hostage: even Al-Baqara unlocks in ten seconds. What tells a
  // parent whether the work happened is the measured time, not this floor.
  assert.ok(minReviewSeconds({ totalVerses: 3 }) >= 8, 'never instant');
  assert.equal(minReviewSeconds({ totalVerses: 286 }), 10, 'and never punishing');
  assert.ok(minReviewSeconds(undefined) >= 8);
});

test('rushing a review earns the time it actually took, and no more', () => {
  // The honest consequence of the low gate: a rushed review is allowed through,
  // and is credited with exactly the ten seconds it took.
  assert.equal(countableSeconds(10), 10);
});

test('idling on one verse does not inflate the session', () => {
  assert.equal(countableSeconds(20), 20);
  assert.equal(
    countableSeconds(3600),
    MAX_ITEM_SECONDS,
    'an hour left on a single verse counts as three minutes, not an hour',
  );
  assert.equal(countableSeconds(-5), 0);
});

test('the server rejects a session that could not have been worked', () => {
  // Twenty verses tapped through in ten seconds.
  assert.equal(
    isPlausibleSession({ activeSeconds: 10, versesLearned: 20, surahsReviewed: 0 }),
    false,
  );
  // Three surahs "reviewed" instantly.
  assert.equal(
    isPlausibleSession({ activeSeconds: 4, versesLearned: 0, surahsReviewed: 3 }),
    false,
  );
});

test('the server accepts a session that was honestly worked', () => {
  assert.equal(
    isPlausibleSession({ activeSeconds: 240, versesLearned: 2, surahsReviewed: 2 }),
    true,
  );
});

test('the server rejects a session claiming more time than its items can hold', () => {
  assert.equal(
    isPlausibleSession({ activeSeconds: 7200, versesLearned: 1, surahsReviewed: 0 }),
    false,
    'two hours on a single verse is not work, it is a forged payload',
  );
});
