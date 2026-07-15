import assert from 'node:assert/strict';
import test from 'node:test';

import { matchRecitation } from './recitationMatch';

// Distinct words used across cases (bare spelling).
const QUL = 'قل';
const HUWA = 'هو';
const ALLAH = 'الله';
const AHAD = 'احد';

test('a perfect recitation marks every word correct', () => {
  const r = matchRecitation([QUL, HUWA, ALLAH], [QUL, HUWA, ALLAH]);
  assert.deepEqual(
    r.words.map((w) => w.verdict),
    ['correct', 'correct', 'correct'],
  );
  assert.equal(r.score, 1);
  assert.deepEqual(r.extra, []);
});

test('a wrong word in place is a substitution, not a skip', () => {
  const r = matchRecitation([QUL, HUWA, ALLAH], [QUL, AHAD, ALLAH]);
  assert.deepEqual(
    r.words.map((w) => w.verdict),
    ['correct', 'substituted', 'correct'],
  );
  assert.equal(r.words[1].spoken, AHAD);
  assert.equal(r.correctCount, 2);
  assert.equal(r.score, 2 / 3);
});

test('a skipped word is reported missing with nothing heard', () => {
  const r = matchRecitation([QUL, HUWA, ALLAH], [QUL, ALLAH]);
  assert.deepEqual(
    r.words.map((w) => w.verdict),
    ['correct', 'missing', 'correct'],
  );
  assert.equal(r.words[1].spoken, undefined);
  assert.equal(r.score, 2 / 3);
});

test('an extra word is surfaced separately, expected words stay correct', () => {
  const r = matchRecitation([QUL, HUWA, ALLAH], [QUL, HUWA, AHAD, ALLAH]);
  assert.deepEqual(
    r.words.map((w) => w.verdict),
    ['correct', 'correct', 'correct'],
  );
  assert.deepEqual(r.extra, [AHAD]);
  assert.equal(r.score, 1);
});

test('saying nothing marks every word missing', () => {
  const r = matchRecitation([QUL, HUWA, ALLAH], []);
  assert.deepEqual(
    r.words.map((w) => w.verdict),
    ['missing', 'missing', 'missing'],
  );
  assert.equal(r.score, 0);
});

test('vowelling never counts as a mistake', () => {
  // Expected carries harakat; spoken is bare. Same words -> all correct.
  const r = matchRecitation(['بِسْمِ', 'ٱللّهِ'], ['بسم', 'الله']);
  assert.deepEqual(
    r.words.map((w) => w.verdict),
    ['correct', 'correct'],
  );
  assert.equal(r.score, 1);
});

test('the expected word keeps its original spelling for display', () => {
  const r = matchRecitation(['بِسْمِ'], ['بسم']);
  assert.equal(r.words[0].expected, 'بِسْمِ');
  assert.equal(r.words[0].verdict, 'correct');
});
