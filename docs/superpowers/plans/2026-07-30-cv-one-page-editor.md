# CV One-Page Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Guarantee every CV version prints to exactly one Letter page, give the editor add/delete of jobs, bullets, projects, schools and sidebar sections, and fix the toolbar and dialog defects.

**Architecture:** A pure `page-fit.js` engine walks a five-step density ladder, applying `data-density` to `.container` until measured content fits a 1040px budget; all sizing lives in CSS behind three custom properties. Structural add/delete lives on the existing resume controller because it alone holds both `en` and `fr` data and must keep them index-parallel. The toolbar splits into two rows so the view controls and edit controls never compete for width.

**Tech Stack:** Astro 7, TypeScript, vanilla DOM, Express 5 API, `node:test` (zero external test dependencies).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-30-cv-one-page-editor-design.md`.
- Page budget is exactly **1040px** = 1056px (Letter @96dpi) − 16px safety buffer.
- Density ladder is exactly **5 steps, 0–4**; font scale floor is **0.92**.
- Every structural add/delete MUST apply to **both `en` and `fr` at the same index**.
- New pure modules MUST be plain `.js` with a sibling `.d.ts`, matching `resume-controller.js`, so `node:test` can import them directly without a build step.
- Do **not** add any npm dependency. `npm test` must stay dependency-free.
- All existing element ids in `src/pages/resume.astro` MUST be preserved — `tests/resume-page-contract.test.mjs` asserts each one.
- Print CSS must keep `#resume-body .container { grid-template-columns: 31% 69%; }` and must keep mentioning `#resume-toolbar`, `dialog`, `#editor-actions` and `.editable-highlight`; the contract test asserts all of these.
- Run the full suite with `npm test` before every commit.

---

### Task 1: Fix the Cancel button in both dialogs

The Cancel buttons are `<button type="submit" formmethod="dialog">` inside forms whose inputs are `required`. `formmethod="dialog"` does not bypass constraint validation, so with an empty field the browser blocks submission and the dialog never closes.

