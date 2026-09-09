/** US Letter at 96dpi. */
export const PAGE_HEIGHT_PX = 1056;

/** Absorbs printer and rasteriser rounding so a hairline overflow never adds a page. */
export const SAFETY_BUFFER_PX = 16;

export const PAGE_BUDGET_PX = PAGE_HEIGHT_PX - SAFETY_BUFFER_PX;

export const MAX_DENSITY_STEP = 4;

/**
 * Walks a density ladder until the rendered CV fits one page, then reports what
 * it took. Measurement and application are injected so the ladder logic can be
 * tested without a DOM.
 */
export function createPageFitter({ measure, applyStep, getLineHeight }) {
  let settledStep = 0;

  function result(step, heightPx, stale = false) {
    const overflowPx = Math.max(0, Math.round(heightPx - PAGE_BUDGET_PX));
    const lineHeight = Math.max(1, getLineHeight());
    return {
      step,
      heightPx,
      budgetPx: PAGE_BUDGET_PX,
      fits: overflowPx === 0,
      overflowPx,
      linesToCut: Math.ceil(overflowPx / lineHeight),
      fillPercent: Math.round((heightPx / PAGE_BUDGET_PX) * 100),
      stale,
    };
  }

  function fit() {
    for (let step = 0; step <= MAX_DENSITY_STEP; step += 1) {
      applyStep(step);
      const heightPx = measure();

      // A detached or unpainted layout measures as 0. Snapping to step 0 here
      // would flash the document at full size, so hold the last good step.
      if (!Number.isFinite(heightPx) || heightPx <= 0) {
        applyStep(settledStep);
        return result(settledStep, PAGE_BUDGET_PX, true);
      }

      if (heightPx <= PAGE_BUDGET_PX || step === MAX_DENSITY_STEP) {
        settledStep = step;
        return result(step, heightPx);
      }
    }

    // Unreachable: the loop always returns at MAX_DENSITY_STEP.
    return result(settledStep, PAGE_BUDGET_PX, true);
  }

  return {
    fit,
    get step() {
      return settledStep;
    },
  };
}
