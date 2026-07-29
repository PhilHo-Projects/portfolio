# Hidden Portfolio Card and CV Manager Design

## Goal

Update the portfolio so its game showcase describes the current **Hidden** web game instead of the obsolete ChatroomWars Unity prototype, and turn the résumé page into a mobile-safe, server-backed manager for multiple named CV versions.

The finished public site should:

- Present Hidden accurately and link to `https://hidden.philippeho.dev`.
- Keep the honest game/full-stack CV as the public default.
- Add a backend-focused CV without replacing the default.
- Let visitors switch CV versions, switch language, return to the portfolio, and print the active version.
- Let Philippe unlock editing with password `0000`, then edit, rename, duplicate, create, save, and restore CV versions.
- Preserve CV edits across portfolio deployments.
- Stop serving stale PDF copies with an old portfolio URL.

## Current-state findings

- The portfolio still presents ChatroomWars as a Unity WebGL prototype and links to `https://philippeho.dev/hiddengame/`.
- Hidden is now a React and TypeScript blind-board strategy game with an offline bot, WebSocket quick matching, rock-paper-scissors pieces, power-ups, PostgreSQL accounts, and a Docker deployment.
- The live CV page has no navigation back to the portfolio.
- The current mobile rules lose to the more-specific desktop grid rule, so the CV remains an unusable two-column layout at phone widths.
- The floating language, print, and edit buttons cover CV content on narrow screens.
- The editor asks for `0000` in browser code, which does not protect write operations.
- Production uses the nginx stage from the Dockerfile, so `/api/save` and `/api/backups` return `404`; the visible editor cannot save.
- The two repository copies of `resume.pdf` are identical and contain stale website destinations. The live JSON CV data already uses `https://philippeho.dev/`.

## Scope

### In scope

- Replace the ChatroomWars project data, imagery, links, and expanded copy with Hidden.
- Add a responsive CV application bar.
- Support multiple shareable CV versions.
- Keep Game & Full-Stack Developer as the default version.
- Add a Backend Software Developer version using only factual experience and projects already represented by the portfolio and repositories.
- Add authenticated server-side CV management and revision history.
- Add **Duplicate** and **New Blank** creation paths.
- Serve the Astro build and CV API from one Node container.
- Add persistent CV storage to the portfolio Coolify application.
- Replace both existing public PDF files with an updated export of the default gaming CV.
- Test, push, and deploy the portfolio through its existing Git-backed Coolify resource.

### Out of scope

- AI-generated CV tailoring inside the website.
- Importing or parsing a job posting in the browser.
- User accounts or multiple CV administrators.
- Deleting CV versions.
- Drag-and-drop section reordering or a full rich-text editor.
- Changes to the Hidden repository or deployment.
- Changing the portfolio's overall visual identity.

## Alternatives considered

### Static CV variants

Store several JSON files in Git and switch between them in the browser. This keeps the deployment simple but makes the production editor misleading: changes would either be browser-local or require a new Git deployment.

### External CMS or database

Use a dedicated content management system or database for CV content. This provides strong administration features but adds unnecessary infrastructure and maintenance for one portfolio owner.

### Server-backed JSON manager — selected

Serve the static Astro build and a small authenticated CV API from the existing Node application. Store runtime JSON and backups in a Coolify-mounted directory. This repairs the existing editor concept with the fewest new dependencies while making edits durable and version-aware.

## Hidden portfolio presentation

The Game Development card keeps the existing expandable project-grid interaction but is rewritten as:

- Title: **Hidden**
- Subtitle: **Blind-board Strategy Game**
- Status: **Live**
- Primary action: **Play Hidden**
- URL: `https://hidden.philippeho.dev`
- Stack: **React · TypeScript · WebSocket · PostgreSQL**
- Card tags: **React**, **TypeScript**, **WebSocket**

The short description will explain that Hidden is a turn-based browser strategy game combining a concealed board with rock-paper-scissors pieces and tactical power-ups.

The expanded panel will use a current live gameplay screenshot rather than the obsolete Unity READY screen. Three proof points will cover:

1. **Blind-board tactics** — a 3×3 placement game influenced by tic-tac-toe, Battleship, and rock-paper-scissors.
2. **Online and offline play** — WebSocket quick matching against another player and configurable practice against a bot.
3. **Production account backend** — optional username/password accounts and sessions persisted in PostgreSQL while guest play remains available.

The copy must not describe the current client as Unity or WebGL. It must not claim private rooms, replay persistence, or reconnection support.

## CV public experience

### Application bar

Replace the floating circular controls with one sticky application bar above the résumé paper.

Desktop order:

