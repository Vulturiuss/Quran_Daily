import assert from 'node:assert/strict';
import test from 'node:test';

import { buildReminderPlan } from './reminders';

test('builds daily and streak reminders for an unfinished day', () => {
  const plan = buildReminderPlan({
    time: '20:00',
    currentStreak: 4,
    completedDates: [],
    now: new Date(2026, 5, 15, 10, 0),
    days: 1,
  });

  assert.deepEqual(
    plan.map((item) => [item.kind, item.date.getHours()]),
    [
      ['daily', 20],
      ['streak', 22],
    ],
  );
  assert.match(plan[1].body, /4 jours/);
});

test('does not schedule reminders for a completed date', () => {
  const plan = buildReminderPlan({
    time: '20:00',
    currentStreak: 4,
    completedDates: ['2026-06-15'],
    now: new Date(2026, 5, 15, 10, 0),
    days: 1,
  });

  assert.equal(plan.length, 0);
});

test('does not recreate a daily reminder after its time has passed', () => {
  const plan = buildReminderPlan({
    time: '20:00',
    currentStreak: 2,
    completedDates: [],
    now: new Date(2026, 5, 15, 21, 0),
    days: 1,
  });

  assert.deepEqual(plan.map((item) => item.kind), ['streak']);
});

test('avoids duplicate notifications when the daily time is 22:00', () => {
  const plan = buildReminderPlan({
    time: '22:00',
    currentStreak: 1,
    completedDates: [],
    now: new Date(2026, 5, 15, 10, 0),
    days: 1,
  });

  assert.equal(plan.length, 1);
  assert.equal(plan[0].kind, 'streak');
});
