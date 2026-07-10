import { SessionEntry, SessionRecord } from '@/types';

function legacyEntry(record: SessionRecord): SessionEntry {
  const sessionCount = record.sessionCount ?? 1;
  return {
    id: `legacy:${record.completedAt}`,
    completedAt: record.completedAt,
    durationSeconds: record.durationSeconds,
    xpEarned: record.xpEarned,
    surahsReviewed: record.surahsReviewed,
    versesLearned: record.versesLearned,
    isPerfect: record.isPerfect,
    sessionCount,
    perfectSessionCount:
      record.perfectSessionCount ?? (record.isPerfect ? sessionCount : 0),
  };
}

export function sessionEntries(record: SessionRecord): SessionEntry[] {
  return record.sessions?.length
    ? record.sessions.map((entry) => ({
        ...entry,
        sessionCount: entry.sessionCount ?? 1,
        perfectSessionCount:
          entry.perfectSessionCount ?? (entry.isPerfect ? 1 : 0),
      }))
    : [legacyEntry(record)];
}

export function aggregateSessionRecord(
  date: string,
  entries: SessionEntry[],
): SessionRecord {
  const unique = new Map<string, SessionEntry>();
  entries.forEach((entry) => {
    const existing = unique.get(entry.id);
    if (!existing || entry.completedAt >= existing.completedAt) {
      unique.set(entry.id, entry);
    }
  });
  const sessions = [...unique.values()].sort((a, b) =>
    a.completedAt.localeCompare(b.completedAt),
  );
  const sessionCount = sessions.reduce(
    (sum, entry) => sum + entry.sessionCount,
    0,
  );
  const perfectSessionCount = sessions.reduce(
    (sum, entry) => sum + entry.perfectSessionCount,
    0,
  );

  return {
    date,
    completedAt: sessions.at(-1)?.completedAt ?? `${date}T00:00:00.000Z`,
    durationSeconds: sessions.reduce(
      (sum, entry) => sum + entry.durationSeconds,
      0,
    ),
    xpEarned: sessions.reduce((sum, entry) => sum + entry.xpEarned, 0),
    surahsReviewed: sessions.reduce(
      (sum, entry) => sum + entry.surahsReviewed,
      0,
    ),
    versesLearned: sessions.reduce(
      (sum, entry) => sum + entry.versesLearned,
      0,
    ),
    isPerfect: sessionCount > 0 && perfectSessionCount === sessionCount,
    sessionCount,
    perfectSessionCount,
    sessions,
  };
}

export function normalizeSessionRecord(record: SessionRecord): SessionRecord {
  return aggregateSessionRecord(record.date, sessionEntries(record));
}

export function appendSessionEntry(
  record: SessionRecord | undefined,
  date: string,
  entry: SessionEntry,
): SessionRecord {
  return aggregateSessionRecord(
    date,
    record ? [...sessionEntries(record), entry] : [entry],
  );
}

export function mergeSessionRecords(
  local: SessionRecord,
  remote: SessionRecord,
): SessionRecord {
  return aggregateSessionRecord(local.date, [
    ...sessionEntries(local),
    ...sessionEntries(remote),
  ]);
}
