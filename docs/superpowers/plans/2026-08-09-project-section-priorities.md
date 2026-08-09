# Project Section Priorities Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lead the portfolio with Web Development, remove Unreal Engine's inaccurate default status, and temporarily hide Personal SoundCloud and MP3 Maker without deleting their project data.

**Architecture:** Keep project presentation controlled by `src/data/projects.ts`. Add an optional visibility flag that defaults to visible, filter explicitly hidden projects before Astro renders cards and detail panels, and make the project-card status badge conditional on an explicit status.

**Tech Stack:** Astro 7, TypeScript, Node.js built-in test runner

## Global Constraints

- Personal SoundCloud and MP3 Maker remain fully defined in source control, including their links, previews, and highlights.
- Hidden projects must not be emitted into built HTML.
- Song Finder keeps its explicit `coming-soon` status.
- No assets, project implementations, or unrelated generated files are deleted or modified.

---

### Task 1: Reprioritize and filter the project index

**Files:**
- Modify: `tests/project-index-contract.test.mjs`
- Modify: `src/data/projects.ts`
- Modify: `src/components/Projects.astro`
- Modify: `src/components/ProjectCard.astro`

**Interfaces:**
- Consumes: `projects: Project[]` and the existing `data-project-trigger`, `data-project-detail`, and category anchor markup.
- Produces: `Project.visible?: boolean`, where only `false` suppresses rendering; status badge markup only for explicit `Project.status` values.

- [ ] **Step 1: Write failing output-contract tests**

Remove `personal-soundcloud` and `mp3-maker` from `richProjectIds`. Remove the MP3 Maker detail assertion from the existing status/copy test. Add these tests after `renders every project as a collapsed expandable index item`:

```js
test('renders Web Development before Game Development', () => {
  const webDevelopment = html.indexOf('id="web-development"');
  const gameDevelopment = html.indexOf('id="game-development"');

  assert.notEqual(webDevelopment, -1);
  assert.notEqual(gameDevelopment, -1);
  assert.ok(webDevelopment < gameDevelopment);
});

test('omits temporarily hidden audio projects from the built page', () => {
  for (const id of ['personal-soundcloud', 'mp3-maker']) {
    assert.doesNotMatch(html, new RegExp(`data-project-trigger="${id}"`));
    assert.doesNotMatch(html, new RegExp(`id="project-detail-${id}"`));
  }
});

test('shows Coming soon only for projects with that explicit status', () => {
  const card = (id) => {
    const start = html.indexOf(`data-project-trigger="${id}"`);
    assert.notEqual(start, -1, `Missing card for ${id}`);
    return html.slice(start, html.indexOf('</button>', start));
  };

  assert.doesNotMatch(card('unreal-engine-5'), /Coming soon/);
  assert.match(card('song-finder'), /Coming soon/);
});
```

- [ ] **Step 2: Run the contract test and verify RED**

Run: `node --test tests/project-index-contract.test.mjs`

Expected: FAIL because Game Development still precedes Web Development, both audio projects still render, and Unreal Engine still inherits the Coming soon label.

- [ ] **Step 3: Add reversible project visibility**

In `src/data/projects.ts`, extend `Project`:

```ts
visible?: boolean;
```

Set this property on both temporarily hidden entries:

```ts
visible: false,
```

Do not remove or comment out any other fields from either project.

- [ ] **Step 4: Filter hidden projects and reorder categories**

In `src/components/Projects.astro`, define Web Development first and filter once before rendering:

```ts
const categories = [
  ['web-development', 'Web Development'],
  ['game-development', 'Game Development'],
  ['automation', 'Automation & Systems'],
  ['native-tools', 'Native & Tools'],
] as const;

const visibleProjects = projects.filter(project => project.visible !== false);
```

Change the category renderer from `projects.filter(...)` to `visibleProjects.filter(...)`.

- [ ] **Step 5: Make the card status badge explicit**

In `src/components/ProjectCard.astro`, derive no label when `project.status` is absent:

```ts
const statusLabel = project.status
  ? { live: 'Live demo', 'public-demo': 'Public demo', readonly: 'Read-only', 'under-construction': 'Under construction', 'coming-soon': 'Coming soon' }[project.status]
  : undefined;
```

Wrap the existing badge span in `{statusLabel && (...)}`. Leave the subtitle and all other card content unchanged.

- [ ] **Step 6: Run the contract test and verify GREEN**

Run: `node --test tests/project-index-contract.test.mjs`

Expected: PASS, including the new order, visibility, and status assertions.

- [ ] **Step 7: Run full verification**

Run: `npm test`

Expected: PASS with the complete Node test suite.

Run: `npm run build`

Expected: PASS with a successful Astro production build.

- [ ] **Step 8: Commit the focused change**

```bash
git add docs/superpowers/plans/2026-08-09-project-section-priorities.md tests/project-index-contract.test.mjs src/data/projects.ts src/components/Projects.astro src/components/ProjectCard.astro
git commit -m "feat: reprioritize portfolio projects"
```
