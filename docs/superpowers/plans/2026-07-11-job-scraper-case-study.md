# Job Scraper Case Study Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the separate Job Scraper and Job Viewer cards with one accurate, visually strong automation case study.

**Architecture:** A focused Astro component owns the feature presentation and its workflow/dashboard actions. The existing project data continues to drive standard cards, while a build-level Node test verifies the generated HTML contract and prevents the redundant cards from returning.

**Tech Stack:** Astro 5, Tailwind CSS 4, Node’s built-in test runner, Playwright CLI

---

### Task 1: Add the generated-page regression test

**Files:**
- Create: `tests/job-scraper-case-study.test.mjs`

- [x] **Step 1: Write the failing test**

```js
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const build = spawnSync('npm', ['run', 'build'], {
  cwd: process.cwd(),
  encoding: 'utf8',
  shell: process.platform === 'win32',
});

assert.equal(build.status, 0, `${build.stdout}\n${build.stderr}`);
const html = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');

test('renders the verified Job Scraper case study', () => {
  assert.match(html, /data-case-study="job-scraper"/);
  assert.match(html, /Automated Job Intelligence Pipeline/);
  assert.match(html, /15 workflow nodes/);
  assert.match(html, /3 targeted searches/);
  assert.match(html, /Schedule \+ webhook/);
});

test('shows both workflow and dashboard visuals with useful actions', () => {
  assert.match(html, /assets\/img\/n8n-workflow\.png/);
  assert.match(html, /assets\/img\/job-viewer-dashboard\.png/);
  assert.match(html, /View workflow/);
  assert.match(html, /Open live dashboard/);
  assert.match(html, /https:\/\/jobs\.philippeho\.dev\/job-viewer\//);
});

test('does not render redundant Job Scraper and Job Viewer cards', () => {
  assert.doesNotMatch(html, /<h4[^>]*>n8n Job Scraper<\/h4>/);
  assert.doesNotMatch(html, /<h4[^>]*>Job Viewer<\/h4>/);
});
```

- [x] **Step 2: Run the test to verify it fails for the missing feature**

Run: `node --test tests/job-scraper-case-study.test.mjs`

Expected: FAIL because `data-case-study="job-scraper"` is absent.

### Task 2: Capture the real dashboard output

**Files:**
- Create: `public/assets/img/job-viewer-dashboard.png`

- [x] **Step 1: Open the public demo at a 1440×900 viewport**

Run: `playwright-cli -s=job-case-study open https://jobs.philippeho.dev/job-viewer/` followed by `playwright-cli -s=job-case-study resize 1440 900`.

- [x] **Step 2: Capture the public demo without interacting with its data**

Run Playwright code that saves the viewport to `public/assets/img/job-viewer-dashboard.png`.

- [x] **Step 3: Inspect the image**

Expected: The public demo banner, three job-status columns, and sample cards are visible; no private account data is present.

### Task 3: Build the featured case-study component

**Files:**
- Create: `src/components/JobScraperCaseStudy.astro`

- [x] **Step 1: Add the visual and narrative structure**

Create an article with `data-case-study="job-scraper"`, a workflow screenshot, an inset dashboard screenshot, the title “Automated Job Intelligence Pipeline,” verified proof points, and the six-stage pipeline.

- [x] **Step 2: Add explicit actions**

Use `window.openImageModal()` for “View workflow” and `window.openProjectModal()` for “Open live dashboard” so both actions reuse the existing modal system.

- [x] **Step 3: Keep the component responsive and accessible**

Use a single-column mobile layout, a two-column desktop layout, descriptive image alt text, real buttons, visible focus styles, and reduced decorative detail at small widths.

### Task 4: Integrate the feature and remove duplication

**Files:**
- Modify: `src/components/Projects.astro`
- Modify: `src/data/projects.ts`

- [x] **Step 1: Import and render the featured component**

Render `<JobScraperCaseStudy />` before the standard Automation & Systems grid.

- [x] **Step 2: Remove the old Job Scraper and Job Viewer entries**

Keep Class Action Scanner unchanged. Do not modify Fitbit or add any under-construction project.

- [x] **Step 3: Run the regression test**

Run: `node --test tests/job-scraper-case-study.test.mjs`

Expected: 3 tests pass, 0 fail.

### Task 5: Verify behavior and presentation

**Files:**
- No production files added in this task.

- [x] **Step 1: Run the production build**

Run: `npm run build`

Expected: Astro builds two pages successfully with exit code 0.

- [x] **Step 2: Run local browser verification**

Start the preview server, inspect the Automation & Systems section at desktop and mobile widths, open the workflow image, and open the live dashboard modal.

- [x] **Step 3: Review the final diff**

Run: `git diff --check` and `git diff -- src/components/Projects.astro src/components/JobScraperCaseStudy.astro src/data/projects.ts tests/job-scraper-case-study.test.mjs`.

Expected: no whitespace errors and no unrelated edits.
