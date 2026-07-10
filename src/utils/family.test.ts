import assert from 'node:assert/strict';
import test from 'node:test';

import {
  normalizeFamilyContext,
  normalizeFamilyMembers,
} from '@/utils/family';

test('normalizes a family with several child profiles', () => {
  const context = normalizeFamilyContext({
    familyId: 'family-1',
    familyName: 'Famille Noor',
    role: 'parent',
    inviteCode: 'ABC123',
    memberCount: 4,
    childCount: 3,
    maxChildren: 4,
    ownerDisplayName: 'Amin',
    active: true,
  });

  assert.equal(context?.childCount, 3);
  assert.equal(context?.role, 'parent');
  assert.equal(context?.active, true);
});

test('drops invalid dashboard rows and normalizes missing progress', () => {
  const members = normalizeFamilyMembers([
    {
      userId: 'child-1',
      displayName: 'Maryam',
      role: 'child',
      currentStreak: 5,
      history: [],
    },
    { displayName: 'Sans identifiant' },
  ]);

  assert.equal(members.length, 1);
  assert.equal(members[0].currentStreak, 5);
  assert.equal(members[0].knownSurahs, 0);
});
