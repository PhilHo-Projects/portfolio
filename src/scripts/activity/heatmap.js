/**
 * Calendar and formatting maths for the activity heatmap. Ported from
 * TokenTracker's web/src/lib/calendar.ts and format.ts, and verified against
 * the same fixtures in tests/activity-heatmap.test.mjs.
 */

export const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/**
 * Dates are plain YYYY-MM-DD strings and all arithmetic runs in UTC, so a
 * viewer behind UTC never sees the grid shift by a day.
 *
 * @param {string} date
 * @returns {Date}
 */
function parseUTC(date) {
  return new Date(`${date}T00:00:00Z`);
}

/**
 * @param {string} date
 * @param {number} n
 * @returns {string}
 */
export function addDays(date, n) {
  const d = parseUTC(date);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * Columns of seven days ending on `end`, each column starting on a Sunday.
 * Days outside the rolling 365-day window are null, so the first and last
 * weeks render ragged rather than silently widening the range.
 *
 * @param {string} end
 * @returns {(string | null)[][]}
 */
export function calendarGrid(end) {
  const first = addDays(end, -364);
  const start = addDays(first, -parseUTC(first).getUTCDay());
  const cols = [];
  let cursor = start;
  while (cursor <= end) {
    const col = [];
    for (let i = 0; i < 7; i++) {
      const d = addDays(cursor, i);
      col.push(d >= first && d <= end ? d : null);
    }
    cols.push(col);
    cursor = addDays(cursor, 7);
  }
  return cols;
}

/**
 * Thresholds for the four activity bands, from the percentiles of active days
 * only. Daily totals are heavily right-skewed — the busiest day can be twenty
 * times the median — so a linear ramp would collapse almost every day into the
 * palest colour.
 *
 * @param {number[]} values
 * @returns {[number, number, number]}
 */
export function quantileCuts(values) {
  const active = values.filter((v) => v > 0).sort((a, b) => a - b);
  if (active.length === 0) return [1, 2, 3];
  const at = (p) => active[Math.min(active.length - 1, Math.floor(active.length * p))];
  return [at(0.5), at(0.75), at(0.92)];
}

/**
 * @param {number} value
 * @param {[number, number, number]} cuts
 * @returns {0 | 1 | 2 | 3 | 4}
 */
export function levelOf(value, cuts) {
  if (value <= 0) return 0;
  if (value < cuts[0]) return 1;
  if (value < cuts[1]) return 2;
  if (value < cuts[2]) return 3;
  return 4;
}

/**
 * @param {(string | null)[][]} grid
 * @returns {{ col: number, label: string }[]}
 */
export function monthLabels(grid) {
  const out = [];
  let seen = '';
  grid.forEach((col, i) => {
    const first = col.find((d) => d !== null);
    if (!first) return;
    const month = first.slice(0, 7);
    // Only label a column whose week actually opens the month, so the label
    // sits above the right place rather than drifting into mid-month.
    if (month === seen || Number(first.slice(8)) > 7) return;
    seen = month;
    out.push({ col: i, label: MONTHS[Number(month.slice(5, 7)) - 1] });
  });
  return out;
}

/**
 * 1_234_567 -> "1.23M". Used wherever space is tight.
 *
 * @param {number} n
 * @returns {string}
 */
export function compact(n) {
  const abs = Math.abs(n);
  if (abs >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(Math.round(n));
}

/**
 * 1234567 -> "1,234,567". Used where the exact figure matters.
 *
 * @param {number} n
 * @returns {string}
 */
export function full(n) {
  return Math.round(n).toLocaleString('en-US');
}
