import {
  CloudSnapshot,
  SessionRecord,
  UserStats,
  UserSurahProgress,
} from '@/types';

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
    if (!existing || record.completedAt >= existing.completedAt) {
      records.set(record.date, record);
    }
  });
  return [...records.values()].sort((a, b) => b.date.localeCompare(a.date));
}

function mergeStats(
  local: UserStats,
  remote: UserStats,
  history: SessionRecord[],
): UserStats {
  const historyXP = history.reduce((sum, record) => sum + record.xpEarned, 0);
  const historyMinutes = history.reduce(
    (sum, record) => sum + Math.max(1, Math.round(record.durationSeconds / 60)),
    0,
  );
  const historyPerfect = history.filter((record) => record.isPerfect).length;

  return {
    currentStreak: Math.max(local.currentStreak, remote.currentStreak),
    longestStreak: Math.max(local.longestStreak, remote.longestStreak),
    totalXP: Math.max(local.totalXP, remote.totalXP, historyXP),
    weeklyXP: Math.max(local.weeklyXP, remote.weeklyXP),
    totalSessions: Math.max(local.totalSessions, remote.totalSessions, history.length),
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
  if (!local.onboardingCompleted && local.updatedAt >= remote.updatedAt) {
    return { ...local, updatedAt };
  }
  if (!remote.onboardingCompleted && remote.updatedAt > local.updatedAt) {
    return { ...remote, updatedAt };
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
    stats: mergeStats(local.stats, remote.stats, history),
    history,
  };
}
