import assert from 'node:assert/strict';
import test from 'node:test';

import {
  addDays,
  dateKey,
  dayDifference,
  monthKey,
  weekStartKey,
} from './date';

test('dateKey formats the local date, zero-padded', () => {
  assert.equal(dateKey(new Date(2026, 0, 5)), '2026-01-05');
  assert.equal(dateKey(new Date(2026, 11, 31)), '2026-12-31');
});

test('addDays rolls over months and years, and goes backwards', () => {
  assert.equal(dateKey(addDays(new Date(2026, 0, 31), 1)), '2026-02-01');
  assert.equal(dateKey(addDays(new Date(2026, 11, 31), 1)), '2027-01-01');
  assert.equal(dateKey(addDays(new Date(2026, 0, 1), -1)), '2025-12-31');
});

test('dayDifference counts whole days and is signed', () => {
  assert.equal(dayDifference('2026-01-01', '2026-01-03'), 2);
  assert.equal(dayDifference('2026-01-03', '2026-01-01'), -2);
  assert.equal(dayDifference('2026-01-01', '2026-01-01'), 0);
});

test('dayDifference stays exact across DST boundaries (noon-anchored)', () => {
  // Spring-forward (23h) and fall-back (25h) days: consecutive dates are still 1.
  assert.equal(dayDifference('2026-03-28', '2026-03-29'), 1);
  assert.equal(dayDifference('2026-10-24', '2026-10-25'), 1);
});

test('weekStartKey anchors to Monday, including the Sunday edge', () => {
  // 2026-01-05 is a Monday, -07 a Wednesday, -04 the Sunday before.
  assert.equal(weekStartKey(new Date(2026, 0, 7)), '2026-01-05');
  assert.equal(weekStartKey(new Date(2026, 0, 5)), '2026-01-05');
  assert.equal(weekStartKey(new Date(2026, 0, 4)), '2025-12-29');
});

test('monthKey is the year-month prefix', () => {
  assert.equal(monthKey(new Date(2026, 0, 15)), '2026-01');
  assert.equal(monthKey(new Date(2026, 11, 1)), '2026-12');
});