**Files:**
- Modify: `src/pages/resume.astro:65` and `src/pages/resume.astro:78`
- Modify: `src/scripts/resume/main.ts`
- Test: `tests/resume-page-contract.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces: a `[data-dialog-close]` attribute convention used by any future dialog.

- [ ] **Step 1: Write the failing test**

Append to `tests/resume-page-contract.test.mjs`:

```js
test('closes dialogs from Cancel without tripping form validation', () => {
  // formmethod="dialog" does not bypass constraint validation, so a required
  // input would block Cancel. Both cancels must be plain buttons instead.
  assert.doesNotMatch(html, /formmethod="dialog"/);
  const loginDialog = html.match(/<dialog[^>]+id="editor-login-dialog"[\s\S]*?<\/dialog>/)?.[0] ?? '';
  const nameDialog = html.match(/<dialog[^>]+id="cv-name-dialog"[\s\S]*?<\/dialog>/)?.[0] ?? '';
  for (const dialog of [loginDialog, nameDialog]) {
    assert.match(dialog, /<button[^>]+type="button"[^>]+data-dialog-close/);
  }
  assert.match(resumeMain, /data-dialog-close/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --test-name-pattern="closes dialogs from Cancel"`
Expected: FAIL — `formmethod="dialog"` is still present in the built HTML.

- [ ] **Step 3: Replace both Cancel buttons**

In `src/pages/resume.astro`, replace the login dialog Cancel (line 65):

```html
                <button type="button" data-dialog-close>Cancel</button>
```

and the name dialog Cancel (line 78) with the identical markup:

```html
                <button type="button" data-dialog-close>Cancel</button>
```

Leave the history and discard dialogs alone — their `method="dialog"` forms contain no required inputs and work correctly.

- [ ] **Step 4: Wire the delegated close handler**

In `src/scripts/resume/main.ts`, immediately after the `showModal` function definition (around line 70), add:

```ts
function resetDialog(dialog: HTMLDialogElement): void {
    dialog.querySelectorAll<HTMLElement>('.dialog-error').forEach((element) => {
        element.textContent = '';
    });
    dialog.querySelectorAll<HTMLInputElement>('input').forEach((input) => {
        input.value = '';
    });
}

for (const dialog of [loginDialog, nameDialog, historyDialog, discardDialog]) {
    dialog.addEventListener('click', (event) => {
        const target = event.target;
        if (target instanceof HTMLElement && target.closest('[data-dialog-close]')) {
            dialog.close('cancel');
        }
    });
    dialog.addEventListener('close', () => resetDialog(dialog));
}
```

- [ ] **Step 5: Run the full suite**

Run: `npm test`
Expected: PASS, all tests.

- [ ] **Step 6: Verify by hand**

Run `npm run dev`, open `http://localhost:4321/resume`, click **Edit**, then click **Cancel** without typing a password.
Expected: the dialog closes immediately with no "Please fill out this field" tooltip.

- [ ] **Step 7: Commit**

```bash
git add src/pages/resume.astro src/scripts/resume/main.ts tests/resume-page-contract.test.mjs
git commit -m "fix: close CV dialogs from Cancel without form validation"
```

---

### Task 2: Two-row toolbar, uniform colours, centred social icons

**Files:**
- Modify: `src/pages/resume.astro:23-54`
- Modify: `src/styles/resume.css`
- Test: `tests/resume-page-contract.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces: `.toolbar-row-view` and `.toolbar-row-edit` containers; `#editor-actions` keeps its id and `hidden` attribute and becomes the edit row itself.

- [ ] **Step 1: Write the failing test**

Append to `tests/resume-page-contract.test.mjs`:

```js
test('splits the toolbar into a view row and an edit row', () => {
  assert.match(html, /class="toolbar-row toolbar-row-view"/);
  assert.match(html, /id="editor-actions"[^>]+class="toolbar-row toolbar-row-edit"[^>]+hidden/);
  // The edit controls must not sit inside the view row's action group.
  const viewRow = html.match(/<div class="toolbar-row toolbar-row-view">[\s\S]*?<\/div>\s*<div[^>]+id="editor-actions"/)?.[0] ?? '';
  assert.doesNotMatch(viewRow, /id="save-cv"/);
});

test('renders the toolbar uniformly white on black', () => {
  // #resume-body a has ID specificity and beats a bare .toolbar-link rule.
  assert.match(css, /#resume-body \.toolbar-link\s*\{[^}]*color:\s*#f4f6f8/);
});

test('centres the sidebar social icons', () => {
  assert.match(css, /\.social-row\s*\{[^}]*justify-content:\s*center/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --test-name-pattern="toolbar|social icons"`
Expected: FAIL — no `toolbar-row-view` in the built HTML.

- [ ] **Step 3: Restructure the toolbar markup**

In `src/pages/resume.astro`, replace lines 23–54 (the whole `<header id="resume-toolbar">` block) with:

```html
    <header id="resume-toolbar" class="resume-toolbar">
        <div class="toolbar-row toolbar-row-view">
            <div class="resume-toolbar-primary">
                <a id="portfolio-link" class="toolbar-link" href="/#projects">
                    <i class="fas fa-arrow-left" aria-hidden="true"></i>
                    Portfolio
                </a>
                <label class="cv-selector-label" for="cv-select">
                    <span>CV version</span>
                    <select id="cv-select" aria-label="CV version"></select>
                </label>
            </div>
            <div class="resume-toolbar-actions">
                <button id="lang-toggle" type="button">FR</button>
                <button id="print-resume" type="button">
                    <i class="fas fa-print" aria-hidden="true"></i>
                    Print / PDF
                </button>
                <button id="edit-toggle" type="button">
                    <i class="fas fa-pen" aria-hidden="true"></i>
                    Edit
                </button>
            </div>
        </div>
        <div id="editor-actions" class="toolbar-row toolbar-row-edit" hidden>
            <div id="page-fit-gauge" class="page-fit-gauge" role="progressbar" aria-label="Page fill"
                aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
                <div class="page-fit-bar"><span id="page-fit-fill" class="page-fit-fill"></span></div>
                <p id="page-fit-label" class="page-fit-label"></p>
            </div>
            <div class="editor-action-buttons">
                <button id="rename-cv" type="button">Rename</button>
                <button id="duplicate-cv" type="button">Duplicate</button>
                <button id="new-blank-cv" type="button">New Blank</button>
                <button id="save-cv" type="button">Save</button>
                <button id="history-cv" type="button">History</button>
                <button id="exit-edit" type="button">Exit editing</button>
            </div>
        </div>
        <p id="resume-status" role="status" aria-live="polite"></p>
    </header>
```

- [ ] **Step 4: Restructure the toolbar CSS**

In `src/styles/resume.css`, replace the `.resume-toolbar` rule (lines 94–108) with:

```css
.resume-toolbar {
    position: sticky;
    top: 0;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: 100%;
    margin: 0;
    padding: 0.625rem max(0.75rem, calc((100vw - 8.5in) / 2));
    background: #17191d;
    border-bottom: 1px solid #343841;
    box-shadow: 0 0.25rem 1rem rgba(0, 0, 0, 0.22);
}

.toolbar-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    width: 100%;
}

.toolbar-row-edit {
    padding-top: 0.5rem;
    border-top: 1px solid #343841;
}

.editor-action-buttons {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
    justify-content: flex-end;
}
```

Then replace the `.resume-toolbar-primary, .resume-toolbar-actions, #editor-actions` rule (lines 110–116) with:

```css
.resume-toolbar-primary,
.resume-toolbar-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}
```

- [ ] **Step 5: Make the toolbar uniformly white on black**

In `src/styles/resume.css`, immediately after the `.toolbar-link { text-decoration: none; }` rule (around line 147), add:

```css
/* #resume-body a wins on ID specificity, so the link needs the same weight. */
#resume-body .toolbar-link {
    color: #f4f6f8;
}
```

and change `.cv-selector-label`'s `color: #d7dbe2;` (line 174) to:

```css
    color: #f4f6f8;
```

- [ ] **Step 6: Centre the social icons**

In `src/styles/resume.css`, replace the `.social-row` rule (lines 343–347) with:

```css
.social-row {
    display: flex;
    justify-content: center;
    gap: 0.75rem;
    margin-top: 0.5rem;
}
```

- [ ] **Step 7: Update the mobile rules**

In `src/styles/resume.css`, inside `@media screen and (max-width: 640px)`, replace the `#editor-actions` and `#editor-actions button` rules (lines 589–596) with:

```css
    .toolbar-row {
        flex-direction: column;
        align-items: stretch;
        gap: 0.5rem;
    }

    .editor-action-buttons button {
        flex: 1 1 calc(33.333% - 0.5rem);
    }
```

- [ ] **Step 8: Run the full suite**

Run: `npm test`
Expected: PASS, all tests including the pre-existing id assertions.

- [ ] **Step 9: Verify by hand**

Run `npm run dev`, open the resume, confirm the Portfolio link is white not blue and the social icons are centred. Unlock editing with `0000` and confirm the six edit buttons sit on their own row with no overlap.

- [ ] **Step 10: Commit**

```bash
git add src/pages/resume.astro src/styles/resume.css tests/resume-page-contract.test.mjs
git commit -m "fix: split CV toolbar into view and edit rows with uniform styling"
```

---

### Task 3: Page-fit engine

**Files:**
- Create: `src/scripts/resume/page-fit.js`
- Create: `src/scripts/resume/page-fit.d.ts`
- Test: `tests/resume-page-fit.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `PAGE_HEIGHT_PX = 1056`, `SAFETY_BUFFER_PX = 16`, `PAGE_BUDGET_PX = 1040`, `MAX_DENSITY_STEP = 4`
  - `createPageFitter({ measure, applyStep, getLineHeight }) => { fit(): PageFitResult, readonly step: number }`
  - `PageFitResult = { step, heightPx, budgetPx, fits, overflowPx, linesToCut, fillPercent, stale }`

- [ ] **Step 1: Write the failing test**

Create `tests/resume-page-fit.test.mjs`:

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MAX_DENSITY_STEP,
  PAGE_BUDGET_PX,
  createPageFitter,
} from '../src/scripts/resume/page-fit.js';

// heights[step] is the measured height once that step is applied.
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
  assert.equal(result.linesToCut, 3); // ceil(63 / 21)
});

test('reports fill as a percentage of budget at the settled step', () => {
  const { fitter } = makeFitter([1200, 1100, 1090, 1080, 1040 * 1.06]);
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/resume-page-fit.test.mjs`
Expected: FAIL — cannot find module `page-fit.js`.

- [ ] **Step 3: Write the implementation**

Create `src/scripts/resume/page-fit.js`:

```js
/** US Letter at 96dpi. */
export const PAGE_HEIGHT_PX = 1056;

/** Absorbs printer and rasteriser rounding so a hairline overflow never adds a page. */
export const SAFETY_BUFFER_PX = 16;

export const PAGE_BUDGET_PX = PAGE_HEIGHT_PX - SAFETY_BUFFER_PX;

export const MAX_DENSITY_STEP = 4;

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
```

- [ ] **Step 4: Write the type declarations**

Create `src/scripts/resume/page-fit.d.ts`:

```ts
export declare const PAGE_HEIGHT_PX: 1056;
export declare const SAFETY_BUFFER_PX: 16;
export declare const PAGE_BUDGET_PX: 1040;
export declare const MAX_DENSITY_STEP: 4;

export type PageFitResult = {
    step: number;
    heightPx: number;
    budgetPx: number;
    fits: boolean;
    overflowPx: number;
    linesToCut: number;
    fillPercent: number;
    stale: boolean;
};

export type PageFitter = {
    fit(): PageFitResult;
    readonly step: number;
};

export declare function createPageFitter(options: {
    measure(): number;
    applyStep(step: number): void;
    getLineHeight(): number;
}): PageFitter;
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `node --test tests/resume-page-fit.test.mjs`
Expected: PASS, 6 tests.

- [ ] **Step 6: Commit**

```bash
git add src/scripts/resume/page-fit.js src/scripts/resume/page-fit.d.ts tests/resume-page-fit.test.mjs
git commit -m "feat: add one-page fit engine with bounded density ladder"
```

---

### Task 4: Density CSS ladder and live wiring

**Files:**
- Modify: `src/styles/resume.css`
- Modify: `src/scripts/resume/main.ts`
- Test: `tests/resume-page-contract.test.mjs`

**Interfaces:**
- Consumes: `createPageFitter`, `PAGE_BUDGET_PX` from Task 3.
- Produces: `data-density="0..4"` on `.container`; CSS custom properties `--fit-space`, `--fit-leading`, `--fit-scale`; a module-level `runPageFit()` in `main.ts` that later tasks call.

- [ ] **Step 1: Write the failing test**

Append to `tests/resume-page-contract.test.mjs`:

```js
test('defines a five-step density ladder down to a 0.92 type floor', () => {
  for (const step of [1, 2, 3, 4]) {
    assert.match(css, new RegExp(`\\[data-density="${step}"\\]`));
  }
  assert.match(css, /--fit-scale:\s*0\.92/);
  assert.doesNotMatch(css, /\[data-density="5"\]/);
  // Sizing must flow through the custom properties, not hardcoded overrides.
  assert.match(css, /font-size:\s*calc\([^)]*var\(--fit-scale\)/);
  assert.match(css, /line-height:\s*var\(--fit-leading\)/);
});

test('runs the page fitter from the resume entry point', () => {
  assert.match(resumeMain, /createPageFitter/);
  assert.match(resumeMain, /data-density/);
  assert.match(resumeMain, /document\.fonts/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --test-name-pattern="density ladder|page fitter"`
Expected: FAIL — no `[data-density]` rules in the stylesheet.

- [ ] **Step 3: Add the density ladder to the stylesheet**

In `src/styles/resume.css`, immediately after the `:root { ... }` block (after line 41), add:

```css
/* ============================================
   ONE-PAGE DENSITY LADDER
   Step 0 is the designed density. Each step trades a little air, then a
   little type size, for vertical room. Type never goes below 92%.
   ============================================ */
#resume-body .container {
    --fit-space: 1;
    --fit-leading: 1.5;
    --fit-scale: 1;
}

#resume-body .container[data-density="1"] {
    --fit-space: 0.78;
    --fit-leading: 1.42;
    --fit-scale: 1;
}

#resume-body .container[data-density="2"] {
    --fit-space: 0.78;
    --fit-leading: 1.42;
    --fit-scale: 0.96;
}

#resume-body .container[data-density="3"] {
    --fit-space: 0.6;
    --fit-leading: 1.35;
    --fit-scale: 0.96;
}

#resume-body .container[data-density="4"] {
    --fit-space: 0.6;
    --fit-leading: 1.32;
    --fit-scale: 0.92;
}
```

- [ ] **Step 4: Route sizing through the custom properties**

In `src/styles/resume.css`, make these replacements.

Replace the shared line-height in the `#resume-body, #resume-body h1, ...` rule (line 70) — change `line-height: var(--line-height-base);` to:

```css
    line-height: var(--fit-leading, var(--line-height-base));
```

Replace `#resume-body section` (lines 434–437):

```css
#resume-body section {
    margin-bottom: calc(0.5rem * var(--fit-space));
    page-break-inside: avoid;
}
```

Replace `#resume-body section h2` (lines 440–447):

```css
#resume-body section h2 {
    font-size: calc(1.25rem * var(--fit-scale));
    color: var(--accent-primary);
    border-bottom: 3px solid var(--border-color);
    padding-bottom: 0.25rem;
    margin-bottom: calc(0.8rem * var(--fit-space));
    font-weight: 700;
}
```

Replace `#resume-body .job, #resume-body .project, #resume-body .school` (lines 453–458):

```css
#resume-body .job,
#resume-body .project,
#resume-body .school {
    margin-bottom: calc(1rem * var(--fit-space));
    page-break-inside: avoid;
}
```

Replace `#resume-body h3` (lines 461–466):

```css
#resume-body h3 {
    font-size: calc(1.05rem * var(--fit-scale));
    color: var(--text-primary);
    margin-bottom: 2px;
    font-weight: 700;
}
```

Replace `#resume-body ul` (lines 468–472):

```css
#resume-body ul {
    padding-left: 1.5rem;
    margin-bottom: calc(0.5rem * var(--fit-space));
    list-style-type: disc;
}
```

Replace `#resume-body li` (lines 474–476):

```css
#resume-body li {
    margin-bottom: calc(4px * var(--fit-space));
}
```

Replace `#resume-body p, #resume-body li` (lines 512–515):

```css
#resume-body p,
#resume-body li {
    font-size: calc(0.9rem * var(--fit-scale));
}
```

Replace `.sidebar-section` (lines 375–378):

```css
.sidebar-section {
    margin-bottom: calc(var(--spacing-lg) * var(--fit-space));
    page-break-inside: avoid;
}
```

Replace `#resume-body .sidebar-section h2` (lines 381–388):

```css
#resume-body .sidebar-section h2 {
    font-size: calc(0.95rem * var(--fit-scale));
    margin-bottom: calc(0.625rem * var(--fit-space));
    color: var(--sidebar-text-muted);
    border-bottom: 2px solid var(--accent-primary);
    padding-bottom: var(--spacing-sm);
    font-weight: 700;
}
```

Replace `.contact-info p` (lines 330–335):

```css
.contact-info p {
    margin-bottom: calc(0.625rem * var(--fit-space));
    display: flex;
    align-items: center;
    overflow-wrap: anywhere;
}
```

Replace `.profile-img` (lines 306–314):

```css
.profile-img {
    width: calc(125px * var(--fit-scale));
    aspect-ratio: 1 / 1;
    border-radius: 50%;
    overflow: hidden;
    margin: 0 auto calc(var(--spacing-lg) * var(--fit-space));
    border: 3px solid white;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}
```

- [ ] **Step 5: Unify screen and print column padding**

The fitter measures the live screen layout, but the PDF renders under `@media print`.
Today those disagree: `.content` is `1.25rem` on screen and `1.5rem 2.5rem` in print. The
narrower print column rewraps body text into more lines, so a screen measurement would
underestimate print height and the gauge would promise fits the PDF does not deliver. Make the
two identical so the measurement is valid and the screen is a true preview.

In `src/styles/resume.css`, replace `#resume-body .content` (lines 428–431) with:

```css
/* Must match the @media print padding exactly: the page fitter measures the
   screen layout to predict the printed page, and different horizontal padding
   would rewrap the text and change the height. */
#resume-body .content {
    padding: 1.5rem 2.5rem;
    min-height: 100%;
}
```

and replace `#resume-body .sidebar` (lines 275–280) with:

```css
#resume-body .sidebar {
    background-color: var(--sidebar-bg);
    color: var(--sidebar-text);
    padding: 1.5rem 1rem;
    min-height: 100%;
}
```

Then, in `@media print`, delete the now-redundant `padding` declarations from
`#resume-body .sidebar` and `#resume-body .content` so the values cannot drift apart again.
Leave the mobile overrides inside the `max-width: 768px` and `max-width: 640px` blocks alone —
those layouts never print.

- [ ] **Step 6: Wire the fitter into the entry point**

In `src/scripts/resume/main.ts`, add to the imports at the top:

```ts
import { createPageFitter } from './page-fit';
import type { PageFitResult } from './page-fit';
```

Then add, after the `const editor = new Editor();` line (around line 59):

```ts
const resumeContent = requiredElement<HTMLElement>('resume-content');

/**
 * The grid stretches both columns to the taller row, so scrollHeight reports
 * the stretched height for both and cannot be used. Measure the union of each
 * column's children instead.
 */
function columnHeight(column: Element | null): number {
    if (!column) return 0;
    const children = [...column.children].filter((child) => child.getClientRects().length > 0);
    if (children.length === 0) return 0;
    const top = Math.min(...children.map((child) => child.getBoundingClientRect().top));
    const bottom = Math.max(...children.map((child) => child.getBoundingClientRect().bottom));
    const styles = getComputedStyle(column);
    return (bottom - top) + parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom);
}

const pageFitter = createPageFitter({
    measure: () => Math.max(
        columnHeight(resumeContent.querySelector('.content')),
        columnHeight(resumeContent.querySelector('.sidebar')),
    ),
    applyStep: (step: number) => {
        resumeContent.dataset.density = String(step);
    },
    getLineHeight: () => {
        const sample = resumeContent.querySelector('.content p');
        if (!sample) return 21;
        const lineHeight = parseFloat(getComputedStyle(sample).lineHeight);
        return Number.isFinite(lineHeight) && lineHeight > 0 ? lineHeight : 21;
    },
});

let lastFitResult: PageFitResult | null = null;
let fitTimer = 0;

function runPageFit(): void {
    lastFitResult = pageFitter.fit();
}

function schedulePageFit(): void {
    window.clearTimeout(fitTimer);
    fitTimer = window.setTimeout(runPageFit, 150);
}
```

- [ ] **Step 7: Call the fitter on render and on edit**

In `src/scripts/resume/main.ts`, in the `createResumeController` options, change the `render` callback to:

```ts
    render: (languageData: ResumeLanguageData, language: 'en' | 'fr') => {
        renderResume(languageData, language);
        editor.bind(languageData);
        runPageFit();
    },
```

Change the `editor.onDirty` assignment (line 124) to:

```ts
editor.onDirty = () => {
    controller.markDirty();
    schedulePageFit();
};
```

Finally, in `init()`, after `await controller.initialize();` add:

```ts
        // Web font metrics change measured height materially, so refit once
        // the real faces have loaded.
        void document.fonts.ready.then(runPageFit);
```

- [ ] **Step 8: Run the full suite**

Run: `npm test`
Expected: PASS, all tests.

- [ ] **Step 9: Verify the density actually engages**

Run `npm run dev`, open `http://localhost:4321/resume`, and in the browser console run:

```js
document.getElementById('resume-content').dataset.density
```

Expected: `"0"` for the default gaming CV (it already fits).

- [ ] **Step 10: Commit**

```bash
git add src/styles/resume.css src/scripts/resume/main.ts tests/resume-page-contract.test.mjs
git commit -m "feat: apply bounded density ladder to keep the CV on one page"
```

---

### Task 5: Page-fill gauge and page-break ruler

**Files:**
- Modify: `src/pages/resume.astro`
- Modify: `src/styles/resume.css`
- Modify: `src/scripts/resume/main.ts`
- Test: `tests/resume-page-contract.test.mjs`

**Interfaces:**
- Consumes: `runPageFit`, `lastFitResult`, `PageFitResult` from Task 4; the `#page-fit-gauge` markup from Task 2.
- Produces: `renderGauge(result: PageFitResult)`; a `.page-break-ruler` element inside `#resume-content`.

- [ ] **Step 1: Write the failing test**

Append to `tests/resume-page-contract.test.mjs`:

```js
test('shows a page fill gauge and a page break ruler in edit mode', () => {
  assert.match(html, /id="page-fit-gauge"[^>]+role="progressbar"/);
  assert.match(html, /id="page-fit-fill"/);
  assert.match(html, /id="page-fit-label"/);
  assert.match(html, /class="page-break-ruler"/);
  // The ruler is an editing aid: never on screen for visitors, never in print.
  assert.match(css, /#resume-body\.is-editing \.page-break-ruler/);
  const print = css.slice(css.indexOf('@media print'));
  assert.match(print, /\.page-break-ruler/);
  assert.match(resumeMain, /page-fit-label/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --test-name-pattern="page fill gauge"`
Expected: FAIL — no `page-break-ruler` in the built HTML.

- [ ] **Step 3: Add the ruler element**

In `src/pages/resume.astro`, inside `<div class="container" id="resume-content">`, add as the first child, immediately before `<aside class="sidebar">`:

```html
        <div class="page-break-ruler" aria-hidden="true"><span>End of page 1</span></div>
```

- [ ] **Step 4: Style the gauge and ruler**

In `src/styles/resume.css`, immediately after the `.restore-confirmation` rule (after line 269), add:

```css
/* ============================================
   PAGE FILL GAUGE AND PAGE BREAK RULER
   ============================================ */
.page-fit-gauge {
    display: grid;
    gap: 0.3rem;
    min-width: 16rem;
}

.page-fit-bar {
    height: 0.5rem;
    border-radius: 999px;
    background: #2f333b;
    overflow: hidden;
}

.page-fit-fill {
    display: block;
    height: 100%;
    width: 0;
    border-radius: 999px;
    background: #2f9e63;
    transition: width 0.15s ease, background-color 0.15s ease;
}

#resume-body .page-fit-label {
    color: #f4f6f8;
    font: 600 0.75rem/1.2 var(--font-base);
}

.page-fit-gauge[data-fit-state="tightened"] .page-fit-fill {
    background: #4fc3f7;
}

.page-fit-gauge[data-fit-state="over"] .page-fit-fill {
    background: #e5484d;
}

.page-break-ruler {
    display: none;
}

#resume-body.is-editing .page-break-ruler {
    display: block;
    position: absolute;
    left: 0;
    right: 0;
    top: 1040px;
    z-index: 5;
    border-top: 2px dashed #e5484d;
    pointer-events: none;
}

#resume-body.is-editing .page-break-ruler span {
    position: absolute;
    right: 0.25rem;
    top: 0.15rem;
    padding: 0.1rem 0.35rem;
    border-radius: 0.25rem;
    background: #e5484d;
    color: #fff;
    font: 600 0.65rem/1.2 var(--font-base);
}
```

Then make the container a positioning context — in the `#resume-body .container` rule (lines 76–84), add:

```css
    position: relative;
```

- [ ] **Step 5: Hide the ruler in print**

In `src/styles/resume.css`, inside `@media print`, add `.page-break-ruler` to the existing hide list so it reads:

```css
    .download-btn,
    #resume-toolbar,
    #editor-actions,
    #resume-body dialog,
    .page-break-ruler,
    .editable-highlight {
        display: none !important;
    }
```

- [ ] **Step 6: Render the gauge**

In `src/scripts/resume/main.ts`, add these element lookups next to the other `requiredElement` calls (after line 34):

```ts
const pageFitGauge = requiredElement<HTMLElement>('page-fit-gauge');
const pageFitFill = requiredElement<HTMLElement>('page-fit-fill');
const pageFitLabel = requiredElement<HTMLElement>('page-fit-label');
```

Then replace the `runPageFit` function from Task 4 with:

```ts
function renderGauge(result: PageFitResult): void {
    const state = !result.fits ? 'over' : result.step === 0 ? 'fits' : 'tightened';
    pageFitGauge.dataset.fitState = state;
    pageFitGauge.setAttribute('aria-valuenow', String(Math.min(100, result.fillPercent)));
    pageFitFill.style.width = `${Math.min(100, result.fillPercent)}%`;

    if (state === 'fits') {
        pageFitLabel.textContent = `${result.fillPercent}% — fits one page`;
    } else if (state === 'tightened') {
        pageFitLabel.textContent = `${result.fillPercent}% — fits, auto-tightened`;
    } else {
        const lines = result.linesToCut === 1 ? 'line' : 'lines';
        pageFitLabel.textContent =
            `${result.fillPercent}% — over by ${result.overflowPx}px, cut ~${result.linesToCut} ${lines}`;
    }
}

function runPageFit(): void {
    lastFitResult = pageFitter.fit();
    if (!lastFitResult.stale) renderGauge(lastFitResult);
}
```

- [ ] **Step 7: Toggle the editing class**

In `src/scripts/resume/main.ts`, inside `renderApplicationState`, after the `editor.setEditing(state.editing);` line, add:

```ts
    document.body.classList.toggle('is-editing', state.editing);
```

- [ ] **Step 8: Run the full suite**

Run: `npm test`
Expected: PASS, all tests.

- [ ] **Step 9: Verify by hand**

Run `npm run dev`, unlock editing with `0000`. Expect a green bar reading roughly `97% — fits one page`. Type several extra lines into the summary and watch it cross into blue (`auto-tightened`) and then red with a line count, and watch the dashed ruler mark the boundary.

- [ ] **Step 10: Commit**

```bash
git add src/pages/resume.astro src/styles/resume.css src/scripts/resume/main.ts tests/resume-page-contract.test.mjs
git commit -m "feat: add page fill gauge and page break ruler to the CV editor"
```

---

### Task 6: Structural add/delete on the controller

**Files:**
- Modify: `src/scripts/resume/resume-controller.js`
- Modify: `src/scripts/resume/resume-controller.d.ts`
- Test: `tests/resume-controller.test.mjs`

**Interfaces:**
- Consumes: the existing controller `state`, `renderCurrent`, `emit`.
- Produces:
  - `addItem(collection: StructuralCollection): void`
  - `removeItem(collection: StructuralCollection, index: number): void`
  - `addPoint(jobIndex: number): void`
  - `removePoint(jobIndex: number, pointIndex: number): void`
  - `undoStructural(): boolean`
  - `state.undoLabel: string | null`
  - `StructuralCollection = 'experience' | 'projects' | 'education' | 'sidebarSections'`

- [ ] **Step 1: Write the failing test**

Append to `tests/resume-controller.test.mjs`:

```js
test('adds and removes items in both languages at the same index', async () => {
  const harness = makeHarness();
  await harness.controller.initialize();
  await harness.controller.unlock('0000');
  const before = harness.controller.state.data.en.main.experience.items.length;

  harness.controller.addItem('experience');
  const added = harness.controller.state.data;
  assert.equal(added.en.main.experience.items.length, before + 1);
  assert.equal(added.fr.main.experience.items.length, before + 1);
  assert.equal(harness.controller.state.dirty, true);

  harness.controller.removeItem('experience', 0);
  const removed = harness.controller.state.data;
  assert.equal(removed.en.main.experience.items.length, before);
  assert.equal(removed.fr.main.experience.items.length, before);
});

test('keeps every collection index-parallel across languages', async () => {
  const harness = makeHarness();
  await harness.controller.initialize();
  await harness.controller.unlock('0000');

  for (const collection of ['experience', 'projects', 'education', 'sidebarSections']) {
    harness.controller.addItem(collection);
  }
  harness.controller.addPoint(0);

  const { en, fr } = harness.controller.state.data;
  assert.equal(en.main.experience.items.length, fr.main.experience.items.length);
  assert.equal(en.main.projects.items.length, fr.main.projects.items.length);
  assert.equal(en.main.education.items.length, fr.main.education.items.length);
  assert.equal(en.sidebar.sections.length, fr.sidebar.sections.length);
  assert.equal(en.main.experience.items[0].points.length, fr.main.experience.items[0].points.length);
});

test('adds and removes bullet points in both languages', async () => {
  const harness = makeHarness();
  await harness.controller.initialize();
  await harness.controller.unlock('0000');
  const before = harness.controller.state.data.en.main.experience.items[0].points.length;

  harness.controller.addPoint(0);
  assert.equal(harness.controller.state.data.en.main.experience.items[0].points.length, before + 1);
  assert.equal(harness.controller.state.data.fr.main.experience.items[0].points.length, before + 1);

  harness.controller.removePoint(0, 0);
  assert.equal(harness.controller.state.data.en.main.experience.items[0].points.length, before);
  assert.equal(harness.controller.state.data.fr.main.experience.items[0].points.length, before);
});

test('restores the exact prior document with one-step undo', async () => {
  const harness = makeHarness();
  await harness.controller.initialize();
  await harness.controller.unlock('0000');
  const before = structuredClone(harness.controller.state.data);

  harness.controller.removeItem('experience', 0);
  assert.notDeepEqual(harness.controller.state.data, before);
  assert.equal(harness.controller.state.undoLabel, 'Job deleted.');

  assert.equal(harness.controller.undoStructural(), true);
  assert.deepEqual(harness.controller.state.data, before);
  assert.equal(harness.controller.state.undoLabel, null);
  assert.equal(harness.controller.undoStructural(), false);
});

test('refuses structural edits when not editing or degraded', async () => {
  const locked = makeHarness();
  await locked.controller.initialize();
  assert.throws(() => locked.controller.addItem('experience'), /unlock editing/i);

  const offline = makeHarness('https://philippeho.dev/resume', { failPublic: true });
  await offline.controller.initialize();
  assert.throws(() => offline.controller.addItem('experience'), /unavailable/i);
});

test('drops the undo snapshot on save and on exit', async () => {
  const harness = makeHarness();
  await harness.controller.initialize();
  await harness.controller.unlock('0000');

  harness.controller.removeItem('projects', 0);
  assert.equal(harness.controller.state.undoLabel, 'Project deleted.');
  await harness.controller.save();
  assert.equal(harness.controller.state.undoLabel, null);

  harness.controller.removeItem('projects', 0);
  await harness.controller.exitEditing();
  assert.equal(harness.controller.state.undoLabel, null);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/resume-controller.test.mjs`
Expected: FAIL — `harness.controller.addItem is not a function`.

- [ ] **Step 3: Add the blank-item templates**

In `src/scripts/resume/resume-controller.js`, add at the top of the file, after the imports:

```js
/**
 * The CV is bilingual and the renderer addresses items by index, so every
 * structural change must apply to `en` and `fr` at the same position. Diverging
 * arrays still pass server validation — it checks each language independently —
 * and would only surface later as a corrupted French CV.
 */
const BLANK_ITEMS = {
  experience: {
    en: { company: 'New company', role: 'New role', period: '', points: ['New achievement'] },
    fr: { company: 'Nouvelle entreprise', role: 'Nouveau poste', period: '', points: ['Nouvelle réalisation'] },
  },
  projects: {
    en: { title: 'New project', description: 'Describe the project.' },
    fr: { title: 'Nouveau projet', description: 'Décrivez le projet.' },
  },
  education: {
    en: { school: 'New school', period: '', description: 'Describe the programme.' },
    fr: { school: 'Nouvelle école', period: '', description: 'Décrivez le programme.' },
  },
  sidebarSections: {
    en: { title: 'New section', content: 'Add details.', icon: 'fas fa-star' },
    fr: { title: 'Nouvelle section', content: 'Ajoutez des détails.', icon: 'fas fa-star' },
  },
};

const BLANK_POINT = { en: 'New achievement', fr: 'Nouvelle réalisation' };

const UNDO_LABELS = {
  experience: 'Job deleted.',
  projects: 'Project deleted.',
  education: 'Education entry deleted.',
  sidebarSections: 'Sidebar section deleted.',
  point: 'Bullet point deleted.',
};

function collectionOf(languageData, collection) {
  if (collection === 'sidebarSections') return languageData.sidebar.sections;
  return languageData.main[collection].items;
}
```

- [ ] **Step 4: Add the structural operations**

In `src/scripts/resume/resume-controller.js`, add these functions immediately before `function markDirty()`:

```js
  let undoSnapshot = null;

  function requireEditable() {
    requireActive();
    if (state.degraded) {
      throw new Error('CV editing is temporarily unavailable.');
    }
    if (!state.editing) {
      throw new Error('Unlock editing before changing the CV structure.');
    }
  }

  function pushUndo(label) {
    undoSnapshot = { label, data: structuredClone(state.data), dirty: state.dirty };
    state.undoLabel = label;
  }

  function clearUndo() {
    undoSnapshot = null;
    state.undoLabel = null;
  }

  function commitStructural() {
    state.dirty = true;
    renderCurrent();
    emit();
  }

  function addItem(collection) {
    requireEditable();
    const template = BLANK_ITEMS[collection];
    if (!template) throw new Error(`Unknown CV collection: ${collection}.`);
    clearUndo();
    for (const language of ['en', 'fr']) {
      collectionOf(state.data[language], collection).push(structuredClone(template[language]));
    }
    commitStructural();
  }

  function removeItem(collection, index) {
    requireEditable();
    if (!BLANK_ITEMS[collection]) throw new Error(`Unknown CV collection: ${collection}.`);
    if (!Number.isInteger(index) || index < 0) return;
    pushUndo(UNDO_LABELS[collection]);
    for (const language of ['en', 'fr']) {
      collectionOf(state.data[language], collection).splice(index, 1);
    }
    commitStructural();
  }

  function addPoint(jobIndex) {
    requireEditable();
    clearUndo();
    for (const language of ['en', 'fr']) {
      const job = state.data[language].main.experience.items[jobIndex];
      if (job) job.points.push(BLANK_POINT[language]);
    }
    commitStructural();
  }

  function removePoint(jobIndex, pointIndex) {
    requireEditable();
    pushUndo(UNDO_LABELS.point);
    for (const language of ['en', 'fr']) {
      const job = state.data[language].main.experience.items[jobIndex];
      if (job) job.points.splice(pointIndex, 1);
    }
    commitStructural();
  }

  function undoStructural() {
    if (!undoSnapshot) return false;
    state.data = undoSnapshot.data;
    state.dirty = undoSnapshot.dirty;
    clearUndo();
    renderCurrent();
    emit();
    return true;
  }
```

- [ ] **Step 5: Seed and clear the undo state**

In `src/scripts/resume/resume-controller.js`, add `undoLabel: null,` to the `state` object literal, after `managementAvailable: false,`.

Then call `clearUndo();` at the start of the body of each of `selectVersion`, `restore`, and `exitEditing`, and inside `save()` immediately after `state.dirty = false;` in the success path.

- [ ] **Step 6: Export the new methods**

In `src/scripts/resume/resume-controller.js`, add to the returned object, after `markDirty,`:

```js
    addItem,
    removeItem,
    addPoint,
    removePoint,
    undoStructural,
```

- [ ] **Step 7: Update the type declarations**

In `src/scripts/resume/resume-controller.d.ts`, add `undoLabel: string | null;` to `ResumeControllerState`, and add to `ResumeController`:

```ts
    addItem(collection: StructuralCollection): void;
    removeItem(collection: StructuralCollection, index: number): void;
    addPoint(jobIndex: number): void;
    removePoint(jobIndex: number, pointIndex: number): void;
    undoStructural(): boolean;
```

and above `ResumeControllerState`:

```ts
export type StructuralCollection =
    | 'experience'
    | 'projects'
    | 'education'
    | 'sidebarSections';
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `node --test tests/resume-controller.test.mjs`
Expected: PASS, including all six new tests.

- [ ] **Step 9: Run the full suite**

Run: `npm test`
Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add src/scripts/resume/resume-controller.js src/scripts/resume/resume-controller.d.ts tests/resume-controller.test.mjs
git commit -m "feat: add bilingual structural add/delete with one-step undo"
```

---

### Task 7: Structural controls in the rendered CV

**Files:**
- Modify: `src/scripts/resume/renderer.ts`
- Modify: `src/scripts/resume/main.ts`
- Modify: `src/styles/resume.css`
- Test: `tests/resume-page-contract.test.mjs`

**Interfaces:**
- Consumes: `addItem`, `removeItem`, `addPoint`, `removePoint`, `undoStructural`, `state.undoLabel` from Task 6; `schedulePageFit` from Task 4.
- Produces: `data-struct-action`, `data-struct-collection`, `data-index`, `data-point-index` attributes handled by one delegated listener on `#resume-content`.

- [ ] **Step 1: Write the failing test**

Append to `tests/resume-page-contract.test.mjs`:

```js
test('renders structural add and remove controls', () => {
  assert.match(rendererSource, /data-struct-action/);
  assert.match(rendererSource, /add-item/);
  assert.match(rendererSource, /remove-item/);
  assert.match(rendererSource, /add-point/);
  assert.match(rendererSource, /remove-point/);
  // Controls must never be editable text or they would corrupt the document.
  assert.doesNotMatch(rendererSource, /structButton\([^)]*\)\.dataset\.path/);
  assert.match(css, /\.struct-controls\s*\{[^}]*display:\s*none/);
  assert.match(css, /#resume-body\.is-editing .*\.struct-controls/);
  const print = css.slice(css.indexOf('@media print'));
  assert.match(print, /\.struct-controls/);
});

test('handles structural controls with one delegated listener and offers undo', () => {
  assert.match(resumeMain, /data-struct-action/);
  assert.match(resumeMain, /undoStructural/);
  assert.match(resumeMain, /undoLabel/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --test-name-pattern="structural"`
Expected: FAIL — `data-struct-action` is absent from the renderer.

- [ ] **Step 3: Add control builders to the renderer**

In `src/scripts/resume/renderer.ts`, add after the `editableElement` function:

```ts
function structButton(
    label: string,
    text: string,
    attributes: Record<string, string>,
): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'struct-btn';
    button.textContent = text;
    button.title = label;
    button.setAttribute('aria-label', label);
    for (const [key, value] of Object.entries(attributes)) {
        button.dataset[key] = value;
    }
    return button;
}

function structControls(...buttons: HTMLButtonElement[]): HTMLElement {
    const controls = document.createElement('span');
    controls.className = 'struct-controls';
    controls.append(...buttons);
    return controls;
}

function addItemButton(collection: string, label: string): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'struct-controls struct-controls-add';
    wrapper.appendChild(
        structButton(label, `+ ${label}`, { structAction: 'add-item', structCollection: collection }),
    );
    return wrapper;
}
```

- [ ] **Step 4: Attach controls to each item**

In `src/scripts/resume/renderer.ts`, in `createJobElement`, after `container.appendChild(heading);` add:

```ts
    heading.appendChild(
        structControls(
            structButton('Delete job', '✕', {
                structAction: 'remove-item',
                structCollection: 'experience',
                index: String(index),
            }),
        ),
    );
```

and replace the bullet loop plus the following `container.appendChild(points);` with:

```ts
    const points = document.createElement('ul');
    job.points.forEach((point, pointIndex) => {
        const item = editableElement('li', `${basePath}.points.${pointIndex}`, point);
        item.appendChild(
            structControls(
                structButton('Delete bullet point', '✕', {
                    structAction: 'remove-point',
                    index: String(index),
                    pointIndex: String(pointIndex),
                }),
            ),
        );
        points.appendChild(item);
    });
    container.appendChild(points);
    container.appendChild(
        (() => {
            const wrapper = document.createElement('div');
            wrapper.className = 'struct-controls struct-controls-add';
            wrapper.appendChild(
                structButton('Add bullet point', '+ bullet', {
                    structAction: 'add-point',
                    index: String(index),
                }),
            );
            return wrapper;
        })(),
    );
```

In `createProjectElement`, after the existing `container.append(...)` call add:

```ts
    container.querySelector('h3')?.appendChild(
        structControls(
            structButton('Delete project', '✕', {
                structAction: 'remove-item',
                structCollection: 'projects',
                index: String(index),
            }),
        ),
    );
```

In `createEducationElement`, after the `container.append(period, ...)` call add:

```ts
    container.querySelector('h3')?.appendChild(
        structControls(
            structButton('Delete education entry', '✕', {
                structAction: 'remove-item',
                structCollection: 'education',
                index: String(index),
            }),
        ),
    );
```

- [ ] **Step 5: Attach the add buttons and sidebar controls**

In `src/scripts/resume/renderer.ts`, inside `renderResume`, in the sidebar sections loop, after `container.appendChild(content);` add:

```ts
            container.appendChild(
                structControls(
                    structButton('Delete sidebar section', '✕', {
                        structAction: 'remove-item',
                        structCollection: 'sidebarSections',
                        index: String(index),
                    }),
                ),
            );
```

and immediately after the `sectionsContainer.appendChild(languages);` line add:

```ts
        sectionsContainer.appendChild(addItemButton('sidebarSections', 'Add section'));
```

Then, after each of the three `setItemContainerVisibility(...)` calls, append the matching add button:

```ts
    document.getElementById('experience-list')?.after(addItemButton('experience', 'Add job'));
    document.getElementById('projects-list')?.after(addItemButton('projects', 'Add project'));
    document.getElementById('education-list')?.after(addItemButton('education', 'Add school'));
```

Because `renderResume` runs on every render, guard against duplicates by removing stale add buttons first — add this at the very top of `renderResume`:

```ts
    document.querySelectorAll('.struct-controls-add').forEach((element) => element.remove());
```

- [ ] **Step 6: Style the controls**

In `src/styles/resume.css`, immediately after the `[contenteditable="true"]:focus` rule (after line 530), add:

```css
.struct-controls {
    display: none;
}

#resume-body.is-editing .struct-controls {
    display: inline-flex;
    gap: 0.25rem;
    margin-left: 0.4rem;
    vertical-align: middle;
}

#resume-body.is-editing .struct-controls-add {
    display: flex;
    margin: 0 0 calc(0.75rem * var(--fit-space));
}

#resume-body .struct-btn {
    padding: 0.05rem 0.4rem;
    border: 1px solid #9aa3b0;
    border-radius: 0.3rem;
    background: #fff;
    color: #47506180;
    cursor: pointer;
    font: 600 0.7rem/1.4 var(--font-base);
    opacity: 0.35;
    transition: opacity 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

#resume-body .struct-btn:hover,
#resume-body .struct-btn:focus-visible {
    opacity: 1;
    color: #b42318;
    border-color: #b42318;
}

#resume-body .struct-controls-add .struct-btn {
    color: #1a5fb4;
    opacity: 0.7;
}

#resume-body .struct-controls-add .struct-btn:hover {
    color: #1a5fb4;
    border-color: #1a5fb4;
    opacity: 1;
}
```

In `@media print`, add `.struct-controls` to the hide list so it reads:

```css
    .download-btn,
    #resume-toolbar,
    #editor-actions,
    #resume-body dialog,
    .page-break-ruler,
    .struct-controls,
    .editable-highlight {
        display: none !important;
    }
```

- [ ] **Step 7: Wire the delegated listener**

In `src/scripts/resume/main.ts`, add after the `cvSelect.addEventListener('change', ...)` block:

```ts
resumeContent.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const button = target.closest<HTMLElement>('[data-struct-action]');
    if (!button) return;

    const { structAction, structCollection, index, pointIndex } = button.dataset;
    try {
        if (structAction === 'add-item' && structCollection) {
            controller.addItem(structCollection as StructuralCollection);
        } else if (structAction === 'remove-item' && structCollection) {
            controller.removeItem(structCollection as StructuralCollection, Number(index));
        } else if (structAction === 'add-point') {
            controller.addPoint(Number(index));
        } else if (structAction === 'remove-point') {
            controller.removePoint(Number(index), Number(pointIndex));
        }
    } catch (error) {
        status.textContent = messageFrom(error);
    }
});
```

Add `StructuralCollection` to the controller type import at the top of the file:

```ts
import type { ResumeControllerState, StructuralCollection } from './resume-controller';
```

- [ ] **Step 8: Offer undo in the status line**

In `src/scripts/resume/main.ts`, replace the `if (state.dirty) { ... }` chain at the end of `renderApplicationState` with:

```ts
    if (state.undoLabel) {
        status.replaceChildren(document.createTextNode(`${state.undoLabel} `));
        const undo = document.createElement('button');
        undo.type = 'button';
        undo.id = 'undo-structural';
        undo.className = 'status-undo';
        undo.textContent = 'Undo';
        undo.addEventListener('click', () => controller.undoStructural());
        status.appendChild(undo);
    } else if (state.dirty) {
        status.textContent = 'Unsaved changes — save or exit editing first.';
    } else if (state.degraded) {
        status.textContent = 'Showing the built-in gaming CV — the live CV service is temporarily unavailable.';
    } else if (!state.managementAvailable) {
        status.textContent = 'CV editing is temporarily unavailable.';
    } else {
        status.textContent = transientStatus;
    }
```

Add the button style to `src/styles/resume.css`, after the `#resume-status` rule:

```css
#resume-body .status-undo {
    margin-left: 0.25rem;
    padding: 0.1rem 0.45rem;
    border: 1px solid #7d8797;
    border-radius: 0.3rem;
    background: #24272d;
    color: #f4f6f8;
    cursor: pointer;
    font: 600 0.75rem/1.3 var(--font-base);
}
```

- [ ] **Step 9: Refit after structural changes**

In `src/scripts/resume/main.ts`, the controller's `render` callback already calls `runPageFit()`, and every structural operation calls `renderCurrent()`. Confirm this by running `npm run dev`, unlocking editing, and deleting a job — the gauge percentage must drop immediately.

- [ ] **Step 10: Run the full suite**

Run: `npm test`
Expected: PASS.

- [ ] **Step 11: Verify by hand**

Run `npm run dev`, unlock editing, then: add a job, add a bullet to it, delete a project, click **Undo** in the status line and confirm the project returns. Toggle to **FR** and confirm the added job is present there too with French placeholder text.

- [ ] **Step 12: Commit**

```bash
git add src/scripts/resume/renderer.ts src/scripts/resume/main.ts src/styles/resume.css tests/resume-page-contract.test.mjs
git commit -m "feat: add structural editing controls to the rendered CV"
```

---

### Task 8: One-page verification across all CV versions

This is the acceptance gate for the whole plan. It is a manual verification run, not a committed test: the suite is dependency-free `node:test` and Playwright would add roughly 150MB of browser binaries for a single assertion.

**Files:**
- Modify: `docs/superpowers/specs/2026-07-30-cv-one-page-editor-design.md` (record measured results)

**Interfaces:**
- Consumes: everything from Tasks 3–7.
- Produces: a verified one-page result table.

- [ ] **Step 1: Serve the built site with the API**

```bash
npm run build
node server.cjs
```

Expected: the server listens and `http://localhost:3000/api/cvs` returns the registry JSON.

- [ ] **Step 2: Render each CV to a PDF and count pages**

Using the Playwright MCP browser, for each of `game-full-stack`, `backend-software-developer` and `customer-solutions-consultant`:

```js
async (page) => {
  const ids = ['game-full-stack', 'backend-software-developer', 'customer-solutions-consultant'];
  const out = {};
  for (const id of ids) {
    await page.goto(`http://localhost:3000/resume?cv=${id}`);
    await page.waitForTimeout(1200);
    await page.emulateMedia({ media: 'print' });
    const buf = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
    out[id] = {
      pages: (buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length,
      density: await page.evaluate(() => document.getElementById('resume-content').dataset.density),
    };
  }
  return out;
}
```

Expected: `pages: 1` for all three. Baseline before this work was 1, 2 and 2 respectively.

- [ ] **Step 3: Confirm the gauge agrees with reality**

For any CV whose reported `density` is 4 and whose gauge shows `over`, confirm the PDF genuinely has 2 pages and that the reported `cut ~N lines` is within one line of the actual excess. The gauge must never claim a fit that the PDF contradicts.

- [ ] **Step 4: Record the results in the spec**

Replace the current-state table in `docs/superpowers/specs/2026-07-30-cv-one-page-editor-design.md` with a before/after table using the measured numbers from Step 2.

- [ ] **Step 5: Run the full suite one final time**

Run: `npm test`
Expected: PASS, all tests.

- [ ] **Step 6: Commit**

```bash
git add docs/superpowers/specs/2026-07-30-cv-one-page-editor-design.md
git commit -m "docs: record verified one-page PDF results for every CV version"
```

---

## Self-review notes

**Spec coverage.** Page-fit engine → Task 3. Density ladder → Task 4. Gauge and ruler → Task 5. Structural add/delete with bilingual parity and undo → Tasks 6–7. Two-row toolbar, uniform colour, centred icons → Task 2. Dialog Cancel → Task 1. Unit tests → Tasks 3 and 6. PDF page count → Task 8. Error handling: stale measurement → Task 3; `document.fonts.ready` → Task 4; degraded guard → Task 6; undo cleared on version change, save, restore and exit → Task 6.

**Naming consistency.** `runPageFit` / `schedulePageFit` / `renderGauge` / `lastFitResult` are introduced in Task 4 and reused unchanged in Tasks 5 and 7. `StructuralCollection` is defined in Task 6 and imported in Task 7. `data-struct-action` values are `add-item`, `remove-item`, `add-point`, `remove-point` throughout.

**Deferred deliberately.** Reordering, show/hide, link and icon editing, and multi-page support are out of scope per the spec.
