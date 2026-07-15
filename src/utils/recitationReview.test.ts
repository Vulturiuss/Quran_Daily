import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildRecitationReview, VerseExpectation } from '@/utils/recitationReview';

// Two short verses, 4 + 2 = 6 expected words.
const VERSES: VerseExpectation[] = [
  { verseNumber: 1, textArabic: 'الحمد لله رب العالمين' },
  { verseNumber: 2, textArabic: 'الرحمن الرحيم' },
];

const V1 = ['الحمد', 'لله', 'رب', 'العالمين'];
const V2 = ['الرحمن', 'الرحيم'];

test('a perfect recitation lights every word correct and scores 1', () => {
  const r = buildRecitationReview(VERSES, [...V1, ...V2]);
  assert.equal(r.score, 1);
  assert.equal(r.reachedWords, 6);
  assert.equal(r.correctWords, 6);
  assert.deepEqual(
    r.byVerse[1].map((w) => w.verdict),
    ['correct', 'correct', 'correct', 'correct'],
  );
  assert.deepEqual(
    r.byVerse[2].map((w) => w.verdict),
    ['correct', 'correct'],
  );
});

test('vowelling on the spoken side never counts against the reciter', () => {
  // Same words carrying harakat — the normaliser folds them away.
  const r = buildRecitationReview(VERSES, ['الْحَمْد', 'لله', 'رب', 'العالمين', 'الرحمن', 'الرحيم']);
  assert.equal(r.score, 1);
});

test('a substituted word is flagged but the rest stay correct', () => {
  const spoken = ['الحمد', 'لله', 'ملك', 'العالمين', 'الرحمن', 'الرحيم'];
  const r = buildRecitationReview(VERSES, spoken);
  assert.deepEqual(
    r.byVerse[1].map((w) => w.verdict),
    ['correct', 'correct', 'substituted', 'correct'],
  );
  assert.equal(r.correctWords, 5);
  assert.equal(r.reachedWords, 6);
  assert.equal(r.score, 5 / 6);
});

test('a word skipped mid-recitation is missing and still counts in the denominator', () => {
  // "لله" omitted; everything else recited.
  const spoken = ['الحمد', 'رب', 'العالمين', 'الرحمن', 'الرحيم'];
  const r = buildRecitationReview(VERSES, spoken);
  assert.equal(r.byVerse[1][1].verdict, 'missing');
  assert.equal(r.reachedWords, 6);
  assert.equal(r.correctWords, 5);
  assert.equal(r.score, 5 / 6);
});

test('stopping early leaves the rest unreached, not wrong, and out of the score', () => {
  // Only the first verse is recited.
  const r = buildRecitationReview(VERSES, [...V1]);
  assert.deepEqual(
    r.byVerse[1].map((w) => w.verdict),
    ['correct', 'correct', 'correct', 'correct'],
  );
  assert.deepEqual(
    r.byVerse[2].map((w) => w.verdict),
    ['unreached', 'unreached'],
  );
  assert.equal(r.reachedWords, 4);
  assert.equal(r.score, 1);
});

test('words heard with no counterpart surface as extra without hurting verdicts', () => {
  const r = buildRecitationReview(VERSES, [...V1, ...V2, 'آمين']);
  assert.deepEqual(r.extra, ['آمين']);
  assert.equal(r.score, 1);
  assert.equal(r.reachedWords, 6);
});

test('saying nothing reaches nothing and scores zero', () => {
  const r = buildRecitationReview(VERSES, []);
  assert.equal(r.reachedWords, 0);
  assert.equal(r.score, 0);
  assert.deepEqual(
    r.byVerse[1].map((w) => w.verdict),
    ['unreached', 'unreached', 'unreached', 'unreached'],
  );
});

test('the display keeps the original Uthmani spelling of each word', () => {
  const withMarks = [{ verseNumber: 7, textArabic: 'ٱلْحَمْدُ لِلَّهِ' }];
  const r = buildRecitationReview(withMarks, ['الحمد', 'لله']);
  assert.deepEqual(
    r.byVerse[7].map((w) => w.text),
    ['ٱلْحَمْدُ', 'لِلَّهِ'],
  );
  assert.equal(r.score, 1);
});
