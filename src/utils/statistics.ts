import { SessionRecord } from '@/types';
import { addDays, dateKey } from '@/utils/date';
import {
  historyPerfectCount,
  historySessionCount,
} from '@/utils/gamification';

export type ActivityRange = 7 | 30;

export interface ActivityPoint {
  date: string;
  xp: number;
  sessions: number;
  minutes: number;
  perfectSessions: number;
}

export function buildActivitySeries(
  history: SessionRecord[],
  days: ActivityRange,
  now = new Date(),
): ActivityPoint[] {
  const byDate = new Map(history.map((record) => [record.date, record]));

  return Array.from({ length: days }, (_, index) => {
    const date = dateKey(addDays(now, index - days + 1));
    const record = byDate.get(date);
    return {
      date,
      xp: record?.xpEarned ?? 0,
      sessions: record ? historySessionCount(record) : 0,
      minutes: record
        ? Math.max(1, Math.round(record.durationSeconds / 60))
        : 0,
      perfectSessions: record ? historyPerfectCount(record) : 0,
    };
  });
}

export function summarizeActivity(series: ActivityPoint[]) {
  return series.reduce(
    (summary, point) => ({
      activeDays: summary.activeDays + (point.sessions > 0 ? 1 : 0),
      xp: summary.xp + point.xp,
      sessions: summary.sessions + point.sessions,
      minutes: summary.minutes + point.minutes,
      perfectSessions: summary.perfectSessions + point.perfectSessions,
    }),
    {
      activeDays: 0,
      xp: 0,
      sessions: 0,
      minutes: 0,
      perfectSessions: 0,
    },
  );
}
