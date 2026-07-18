# Expandable Project Index — Design and New-Task Handoff

## Purpose

Replace the portfolio's oversized always-open project showcases and legacy modal/iframe system with a compact project index. Every project is compact by default. Selecting one expands its detail presentation inline, pushes later projects down, and keeps the visitor in the Projects section.

This document is the source of truth for the next Codex task. The current task intentionally made no UI or behavior changes.

## Current repository state

- Repository: `D:\WebDev\Portfolio`
- Branch: local `main`
- Current HEAD: `17cabe3`
- Local `main` is 8 commits ahead of `origin/main`; do not lose or overwrite those commits.
- The working tree was clean when this document was prepared.
- Do not merge `codex/claude-wip-backup`; it preserves a discarded redesign.
- Do not push or deploy unless the user asks separately.
- Do not modify any external project repository, including Billing Hub, MusicPlayer, Job Scraper/n8n, or their deployments.

## Why the current layout needs to change

The project section now represents roughly 13 projects. Billing Hub, the n8n Job Scraper, and MusicPlayer are rendered as large permanent showcases, while the other projects use small cards that open an old full-screen iframe/image/carousel modal. The result has two problems:

1. The permanent showcases dominate the page and make scanning slow.
2. The modal removes the visitor from the project list and feels disconnected from the portfolio.

An irregular bento layout was considered but rejected as the main information architecture. With this many projects, arbitrary tile sizes weaken scanning and imply a hierarchy that will become harder to maintain.

## Approved experience

### Default state

- Every project loads as a compact tile.
- No project is expanded on initial page load.
- Category anchors such as `#web-development` and `#native-tools` continue to work.
- Use a uniform responsive grid rather than a highly irregular bento composition.

### Expansion behavior

- Clicking a compact tile expands that project's detail panel inline.
- The expanded panel spans the full category width and appears directly after the selected tile's current visual row.
- Later tiles are pushed down; there is no overlay, body scroll lock, iframe modal, or detached drawer.
- Only one project may be expanded across the entire Projects section.
- Clicking the active tile or its explicit **Collapse details** control closes it.
- Selecting another tile closes the current panel and opens the new one.
- `Escape` collapses the active project without moving focus away from its trigger.
- After opening, use `scrollIntoView({ block: 'nearest' })` only when needed. Respect `prefers-reduced-motion`.
- Expansion state does not need URL/hash synchronization in the first version.

### Responsive placement

The category grid should render compact tiles normally. Each pre-rendered detail panel is a hidden full-width grid child. When a project opens:

1. Find the selected tile's visual row using its `offsetTop`.
2. Find the last compact tile in that row.
3. Move the selected project's detail panel after that tile.
4. Show it as a full-width grid child.

On a one-column mobile grid, the panel naturally appears immediately after its tile. Reposition the active panel after responsive resizes so it remains after the correct visual row.

Do not animate layout height. A short opacity/translate reveal is enough; disable it for reduced motion.

## Project presentation levels

### Rich existing details

Preserve the content and assets already built, but render each only after its compact tile is expanded:

- **Billing Hub:** reuse the dashboard and invoice presentation from `BillingHubFeatured.astro`; retain the exact public-demo URL and the plain **Private repository** status. Never add a source link.
- **Automated Job Intelligence Pipeline:** reuse the workflow/dashboard presentation from `JobScraperCaseStudy.astro`. The dashboard CTA becomes a normal external link. The workflow is already visible; if it needs a larger view, link directly to the local image asset in a new tab instead of using the modal.
- **MusicPlayer:** reuse the released-app presentation from `MusicPlayerFeatured.astro`, including Windows/macOS downloads, source link, release notes, and unsigned-build warning.
- **Unreal Engine coursework:** preserve certificate/coursework browsing inside the inline expanded panel. Do not retain the full-screen carousel modal solely for this project.

These components may be renamed to `*Details.astro`, or may accept an embedded/detail-only mode. Avoid duplicating their content.

### Standard details

All remaining projects should use one reusable detail layout driven by project data:

- Title, subtitle, description, status, tags, and icon/accent
- One clear primary action when a real destination exists
- Live/read-only/under-construction language that accurately matches the project
- No iframe embedding
- External destinations open in a new tab with `rel="noreferrer"`
- Projects without a valid destination show status information instead of a fake or disabled CTA

## Known project-status constraints

- Billing Hub is live, has a public demo, and has a private repository.
- MusicPlayer is released and downloadable; do not modify its Rust repository.
- Job Scraper/Job Viewer has a live dashboard and a real workflow image.
- Song Finder is not ready for a demo and remains coming soon.
- ClassAction Scanner was identified by the user as under construction. Its current `status: "live"` data is stale and must not be carried forward as a live claim.
- The Fitbit app is also under construction and is not currently displayed. Do not add it during this layout refactor unless the user expands the scope.

## Legacy modal removal

The old project modal system should be removed once no project depends on it:

- Remove the `#project-modal` markup from `src/pages/index.astro`.
- Remove project-modal globals and logic from `src/scripts/main.ts`:
  - `openProjectModal`
  - `closeProjectModal`
  - `openImageModal`
  - `openCertificateModal`
  - modal reset/loading/error/iframe logic
  - modal backdrop and keyboard handlers
  - carousel state and touch handlers after coursework moves inline
