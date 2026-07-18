# Billing Hub Featured Project Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Billing Hub as a screenshot-led featured project above the generic Web Development grid, with a public-demo action and an honest private-repository status.

**Architecture:** A focused Astro component owns all Billing Hub presentation data and markup. `Projects.astro` only imports and places it, while two local PNG assets captured from the public demo provide the visual proof. A source-level regression test builds the site and checks ordering, content, links, assets, and repository messaging.

**Tech Stack:** Astro 5, Tailwind CSS 4, Node's built-in test runner, Playwright CLI

## Global Constraints

- Change only the Portfolio repository.
- Do not modify the Billing Hub checkout, Git history, database, deployment, or live application.
- Use only Billing Hub's public demo state and bundled sample data.
- Keep the live URL exactly `https://philippeho.dev/InvoicingAndTrackingTool/`.
- Do not add a GitHub or source-code link for the private repository.
- Do not add runtime dependencies, client-side state, or a new portfolio route.
- Do not push or deploy without a separate user request.
- Work in the existing `codex/billing-hub-feature` branch and do not create another worktree.

---

### Task 1: Lock the featured-project contract with a failing test

**Files:**
- Create: `tests/billing-hub-feature.test.mjs`

**Interfaces:**
- Consumes: the production build output at `dist/index.html`
- Produces: a regression contract for `data-featured-project="billing-hub"`, exact URL behavior, asset names, project ordering, proof-point copy, and private-repository messaging

- [ ] **Step 1: Write the failing test**

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

test('renders Billing Hub as the featured Web Development project', () => {
  const billingHubIndex = html.indexOf('data-featured-project="billing-hub"');
  const genericProjectIndex = html.indexOf('TurboReader');

  assert.ok(billingHubIndex >= 0, 'Billing Hub feature should render');
  assert.ok(genericProjectIndex >= 0, 'generic web project grid should render');
  assert.ok(billingHubIndex < genericProjectIndex, 'Billing Hub should precede the generic web project grid');
  assert.match(html, /Freelance operations workspace/);
  assert.match(html, /Billing Hub/);
});

test('uses real public-demo visuals and a safe live action', () => {
  assert.match(html, /assets\/img\/billing-hub-dashboard\.png/);
  assert.match(html, /assets\/img\/billing-hub-invoice\.png/);
  assert.match(html, /alt="Billing Hub Gazette dashboard showing companies, time entries, expenses, current totals, and archived invoices"/);
  assert.match(html, /alt="Billing Hub invoice preview showing billable work, expenses, totals, and PDF controls"/);
  assert.match(html, /href="https:\/\/philippeho\.dev\/InvoicingAndTrackingTool\/"/);
  assert.match(html, /target="_blank"/);
  assert.match(html, /rel="noreferrer"/);
  assert.match(html, /Open public demo/);
});

test('explains the workflow without advertising private source code', () => {
  const billingHubStart = html.indexOf('data-featured-project="billing-hub"');
  const billingHubEnd = html.indexOf('</article>', billingHubStart);
  const billingHubHtml = html.slice(billingHubStart, billingHubEnd);

  assert.match(html, /Multiple companies and timesheets/);
  assert.match(html, /Expenses flow into invoice-ready totals/);
  assert.match(html, /PDF, archive, download, and paid-state workflows/);
  assert.match(html, /data-repository-visibility="private"/);
  assert.match(html, /Private repository/);
  assert.doesNotMatch(billingHubHtml, /github\.com\/PhilHo-Projects\/InvoicingAndTrackingTool/);
  assert.doesNotMatch(billingHubHtml, /View source/);
});
```

- [ ] **Step 2: Run the focused test to verify RED**

Run: `node --test tests/billing-hub-feature.test.mjs`

Expected: the build succeeds, then the tests fail because `data-featured-project="billing-hub"`, the Billing Hub assets, and its copy are not in the portfolio yet.

- [ ] **Step 3: Commit the test contract**

```powershell
git add -- tests/billing-hub-feature.test.mjs docs/superpowers/plans/2026-07-18-billing-hub-feature.md
git commit -m "test: define Billing Hub portfolio feature"
```

### Task 2: Capture public-demo assets and implement the component

**Files:**
- Create: `public/assets/img/billing-hub-dashboard.png`
- Create: `public/assets/img/billing-hub-invoice.png`
- Create: `src/components/BillingHubFeatured.astro`
- Modify: `src/components/Projects.astro`
- Test: `tests/billing-hub-feature.test.mjs`

**Interfaces:**
- Consumes: the approved Billing Hub design, exact public-demo URL, and two Playwright-captured PNG assets
- Produces: the static `<BillingHubFeatured />` Astro component and its placement above the Web Development grid

- [ ] **Step 1: Capture the dashboard from verified public demo state**

Run these commands from the Portfolio repository with the named browser session:

```powershell
playwright-cli -s=billing-capture goto "https://philippeho.dev/InvoicingAndTrackingTool/"
playwright-cli -s=billing-capture resize 1440 1000
playwright-cli -s=billing-capture find "Public demo"
playwright-cli -s=billing-capture screenshot "main" --filename=public/assets/img/billing-hub-dashboard.png
```

Expected: `Public demo` is visible and the dashboard screenshot contains only the bundled Northstar Studio and Maple Launch Co. sample data.

- [ ] **Step 2: Capture the invoice preview from the same public session**

```powershell
playwright-cli -s=billing-capture click "getByRole('button', { name: 'Preview invoice' })"
playwright-cli -s=billing-capture screenshot "getByRole('dialog', { name: 'Invoice preview' })" --filename=public/assets/img/billing-hub-invoice.png
playwright-cli -s=billing-capture click "getByRole('button', { name: 'Close' })"
```

Expected: the second asset shows the Demo Freelancer sample invoice; no save, download, archive, sign-in, or persistent-data action occurs.

- [ ] **Step 3: Create the focused Astro component**

Create `src/components/BillingHubFeatured.astro` with:

```astro
---
const dashboardImage = import.meta.env.BASE_URL + 'assets/img/billing-hub-dashboard.png';
const invoiceImage = import.meta.env.BASE_URL + 'assets/img/billing-hub-invoice.png';
const publicDemo = 'https://philippeho.dev/InvoicingAndTrackingTool/';

