import {
  CloudSnapshot,
  SessionRecord,
  UserStats,
  UserSurahProgress,
} from '@/types';
import {
  historyPerfectCount,
  historySessionCount,
  normalizeStats,
} from '@/utils/gamification';
import {
  mergeSessionRecords,
  normalizeSessionRecord,
  sessionEntries,
} from '@/utils/sessionHistory';

type SnapshotInput = Omit<CloudSnapshot, 'schemaVersion' | 'updatedAt'>;

function mergeProgress(local: CloudSnapshot, remote: CloudSnapshot) {
  const merged: Record<number, UserSurahProgress> = {};
  const surahNumbers = new Set([
    ...Object.keys(local.progress).map(Number),
    ...Object.keys(remote.progress).map(Number),
  ]);

  surahNumbers.forEach((surahNumber) => {
    const localItem = local.progress[surahNumber];
    const remoteItem = remote.progress[surahNumber];
    if (!localItem) {
      merged[surahNumber] = remoteItem;
      return;
    }
    if (!remoteItem) {
      merged[surahNumber] = localItem;
      return;
    }

    const localUpdatedAt = localItem.updatedAt ?? local.updatedAt;
    const remoteUpdatedAt = remoteItem.updatedAt ?? remote.updatedAt;
    merged[surahNumber] =
      localUpdatedAt >= remoteUpdatedAt ? localItem : remoteItem;
  });

  return merged;
}

function mergeHistory(local: SessionRecord[], remote: SessionRecord[]) {
  const records = new Map<string, SessionRecord>();
  [...remote, ...local].forEach((record) => {
    const existing = records.get(record.date);
    records.set(
      record.date,
      existing
        ? mergeSessionRecords(existing, record)
        : normalizeSessionRecord(record),
    );
  });
  return [...records.values()].sort((a, b) => b.date.localeCompare(a.date));
}

function mergeStats(
  local: UserStats,
  remote: UserStats,
  history: SessionRecord[],
  localIsNewer: boolean,
): UserStats {
  const historyXP = history.reduce((sum, record) => sum + record.xpEarned, 0);
  const historyMinutes = history.reduce(
    (sum, record) =>
      sum +
      sessionEntries(record).reduce(
        (recordTotal, entry) =>
          recordTotal + Math.max(1, Math.round(entry.durationSeconds / 60)),
        0,
      ),
    0,
  );
  const historySessions = history.reduce(
    (sum, record) => sum + historySessionCount(record),
    0,
  );
  const historyPerfect = history.reduce(
    (sum, record) => sum + historyPerfectCount(record),
    0,
  );
  const temporal = normalizeStats(localIsNewer ? local : remote);
  const historyWeeklyXP = history
    .filter((record) => record.date >= temporal.weekStart)
    .reduce((sum, record) => sum + record.xpEarned, 0);
  const localWeeklyXP =
    local.weekStart === temporal.weekStart ? local.weeklyXP : 0;
  const remoteWeeklyXP =
    remote.weekStart === temporal.weekStart ? remote.weeklyXP : 0;

  return {
    ...temporal,
    currentStreak: temporal.currentStreak,
    longestStreak: Math.max(local.longestStreak, remote.longestStreak),
    totalXP: Math.max(local.totalXP, remote.totalXP, historyXP),
    weeklyXP: Math.max(localWeeklyXP, remoteWeeklyXP, historyWeeklyXP),
    totalSessions: Math.max(local.totalSessions, remote.totalSessions, historySessions),
    perfectSessions: Math.max(
      local.perfectSessions,
      remote.perfectSessions,
      historyPerfect,
    ),
    totalMinutes: Math.max(local.totalMinutes, remote.totalMinutes, historyMinutes),
    badges: [...new Set([...local.badges, ...remote.badges])],
  };
}

export function createCloudSnapshot(
  input: SnapshotInput,
  updatedAt = new Date().toISOString(),
): CloudSnapshot {
  return {
    schemaVersion: 1,
    updatedAt,
    onboardingCompleted: input.onboardingCompleted,
    profile: input.profile,
    progress: input.progress,
    stats: input.stats,
    history: input.history,
  };
}

export function mergeCloudSnapshots(
  local: CloudSnapshot,
  remote: CloudSnapshot,
  updatedAt = new Date().toISOString(),
): CloudSnapshot {
  if (!local.onboardingCompleted && remote.onboardingCompleted) {
    return { ...remote, updatedAt };
  }
  if (!remote.onboardingCompleted && local.onboardingCompleted) {
    return { ...local, updatedAt };
  }

  const history = mergeHistory(local.history, remote.history);
  const localIsNewer = local.updatedAt >= remote.updatedAt;

  return {
    schemaVersion: 1,
    updatedAt,
    onboardingCompleted: localIsNewer
      ? local.onboardingCompleted
      : remote.onboardingCompleted,
    profile: localIsNewer ? local.profile : remote.profile,
    progress: mergeProgress(local, remote),
    stats: mergeStats(local.stats, remote.stats, history, localIsNewer),
    history,
  };
}
