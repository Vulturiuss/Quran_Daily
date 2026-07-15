import assert from 'node:assert/strict';
import test from 'node:test';

import {
  activeWordIndex,
  parseSegments,
  segmentsFitWords,
  splitArabicWords,
} from './recitation';

test('splitArabicWords splits on any whitespace and drops empties', () => {
  assert.deepEqual(splitArabicWords('بِسْمِ اللَّهِ الرَّحْمَٰنِ'), [
    'بِسْمِ',
    'اللَّهِ',
    'الرَّحْمَٰنِ',
  ]);
  assert.deepEqual(splitArabicWords('  الله   أكبر  '), ['الله', 'أكبر']);
  assert.deepEqual(splitArabicWords(''), []);
});

test('parseSegments reads the last two columns as start/end (Al-Fatiha 1:1)', () => {
  const raw = [
    [0, 1, 60, 610],
    [1, 2, 620, 1310],
    [2, 3, 1320, 2450],
    [3, 4, 2460, 5970],
  ];
  assert.deepEqual(parseSegments(raw), [
    { start: 60, end: 610 },
    { start: 620, end: 1310 },
    { start: 1320, end: 2450 },
    { start: 2460, end: 5970 },
  ]);
});

test('parseSegments merges rows that share a word index', () => {
  const raw = [
    [0, 1, 100, 200],
    [0, 2, 200, 350],
    [1, 3, 360, 500],
  ];
  assert.deepEqual(parseSegments(raw), [
    { start: 100, end: 350 },
    { start: 360, end: 500 },
  ]);
});

test('parseSegments skips malformed rows and fills index gaps', () => {
  const raw = [
    [0, 1, 100, 200],
    'nope',
    [2, 3, 400, 600], // index 1 is never mentioned
    [3, 4, 700, 500], // end before start: dropped
  ];
  const parsed = parseSegments(raw);
  assert.equal(parsed.length, 3);
  assert.deepEqual(parsed[0], { start: 100, end: 200 });
  assert.deepEqual(parsed[1], { start: 0, end: 0 }); // filled gap
  assert.deepEqual(parsed[2], { start: 400, end: 600 });
});

test('parseSegments tolerates non-array input', () => {
  assert.deepEqual(parseSegments(undefined), []);
  assert.deepEqual(parseSegments(null), []);
  assert.deepEqual(parseSegments('x'), []);
});

test('segmentsFitWords only trusts an exact one-per-word match', () => {
  const timings = [
    { start: 0, end: 100 },
    { start: 100, end: 200 },
  ];
  assert.equal(segmentsFitWords(timings, 2), true); // exact
  assert.equal(segmentsFitWords(timings, 3), false); // fewer timings than words: drift risk
  assert.equal(segmentsFitWords(timings, 1), false); // more timings than words
  assert.equal(segmentsFitWords([], 5), false);
  assert.equal(segmentsFitWords([], 0), false);
});

test('activeWordIndex tracks the recited word and stays sticky between words', () => {
  const timings = [
    { start: 60, end: 610 },
    { start: 620, end: 1310 },
    { start: 1320, end: 2450 },
  ];
  assert.equal(activeWordIndex(timings, 0), -1); // before the first word
  assert.equal(activeWordIndex(timings, 300), 0);
  assert.equal(activeWordIndex(timings, 615), 0); // gap between word 0 and 1: keep 0
  assert.equal(activeWordIndex(timings, 700), 1);
  assert.equal(activeWordIndex(timings, 2000), 2);
  assert.equal(activeWordIndex(timings, 9999), 2); // past the end: keep the last
});

test('activeWordIndex never lands on a filled gap', () => {
  const timings = [
    { start: 100, end: 300 },
    { start: 0, end: 0 }, // gap
    { start: 400, end: 600 },
  ];
  assert.equal(activeWordIndex(timings, 350), 0); // sticky on 0, not the gap
  assert.equal(activeWordIndex(timings, 500), 2);
});
