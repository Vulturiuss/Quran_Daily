import assert from 'node:assert/strict';
import test from 'node:test';

import {
  capabilities,
  effectiveReciter,
  effectiveTheme,
  FREE_RECITER_ID,
  FREE_THEME,
  hasFullAccess,
} from './access';

test('the free tier keeps the whole Quran, and pays for nothing to learn or review', () => {
  const free = capabilities(false);
  const premium = capabilities(true);

  // Nothing in the capability model gates a surah or caps reviews: that is the
  // point of the business model. What Premium buys is capacity and comfort.
  assert.equal(free.maxLearningSurahs, 1);
  assert.equal(premium.maxLearningSurahs, 3);
  assert.equal(free.stats, false);
  assert.equal(premium.stats, true);
  assert.equal(free.allReciters, false);
  assert.equal(premium.allReciters, true);
  assert.equal(free.allThemes, false);
  assert.equal(premium.allThemes, true);

  // Offline audio gates bandwidth, not the Quran: streaming stays free and
  // unlimited, and the text is offline for everyone.
  assert.equal(free.offlineAudio, false);
  assert.equal(premium.offlineAudio, true);
});

test('a free user is pinned to the default reciter and theme', () => {
  assert.equal(effectiveReciter(false, 'sudais'), FREE_RECITER_ID);
  assert.equal(effectiveTheme(false, 'pink'), FREE_THEME);
});

test('a premium user keeps their choice', () => {
  assert.equal(effectiveReciter(true, 'sudais'), 'sudais');
  assert.equal(effectiveTheme(true, 'pink'), 'pink');
});

test('with no billing backend configured the app runs unlocked', () => {
  assert.equal(hasFullAccess(false, false), true, 'local dev run');
  assert.equal(hasFullAccess(true, false), false, 'configured and not premium');
  assert.equal(hasFullAccess(true, true), true, 'configured and premium');
});
