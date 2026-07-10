import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveCloudIdentityAction } from './cloudIdentity';

test('an unsynced guest state can be attached to the first account', () => {
  assert.equal(
    resolveCloudIdentityAction({ dirty: true }, 'user-a', false),
    'merge-local',
  );
});

test('state already owned by the current account can be merged', () => {
  assert.equal(
    resolveCloudIdentityAction(
      { dirty: true, cloudUserId: 'user-a' },
      'user-a',
      true,
    ),
    'merge-local',
  );
});

test('switching accounts never uploads the previous account local state', () => {
  assert.equal(
    resolveCloudIdentityAction(
      { dirty: true, cloudUserId: 'user-a' },
      'user-b',
      true,
    ),
    'replace-from-remote',
  );
  assert.equal(
    resolveCloudIdentityAction(
      { dirty: true, cloudUserId: 'user-a' },
      'user-b',
      false,
    ),
    'reset-for-user',
  );
});

test('legacy synchronized state without an owner is treated as private', () => {
  assert.equal(
    resolveCloudIdentityAction(
      {
        dirty: false,
        lastSyncedAt: '2026-06-15T10:00:00.000Z',
      },
      'user-b',
      false,
    ),
    'reset-for-user',
  );
});