- Keep unrelated resume, email, toast, and contact behavior.
- Remove `onclick` strings from `ProjectCard.astro`.
- Remove all remaining calls to the old modal functions from the Job Scraper and other project components.
- Remove the now-unused `certificates` import from `main.ts` after coursework content owns it.

Before deleting anything, use `rg` to prove every removed global/DOM id has no remaining consumer.

## Suggested component boundaries

The next task should confirm exact names during planning, but keep these responsibilities separate:

- `Projects.astro`: category composition and project ordering
- Compact tile component: semantic button, status, tags, `aria-expanded`, and `aria-controls`
- Generic detail component: reusable expanded presentation for standard projects
- Rich detail components: Billing Hub, Job Scraper, MusicPlayer, and coursework
- A small client-side controller: one-open-at-a-time state, panel placement, resize repositioning, focus/keyboard behavior
- `projects.ts`: stable IDs and accurate data/action/status fields; avoid modal-specific `type` values

The compact trigger must not contain nested links. Links and download actions belong inside the expanded panel.

## Accessibility and interaction requirements

- Use a real `<button>` for every compact project trigger.
- Each trigger owns `aria-expanded="false|true"` and `aria-controls="project-detail-<id>"`.
- Each detail panel has the corresponding stable ID and an accessible heading.
- Preserve visible keyboard focus.
- Keep all primary touch targets at least 44px high.
- Never communicate live/read-only/under-construction status through color alone.
- Opening or closing a project must not trap focus or lock page scrolling.
- Expansion motion must have a reduced-motion alternative.
- The 390px layout must have no horizontal overflow.

## Test-first acceptance criteria

The implementation task should use TDD and browser verification. At minimum, prove:

1. The new test fails before implementation for the missing compact/expanded contract.
2. Every project, including Billing Hub, Job Scraper, MusicPlayer, and coursework, has a compact trigger.
3. The page loads with zero expanded projects.
4. Clicking a tile opens its matching panel and sets `aria-expanded="true"`.
5. Clicking a second tile closes the first; only one panel is visible globally.
6. Clicking the active tile and pressing `Escape` both collapse it.
7. The expanded panel is positioned after the selected tile's visual row at desktop and after the tile on mobile.
8. Repositioning remains correct after viewport resize.
9. Billing Hub, Job Scraper, and MusicPlayer retain their verified actions and assets.
10. ClassAction is not labeled live.
11. No project uses an iframe or the old modal globals.
12. `#project-modal` and all obsolete modal IDs/functions are absent from production output.
13. All external links use safe new-tab attributes.
14. Existing project tests are updated without weakening their content/action assertions.
15. The complete Node suite and `npm run build` pass.
16. Playwright checks desktop and 390px mobile layouts for overflow, console errors, correct one-open behavior, keyboard use, and 44px actions.

## Files the next task should inspect first

- `AGENTS.md`
- `src/components/Projects.astro`
- `src/components/ProjectCard.astro`
- `src/components/BillingHubFeatured.astro`
- `src/components/JobScraperCaseStudy.astro`
- `src/components/MusicPlayerFeatured.astro`
- `src/data/projects.ts`
- `src/data/certificates.ts`
- `src/pages/index.astro`
- `src/scripts/main.ts`
- `tests/billing-hub-feature.test.mjs`
- `tests/job-scraper-case-study.test.mjs`
- `tests/music-player-featured-card.test.mjs`

## Out of scope

- Editing external project repositories
- New screenshots or project audits
- Adding Fitbit or other missing projects
- New portfolio case-study routes
- Deploying or pushing the portfolio
- Broad typography or brand redesign outside the Projects section

## Ready-to-paste prompt for a new Plan Mode task

```text
We are working in D:\WebDev\Portfolio. Stay in Plan Mode and do not implement yet.

Read AGENTS.md and then read this handoff completely:
docs/superpowers/specs/2026-07-18-expandable-project-index-design.md

Treat that document as the approved product/design source of truth. Inspect the listed current files and git state, then write a concise but execution-ready implementation plan for replacing the legacy project modal system and oversized permanent showcases with a compact-by-default project index where one project expands inline at a time.

The plan must cover Billing Hub, the n8n Job Scraper/Job Viewer, both Rust projects (MusicPlayer and Song Finder), coursework/certificates, and all standard project cards. Preserve MusicPlayer downloads, Billing Hub's private-repo/public-demo rules, and Job Scraper visuals/actions. ClassAction is under construction despite its stale current live status. Fitbit is out of scope.

Plan the removal of the old iframe/image/carousel modal only after all consumers have inline replacements. Use TDD, accessibility requirements, responsive row placement, resize behavior, and Playwright desktop/mobile verification. Do not touch any external project repo, do not push, and do not deploy.

Before proposing the plan, verify that local main still contains the existing unpushed n8n, MusicPlayer, and Billing Hub commits and preserve all user work. Ask only if a genuinely blocking ambiguity remains; otherwise make reasonable implementation-level decisions from the handoff.
```

