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
    memberCount: 5,
    parentCount: 2,
    childCount: 3,
    maxMembers: 5,
    ownerDisplayName: 'Amin',
    active: true,
  });

  assert.equal(context?.childCount, 3);
  assert.equal(context?.parentCount, 2);
  assert.equal(context?.maxMembers, 5);
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
      isOwner: false,
    },
    { displayName: 'Sans identifiant' },
  ]);

  assert.equal(members.length, 1);
  assert.equal(members[0].currentStreak, 5);
  assert.equal(members[0].knownSurahs, 0);
  assert.equal(members[0].todayCompleted, false);
});

test('derives today completion from synchronized history', () => {
  const members = normalizeFamilyMembers(
    [
      {
        userId: 'child-1',
        displayName: 'Maryam',
        role: 'child',
        history: [
          {
            completedAt: '2026-07-10T08:00:00.000Z',
            date: '2026-07-10',
            durationSeconds: 420,
            isPerfect: true,
            surahsReviewed: 2,
            versesLearned: 3,
            xpEarned: 110,
          },
        ],
      },
    ],
    '2026-07-10',
  );

  assert.equal(members[0].todayCompleted, true);
  assert.equal(members[0].todayReviews, 2);
  assert.equal(members[0].todayVersesLearned, 3);
  assert.equal(members[0].todayXPEarned, 110);
  assert.equal(members[0].lastSessionDate, '2026-07-10');
});
