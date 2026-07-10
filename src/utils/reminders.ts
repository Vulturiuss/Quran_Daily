import { addDays, dateKey } from './date';

export type ReminderKind = 'daily' | 'streak';

export interface ReminderPlanItem {
  id: string;
  kind: ReminderKind;
  date: Date;
  title: string;
  body: string;
}

interface ReminderPlanInput {
  time: string;
  currentStreak: number;
  completedDates: readonly string[];
  now?: Date;
  days?: number;
}

export const REMINDER_ID_PREFIX = 'quran-daily:';

const dailyMessages = [
  'Cinq minutes pour réciter, apprendre et garder ton élan.',
  'Un verset à la fois. Ta session du jour est prête.',
  'Hier tu as avancé. Aujourd’hui aussi, quelques minutes suffisent.',
  'Retrouve tes sourates et consolide ce que tu as appris.',
  'Ton rendez-vous quotidien avec le Coran t’attend.',
];

function parseTime(time: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(time);
  const hour = match ? Number(match[1]) : 20;
  const minute = match ? Number(match[2]) : 0;
  return {
    hour: hour >= 0 && hour <= 23 ? hour : 20,
    minute: minute >= 0 && minute <= 59 ? minute : 0,
  };
}

function atLocalTime(day: Date, hour: number, minute: number) {
  const result = new Date(day);
  result.setHours(hour, minute, 0, 0);
  return result;
}

function messageForDate(key: string) {
  const seed = [...key].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return dailyMessages[seed % dailyMessages.length];
}

function streakBody(currentStreak: number, isToday: boolean) {
  if (isToday && currentStreak > 0) {
    return `Ton streak de ${currentStreak} jour${currentStreak > 1 ? 's' : ''} se joue ce soir. Il reste deux heures pour faire ta session.`;
  }
  return 'Il reste deux heures pour valider ta session du jour et protéger ta régularité.';
}

export function buildReminderPlan({
  time,
  currentStreak,
  completedDates,
  now = new Date(),
  days = 14,
}: ReminderPlanInput): ReminderPlanItem[] {
  const completed = new Set(completedDates);
  const { hour, minute } = parseTime(time);
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const plan: ReminderPlanItem[] = [];

  for (let offset = 0; offset < days; offset += 1) {
    const day = addDays(start, offset);
    const key = dateKey(day);
    if (completed.has(key)) continue;

    const dailyDate = atLocalTime(day, hour, minute);
    const streakDate = atLocalTime(day, 22, 0);
    const hasStreakAlert = currentStreak > 0 && streakDate.getTime() > now.getTime();
    const sameTimeAsStreak = hour === 22 && minute === 0;

    if (dailyDate.getTime() > now.getTime() && !(hasStreakAlert && sameTimeAsStreak)) {
      plan.push({
        id: `${REMINDER_ID_PREFIX}daily:${key}`,
        kind: 'daily',
        date: dailyDate,
        title: 'Ta session du jour t’attend',
        body: messageForDate(key),
      });
    }

    if (hasStreakAlert) {
      plan.push({
        id: `${REMINDER_ID_PREFIX}streak:${key}`,
        kind: 'streak',
        date: streakDate,
        title: 'Protège ton streak avant minuit',
        body: streakBody(currentStreak, offset === 0),
      });
    }
  }

  return plan.sort((a, b) => a.date.getTime() - b.date.getTime());
}