1. **← Portfolio** link to `/#projects` or the portfolio root
2. CV version selector
3. EN/FR language toggle
4. **Print / PDF**
5. **Edit**

On narrow screens, the bar becomes two compact rows:

- Row one: Portfolio and the full-width CV selector
- Row two: language, print, and edit actions

The bar remains visible while reading but is completely hidden in print media.

### Version selection and sharing

The initial registry contains:

- **Game & Full-Stack Developer** — default
- **Backend Software Developer**

The active CV ID is represented by `?cv=<stable-id>`. Changing the selector updates the query parameter without reloading the portfolio shell. Opening a shared URL renders that version directly. An absent or unknown ID falls back to the default and removes the invalid selection from the visible state.

Language remains an independent EN/FR choice. Every version stores both language records so the existing language control remains predictable.

### Responsive screen layout

At phone widths, the résumé paper becomes one readable column with the sidebar first and main content second. Contact text and controls must not clip or create horizontal scrolling. The desktop paper remains centered and constrained to letter-page proportions.

Print always uses the current two-column letter layout regardless of screen width. The application bar, editor highlights, management controls, status messages, and dialogs are excluded from print.

## CV editing experience

### Unlocking

Selecting **Edit** opens an accessible password dialog. Submitting `0000` to the server creates an editor session. The browser never contains the expected password or performs the authoritative comparison.

After unlocking, the application bar exposes:

- Rename
- Duplicate
- New Blank
- Save
- History
- Exit editing

Editable CV content retains the existing inline editing model and visible focus/highlight treatment.

### Rename

Rename changes only the display name in the registry. The stable CV ID and any shared URL remain valid.

Names are trimmed, must contain visible text, and must be unique case-insensitively. A validation message appears in the dialog without discarding the entered name.

### Duplicate

Duplicate asks for a new display name and clones both languages of the active CV. The server generates a new stable ID, saves the clone, and switches the UI to it.

### New Blank

New Blank asks for a display name and derives a template from the default gaming CV.

It preserves:

- Name, photo, email, and phone supplied by the page template
- Location and portfolio, LinkedIn, and GitHub links
- Languages
- Sidebar skill/tool sections
- Localized section headings and the existing visual structure

It clears:

- Role
- Summary content
- Experience items
- Project items
- Education items

This produces a structurally valid CV that can later be filled from a job posting by editing the repository or through a future assisted workflow.

### Save and history

Save sends the complete active bilingual CV to the protected API. The server validates the payload before changing disk state, creates a timestamped backup of the previous version, writes through a temporary file, then atomically replaces the active file.

History is scoped to the active CV and lists its ten newest backups. Restoring a backup requires confirmation and creates a backup of the current content before replacement.

No delete action is exposed in this release.

## Backend-focused CV

The backend version must remain factual and should not invent a conventional backend job history. It will reposition existing work around deployed systems:

- Lead with TypeScript/JavaScript, Node/Express, WebSocket services, PostgreSQL/SQLite, Docker, Linux, APIs, and automation.
- Keep the Téléfix employment entry but phrase it around shipped software, integration, debugging, and delivery rather than pretending it was a backend role.
- Feature the current Hidden service and account backend.
- Feature server-backed portfolio work such as Billing Hub, the automated job-intelligence pipeline, ClassAction Scanner, and Manga Tracker where space allows.
- Reduce, but do not erase, Unity and Unreal references.
- Link every language version to `https://philippeho.dev/`.

The gaming version remains the default and keeps its game-development emphasis, updated only where content or links are stale.

## Data model

### Seed and runtime locations

Version-controlled seed data lives under `public/data/resumes/`.

Runtime data lives under a configurable `CV_DATA_DIR`, with the production container using `/app/runtime/cv`. Coolify mounts persistent storage at that exact path. On startup, the server copies seed data only when the runtime registry is absent; deployments never overwrite an initialized runtime directory.

### Registry

`index.json` contains:

- Schema version
- Default CV ID
- Ordered entries with stable ID, display name, creation timestamp, and update timestamp

CV IDs are server-generated and never change during rename. The two seeded IDs are human-readable and stable; later IDs receive a collision-safe generated suffix.

### Version files

Each `<id>.json` file contains the existing bilingual `ResumeData` shape. Version names belong only to the registry so renaming does not rewrite every language record.

Backups live below `backups/<id>/` and never appear in the public version list.

## HTTP API

Public read endpoints:

- `GET /api/cvs` — ordered registry metadata and default ID
- `GET /api/cvs/:id` — one bilingual CV document

Editor session endpoints:

- `POST /api/cv-editor/login`
- `POST /api/cv-editor/logout`
- `GET /api/cv-editor/session`

Protected management endpoints:

