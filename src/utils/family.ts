import {
  FamilyContext,
  FamilyMemberSummary,
  FamilyRole,
  SessionRecord,
} from '@/types';
import { dateKey } from '@/utils/date';
import { historySessionCount } from '@/utils/gamification';

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

  const parentCount = numberValue(input.parentCount);
  const memberCount = numberValue(input.memberCount);
  const maxMembers = Math.max(
    2,
    numberValue(input.maxMembers) || numberValue(input.maxAccounts) || 5,
  );

  return {
    familyId: input.familyId,
    familyName:
      typeof input.familyName === 'string' ? input.familyName : 'Ma famille',
    role: roleValue(input.role),
    inviteCode:
      typeof input.inviteCode === 'string' ? input.inviteCode : undefined,
    memberCount,
    parentCount,
    childCount: numberValue(input.childCount),
    maxChildren: Math.max(
      1,
      numberValue(input.maxChildren) || Math.max(1, maxMembers - Math.max(1, parentCount)),
    ),
    maxMembers,
    ownerDisplayName:
      typeof input.ownerDisplayName === 'string'
        ? input.ownerDisplayName
        : 'Parent',
    active: input.active === true,
  };
}

function normalizeHistory(value: unknown): SessionRecord[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((record) => {
    if (!record || typeof record !== 'object') return [];
    const input = record as Partial<SessionRecord>;
    if (typeof input.date !== 'string') return [];
    return [input as SessionRecord];
  });
}

function lastSessionDate(history: SessionRecord[]) {
  return history
    .map((record) => record.date)
    .filter(Boolean)
    .sort((a, b) => b.localeCompare(a))[0];
}

export function normalizeFamilyMembers(
  value: unknown,
  today = dateKey(),
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
    const history = normalizeHistory(input.history);
    const todayRecord = history.find((record) => record.date === today);
    const explicitTodaySessionCount = numberValue(input.todaySessionCount);
    const todaySessionCount =
      explicitTodaySessionCount ||
      (todayRecord ? historySessionCount(todayRecord) : 0);
    return [
      {
        userId: input.userId,
        displayName: input.displayName,
        role: roleValue(input.role),
        isOwner: input.isOwner === true,
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
        history,
        todayCompleted:
          input.todayCompleted === true ||
          todaySessionCount > 0 ||
          Boolean(todayRecord),
        todayReviews:
          numberValue(input.todayReviews) ||
          numberValue(todayRecord?.surahsReviewed),
        todayVersesLearned:
          numberValue(input.todayVersesLearned) ||
          numberValue(todayRecord?.versesLearned),
        todayXPEarned:
          numberValue(input.todayXPEarned) ||
          numberValue(todayRecord?.xpEarned),
        lastSessionDate:
          typeof input.lastSessionDate === 'string'
            ? input.lastSessionDate
            : lastSessionDate(history),
        snapshotUpdatedAt:
          typeof input.snapshotUpdatedAt === 'string'
            ? input.snapshotUpdatedAt
            : undefined,
      },
    ];
  });
}
