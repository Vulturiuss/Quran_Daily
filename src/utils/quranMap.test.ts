import assert from 'node:assert/strict';
import test from 'node:test';

import { UserSurahProgress } from '../types';
import { buildQuranMap } from './quranMap';

function progress(
  surahNumber: number,
  partial: Partial<UserSurahProgress>,
): UserSurahProgress {
  return {
    surahNumber,
    status: 'learning',
    versesLearned: 0,
    totalVerses: 0,
    reviewIntervalDays: 1,
    easeFactor: 2.5,
    reviewCount: 0,
    ...partial,
  };
}

test('an empty map still holds the whole Quran', () => {
  const map = buildQuranMap({});

  assert.equal(map.surahs.length, 114);
  assert.equal(map.juz.length, 30);
  assert.equal(map.totalVerses, 6236, 'the map is the Quran, not a subset of it');
  assert.equal(map.versesLearned, 0);
  assert.equal(map.progress, 0);
  assert.equal(map.surahsKnown, 0);
});

test('the juz fill up as the surahs inside them are learnt', () => {
  // An-Nas and Al-Falaq are both in juz 30. Memorising them must show up there,
  // and nowhere else.
  const map = buildQuranMap({
    113: progress(113, { status: 'known', versesLearned: 5, totalVerses: 5 }),
    114: progress(114, { status: 'known', versesLearned: 6, totalVerses: 6 }),
  });

  const juz30 = map.juz.find((item) => item.number === 30)!;
  const juz1 = map.juz.find((item) => item.number === 1)!;

  assert.equal(juz30.versesLearned, 11);
  assert.ok(juz30.progress > 0);
  assert.equal(juz1.versesLearned, 0, 'juz 1 is untouched');
  assert.equal(map.versesLearned, 11);
  assert.equal(map.surahsKnown, 2);
});

test('a surah spanning several juz only fills the ones it reaches', () => {
  // Al-Baqara starts in juz 1 and runs into juz 3. Learning its first 20 verses
  // must not colour juz 2 or 3 — that is the whole point of a map you can trust.
  const map = buildQuranMap({
    2: progress(2, { status: 'learning', versesLearned: 20, totalVerses: 286 }),
  });

  const juz1 = map.juz.find((item) => item.number === 1)!;
  const juz2 = map.juz.find((item) => item.number === 2)!;

  assert.equal(juz1.versesLearned, 20);
  assert.equal(juz2.versesLearned, 0);
  assert.equal(map.versesLearned, 20);
});

test('a surah carries how much is memorised and how well it holds', () => {
  const map = buildQuranMap({
    112: progress(112, {
      status: 'known',
      versesLearned: 4,
      totalVerses: 4,
      weakVerses: [2],
    }),
  });

  const cell = map.surahs.find((item) => item.number === 112)!;

  assert.equal(cell.state, 'known');
  assert.equal(cell.progress, 1, 'every verse is memorised');
  assert.equal(cell.solidity, 0.75, 'but one of the four is still fragile');
});

test('a surah awaiting its final recitation has its own colour', () => {
  const map = buildQuranMap({
    112: progress(112, { status: 'verifying', versesLearned: 4, totalVerses: 4 }),
  });

  assert.equal(map.surahs.find((item) => item.number === 112)!.state, 'verifying');
  assert.equal(map.surahsKnown, 0, 'seen is not known');
});
