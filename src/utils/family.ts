import {
  FamilyContext,
  FamilyMemberSummary,
  FamilyRole,
  SessionRecord,
} from '@/types';

function numberValue(value: unknown) {
  const result = Number(value);
  return Number.isFinite(result) ? result : 0;
}

function roleValue(value: unknown): FamilyRole {
  return value === 'parent' ? 'parent' : 'child';
}

export function normalizeFamilyContext(value: unknown): FamilyContext | null {
  if (!value || typeof value !== 'object') return null;
  const input = value as Record<string, unknown>;
  if (typeof input.familyId !== 'string') return null;

  return {
    familyId: input.familyId,
    familyName:
      typeof input.familyName === 'string' ? input.familyName : 'Ma famille',
    role: roleValue(input.role),
    inviteCode:
      typeof input.inviteCode === 'string' ? input.inviteCode : undefined,
    memberCount: numberValue(input.memberCount),
    childCount: numberValue(input.childCount),
    maxChildren: Math.max(1, numberValue(input.maxChildren) || 4),
    ownerDisplayName:
      typeof input.ownerDisplayName === 'string'
        ? input.ownerDisplayName
        : 'Parent',
    active: input.active === true,
  };
}

export function normalizeFamilyMembers(
  value: unknown,
): FamilyMemberSummary[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const input = item as Record<string, unknown>;
    if (
      typeof input.userId !== 'string' ||
      typeof input.displayName !== 'string'
    ) {
      return [];
    }

    const learningSurah = numberValue(input.learningSurah);
    return [
      {
        userId: input.userId,
        displayName: input.displayName,
        role: roleValue(input.role),
        joinedAt:
          typeof input.joinedAt === 'string'
            ? input.joinedAt
            : new Date(0).toISOString(),
        currentStreak: numberValue(input.currentStreak),
        longestStreak: numberValue(input.longestStreak),
        totalXP: numberValue(input.totalXP),
        totalSessions: numberValue(input.totalSessions),
        totalMinutes: numberValue(input.totalMinutes),
        knownSurahs: numberValue(input.knownSurahs),
        versesLearned: numberValue(input.versesLearned),
        learningSurah: learningSurah > 0 ? learningSurah : undefined,
        learningVersesLearned: numberValue(input.learningVersesLearned),
        learningTotalVerses: numberValue(input.learningTotalVerses),
        history: Array.isArray(input.history)
          ? (input.history as SessionRecord[])
          : [],
        snapshotUpdatedAt:
          typeof input.snapshotUpdatedAt === 'string'
            ? input.snapshotUpdatedAt
            : undefined,
      },
    ];
  });
}
