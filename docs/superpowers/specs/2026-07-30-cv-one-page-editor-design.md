# CV One-Page Editor Design

## Goal

Make the résumé page guarantee a printable one-page PDF, give the editor the structural
editing it currently lacks, and fix the toolbar defects that make the page look unfinished.

The finished page should:

- Render every CV version to exactly one Letter page, on screen and in print.
- Tell the editor how full the page is and, when content still overflows, how much to cut.
- Let Philippe add and delete jobs, bullet points, projects, schools, and sidebar sections.
- Keep English and French CV data structurally identical through every edit.
- Present a uniform white-on-black toolbar that does not break when editing is unlocked.
- Close the password and name dialogs when Cancel is clicked.

## Current-state findings

Measured by rendering each CV to a real PDF through headless Chrome at Letter size with zero
page margins:

| CV | Main column | Fill vs. 1056px | PDF pages |
| --- | --- | --- | --- |
| `game-full-stack` | 1028px | 97% | 1 |
| `backend-software-developer` | 1071px | 101% | 2 |
| `customer-solutions-consultant` | 1315px | 125% | 2 |

- Two of three CV versions already print to two pages. The third clears one page by 28px,
  roughly one line of body text, so any edit tips it over.
- Sidebar columns run 874–917px against the same 1056px budget. The left column wastes space
  while the right column overflows.
- The second PDF page is almost empty in every failing case: a sliver of text over a full-height
  sidebar background.
- Nothing in the page measures its own height. There is no feedback of any kind while editing.

### Editor limits

- `Editor.ts` only rebinds `contenteditable` on elements that the renderer already emitted. Every
  edit is a text replacement of an existing value.
- No array in the data can grow or shrink from the UI: `main.experience.items`,
  `main.projects.items`, `main.education.items`, `sidebar.sections`, and every `points` array are
  fixed at whatever the JSON already contains.
- `createBlankResume` in `server/cv-data.cjs` empties `experience.items`, `projects.items`, and
  `education.items`. A blank CV is therefore a dead end: the New Blank button produces a document
  that the UI can never populate.

### Toolbar and dialog defects

- `#resume-body a { color: var(--accent-primary) }` has ID specificity `(1,0,1)` and beats
  `.toolbar-link { color: #f4f6f8 }` at `(0,1,0)`. The Portfolio link therefore renders blue on
  black while every sibling control renders white.
- `#editor-actions` is a flex child of `.resume-toolbar-actions`, which wraps. Unlocking editing
  puts ten controls in a two-column grid row, and the wrapped edit buttons collide with the CV
  version select.
- The social icon row is left-aligned inside a centred sidebar header block.
- Both `#editor-login-dialog` and `#cv-name-dialog` implement Cancel as
  `<button type="submit" formmethod="dialog">` inside a form whose input is `required`.
  `formmethod="dialog"` does not bypass constraint validation; only `formnovalidate` does. With an
  empty field the browser blocks the submit and the dialog never closes. One cause, two bugs.

The `/api/cvs` 404 seen in `astro dev` is expected: the Express API is not running in that mode
and the controller falls back to embedded data. It is not a defect.

## Scope

### In scope

- A page-fit engine that measures rendered height and applies bounded automatic tightening.
- A page-fill gauge and a page-break ruler in edit mode.
- Add and delete for jobs, bullet points, projects, schools, and sidebar sections.
- English/French structural parity for every add and delete.
- One-step undo for structural deletions.
- A two-row toolbar with uniform white-on-black styling.
- Centred sidebar social icons.
- A Cancel fix for both dialogs.
- Unit tests for the fit ladder and structural operations, plus a PDF page-count test.

### Out of scope

- Reordering items, whether by drag-and-drop or arrow buttons.
- Show/hide toggles that exclude an item from render without deleting it.
- Editing link URLs, sidebar icon classes, or the document title from the UI.
- Deleting whole CV versions.
- Multi-page CV support or a page-count selector.
- AI-assisted content tailoring or trimming.
- Any change to authentication, storage, or the deployment pipeline.

## Alternatives considered

### Hard auto-fit to exactly one page

Always scale content to fill the page regardless of length. Guarantees the requirement
unconditionally, but a long CV silently degrades to unreadable type with no signal that anything
is wrong. Rejected: a CV that fits and cannot be read has failed at its actual job.

### Warn only, never adjust rendering

Show the overflow and let the author trim by hand. Simplest and fully predictable, but it makes
the author solve a 1% overflow — the Backend CV's exact situation — by rewriting prose, when a
spacing step absorbs it invisibly. Rejected as needless work.

### Bounded auto-fit with explicit reporting (chosen)

Tighten spacing first, then scale type down to a floor of 92%, and report honestly when that is
not enough. Absorbs realistic overflow without ever producing type too small to read, and keeps
the author in control of real content cuts.

## Architecture

### Page-fit engine

New module `src/scripts/resume/page-fit.ts`, pure and browser-independent. It receives a measure
function and an apply function, so the ladder logic unit-tests without a DOM.

**Budget.** One Letter page is 1056px at 96dpi. A 16px safety buffer absorbs printer rounding,
giving a usable budget of **1040px**.

**Measurement.** Height is the greater of the two column heights. Each column is measured as the
union of its children's bounding boxes, not `scrollHeight`: the CSS grid stretches both columns to
the taller row height, so `scrollHeight` reports the stretched height for both and is useless for
this purpose. This was confirmed empirically while gathering the numbers above.

