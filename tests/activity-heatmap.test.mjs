import assert from 'node:assert/strict';
import test from 'node:test';

import {
  addDays,
  calendarGrid,
  compact,
  full,
  levelOf,
  monthLabels,
  quantileCuts,
} from '../src/scripts/activity/heatmap.js';

test('steps dates in UTC so the grid never shifts by a day', () => {
  assert.equal(addDays('2026-09-03', 1), '2026-09-04');
  assert.equal(addDays('2026-01-01', -1), '2025-12-31');
  assert.equal(addDays('2026-03-01', -1), '2026-02-28');
});

test('builds columns of seven days, ragged at both ends', () => {
  const grid = calendarGrid('2026-09-03');
  assert.ok(grid.length >= 53 && grid.length <= 54);
  for (const column of grid) assert.equal(column.length, 7);

  const dates = grid.flat().filter(Boolean);
  assert.equal(dates[0], addDays('2026-09-03', -364));
  assert.equal(dates[dates.length - 1], '2026-09-03');
  assert.equal(dates.length, 365);
});

// Daily totals are heavily right-skewed, so a linear ramp would collapse
// almost every day into the palest band.
test('takes band thresholds from the percentiles of active days only', () => {
  assert.deepEqual(quantileCuts([0, 0, 0, 0]), [1, 2, 3]);
  const values = Array.from({ length: 100 }, (_, i) => i + 1);
  assert.deepEqual(quantileCuts([...values, 0, 0]), [51, 76, 93]);
});

test('maps a value onto its band', () => {
  const cuts = [10, 20, 30];
  assert.equal(levelOf(0, cuts), 0);
  assert.equal(levelOf(1, cuts), 1);
  assert.equal(levelOf(10, cuts), 2);
  assert.equal(levelOf(25, cuts), 3);
  assert.equal(levelOf(30, cuts), 4);
});

test('labels only the column whose week opens a month', () => {
  const labels = monthLabels(calendarGrid('2026-09-03'));
  assert.equal(labels.length, 12);
  // The window opens on 2025-09-05, early enough in the month to be labelled.
  assert.equal(labels[0].label, 'Sep');
  // The final column opens on Aug 30, so it belongs to August. A trailing
  // partial month is deliberately not labelled rather than drifting a label
  // into the middle of a week.
  assert.equal(labels[labels.length - 1].label, 'Aug');
  const columns = labels.map((l) => l.col);
  assert.deepEqual(columns, [...columns].sort((a, b) => a - b));
});

test('formats numbers compactly and in full', () => {
  assert.equal(compact(999), '999');
  assert.equal(compact(1500), '1.5K');
  assert.equal(compact(7_244_706_966), '7.24B');
  assert.equal(full(7_244_706_966), '7,244,706,966');
});
