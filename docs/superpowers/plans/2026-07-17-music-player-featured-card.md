# MusicPlayer Featured Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the inaccurate “Coming soon” Rust Music Player tile with a screenshot-led featured card that accurately presents the released desktop app and gives visitors clear Windows, macOS, source, and release actions.

**Architecture:** Add one focused Astro component for the featured native app, render it before the remaining Native & Tools cards, and remove the redundant Music Player record from the generic project data. Use a real screenshot captured from the published v1.0.0 Windows release without cloning, pulling, or modifying the MusicPlayer repository.

**Tech Stack:** Astro 5, Tailwind CSS 4, Node.js built-in test runner, GitHub Releases, Playwright CLI for responsive browser verification.

## Global Constraints

- Do not clone, pull, edit, commit, or otherwise modify `PhilHo-Projects/MusicPlayer`.
- Use the published MusicPlayer v1.0.0 release only for screenshot capture and verified download URLs.
- Preserve Song Finder as a smaller `Coming soon` card.
- State that the current binaries are unsigned so visitors are not surprised by Windows SmartScreen or macOS Gatekeeper.
- Keep the card inside the portfolio's existing dark mono visual system and make it responsive without adding dependencies.
- Do not push, deploy, or modify the remote `main` branch before the user inspects localhost.

---

### Task 1: Lock the featured-card behavior with a failing build test

**Files:**
- Create: `tests/music-player-featured-card.test.mjs`

**Interfaces:**
- Consumes: Astro's production build output at `dist/index.html`.
- Produces: Assertions for the card marker, accurate feature copy, screenshot, download actions, source link, and removal of the generic Music Player tile.

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

test('renders MusicPlayer as a released featured native app', () => {
  assert.match(html, /data-featured-project="music-player"/);
  assert.match(html, /Native DJ-focused audio player/);
  assert.match(html, /10-band EQ/);
  assert.match(html, /Traktor/);
  assert.match(html, /assets\/img\/music-player-v1\.0\.0\.png/);
});

test('offers verified platform downloads and source access', () => {
  assert.match(html, /data-download="windows"/);
  assert.match(html, /MusicPlayer-v1\.0\.0\.zip/);
  assert.match(html, /data-download="macos"/);
  assert.match(html, /MusicPlayer-macos-v1\.0\.0\.zip/);
  assert.match(html, /https:\/\/github\.com\/PhilHo-Projects\/MusicPlayer/);
  assert.match(html, /Unsigned indie build/);
});