**Density ladder.** Five discrete states, each individually styleable and testable:

| Step | Spacing | Font scale |
| --- | --- | --- |
| 0 | normal | 100% |
| 1 | tight | 100% |
| 2 | tight | 96% |
| 3 | tighter | 96% |
| 4 | tighter | 92% |

The engine starts at step 0 and advances to the first step whose measured height fits the budget.
State is applied as `data-density="N"` on `.container` together with a `--fit-scale` custom
property. All sizing lives in CSS; the engine never writes individual element styles.

**Result.** `{ step, heightPx, budgetPx, fits, overflowPx, linesToCut }`, where `linesToCut` is
`ceil(overflowPx / lineHeightPx)` using the computed body line-height at the settled step.

**When it runs.** On every render, and debounced at 150ms on every edit input. Auto-fit applies in
all modes, not only edit mode, so the on-screen document is a truthful preview of the PDF.

### Gauge and ruler

The gauge occupies the left of the edit row and reports three states:

- `✓ fits one page` — settled at step 0.
- `✓ fits — auto-tightened` — settled at steps 1–4.
- `⚠ 106% — cut ~3 lines` — still over budget at step 4.

The reported percentage is always `heightPx / budgetPx` at the **settled** step, so it reflects
what will actually print rather than the untightened height.

A dashed rule overlays `.container` at the 1040px mark, shown only in edit mode, so the author can
see where the page boundary falls rather than only that it was crossed.

### Structural editing

Add and delete are **controller methods**, not `Editor` methods. `Editor` is handed a single
`ResumeLanguageData` and cannot see the other language; the controller owns `state.data` with both.

**Bilingual parity is the central constraint.** Every insertion and removal applies to `en` and
`fr` at the same index. Divergent arrays would pass `assertResumeData` in `server/cv-data.cjs`
unnoticed — it validates each language independently and never compares them — and would surface
later as a corrupted French CV. New items are inserted into both languages with language-appropriate
placeholder text.

Controls appear on hover in edit mode: `+ Add job`, `+ bullet`, `+ Add project`, `+ Add school`,
`+ Add section`, and `✕` on each job, bullet point, project, school, and sidebar section.

Deletion takes effect immediately and marks the document dirty. The status line then offers
`Job deleted. [Undo]`, holding one step of undo. This is preferred to a confirmation dialog on
every click because it keeps editing fast and composes with the existing safety net: nothing
persists until Save, and backups cover everything after that.

No server change is required. `assertResumeData` already accepts arrays of any length.

### Toolbar

`.resume-toolbar` becomes two stacked rows:

- **View row**, always present: Portfolio link, CV picker, spacer, FR, Print, Edit.
- **Edit row**, present only while editing: gauge on the left; Rename, Duplicate, New Blank, Save,
  History, Exit on the right.

Separate rows cannot compete for width, which is the direct cause of the current collision. The
status line spans the full width beneath both rows.

Colour is unified to `#f4f6f8` on `#24272d` across links, buttons, the select, and the "CV version"
label. The Portfolio link specifically requires `#resume-body .toolbar-link` to outrank the
generic `#resume-body a` accent rule; a plain class-level colour will not take effect.

Every existing element id is preserved, so `tests/resume-page-contract.test.mjs` continues to pass.

### Sidebar icons

`.social-row` gains `justify-content: center` so the three icons centre under the contact block,
matching the centred header above them.

### Dialog Cancel

Both Cancel buttons become `type="button"` driven by a shared `[data-dialog-close]` delegated
handler that closes the dialog and clears its error text and inputs. This sidesteps constraint
validation entirely rather than papering over it with `formnovalidate`.

## Error handling

- If measurement returns 0 or a non-finite height — detached DOM, fonts not yet loaded — the
  engine holds the previous density step rather than snapping to step 0 and causing a visible jump.
- Auto-fit runs after `document.fonts.ready` on first render, since web font metrics change
  measured height materially.
- Structural edits on a degraded (offline API) document are blocked, consistent with the existing
  treatment of the CV picker and editing controls in that state.
- Undo is discarded when the version changes, on save, and on exiting edit mode, so it can never
  reapply to the wrong document.

## Testing

Unit tests, `node:test`, matching the existing suite's style:

- **Fit ladder.** Given a stubbed measure function, the engine selects the lowest sufficient step;
  reports `fits: false` with correct `overflowPx` and `linesToCut` when step 4 is insufficient;
  holds the previous step on a zero or non-finite measurement.
- **Structural operations.** Add and delete keep `en` and `fr` arrays parallel in length and index;
  undo restores the prior state exactly; every operation marks the document dirty; operations are
  rejected while degraded.

Integration:

- **PDF page count.** Render each CV version through headless Chrome at Letter size and assert the
  output is exactly one page. This is the requirement stated literally, and it is the method that
  produced the current-state table above.

Existing tests must continue to pass unchanged, in particular the element-id assertions in
`tests/resume-page-contract.test.mjs`.

## Decisions taken

- Auto-fit applies on screen as well as in print, so the preview never lies about the PDF.
- Deletion is immediate with one-step undo rather than guarded by a confirmation dialog.
- The type floor is 92%, keeping body text at or above roughly 8.3pt for print and ATS legibility.
- Reordering is deliberately excluded; it was raised and set aside to keep this change focused.
