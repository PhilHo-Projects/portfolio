import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MAX_DENSITY_STEP,
  PAGE_BUDGET_PX,
  createPageFitter,
} from '../src/scripts/resume/page-fit.js';

// heights[step] is the measured height once that step has been applied.
function makeFitter(heights, lineHeight = 21) {
  const applied = [];
  let current = 0;
  const fitter = createPageFitter({
    measure: () => heights[current],
    applyStep: (step) => {
      current = step;
      applied.push(step);
    },
    getLineHeight: () => lineHeight,
  });
  return { fitter, applied };
}

test('stays at step 0 when the content already fits', () => {
  const { fitter, applied } = makeFitter([1000, 900, 850, 800, 750]);
  const result = fitter.fit();
  assert.equal(result.step, 0);
  assert.equal(result.fits, true);
  assert.equal(result.overflowPx, 0);
  assert.equal(result.linesToCut, 0);
  assert.equal(result.budgetPx, PAGE_BUDGET_PX);
  assert.deepEqual(applied, [0]);
});

test('advances to the lowest step that fits', () => {
  const { fitter, applied } = makeFitter([1200, 1100, 1030, 980, 940]);
  const result = fitter.fit();
  assert.equal(result.step, 2);
  assert.equal(result.fits, true);
  assert.equal(result.heightPx, 1030);
  assert.deepEqual(applied, [0, 1, 2]);
});

test('reports the shortfall when even the last step overflows', () => {
  const { fitter } = makeFitter([1400, 1300, 1250, 1150, 1103], 21);
  const result = fitter.fit();
  assert.equal(result.step, MAX_DENSITY_STEP);
  assert.equal(result.fits, false);
  assert.equal(result.overflowPx, 63);
  assert.equal(result.linesToCut, 3);
});

test('reports fill as a percentage of budget at the settled step', () => {
  const { fitter } = makeFitter([1200, 1100, 1090, 1080, PAGE_BUDGET_PX * 1.06]);
  const result = fitter.fit();
  assert.equal(result.fillPercent, 106);
});

test('holds the previous step when measurement is unusable', () => {
  const { fitter } = makeFitter([1200, 1100, 1030, 980, 940]);
  fitter.fit();
  assert.equal(fitter.step, 2);

  const stale = createPageFitter({
    measure: () => 0,
    applyStep: () => {},
    getLineHeight: () => 21,
  });
  const result = stale.fit();
  assert.equal(result.stale, true);
  assert.equal(result.step, 0);
});

test('never returns a step above the ladder maximum', () => {
  const { fitter } = makeFitter([9000, 9000, 9000, 9000, 9000]);
  assert.equal(fitter.fit().step, MAX_DENSITY_STEP);
});

test('a settled fitter keeps its step for the next unusable measurement', () => {
  let heights = [1200, 1100, 1030, 980, 940];
  let current = 0;
  const fitter = createPageFitter({
    measure: () => heights[current],
    applyStep: (step) => { current = step; },
    getLineHeight: () => 21,
  });
  assert.equal(fitter.fit().step, 2);
  heights = [0, 0, 0, 0, 0];
  const result = fitter.fit();
  assert.equal(result.stale, true);
  assert.equal(result.step, 2);
  assert.equal(fitter.step, 2);
});