const proofPoints = [
  {
    icon: 'fa-solid fa-building',
    title: 'Multiple companies and timesheets',
    detail: 'Separate client profiles, current work, and archived billing periods.',
  },
  {
    icon: 'fa-solid fa-receipt',
    title: 'Expenses flow into invoice-ready totals',
    detail: 'Billable time and reimbursable costs stay in one calculation path.',
  },
  {
    icon: 'fa-solid fa-file-invoice-dollar',
    title: 'PDF, archive, download, and paid-state workflows',
    detail: 'The full invoice lifecycle remains visible from one workspace.',
  },
];
---

<article
  data-featured-project="billing-hub"
  class="overflow-hidden rounded-2xl border border-amber-300/15 bg-[#171510]"
>
  <div class="grid grid-cols-1 lg:grid-cols-[1.16fr_0.84fr]">
    <figure class="relative overflow-hidden border-b border-white/10 bg-[#0c0b09] lg:border-r lg:border-b-0">
      <a
        href={publicDemo}
        target="_blank"
        rel="noreferrer"
        aria-label="Open the Billing Hub public demo"
        class="group block p-4 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-amber-300 sm:p-6 lg:p-8"
      >
        <span class="block overflow-hidden rounded-xl border border-amber-200/15 bg-[#d8c79a]">
          <img
            src={dashboardImage}
            alt="Billing Hub Gazette dashboard showing companies, time entries, expenses, current totals, and archived invoices"
            class="aspect-[4/3] w-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.01] motion-reduce:transition-none motion-reduce:transform-none"
          />
        </span>

        <span class="relative -mt-12 ml-auto mr-3 block w-[72%] overflow-hidden rounded-lg border border-white/20 bg-white sm:-mt-16 sm:mr-5 sm:w-[62%] lg:-mt-20 lg:mr-4 lg:w-[68%]">
          <img
            src={invoiceImage}
            alt="Billing Hub invoice preview showing billable work, expenses, totals, and PDF controls"
            class="aspect-[1.39/1] w-full object-cover object-top transition-transform duration-500 ease-out group-hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:transform-none"
          />
        </span>

        <span class="mt-4 flex items-center justify-between gap-4 text-[10px] font-mono uppercase tracking-[0.14em] text-amber-100/75">
          <span class="inline-flex items-center gap-2">
            <i class="fa-solid fa-camera text-amber-300"></i>
            Public demo · Gazette interface
          </span>
          <i class="fa-solid fa-arrow-up-right-from-square text-amber-300 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:transform-none"></i>
        </span>
      </a>
      <figcaption class="sr-only">Billing Hub dashboard and invoice preview captured from its public demo.</figcaption>
    </figure>

    <div class="flex flex-col p-6 sm:p-8 lg:p-9">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <span class="inline-flex items-center gap-2 rounded-full bg-emerald-300/10 px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.14em] text-emerald-200">
          <span class="h-1.5 w-1.5 rounded-full bg-emerald-300"></span>
          Live web app
        </span>
        <span class="text-[10px] font-mono uppercase tracking-[0.12em] text-slate-400">Astro SSR · SQLite · Bun</span>
      </div>

      <p class="mt-7 text-[10px] font-mono uppercase tracking-[0.14em] text-amber-300">Freelance operations workspace</p>
      <h4 class="mt-2 text-3xl font-medium leading-tight tracking-[-0.025em] text-white">Billing Hub</h4>
      <p class="mt-4 max-w-[65ch] text-sm leading-relaxed text-slate-300">
        A multi-company workspace that turns time entries and expenses into polished invoices, then keeps every paid and archived record within reach.
      </p>

      <ul class="mt-7 divide-y divide-white/10 border-y border-white/10" aria-label="Billing Hub capabilities">
        {proofPoints.map((point) => (
          <li class="flex gap-3 py-4">
            <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-amber-300/10 text-amber-300" aria-hidden="true">
              <i class={`${point.icon} text-[11px]`}></i>
            </span>
            <span>
              <strong class="block text-[11px] font-medium text-slate-100">{point.title}</strong>
              <span class="mt-1 block text-[10px] leading-relaxed text-slate-400">{point.detail}</span>
            </span>
          </li>
        ))}
      </ul>

      <div class="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center lg:mt-auto lg:pt-8">
        <a
          href={publicDemo}
          target="_blank"
          rel="noreferrer"
          class="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-amber-300 px-5 py-3 text-[10px] font-mono font-semibold uppercase tracking-[0.13em] text-[#1a1508] transition-colors hover:bg-amber-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200"
        >
          Open public demo
          <i class="fa-solid fa-arrow-up-right-from-square"></i>
        </a>
        <span data-repository-visibility="private" class="inline-flex min-h-11 items-center gap-2 text-[10px] font-mono uppercase tracking-[0.12em] text-slate-400">
          <i class="fa-solid fa-lock text-amber-300/80"></i>
          Private repository
        </span>
      </div>
    </div>
  </div>
