import assert from 'node:assert/strict';
import test from 'node:test';

import { surahs } from './surahs';
import { getVerses, versesBySurah } from './verses';

test('bundled Quran corpus contains all 114 surahs and 6,236 verses', () => {
  const allVerses = Object.values(versesBySurah).flat();
  assert.equal(Object.keys(versesBySurah).length, 114);
  assert.equal(allVerses.length, 6236);
});

test('every surah has the expected verse count and complete content', () => {
  for (const surah of surahs) {
    const verses = getVerses(surah.number);
    assert.equal(verses.length, surah.totalVerses, surah.nameTranslit);

    for (const [index, verse] of verses.entries()) {
      assert.equal(verse.verseNumber, index + 1);
      assert.equal(verse.verseKey, `${surah.number}:${index + 1}`);
      assert.ok(verse.textArabic);
      assert.ok(verse.textFr);
      assert.ok(verse.textTranslit);
      assert.match(verse.audioUrl ?? '', /^https:\/\//);
    }
  }
});

test('all bundled Mishary audio URLs point to the Quran.com CDN', () => {
  const allVerses = Object.values(versesBySurah).flat();
  assert.ok(
    allVerses.every((verse) => verse.audioUrl?.startsWith('https://verses.quran.com/')),
  );
});
