import assert from 'node:assert/strict';
import test from 'node:test';

import { hasCloudPaidAccess } from '@/utils/subscriptionAccess';

test('cloud premium access accepts active and lifetime tiers', () => {
  const now = new Date('2026-06-15T12:00:00.000Z');

  assert.equal(hasCloudPaidAccess('free', null, now), false);
  assert.equal(hasCloudPaidAccess('premium', null, now), true);
  assert.equal(
    hasCloudPaidAccess('family', '2026-06-16T12:00:00.000Z', now),
    true,
  );
});

test('cloud premium access rejects expired or invalid expirations', () => {
  const now = new Date('2026-06-15T12:00:00.000Z');

  assert.equal(
    hasCloudPaidAccess('premium', '2026-06-14T12:00:00.000Z', now),
    false,
  );
  assert.equal(hasCloudPaidAccess('premium', 'not-a-date', now), false);
});
