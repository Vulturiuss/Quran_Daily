import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeArabic, sameArabicWord } from './arabicNormalize';

// Arabic is written with \u escapes so the source stays ASCII and no combining
// mark can be mangled by an editor.

test('normalizeArabic strips harakat and sukun', () => {
  // بِسْمِ -> بسم
  assert.equal(normalizeArabic('بِسْمِ'), 'بسم');
});

test('normalizeArabic folds alef-wasla to a bare alef and drops shadda', () => {
  // ٱللّهِ -> الله
  assert.equal(
    normalizeArabic('ٱللّهِ'),
    'الله',
  );
});

test('normalizeArabic drops the superscript alef', () => {
  // ٱلرّحْمٰنِ -> الرحمن
  assert.equal(
    normalizeArabic('ٱلرّحْمٰنِ'),
    'الرحمن',
  );
});

test('normalizeArabic folds alef-maqsura to ya', () => {
  // موسى -> موسي
  assert.equal(normalizeArabic('موسى'), 'موسي');
});

test('normalizeArabic folds ta-marbuta to ha', () => {
  // رحمة -> رحمه
  assert.equal(normalizeArabic('رحمة'), 'رحمه');
});

test('normalizeArabic drops a free-standing hamza', () => {
  // شيء -> شي
  assert.equal(normalizeArabic('شيء'), 'شي');
});

test('sameArabicWord ignores vowelling', () => {
  // قُلْ vs قل
  assert.equal(sameArabicWord('قُلْ', 'قل'), true);
  // ٱلله vs الله (wasla vs bare alef)
  assert.equal(sameArabicWord('ٱلله', 'الله'), true);
  // قل vs هو
  assert.equal(sameArabicWord('قل', 'هو'), false);
  assert.equal(sameArabicWord('', ''), true);
});