</article>
```

- [ ] **Step 4: Render the component before the generic Web Development grid**

Add the import to `src/components/Projects.astro`:

```astro
import BillingHubFeatured from './BillingHubFeatured.astro';
```

Then replace the Web Development grid opening with:

```astro
      <BillingHubFeatured />
      <div class="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
```

- [ ] **Step 5: Run the focused test to verify GREEN**

Run: `node --test tests/billing-hub-feature.test.mjs`

Expected: 3 tests pass, 0 fail.

- [ ] **Step 6: Commit the feature**

```powershell
git add -- public/assets/img/billing-hub-dashboard.png public/assets/img/billing-hub-invoice.png src/components/BillingHubFeatured.astro src/components/Projects.astro
git commit -m "feat: showcase Billing Hub"
```

### Task 3: Verify production output and responsive presentation

**Files:**
- Verify: `tests/*.test.mjs`
- Verify: `dist/index.html`
- Verify: `http://127.0.0.1:4321/#web-development`

**Interfaces:**
- Consumes: the completed Billing Hub feature and existing localhost Astro server
- Produces: fresh test, build, desktop, mobile, overflow, asset, link, and console evidence

- [ ] **Step 1: Run the complete test suite serially**

Run: `node --test --test-concurrency=1`

Expected after responsive-review and asset-loading coverage: 12 tests pass, 0 fail.

- [ ] **Step 2: Run a fresh production build**

Run: `npm run build`

Expected: Astro reports a successful build and writes `dist/index.html`.

- [ ] **Step 3: Inspect desktop layout and runtime health**

```powershell
playwright-cli -s=billing-portfolio open "http://127.0.0.1:4321/#web-development"
playwright-cli -s=billing-portfolio resize 1440 1000
playwright-cli -s=billing-portfolio snapshot "[data-featured-project='billing-hub']" --boxes
playwright-cli -s=billing-portfolio eval "JSON.stringify({overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth, images: [...document.querySelectorAll('[data-featured-project=\"billing-hub\"] img')].map(img => ({complete: img.complete, width: img.naturalWidth})), links: [...document.querySelectorAll('[data-featured-project=\"billing-hub\"] a')].map(a => a.href)})"
playwright-cli -s=billing-portfolio console error
```

Expected: no horizontal overflow, both images are complete with non-zero natural widths, both links use the exact public-demo URL, and no page console errors appear.

- [ ] **Step 4: Inspect the 390px mobile layout**

```powershell
playwright-cli -s=billing-portfolio resize 390 844
playwright-cli -s=billing-portfolio snapshot "[data-featured-project='billing-hub']" --boxes
playwright-cli -s=billing-portfolio eval "JSON.stringify({viewport: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth, card: document.querySelector('[data-featured-project=\"billing-hub\"]').getBoundingClientRect().toJSON()})"
playwright-cli -s=billing-portfolio screenshot "[data-featured-project='billing-hub']" --filename=.playwright-cli/billing-hub-mobile-review.png
```

Expected: `scrollWidth` equals `viewport`, the full card fits within 390px, content order remains logical, the action is at least 44px high, and both screenshots remain visible.

- [ ] **Step 5: Verify repository isolation and clean branch state**

```powershell
git status --short --branch
git log -3 --oneline --decorate
```

Expected: only ignored Playwright review artifacts may remain; the Billing Hub project repository has not been touched; the feature branch contains the spec, test, and implementation commits.
