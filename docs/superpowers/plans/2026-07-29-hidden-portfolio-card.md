# Hidden Portfolio Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the obsolete ChatroomWars portfolio entry with an accurate, screenshot-led showcase of the live Hidden browser strategy game.

**Architecture:** Keep the established expandable project-index architecture. Update the typed project record and its contract tests, add one real gameplay image, and reuse `StandardProjectDetails.astro` for the expanded presentation.

**Tech Stack:** Astro 5, TypeScript, Tailwind CSS 4, Node test runner, live Browser inspection

## Global Constraints

- The project ID changes from `chatroomwars` to `hidden`; no active portfolio data may retain the old ID.
- The live action URL is exactly `https://hidden.philippeho.dev`.
- The card must not describe the current client as Unity or WebGL.
- The card must not claim private rooms, replay persistence, or reconnection support.
- The current screenshot must show live Hidden gameplay and contain no account credentials or private user data.
- The expanded detail remains keyboard accessible and uses the existing safe new-tab link behavior.
- Preserve the portfolio's current project-grid layout and visual language.

---

## File map

- `tests/project-index-contract.test.mjs` — owns the generated-HTML contract for the Hidden card, expanded panel, current URL, and stale-copy exclusions.
- `src/data/projects.ts` — remains the single source of card and expanded-detail copy.
- `public/assets/img/hidden-gameplay.webp` — stores the optimized live offline-practice screenshot.
- `public/assets/img/chatroomwars.webp` — becomes unused; remove it only after `rg` confirms no references remain.

### Task 1: Replace ChatroomWars with Hidden

**Files:**
- Modify: `tests/project-index-contract.test.mjs`
- Modify: `src/data/projects.ts`
- Create: `public/assets/img/hidden-gameplay.webp`
- Delete: `public/assets/img/chatroomwars.webp`

**Interfaces:**
- Consumes: the existing `Project` and `ProjectPreview` interfaces and the generic `StandardProjectDetails.astro` renderer.
- Produces: one `Project` with `id: "hidden"`, three highlights, a 1280×720 preview, and a safe live link.

- [ ] **Step 1: Write the failing Hidden contract**

In `tests/project-index-contract.test.mjs`, replace `chatroomwars` with `hidden` in `richProjectIds` and the expandable-index ID list. Add this focused contract:

```js
test('presents Hidden as the current live browser strategy game', () => {
  const detail = projectDetail('hidden');

  assert.match(html, /data-project-trigger="hidden"/);
  assert.match(detail, /Blind-board Strategy Game/);
  assert.match(detail, /React · TypeScript · WebSocket · PostgreSQL/);
  assert.match(detail, /assets\/img\/hidden-gameplay\.webp/);
  assert.match(detail, /Blind-board tactics/);
  assert.match(detail, /Online and offline play/);
  assert.match(detail, /Production account backend/);
  assert.match(
    detail,
    /href="https:\/\/hidden\.philippeho\.dev"[^>]+target="_blank"[^>]+rel="noreferrer"/,
  );

  assert.doesNotMatch(html, /ChatroomWars|Unity WebGL|\/hiddengame\//);
});
```

Update the screenshot-led proof test so `hidden` is included in the same three-highlight and 1280×720 assertions as the other finished standard projects.

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```powershell
node --test tests/project-index-contract.test.mjs
```

Expected: FAIL because `data-project-trigger="hidden"` and `hidden-gameplay.webp` are absent while the generated HTML still contains ChatroomWars.

- [ ] **Step 3: Capture and optimize current gameplay**

Use the live Browser at `https://hidden.philippeho.dev`:

1. Choose **Play as Guest**.
2. Choose **Offline**.
3. Start the default practice match.
4. Wait until the battle screen shows the board, power-ups, and rock/paper/scissors controls.
5. Capture a 1280×720 screenshot with no browser chrome.
6. Save the raw capture to `tmp/hidden-gameplay.png`.

Convert it using the Sharp dependency already installed through Astro:

