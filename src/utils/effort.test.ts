import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  countableSeconds,
  isPlausibleSession,
  MAX_ITEM_SECONDS,
  minReviewSeconds,
  minVerseSeconds,
  SERVER_MIN_SECONDS_PER_ITEM,
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

test('the server never refuses work the app itself allowed', () => {
  // The invariant that matters, and it was broken. The app gates a short verse at
  // MIN_VERSE_FLOOR (4 s), so the server's per-item floor must sit below it — at
  // 5 s per review, four honest sabqi verses on Al-Ikhlas, done at exactly the pace
  // the app allowed, were refused, and the child's real work vanished from their
  // parent's dashboard.
  const shortVerse = { textArabic: 'قُلْ هُوَ ٱللَّهُ أَحَدٌ' };
  const clientFloor = minVerseSeconds(shortVerse);

  for (const items of [1, 4, 8, 20]) {
    assert.equal(
      isPlausibleSession({
        activeSeconds: items * clientFloor,
        versesLearned: 0,
        surahsReviewed: 0,
        recitedVerses: items,
      }),
      true,
      `${items} sabqi verses at the client's own minimum must be accepted`,
    );
  }
});

test('a full recitation of a long surah is not refused for being long', () => {
  // The other half of the same mistake: reciting all 286 verses of Al-Baqara was
  // reported as ONE review, and one item cannot plausibly hold 47 minutes — so the
  // server refused the single most demanding thing a user can do.
  assert.equal(
    isPlausibleSession({
      activeSeconds: 2860,
      versesLearned: 0,
      surahsReviewed: 1,
      recitedVerses: 286,
    }),
    true,
  );
});

test('reciting verses instantly is still refused', () => {
  assert.equal(
    isPlausibleSession({
      activeSeconds: 5,
      versesLearned: 0,
      surahsReviewed: 0,
      recitedVerses: 20,
    }),
    false,
    'twenty verses cannot be recited in five seconds',
  );
});

test('the server rejects a session claiming more time than its items can hold', () => {
  assert.equal(
    isPlausibleSession({ activeSeconds: 7200, versesLearned: 1, surahsReviewed: 0 }),
    false,
    'two hours on a single verse is not work, it is a forged payload',
  );
});

// The real anti-cheat gate runs in PL/pgSQL (record_daily_session); this TS
// mirror has no production caller. The two floors are coupled only by a comment,
// so pin the per-item floor in schema.sql to the constant here — if either side
// moves without the other, this fails instead of silently drifting apart.
test('the server per-item time floor mirrors SERVER_MIN_SECONDS_PER_ITEM', () => {
  const schema = readFileSync(
    new URL('../../supabase/schema.sql', import.meta.url),
    'utf8',
  );
  const match = schema.match(
    /session_time_floor[\s\S]*?session_items\([^)]*\)\s*\*\s*(\d+)/,
  );
  assert.ok(match, 'session_time_floor multiplies session_items by a literal');
  assert.equal(
    Number(match![1]),
    SERVER_MIN_SECONDS_PER_ITEM,
    'schema.sql and effort.ts disagree on the per-item floor',
  );

  // The per-item ceiling in the SQL gate must match MAX_ITEM_SECONDS.
  const ceiling = schema.match(/p_active_seconds\s*>\s*(\d+)\s*\*\s*item_count/);
  assert.ok(ceiling, 'the SQL enforces a per-item ceiling');
  assert.equal(
    Number(ceiling![1]),
    MAX_ITEM_SECONDS,
    'schema.sql and effort.ts disagree on the per-item ceiling',
  );

  // And the absolute hourly cap (MAX_SESSION_SECONDS in the store) is present.
  assert.match(
    schema,
    /p_active_seconds\s*>\s*3600/,
    'the SQL keeps the 3600s absolute session cap',
  );
});