test('removes the inaccurate generic Music Player card', () => {
  assert.doesNotMatch(html, /MusicBee-style desktop client/);
  assert.doesNotMatch(html, /Music Player[\s\S]{0,200}Coming soon/);
  assert.match(html, /Song Finder/);
});
```

- [x] **Step 2: Run the test to verify RED**

Run: `node --test tests\music-player-featured-card.test.mjs`

Expected: FAIL because the production HTML does not contain `data-featured-project="music-player"`.

- [x] **Step 3: Commit the test with the implementation task**

Do not commit while RED; keep the verified failing test in the working tree for Task 2.

### Task 2: Capture a genuine release screenshot and implement the card

**Files:**
- Create: `public/assets/img/music-player-v1.0.0.png`
- Create: `src/components/MusicPlayerFeatured.astro`
- Modify: `src/components/Projects.astro`
- Modify: `src/data/projects.ts`
- Test: `tests/music-player-featured-card.test.mjs`

**Interfaces:**
- Consumes: the v1.0.0 Windows release asset, existing global color/font utilities, and the `ProjectCard` list for Song Finder.
- Produces: `<MusicPlayerFeatured />` with `data-featured-project="music-player"`, `data-download="windows"`, and `data-download="macos"` hooks.

- [x] **Step 1: Capture the published app, not a mockup**

Download `MusicPlayer-v1.0.0.zip` to a temporary directory with `gh release download v1.0.0 --repo PhilHo-Projects/MusicPlayer --pattern MusicPlayer-v1.0.0.zip`, extract it outside the portfolio and launch `MusicPlayer.exe`. Capture the real UI at a readable desktop size; crop only surrounding desktop chrome and save the result as `public/assets/img/music-player-v1.0.0.png`. Delete the temporary release files after capture.

- [x] **Step 2: Add the focused featured component**

Create `src/components/MusicPlayerFeatured.astro` with:

```astro
---
const screenshot = import.meta.env.BASE_URL + 'assets/img/music-player-v1.0.0.png';
const repository = 'https://github.com/PhilHo-Projects/MusicPlayer';
const release = `${repository}/releases/tag/v1.0.0`;
const windowsDownload = `${repository}/releases/download/v1.0.0/MusicPlayer-v1.0.0.zip`;
const macDownload = `${repository}/releases/download/v1.0.0/MusicPlayer-macos-v1.0.0.zip`;
---
```

Render one responsive, screenshot-led `<article data-featured-project="music-player">` with the visible copy “Native DJ-focused audio player,” the proof points “10-band EQ,” “Live FFT + waveform,” and “Traktor analysis,” platform badges for Windows and macOS, direct download anchors using the two `data-download` attributes, a `View source` anchor to `repository`, a `Release notes` anchor to `release`, and the note “Unsigned indie build — Windows SmartScreen or macOS Gatekeeper may ask for confirmation.”

- [x] **Step 3: Integrate it without duplication**

Import `MusicPlayerFeatured` in `src/components/Projects.astro`, render it first inside `#native-tools`, and add a top margin before the generic Native & Tools grid. Remove only the `Rust Music Player` object from `src/data/projects.ts`; keep the Song Finder object unchanged.

- [x] **Step 4: Run the feature test to verify GREEN**

Run: `node --test tests\music-player-featured-card.test.mjs`

Expected: 3 tests pass, 0 fail.

- [x] **Step 5: Run the existing regression test**

Run: `node --test tests\job-scraper-case-study.test.mjs`

Expected: 3 tests pass, 0 fail.

- [x] **Step 6: Commit the working feature**

```bash
git add public/assets/img/music-player-v1.0.0.png src/components/MusicPlayerFeatured.astro src/components/Projects.astro src/data/projects.ts tests/music-player-featured-card.test.mjs docs/superpowers/plans/2026-07-17-music-player-featured-card.md
git commit -m "feat: feature MusicPlayer downloads"
```

### Task 3: Responsive visual verification and localhost handoff

**Files:**
- Modify only files from Task 2 if a failing visual check requires a correction.

**Interfaces:**
- Consumes: the Astro development server and the completed card.
- Produces: a localhost instance ready for user inspection.

- [x] **Step 1: Start the portfolio locally**

Run `npm run dev -- --host 127.0.0.1 --port 4321` in a hidden background process and leave it running for the user's inspection.

- [x] **Step 2: Verify desktop rendering**

Open `http://127.0.0.1:4321/#native-tools` at 1440×1000. Confirm the app screenshot is readable, all four actions are visible, there is no horizontal overflow, and Song Finder remains below the featured card.

- [x] **Step 3: Verify mobile rendering**

Resize to 390×844. Confirm actions wrap or stack without clipping, the screenshot retains useful content, the security note remains readable, and the page width equals the viewport width.

- [x] **Step 4: Verify action destinations without downloading**

Read the rendered anchor `href` values and confirm they match the repository, v1.0.0 release page, Windows asset, and macOS asset. Do not trigger a download during this check.

- [x] **Step 5: Run final verification**

Run: `node --test --test-concurrency=1`

Expected: 6 tests pass, 0 fail.

Run: `npm run build`

Expected: Astro build succeeds with no errors.

- [x] **Step 6: Hand off localhost**

Report `http://127.0.0.1:4321/#native-tools`, the active branch, the backup branch containing Claude's WIP, and that no Rust repository, remote branch, or production deployment was modified.