- `PUT /api/cvs/:id` — validate and save content
- `PATCH /api/cvs/:id/name` — rename
- `POST /api/cvs/:id/duplicate` — clone active version
- `POST /api/cvs` — create a blank version
- `GET /api/cvs/:id/backups` — list history
- `POST /api/cvs/:id/backups/:backupId/restore` — restore one revision

All API errors use a small JSON shape with a stable code and human-readable message. The UI keeps unsaved content in place after validation, authorization, or network failures.

## Authentication and safety

- The production password is supplied through `CV_EDITOR_PASSWORD`; Coolify will initially set it to `0000`.
- The password is never committed, embedded into JavaScript, or returned by an endpoint.
- Login is rate-limited by client address.
- A successful login creates a random server-side session with a short idle expiry.
- The session cookie is `HttpOnly`, `Secure` in production, `SameSite=Strict`, and scoped to the portfolio host.
- Protected endpoints reject missing or expired sessions with `401`.
- Payload size is capped and the full bilingual schema is validated before writing.
- IDs and backup names are selected from server-known registry entries; request values are never concatenated into filesystem paths unchecked.
- Writes use temporary files and atomic replacement to reduce corruption risk.

The `0000` value is intentionally temporary and can be changed later through Coolify without rebuilding the site.

## Server and Docker architecture

The Astro site remains a static production build. The final container runs Node rather than nginx:

1. A build stage installs dependencies and produces `dist/`.
2. A runtime stage copies `dist/`, `server.cjs`, seed CV data, and production dependencies.
3. Express serves `/api/*`, runtime CV data, static assets, and the Astro fallback.
4. The container listens on the port expected by Coolify.

The existing portfolio domains and Coolify resource UUID remain unchanged.

## Failure handling

- If the public CV API fails, the page renders the embedded default gaming CV and marks version switching unavailable.
- A failed editor login shows an inline error and does not disclose whether a specific password character was correct.
- A failed save preserves inline edits and changes the Save status to a retryable error.
- An expired session exits edit mode without discarding visible unsaved content.
- Registry entries whose files are missing are omitted from the selector and logged by the server.
- A corrupt runtime registry prevents management writes and falls back to seed/default public content rather than silently replacing production data.

## PDF replacement

The active browser print action remains the canonical way to create a PDF for any selected version.

For compatibility with already-shared URLs, regenerate both:

- `public/img/resume.pdf`
- `public/assets/img/resume.pdf`

Both files contain the default Game & Full-Stack CV, use `https://philippeho.dev/` for the portfolio link, and remain byte-identical. They are rendered and visually inspected at letter size after generation.

## Testing and acceptance criteria

### Hidden card

- Source tests verify the title, live URL, current stack, gameplay description, and current screenshot reference.
- No ChatroomWars title, Unity WebGL claim, or `/hiddengame/` URL remains in active portfolio data.
- The expanded panel works with keyboard and pointer input.
- The live action opens `https://hidden.philippeho.dev`.

### CV API

- Public list and version reads return the seeded versions in the intended order.
- Gaming is the default.
- Login rejects an incorrect password and creates a session for the configured password.
- Protected operations reject unauthenticated requests.
- Rename preserves the CV ID and rejects empty or duplicate names.
- Duplicate creates an independent copy.
- New Blank preserves the defined sidebar fields and clears every defined role/main field.
- Save validation rejects malformed data without changing the current file.
- Save creates a backup and enforces the ten-backup retention limit.
- Restore backs up the outgoing current state before replacement.
- Path traversal attempts and unknown IDs are rejected.

### CV browser behavior

- Selector state and `?cv=` URLs stay synchronized.
- Unknown CV IDs fall back to gaming.
- Language switching renders the active version rather than another version's language record.
- Portfolio navigation returns to the main site.
- Edit controls remain hidden before authentication.
- Failed saves preserve editable content.
- The page has no horizontal overflow at 390×844.
- The mobile application bar does not cover CV content.
- Print preview hides all application/editor chrome and uses the two-column letter layout.
- Website links resolve to `https://philippeho.dev/`.

### Build and deployment

- Run the complete Node test suite.
- Run the Astro production build.
- Start the production container locally and exercise public and protected API flows against a temporary data directory.
- Render both updated PDFs and visually inspect every page.
- Inspect the updated portfolio and CV at desktop and phone widths with no console errors or broken assets.
- Push the verified commit to `PhilHo-Projects/portfolio`.
- Add the Coolify password environment variable and persistent storage mount without printing the secret.
- Deploy resource `vm871iggnjyzcufbzyvxbssq`.
- Verify both portfolio domains, the Hidden link, CV switching, editor login, save persistence, mobile navigation, and PDF URLs in production.