```powershell
node --input-type=module -e "import sharp from 'sharp'; await sharp('tmp/hidden-gameplay.png').resize(1280,720,{fit:'cover',position:'centre'}).webp({quality:82}).toFile('public/assets/img/hidden-gameplay.webp')"
```

Verify the artifact:

```powershell
node --input-type=module -e "import sharp from 'sharp'; const m=await sharp('public/assets/img/hidden-gameplay.webp').metadata(); if(m.width!==1280||m.height!==720||m.format!=='webp') process.exit(1); console.log(m)"
```

Expected: `width: 1280`, `height: 720`, and `format: 'webp'`.

- [ ] **Step 4: Replace the project record**

Replace the first object in `src/data/projects.ts` with:

```ts
{
    id: "hidden",
    title: "Hidden",
    category: "Game Development",
    subtitle: "Blind-board Strategy Game",
    description: "A browser strategy game built around hidden information — place rock, paper, and scissors on a blind 3×3 board, use tactical power-ups, and battle a bot or another player online.",
    link: "https://hidden.philippeho.dev",
    detail: "standard",
    accent: "#facc15",
    icon: "fa-solid fa-eye-slash",
    tags: ["React", "TypeScript", "WebSocket"],
    status: "live",
    detailDescription: "A turn-based strategy game that mixes a concealed 3×3 board with rock-paper-scissors matchups, tactical power-ups, and fast browser-based matches.",
    stackLabel: "React · TypeScript · WebSocket · PostgreSQL",
    actionLabel: "Play Hidden",
    preview: {
        src: "assets/img/hidden-gameplay.webp",
        alt: "Hidden offline practice match showing the blind board, power-ups, timer, and rock paper scissors controls",
        caption: "Offline practice · active blind-board match",
        width: 1280,
        height: 720,
    },
    highlights: [
        {
            icon: "fa-solid fa-table-cells",
            title: "Blind-board tactics",
            detail: "A concealed 3×3 board combines tic-tac-toe positioning, Battleship-style uncertainty, and rock-paper-scissors matchups.",
        },
        {
            icon: "fa-solid fa-people-arrows-left-right",
            title: "Online and offline play",
            detail: "WebSocket quick matching supports live opponents while configurable practice keeps the full game playable against a bot.",
        },
        {
            icon: "fa-solid fa-database",
            title: "Production account backend",
            detail: "Optional accounts and browser sessions persist in PostgreSQL while unrestricted guest play remains available.",
        },
    ],
},
```

- [ ] **Step 5: Run the focused test and verify GREEN**

Run:

```powershell
node --test tests/project-index-contract.test.mjs
```

Expected: all project-index contract tests PASS.

- [ ] **Step 6: Remove the obsolete image after reference verification**

Run:

```powershell
rg -n "chatroomwars\.webp|ChatroomWars|hiddengame" src tests public -g '!public/assets/img/chatroomwars.webp'
```

Expected: no matches. Then remove only `public/assets/img/chatroomwars.webp`.

- [ ] **Step 7: Run the complete static verification**

Run:

```powershell
node --test --test-concurrency=1 tests
npm run build
git diff --check
```

Expected: all Node tests pass, Astro builds successfully, and `git diff --check` prints no errors.

- [ ] **Step 8: Verify the interaction visually**

Run the production preview:

```powershell
npm run preview -- --host 127.0.0.1 --port 4321
```

With Browser:

1. Open `http://127.0.0.1:4321/#projects`.
2. Confirm the collapsed card says Hidden and no stale ChatroomWars copy is visible.
3. Expand it with the keyboard.
4. Confirm the screenshot is legible, all three proof points render, and the CTA targets `https://hidden.philippeho.dev`.
5. Test 1280×800 and 390×844 viewports.
6. Confirm there is no horizontal overflow and no browser console error.

- [ ] **Step 9: Commit**

```powershell
git add -- tests/project-index-contract.test.mjs src/data/projects.ts public/assets/img/hidden-gameplay.webp public/assets/img/chatroomwars.webp
git commit -m "feat: replace ChatroomWars with Hidden"
```
