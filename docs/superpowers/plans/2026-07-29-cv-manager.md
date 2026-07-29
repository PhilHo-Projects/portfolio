# Server-Backed CV Manager Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `/resume` into a mobile-safe, multi-version CV viewer and password-protected editor whose changes persist across Coolify deployments.

**Architecture:** Split bilingual CV seed data into a public registry and per-version JSON documents. A small CommonJS server layer owns schema validation, atomic filesystem persistence, backups, login throttling, and editor sessions; Express serves both the API and the Astro build. Browser code separates pure version/controller state from DOM wiring so behavior can be tested with Node's built-in test runner.

**Tech Stack:** Astro 5, TypeScript/JavaScript, Express 5, Node 22 test runner, JSON filesystem storage, Docker, Coolify

## Global Constraints

- **Game & Full-Stack Developer** remains the public default.
- Seed **Backend Software Developer** as the second version using only factual work already represented by the portfolio and repositories.
- Every version contains both `en` and `fr` language records.
- Public selection uses `?cv=<stable-id>`.
- The editor password is supplied through `CV_EDITOR_PASSWORD`; production initially sets it to `0000`.
- The authoritative password comparison never runs in browser code.
- New Blank preserves the photo/contact shell, location, links, languages, and skill/tool sidebar sections while clearing role, summary, experience, projects, and education.
- No CV deletion feature is added.
- Runtime data lives at `CV_DATA_DIR`; production uses `/app/runtime/cv`.
- Save and restore operations use atomic replacement and retain ten backups per CV.
- The page must fit 390×844 without horizontal overflow.
- Print hides every application/editor control and restores the two-column letter layout.
- Both public PDF paths remain available and point portfolio links to `https://philippeho.dev/`.
- Do not print or commit `COOLIFY_TOKEN` or any future replacement password.

---

## File map

### Shared data and types

- `src/types/resume.ts` — browser-visible CV, registry, metadata, and API response types.
- `public/data/resumes/index.json` — ordered seed registry and default ID.
- `public/data/resumes/game-full-stack.json` — default bilingual gaming/full-stack document.
- `public/data/resumes/backend-software-developer.json` — factual bilingual backend-targeted document.
- `public/data/resume.json` — legacy single-file seed; remove after all readers migrate.

### Server

- `server/cv-data.cjs` — display-name normalization, bilingual schema validation, blank-document derivation, API error type.
- `server/cv-store.cjs` — initialization, registry reads, atomic writes, rename, duplicate, blank creation, backups, and restore.
- `server/cv-auth.cjs` — timing-safe password comparison, rate limiting, random sessions, cookie parsing, and expiry.
- `server/app.cjs` — Express app factory, API routes, error translation, health endpoint, and static serving.
- `server.cjs` — production entrypoint only.
- `Dockerfile` — build and Node runtime image.
- `.dockerignore` — excludes mutable/local runtime data.

### Browser

- `src/pages/resume.astro` — accessible toolbar/dialog markup and embedded default fallback.
- `src/components/resume/ResumeLoader.ts` — parses the two build-time embedded fallback scripts.
- `src/components/resume/Editor.ts` — inline contenteditable binding only.
- `src/scripts/resume/api.ts` — typed same-origin CV API client.
- `src/scripts/resume/version-state.js` — pure ID resolution and URL functions.
- `src/scripts/resume/resume-controller.js` — pure asynchronous state transitions.
- `src/scripts/resume/main.ts` — DOM adapter and event wiring.
- `src/scripts/resume/renderer.ts` — existing CV DOM renderer with empty-state support.
- `src/styles/resume.css` — toolbar, dialogs, mobile paper, editing, and print rules.
- `src/components/Hero.astro` and `src/scripts/main.ts` — replace the JavaScript popup resume action with a normal `/resume` link.

### Tests and artifacts

- `tests/cv-data.test.cjs` — schema, name, and New Blank behavior.
- `tests/cv-store.test.cjs` — version lifecycle, atomic persistence, backup retention, and restore.
- `tests/cv-auth.test.cjs` — password, rate limit, cookie, and expiry behavior.
- `tests/cv-api.test.cjs` — public/protected HTTP contract.
- `tests/resume-version-state.test.mjs` — stable URL and fallback behavior.
- `tests/resume-controller.test.mjs` — selection, language, authentication, management, and failure behavior.
- `tests/resume-page-contract.test.mjs` — generated toolbar/dialog/print/mobile/source contract.
- `scripts/update-resume-pdf-links.py` — deterministic annotation replacement for the two legacy PDF URLs.
- `public/img/resume.pdf` and `public/assets/img/resume.pdf` — byte-identical default gaming CV artifacts.

### Task 1: Add versioned seed data and pure CV rules

**Files:**
- Create: `tests/cv-data.test.cjs`
- Create: `server/cv-data.cjs`
- Create: `public/data/resumes/index.json`
- Create: `public/data/resumes/game-full-stack.json`
- Create: `public/data/resumes/backend-software-developer.json`
- Modify: `src/types/resume.ts`
- Modify: `src/pages/resume.astro`

**Interfaces:**
- Produces: `CvError`, `normalizeDisplayName(name)`, `assertResumeData(value)`, and `createBlankResume(template, displayName)` from `server/cv-data.cjs`.
- Produces: `ResumeRegistry`, `ResumeRegistryEntry`, and `ResumeData` browser types.
- Seed IDs are exactly `game-full-stack` and `backend-software-developer`.

- [ ] **Step 1: Write failing pure-data tests**

Create `tests/cv-data.test.cjs`:

```js
const assert = require('node:assert/strict');
const test = require('node:test');
const {
  CvError,
  assertResumeData,
  createBlankResume,
  normalizeDisplayName,
} = require('../server/cv-data.cjs');
const gaming = require('../public/data/resumes/game-full-stack.json');

test('normalizes visible CV names', () => {
  assert.equal(normalizeDisplayName('  Backend   Software Developer  '), 'Backend Software Developer');
  assert.throws(() => normalizeDisplayName('   '), (error) =>
    error instanceof CvError && error.code === 'invalid_name');
});

test('accepts the existing bilingual CV and rejects incomplete payloads', () => {
  assert.equal(assertResumeData(gaming), gaming);
  assert.throws(
    () => assertResumeData({ en: gaming.en }),
    (error) => error instanceof CvError && error.code === 'invalid_resume',
  );
});

test('creates a blank CV with the sidebar intact', () => {
  const blank = createBlankResume(gaming, 'General AI');

  for (const language of ['en', 'fr']) {
    assert.equal(blank[language].sidebar.location, gaming[language].sidebar.location);
    assert.deepEqual(blank[language].sidebar.languages, gaming[language].sidebar.languages);
    assert.deepEqual(blank[language].sidebar.sections, gaming[language].sidebar.sections);
    assert.equal(blank[language].sidebar.website.url, 'https://philippeho.dev/');
    assert.equal(blank[language].sidebar.role, '');
    assert.equal(blank[language].main.summary.content, '');
    assert.deepEqual(blank[language].main.experience.items, []);
    assert.deepEqual(blank[language].main.projects.items, []);
    assert.deepEqual(blank[language].main.education.items, []);
  }
  assert.equal(blank.en.meta.title, 'Philippe Ho - General AI');
  assert.equal(blank.fr.meta.title, 'Philippe Ho - General AI');
  assert.notEqual(blank, gaming);
});
```

- [ ] **Step 2: Run the data test and verify RED**

Run:

```powershell
node --test tests/cv-data.test.cjs
```

Expected: FAIL with `MODULE_NOT_FOUND` for `server/cv-data.cjs`.

- [ ] **Step 3: Implement the pure data module**

Create `server/cv-data.cjs` with these exports and exact rules:

```js
class CvError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = 'CvError';
    this.status = status;
    this.code = code;
  }
}

function normalizeDisplayName(input) {
  const name = typeof input === 'string' ? input.trim().replace(/\s+/g, ' ') : '';
  if (!name || name.length > 80) {
    throw new CvError(400, 'invalid_name', 'CV name must contain 1 to 80 visible characters.');
  }
  return name;
}

function requireString(value, path, allowEmpty = false) {
  if (typeof value !== 'string' || (!allowEmpty && !value.trim())) {
    throw new CvError(400, 'invalid_resume', `${path} must be a string.`);
  }
}

function requireStringArray(value, path) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new CvError(400, 'invalid_resume', `${path} must be an array of strings.`);
  }
}
```

`assertResumeData(value)` must:

- Require exactly usable `en` and `fr` objects.
- Validate `meta.title`.
- Validate sidebar role, location, website/linkedin/github URL strings, language title/items, and every sidebar section title/content/icon.
- Validate main summary title/content.
- Validate every experience company/role/period/points.
- Validate every project title/description.
- Validate every education school/period/description.
- Permit empty role/content/item arrays so New Blank remains valid.
- Return the original validated object.

`createBlankResume(template, displayName)` must use `structuredClone`, set both meta titles to `Philippe Ho - ${normalizeDisplayName(displayName)}`, set both roles and summary content to `''`, and replace all three main item arrays with `[]`. Call `assertResumeData` before returning.

- [ ] **Step 4: Create the registry and gaming seed**

Create `public/data/resumes/index.json`:

```json
{
  "schemaVersion": 1,
  "defaultResumeId": "game-full-stack",
  "resumes": [
    {
      "id": "game-full-stack",
      "name": "Game & Full-Stack Developer",
      "createdAt": "2026-07-29T00:00:00.000Z",
      "updatedAt": "2026-07-29T00:00:00.000Z"
    },
    {
      "id": "backend-software-developer",
      "name": "Backend Software Developer",
      "createdAt": "2026-07-29T00:00:00.000Z",
      "updatedAt": "2026-07-29T00:00:00.000Z"
    }
  ]
}
```

Copy the complete current `public/data/resume.json` object to `public/data/resumes/game-full-stack.json`. Preserve the existing gaming emphasis and set both website URLs to `https://philippeho.dev/`.

- [ ] **Step 5: Create the factual backend seed**

Start from the gaming seed so contact, education, links, and bilingual structure remain intact. Apply these exact English replacements:

```json
{
  "meta": { "title": "Philippe Ho - Backend Software Developer" },
  "sidebar": {
    "role": "Backend Software Developer",
    "sections": [
      {
        "title": "Backend & Data",
        "content": "Node.js • Express • WebSocket<br>PostgreSQL • SQLite • REST APIs",
        "icon": "fas fa-server"
      },
      {
        "title": "Cloud & Operations",
        "content": "Docker • Linux • Coolify<br>AWS • Cloudflare • GitHub",
        "icon": "fas fa-cloud"
      },
      {
        "title": "Languages & Automation",
        "content": "TypeScript • JavaScript • Python • C#<br>n8n • Gemini • LLM APIs",
        "icon": "fas fa-laptop-code"
      }
    ]
  },
  "main": {
    "summary": {
      "title": "Summary",
      "content": "Backend-focused software developer who builds and deploys practical web services, real-time systems, and automation pipelines. Hands-on experience with Node.js, Express, WebSockets, PostgreSQL, SQLite, Docker, Linux, and API integrations, backed by shipped software and self-hosted production projects."
    },
    "experience": {
      "title": "Professional Experience",
      "items": [
        {
          "company": "Téléfix Productions",
          "role": "Game Programmer",
          "period": "01/2024-11/2024 | Montréal, Canada",
          "points": [
            "Shipped a complete Unity and C# game on Steam as part of a small production team",
            "Owned technical delivery across gameplay systems, persistence, UI, asset pipelines, and release integration",
            "Diagnosed cross-system issues and coordinated fixes against project deadlines",
            "Used Git-based workflows and AI-assisted tooling to prototype and resolve technical problems"
          ]
        }
      ]
    },
    "projects": {
      "title": "Selected Backend Projects",
      "items": [
        {
          "title": "Hidden Multiplayer Service",
          "description": "Built and deployed an Express and WebSocket service for real-time matchmaking and game messages, with optional PostgreSQL accounts, browser sessions, validation, rate limits, and guest play."
        },
        {
          "title": "Billing Hub",
          "description": "Built a server-backed multi-company workspace that turns time entries and expenses into invoice-ready records, PDFs, payment state, and durable archives."
        },
        {
          "title": "Automated Job Intelligence Pipeline",
          "description": "Built an n8n and Gemini pipeline that collects job listings, normalizes them into structured records, publishes a purpose-built dashboard, and delivers a review digest."
        }
      ]
    }
  }
}
```

Apply these exact French replacements:

```json
{
  "meta": { "title": "Philippe Ho - Développeur logiciel back-end" },
  "sidebar": {
    "role": "Développeur logiciel back-end",
    "sections": [
      {
        "title": "Back-end et données",
        "content": "Node.js • Express • WebSocket<br>PostgreSQL • SQLite • APIs REST",
        "icon": "fas fa-server"
      },
      {
        "title": "Cloud et opérations",
        "content": "Docker • Linux • Coolify<br>AWS • Cloudflare • GitHub",
        "icon": "fas fa-cloud"
      },
      {
        "title": "Langages et automatisation",
        "content": "TypeScript • JavaScript • Python • C#<br>n8n • Gemini • APIs LLM",
        "icon": "fas fa-laptop-code"
      }
    ]
  },
  "main": {
    "summary": {
      "title": "Résumé",
      "content": "Développeur logiciel orienté back-end qui conçoit et déploie des services web, des systèmes temps réel et des pipelines d'automatisation concrets. Expérience pratique avec Node.js, Express, WebSockets, PostgreSQL, SQLite, Docker, Linux et les intégrations d'API, appuyée par des logiciels livrés et des projets de production auto-hébergés."
    },
    "experience": {
      "title": "Expérience professionnelle",
      "items": [
        {
          "company": "Téléfix Productions",
          "role": "Programmeur de jeux",
          "period": "01/2024-11/2024 | Montréal, Canada",
          "points": [
            "Livré un jeu complet Unity et C# sur Steam au sein d'une petite équipe de production",
            "Pris en charge la livraison technique des systèmes de jeu, de la persistance, de l'interface, des pipelines d'actifs et de l'intégration de la version",
            "Diagnostiqué des problèmes entre systèmes et coordonné les correctifs selon les échéances du projet",
            "Utilisé des flux Git et des outils assistés par IA pour prototyper et résoudre des problèmes techniques"
          ]
        }
      ]
    },
    "projects": {
      "title": "Projets back-end sélectionnés",
      "items": [
        {
          "title": "Service multijoueur Hidden",
          "description": "Construit et déployé un service Express et WebSocket pour le matchmaking et les messages de jeu en temps réel, avec comptes PostgreSQL optionnels, sessions navigateur, validation, limites de débit et jeu invité."
        },
        {
          "title": "Billing Hub",
          "description": "Construit un espace multi-entreprises côté serveur qui transforme les heures et dépenses en factures, PDF, états de paiement et archives durables."
        },
        {
          "title": "Pipeline automatisé d'intelligence d'emploi",
          "description": "Construit un pipeline n8n et Gemini qui collecte des offres, les normalise en données structurées, publie un tableau de bord dédié et livre un résumé prêt à réviser."
        }
      ]
    }
  }
}
```

Keep the existing education records. Set both website URLs to `https://philippeho.dev/`. Save the completed object as `public/data/resumes/backend-software-developer.json`.

- [ ] **Step 6: Extend browser types and embed the new fallback**

Add to `src/types/resume.ts`:

```ts
export interface ResumeRegistryEntry {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
}

export interface ResumeRegistry {
    schemaVersion: 1;
    defaultResumeId: string;
    resumes: ResumeRegistryEntry[];
}

export interface ApiErrorPayload {
    error: {
        code: string;
        message: string;
    };
}
```

Change `src/pages/resume.astro` to read and embed:

```ts
const embeddedResumeData = fs.readFileSync(
    new URL('../../public/data/resumes/game-full-stack.json', import.meta.url),
    'utf-8'
);
const embeddedRegistry = fs.readFileSync(
    new URL('../../public/data/resumes/index.json', import.meta.url),
    'utf-8'
);
```

Add `<script id="initial-resume-registry" type="application/json" set:html={embeddedRegistry}></script>` beside the existing embedded data script.

- [ ] **Step 7: Verify GREEN**

Run:

```powershell
node --test tests/cv-data.test.cjs
npm run build
```

Expected: data tests pass and Astro builds with the new embedded seed.

- [ ] **Step 8: Commit**

```powershell
git add -- tests/cv-data.test.cjs server/cv-data.cjs public/data/resumes src/types/resume.ts src/pages/resume.astro
git commit -m "feat: seed versioned CV data"
```

### Task 2: Add the persistent CV store

**Files:**
- Create: `tests/cv-store.test.cjs`
- Create: `server/cv-store.cjs`

**Interfaces:**
- Consumes: `CvError`, `assertResumeData`, `createBlankResume`, and `normalizeDisplayName` from `server/cv-data.cjs`.
- Produces: `createCvStore({ dataDir, seedDir, now, idFactory, onWarning })`.
- Store methods: `initialize`, `list`, `read`, `save`, `rename`, `duplicate`, `createBlank`, `listBackups`, and `restore`.

- [ ] **Step 1: Write failing store lifecycle tests**

Create `tests/cv-store.test.cjs` using `node:test`, `mkdtempSync(join(tmpdir(), 'portfolio-cv-'))`, and `rmSync(testDir, { recursive: true, force: true })` in `afterEach`.

The first test must:

```js
test('initializes an empty runtime directory from seeds without overwriting later edits', () => {
  const store = makeStore();
  store.initialize();
  assert.equal(store.list().defaultResumeId, 'game-full-stack');
  assert.deepEqual(
    store.list().resumes.map(({ id }) => id),
    ['game-full-stack', 'backend-software-developer'],
  );

  const changed = store.read('game-full-stack');
  changed.en.sidebar.role = 'Changed Role';
  store.save('game-full-stack', changed);
  store.initialize();
  assert.equal(store.read('game-full-stack').en.sidebar.role, 'Changed Role');
});
```

Add separate tests that prove:

- Rename preserves the ID and rejects a case-insensitive duplicate.
- Duplicate produces an independent file and switches no default.
- `createBlank` preserves sidebar sections and clears the specified role/main fields.
- Eleven saves leave exactly ten backups.
- Restore first backs up the outgoing current content.
- Unknown IDs, `../` traversal strings, and unknown backup names throw `CvError` with `404`.
- A corrupt existing registry throws `CvError` without copying seeds over it.
- A missing non-default version file is omitted from `list()` and reported through `onWarning`.

- [ ] **Step 2: Run the store test and verify RED**

Run:

```powershell
node --test tests/cv-store.test.cjs
```

Expected: FAIL with `MODULE_NOT_FOUND` for `server/cv-store.cjs`.

- [ ] **Step 3: Implement atomic registry and document writes**

Create `server/cv-store.cjs`. Use:

```js
const {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} = require('node:fs');
const { basename, join } = require('node:path');
const {
  CvError,
  assertResumeData,
  createBlankResume,
  normalizeDisplayName,
} = require('./cv-data.cjs');

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function writeJsonAtomic(path, value) {
  const temporary = `${path}.${process.pid}.${Date.now()}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  renameSync(temporary, path);
}
```

`createCvStore(options)` must:

- Default `now` to `() => new Date()`.
- Default `idFactory` to a function based on `crypto.randomUUID().slice(0, 8)`.
- Copy `seedDir` recursively only when `${dataDir}/index.json` does not exist.
- Validate registry shape and every returned CV.
- Resolve IDs only by finding an exact registry entry before building a file path.
- Omit a non-default registry entry whose JSON file is missing and call `onWarning({ code: 'missing_cv_file', id })`.
- Treat a missing default file as `corrupt_registry`; do not silently choose a different default.
- Generate IDs from a lowercase ASCII slug plus the collision-safe factory suffix when required.
- Store backups as `backups/<id>/<ISO timestamp with colons/dots replaced>.json`.
- Sort backups newest-first and remove entries after index 9.
- Write the document before updating its registry timestamp.
- Clean up a newly-created document if its registry update fails.

Return the exact public registry shape from `list()`; never expose backup paths.

- [ ] **Step 4: Verify GREEN**

Run:

```powershell
node --test tests/cv-store.test.cjs
```

Expected: all store tests PASS.

- [ ] **Step 5: Commit**

```powershell
git add -- tests/cv-store.test.cjs server/cv-store.cjs
git commit -m "feat: add persistent CV store"
```

### Task 3: Add password sessions and login throttling

**Files:**
- Create: `tests/cv-auth.test.cjs`
- Create: `server/cv-auth.cjs`

**Interfaces:**
- Produces: `createCvAuth({ password, secure, now, tokenFactory, idleMs, maxAttempts, attemptWindowMs })`.
- Auth methods: `login(ip, candidate)`, `logout(cookieHeader)`, `isAuthenticated(cookieHeader)`, `requireToken(cookieHeader)`, and `clearExpired()`.
- Cookie name: `cv_editor_session`.

- [ ] **Step 1: Write failing auth tests**

Create `tests/cv-auth.test.cjs` with deterministic `now` and `tokenFactory`. Cover:

```js
test('accepts only the configured password and returns an HttpOnly cookie', () => {
  const auth = makeAuth();
  assert.throws(() => auth.login('127.0.0.1', 'wrong'), /Incorrect editor password/);
  const result = auth.login('127.0.0.1', '0000');
  assert.match(result.setCookie, /^cv_editor_session=test-token;/);
  assert.match(result.setCookie, /HttpOnly/);
  assert.match(result.setCookie, /SameSite=Strict/);
  assert.equal(auth.isAuthenticated(result.setCookie), true);
});
```

Add tests for:

- `Secure` appears only when `secure: true`.
- Five failed attempts in fifteen minutes cause a `429 login_rate_limited`.
- A successful login clears failures for that address.
- Inactivity beyond two hours expires a session.
- Logout invalidates the token and returns a `Max-Age=0` cookie.
- Missing and malformed cookies are unauthenticated.

- [ ] **Step 2: Run the auth test and verify RED**

Run:

```powershell
node --test tests/cv-auth.test.cjs
```

Expected: FAIL with `MODULE_NOT_FOUND` for `server/cv-auth.cjs`.

- [ ] **Step 3: Implement the auth module**

Use `crypto.createHash('sha256')` plus `timingSafeEqual` for equal-length password digests and `randomBytes(32).toString('hex')` for production tokens.

Use these defaults:

```js
const COOKIE_NAME = 'cv_editor_session';
const DEFAULT_IDLE_MS = 2 * 60 * 60 * 1000;
const DEFAULT_ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_MAX_ATTEMPTS = 5;
```

`login` returns `{ token, setCookie }`. Cookie serialization must produce:

```text
cv_editor_session=<token>; Path=/; HttpOnly; SameSite=Strict; Max-Age=7200
```

Append `; Secure` in production. `requireToken` throws `CvError(401, 'editor_session_required', 'Editor session required.')`.

- [ ] **Step 4: Verify GREEN**

Run:

```powershell
node --test tests/cv-auth.test.cjs
```

Expected: all auth tests PASS.

- [ ] **Step 5: Commit**

```powershell
git add -- tests/cv-auth.test.cjs server/cv-auth.cjs
git commit -m "feat: protect CV editing sessions"
```

### Task 4: Expose the CV API and serve the Astro build

**Files:**
- Create: `tests/cv-api.test.cjs`
- Create: `server/app.cjs`
- Modify: `server.cjs`

**Interfaces:**
- Consumes: `createCvStore` and `createCvAuth`.
- Produces: `createPortfolioApp({ dataDir, seedDir, distDir, password, secure, authOptions, storeOptions })`.
- Error response: `{ "error": { "code": string, "message": string } }`.

- [ ] **Step 1: Write failing HTTP contract tests**

Create `tests/cv-api.test.cjs`. Start the app on an ephemeral port with:

```js
const server = app.listen(0, '127.0.0.1');
await once(server, 'listening');
const baseUrl = `http://127.0.0.1:${server.address().port}`;
```

Use native `fetch`. Cover:

- `GET /healthz` returns `200` and `{ "status": "ok" }`.
- `GET /api/cvs` returns gaming as the default and both seeded entries.
- `GET /api/cvs/game-full-stack` returns the bilingual document.
- Unknown public IDs return `404 cv_not_found`.
- Protected writes return `401` without a cookie.
- Wrong login returns `401 invalid_editor_password`.
- Correct login returns `204` plus `Set-Cookie`.
- Session endpoint returns `{ "authenticated": true }` with the cookie.
- Authenticated rename, duplicate, blank creation, save, history, and restore call the matching store behavior.
- Logout returns `204` and invalidates the session.
- A body larger than 256 KiB returns `413 payload_too_large`.
- A corrupt runtime registry leaves public reads available from immutable seeds, returns `{ "authenticated": false, "available": false }` from the session endpoint, and rejects management writes with `503 cv_store_unavailable`.

- [ ] **Step 2: Run the API test and verify RED**

Run:

```powershell
node --test tests/cv-api.test.cjs
```

Expected: FAIL with `MODULE_NOT_FOUND` for `server/app.cjs`.

- [ ] **Step 3: Implement the Express application**

Create `server/app.cjs` with:

```js
const express = require('express');
const { join } = require('node:path');
const { CvError } = require('./cv-data.cjs');
const { createCvAuth } = require('./cv-auth.cjs');
const { createCvStore } = require('./cv-store.cjs');

function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}
```

Create the runtime store, call `initialize()` before routes, mount `express.json({ limit: '256kb' })`, and call `app.set('trust proxy', 1)` so login throttling sees the direct client behind Coolify's single Traefik proxy hop.

If runtime initialization throws `corrupt_registry`, log only the error code, create a read-only store over `seedDir`, and mark management unavailable. Public list/read routes use that seed store. The session route reports `available: false`, and every protected management route returns `CvError(503, 'cv_store_unavailable', 'CV editing is temporarily unavailable.')`.

Implement these exact routes:

```text
GET    /healthz
GET    /api/cvs
GET    /api/cvs/:id
POST   /api/cv-editor/login
POST   /api/cv-editor/logout
GET    /api/cv-editor/session
PUT    /api/cvs/:id
PATCH  /api/cvs/:id/name
POST   /api/cvs/:id/duplicate
POST   /api/cvs
GET    /api/cvs/:id/backups
POST   /api/cvs/:id/backups/:backupId/restore
```

Use `req.ip` for login throttling. Read editor tokens from `req.headers.cookie`. Set or clear cookies with `res.setHeader('Set-Cookie', value)`.

After the API routes:

```js
app.use('/api', (_req, res) => {
  res.status(404).json({
    error: { code: 'api_route_not_found', message: 'API route not found.' },
  });
});
app.get('/resume', (_req, res) => res.sendFile(join(distDir, 'resume', 'index.html')));
app.use(express.static(distDir));
app.get('/{*path}', (_req, res) => res.sendFile(join(distDir, 'index.html')));
```

Mount the explicit `/resume` route before `express.static` so directory redirects cannot bypass it. Add an `/api` JSON `404` handler before static serving so unknown API routes never return portfolio HTML.

Use an error middleware that maps `CvError`, Express JSON parse errors, and payload-too-large errors to the stable JSON shape. Log unexpected errors without request bodies, cookies, or password values and return `500 internal_error`.

- [ ] **Step 4: Reduce the entrypoint to production configuration**

Replace `server.cjs` with:

```js
const { join } = require('node:path');
const { createPortfolioApp } = require('./server/app.cjs');

const rootDir = __dirname;
const port = Number(process.env.PORT || 8080);
const dataDir = process.env.CV_DATA_DIR || join(rootDir, 'runtime', 'cv');
const seedDir = join(rootDir, 'public', 'data', 'resumes');
const distDir = join(rootDir, 'dist');
const password = process.env.CV_EDITOR_PASSWORD || '0000';
const secure =
  process.env.CV_COOKIE_SECURE === 'false'
    ? false
    : process.env.NODE_ENV === 'production';

const app = createPortfolioApp({
  dataDir,
  seedDir,
  distDir,
  password,
  secure,
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Portfolio listening on port ${port}`);
});
```

Do not log `dataDir` if later configuration could include credentials. Do not log the password.

- [ ] **Step 5: Verify GREEN**

Run:

```powershell
node --test tests/cv-api.test.cjs
```

Expected: all HTTP contract tests PASS.

- [ ] **Step 6: Commit**

```powershell
git add -- tests/cv-api.test.cjs server/app.cjs server.cjs
git commit -m "feat: expose CV management API"
```

### Task 5: Build the responsive CV application bar

**Files:**
- Create: `tests/resume-page-contract.test.mjs`
- Modify: `src/pages/resume.astro`
- Modify: `src/styles/resume.css`
- Modify: `src/components/Hero.astro`
- Modify: `src/scripts/main.ts`

**Interfaces:**
- Produces stable DOM IDs consumed by `src/scripts/resume/main.ts`.
- Toolbar IDs: `resume-toolbar`, `portfolio-link`, `cv-select`, `lang-toggle`, `print-resume`, `edit-toggle`, `editor-actions`, `rename-cv`, `duplicate-cv`, `new-blank-cv`, `save-cv`, `history-cv`, `exit-edit`, and `resume-status`.
- Dialog IDs: `editor-login-dialog`, `cv-name-dialog`, and `cv-history-dialog`.

- [ ] **Step 1: Write the failing generated-page contract**

Create `tests/resume-page-contract.test.mjs`. Build once with `spawnSync('npm', ['run', 'build'])`, then read `dist/resume/index.html` and the source CSS.

Assert:

```js
test('renders a CV application bar instead of floating controls', () => {
  for (const id of [
    'resume-toolbar',
    'portfolio-link',
    'cv-select',
    'lang-toggle',
    'print-resume',
    'edit-toggle',
    'editor-actions',
    'rename-cv',
    'duplicate-cv',
    'new-blank-cv',
    'save-cv',
    'history-cv',
    'exit-edit',
    'resume-status',
  ]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /href="\/#projects"/);
  assert.doesNotMatch(html, /floating-download|download-icon/);
});
```

Also assert:

- All three dialogs exist and have accessible headings.
- Management actions are inside an initially hidden container.
- The default and registry JSON scripts are embedded.
- CSS contains `#resume-body .container { grid-template-columns: 1fr; }` inside the 640px media query.
- Print CSS hides `#resume-toolbar`, all dialogs, `#editor-actions`, and `.editable-highlight`.
- Hero contains a normal `href="/resume"` and no `window.openResume`.

- [ ] **Step 2: Run the page contract and verify RED**

Run:

```powershell
node --test tests/resume-page-contract.test.mjs
```

Expected: FAIL because the current page still renders floating controls and lacks the toolbar.

- [ ] **Step 3: Replace floating controls with semantic toolbar markup**

In `src/pages/resume.astro`, place this before `#resume-content`:

```astro
<header id="resume-toolbar" class="resume-toolbar">
  <div class="resume-toolbar-primary">
    <a id="portfolio-link" class="toolbar-link" href="/#projects">
      <i class="fas fa-arrow-left" aria-hidden="true"></i>
      Portfolio
    </a>
    <label class="cv-selector-label" for="cv-select">
      <span>CV version</span>
      <select id="cv-select"></select>
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
    <div id="editor-actions" hidden>
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

Add native `<dialog>` elements with:

- A password form containing `#editor-password`, `#editor-login-submit`, and `#editor-login-error`.
- A reusable naming form containing `#cv-name-title`, `#cv-name-input`, `#cv-name-submit`, and `#cv-name-error`.
- A history dialog containing `#cv-history-list`, `#cv-history-error`, and a Close button.

Every form must use `method="dialog"` only for explicit cancel buttons; JavaScript handles submissions so validation errors do not close dialogs.

- [ ] **Step 4: Add toolbar, dialog, mobile, and print CSS**

In `src/styles/resume.css`:

- Add `padding-top` or normal-flow spacing so the sticky toolbar never overlaps the paper.
- Style `.resume-toolbar` as a sticky dark bar with compact grouped actions.
- Give buttons and selects a minimum 44px touch target.
- Use visible `:focus-visible` outlines.
- At `max-width: 640px`, make `.resume-toolbar-primary` and `.resume-toolbar-actions` separate wrapping rows and make the selector consume the available width.
- Fix the specificity bug by using `#resume-body .container`, `#resume-body .sidebar`, and `#resume-body .content` in every responsive override.
- Ensure long email, role, and section text wrap with `overflow-wrap: anywhere`.
- In print, explicitly restore `#resume-body .container { grid-template-columns: 31% 69%; }`.

Remove all `.floating-download` and `.download-icon` rules.

- [ ] **Step 5: Make Resume a normal same-tab link**

In `src/components/Hero.astro`, replace the JavaScript Resume anchor with:

```astro
<a class="text-slate-500 hover:text-name-bright transition-colors" href="/resume" aria-label="Resume">
  <i class="fa-regular fa-file-pdf"></i>
</a>
```

Remove `openResume` from the `Window` interface and delete its assignment from `src/scripts/main.ts`.

- [ ] **Step 6: Verify GREEN**

Run:

```powershell
node --test tests/resume-page-contract.test.mjs
npm run build
```

Expected: the page contract passes and Astro builds.

- [ ] **Step 7: Commit**

```powershell
git add -- tests/resume-page-contract.test.mjs src/pages/resume.astro src/styles/resume.css src/components/Hero.astro src/scripts/main.ts
git commit -m "feat: add responsive CV application bar"
```

### Task 6: Add version URL state and the typed API client

**Files:**
- Create: `tests/resume-version-state.test.mjs`
- Create: `src/scripts/resume/version-state.js`
- Create: `src/scripts/resume/api.ts`
- Modify: `src/types/resume.ts`
- Modify: `src/components/resume/ResumeLoader.ts`

**Interfaces:**
- Produces: `resolveResumeId(requestedId, registry)`, `resumeUrlForId(href, id)`, and `readRequestedResumeId(href)`.
- Produces: `createResumeApi(baseUrl = '')` with methods matching every server endpoint.
- Produces: `getEmbeddedResumeRegistry()` and `getEmbeddedResumeData()`.

- [ ] **Step 1: Write failing URL-state tests**

Create `tests/resume-version-state.test.mjs`:

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  readRequestedResumeId,
  resolveResumeId,
  resumeUrlForId,
} from '../src/scripts/resume/version-state.js';

const registry = {
  schemaVersion: 1,
  defaultResumeId: 'game-full-stack',
  resumes: [
    { id: 'game-full-stack', name: 'Game & Full-Stack Developer' },
    { id: 'backend-software-developer', name: 'Backend Software Developer' },
  ],
};

test('uses requested known IDs and falls back to gaming', () => {
  assert.equal(resolveResumeId('backend-software-developer', registry), 'backend-software-developer');
  assert.equal(resolveResumeId('unknown', registry), 'game-full-stack');
  assert.equal(resolveResumeId(null, registry), 'game-full-stack');
});

test('reads and writes one stable cv query without losing other params or hashes', () => {
  const href = 'https://philippeho.dev/resume?source=portfolio#top';
  assert.equal(readRequestedResumeId(href), null);
  const next = resumeUrlForId(href, 'backend-software-developer');
  assert.equal(
    next,
    'https://philippeho.dev/resume?source=portfolio&cv=backend-software-developer#top',
  );
  assert.equal(readRequestedResumeId(next), 'backend-software-developer');
});
```

- [ ] **Step 2: Run the URL-state test and verify RED**

Run:

```powershell
node --test tests/resume-version-state.test.mjs
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Implement the pure URL functions**

Create `src/scripts/resume/version-state.js`:

```js
export function readRequestedResumeId(href) {
  return new URL(href).searchParams.get('cv');
}

export function resolveResumeId(requestedId, registry) {
  return registry.resumes.some(({ id }) => id === requestedId)
    ? requestedId
    : registry.defaultResumeId;
}

export function resumeUrlForId(href, id) {
  const url = new URL(href);
  url.searchParams.set('cv', id);
  return url.toString();
}
```

- [ ] **Step 4: Implement the typed API client**

Extend `src/types/resume.ts`:

```ts
export interface ResumeBackup {
    id: string;
    createdAt: string;
}

export interface EditorSession {
    authenticated: boolean;
    available: boolean;
}
```

Create `src/scripts/resume/api.ts` with a private `request<T>` helper that:

- Sends `Content-Type: application/json` only when a body exists.
- Uses same-origin credentials.
- Parses the stable API error shape.
- Throws `ResumeApiError` with `status`, `code`, and `message`.

Expose:

```ts
export function createResumeApi(baseUrl = '') {
  return {
    list(): Promise<ResumeRegistry>,
    read(id: string): Promise<ResumeData>,
    session(): Promise<EditorSession>,
    login(password: string): Promise<void>,
    logout(): Promise<void>,
    save(id: string, data: ResumeData): Promise<void>,
    rename(id: string, name: string): Promise<ResumeRegistryEntry>,
    duplicate(id: string, name: string): Promise<ResumeRegistryEntry>,
    createBlank(name: string): Promise<ResumeRegistryEntry>,
    backups(id: string): Promise<ResumeBackup[]>,
    restore(id: string, backupId: string): Promise<ResumeData>,
  };
}
```

- [ ] **Step 5: Migrate the loader**

Change `ResumeLoader.ts` so it reads both embedded scripts and exports:

```ts
export function getEmbeddedResumeData(): ResumeData | null;
export function getEmbeddedResumeRegistry(): ResumeRegistry | null;
```

Each function parses only its matching `<script type="application/json">` element, returns `null` on missing or invalid content, and logs a concise parse error without printing the embedded CV document. Network loading and fallback decisions remain owned by the controller.

- [ ] **Step 6: Verify GREEN**

Run:

```powershell
node --test tests/resume-version-state.test.mjs
npm run build
```

Expected: URL-state tests pass and TypeScript compiles in the Astro build.

- [ ] **Step 7: Commit**

```powershell
git add -- tests/resume-version-state.test.mjs src/scripts/resume/version-state.js src/scripts/resume/api.ts src/types/resume.ts src/components/resume/ResumeLoader.ts
git commit -m "feat: add CV version client"
```

### Task 7: Add the testable résumé controller

**Files:**
- Create: `tests/resume-controller.test.mjs`
- Create: `src/scripts/resume/resume-controller.js`

**Interfaces:**
- Consumes: registry/version API methods and the URL-state functions.
- Produces: `createResumeController(dependencies)` with `initialize`, `selectVersion`, `toggleLanguage`, `unlock`, `rename`, `duplicate`, `createBlank`, `save`, `listBackups`, `restore`, and `exitEditing`.
- Controller state: `{ registry, activeId, data, language, editing, dirty, degraded, managementAvailable }`.

- [ ] **Step 1: Write failing controller tests**

Create `tests/resume-controller.test.mjs` with a fake in-memory API and spies. Cover:

```js
test('initializes the requested version and renders English', async () => {
  const harness = makeHarness(
    'https://philippeho.dev/resume?cv=backend-software-developer',
  );
  const controller = createResumeController(harness.dependencies);
  await controller.initialize();

  assert.equal(controller.state.activeId, 'backend-software-developer');
  assert.equal(controller.state.language, 'en');
  assert.equal(harness.rendered.at(-1).sidebar.role, 'Backend Software Developer');
  assert.equal(harness.urls.at(-1), '/resume?cv=backend-software-developer');
});
```

Add separate tests proving:

- Unknown IDs fall back to gaming and replace the URL.
- A registry/API failure renders embedded gaming data and sets `degraded: true`.
- A session response with `available: false` keeps public version switching active but sets `managementAvailable: false`.
- An existing authenticated session restores edit mode after reload.
- Selection loads another version and updates URL.
- Language toggling renders the active document's other language.
- Unlock calls the login API and changes editing only after success.
- Rename updates selector metadata without changing ID.
- Duplicate and New Blank both switch to the newly returned ID.
- Save sends the complete bilingual data and clears dirty state.
- A `401` save exits editing but retains `data` and `dirty: true`.
- Restore renders returned data.
- Exit editing calls logout and clears editing state.

- [ ] **Step 2: Run the controller test and verify RED**

Run:

```powershell
node --test tests/resume-controller.test.mjs
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Implement the controller**

Create `src/scripts/resume/resume-controller.js`. Dependency shape:

```js
export function createResumeController({
  api,
  embeddedRegistry,
  embeddedData,
  initialHref,
  render,
  replaceUrl,
  onState,
}) {
  // Return the public methods and a read-only state getter.
}
```

Rules:

- Clone embedded inputs before storing them.
- Call `onState(structuredClone(state))` after every state transition.
- During initialization, call `api.session()` after public data loads; use `authenticated` to restore edit mode and `available` to enable or disable management.
- Never discard current `data` after a failed mutation.
- `selectVersion` must refuse changes while `dirty` unless the caller supplied `{ discardDirty: true }`.
- `rename`, `duplicate`, and `createBlank` normalize server-returned registry entries by reloading `api.list()`.
- `save` catches `ResumeApiError` with status `401`, sets `editing: false`, leaves `dirty: true`, and rethrows.
- `restore` replaces the complete bilingual `data` and renders the current language.
- URL updates use a relative `pathname + search + hash` string so production origin is not hard-coded.

- [ ] **Step 4: Verify GREEN**

Run:

```powershell
node --test tests/resume-controller.test.mjs
```

Expected: all controller tests PASS.

- [ ] **Step 5: Commit**

```powershell
git add -- tests/resume-controller.test.mjs src/scripts/resume/resume-controller.js
git commit -m "feat: add CV state controller"
```

### Task 8: Wire version management and inline editing into the page

**Files:**
- Modify: `src/components/resume/Editor.ts`
- Modify: `src/scripts/resume/main.ts`
- Modify: `src/scripts/resume/renderer.ts`
- Modify: `src/styles/resume.css`
- Modify: `tests/resume-page-contract.test.mjs`

**Interfaces:**
- Consumes: `createResumeController`, `createResumeApi`, embedded loader functions, and the toolbar IDs from Task 5.
- Produces: complete public switching, login, rename, duplicate, New Blank, save, history, restore, print, language, and exit behavior.

- [ ] **Step 1: Extend the page contract for wiring**

Add assertions that the built resume JavaScript bundle/source:

- Imports `createResumeController` and `createResumeApi`.
- Contains no literal password comparison and no `prompt(`, `alert(`, or `confirm(` calls.
- Binds the print action to `window.print()`.
- Binds New Blank separately from Duplicate.
- Uses dialog elements for login, naming, history, and restore confirmation.

Run:

```powershell
node --test tests/resume-page-contract.test.mjs
```

Expected: FAIL because the old editor still owns prompts and compares against `0000`.

- [ ] **Step 2: Reduce `Editor` to inline binding**

Replace the current UI-creating constructor with:

```ts
export class Editor {
    private currentData: ResumeLanguageData | null = null;
    public isEditing = false;
    public onDirty: (() => void) | null = null;

    public bind(data: ResumeLanguageData): void {
        this.currentData = data;
        this.applyEditable(this.isEditing);
    }

    public setEditing(active: boolean): void {
        this.isEditing = active;
        this.applyEditable(active);
    }
}
```

Keep `data-path` handling, but call `onDirty?.()` after a successful deep update. Remove password prompts, controls, history fetches, saving, keyboard shortcuts, alerts, and confirms from this class.

- [ ] **Step 3: Make the renderer safe for empty versions**

In `renderer.ts`:

- Render empty strings without substituting gaming content.
- Ensure `setList` clears containers when arrays are empty.
- Hide only an empty item container, not its section heading, so a blank CV remains structurally understandable during editing.
- Keep every editable text node's `data-path`.

Replace `setList` in `domUtils.ts` with:

```ts
export function setList<T>(id, items, createItemFn) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = '';
  (items ?? []).forEach((item, index) => el.appendChild(createItemFn(item, index)));
}
```

- [ ] **Step 4: Implement DOM wiring in `main.ts`**

Build one `requiredElement<T>(id)` helper that throws a clear initialization error if markup and script drift.

Initialize:

```ts
const api = createResumeApi();
const editor = new Editor();
const controller = createResumeController({
  api,
  embeddedRegistry: getEmbeddedResumeRegistry(),
  embeddedData: getEmbeddedResumeData(),
  initialHref: window.location.href,
  render: (languageData) => {
    renderResume(languageData);
    editor.bind(languageData);
  },
  replaceUrl: (relativeUrl) => history.replaceState(null, '', relativeUrl),
  onState: renderApplicationState,
});
```

`renderApplicationState` must:

- Populate and select `#cv-select`.
- Set `#lang-toggle` to the language not currently shown.
- Toggle `#editor-actions` and `#edit-toggle`.
- Call `editor.setEditing(state.editing)`.
- Disable version switching while dirty and show `Unsaved changes — save or exit editing first.`
- Show a degraded-mode message and disable editing/version switching when the complete API is unavailable.
- Keep public version switching active but disable Edit with `CV editing is temporarily unavailable.` when `managementAvailable` is false.

Dialog behavior:

- Login submit calls `controller.unlock(password)`, clears the input on success, and writes errors into `#editor-login-error`.
- Rename opens the naming dialog prefilled with the current name.
- Duplicate opens the same dialog with `${currentName} Copy`.
- New Blank opens it empty with title `Create blank CV`.
- The name submit handler dispatches by a local mode enum: `'rename' | 'duplicate' | 'blank'`.
- History loads backups and creates one Restore button per backup. Selecting Restore reveals an in-dialog confirmation row naming that backup; only its explicit **Confirm restore** button calls `controller.restore`.
- Escape and Cancel close dialogs without mutation.

Other controls:

- Print calls `window.print()`.
- Language calls `controller.toggleLanguage()`.
- Select calls `controller.selectVersion(value)` only when not dirty.
- Save calls `controller.save()` and shows Saving/Saved/Error status.
- Exit editing calls `controller.exitEditing()`; if dirty, show a confirmation dialog before discarding.

Call `await controller.initialize()` inside a guarded `init()`.

- [ ] **Step 5: Verify GREEN**

Run:

```powershell
node --test tests/resume-controller.test.mjs tests/resume-page-contract.test.mjs
npm run build
```

Expected: controller and page contracts pass and Astro builds.

- [ ] **Step 6: Commit**

```powershell
git add -- src/components/resume/Editor.ts src/components/resume/domUtils.ts src/scripts/resume/main.ts src/scripts/resume/renderer.ts src/styles/resume.css tests/resume-page-contract.test.mjs
git commit -m "feat: connect CV version management"
```

### Task 9: Replace stale PDF link annotations

**Files:**
- Create: `scripts/update-resume-pdf-links.py`
- Modify: `public/img/resume.pdf`
- Modify: `public/assets/img/resume.pdf`

**Interfaces:**
- Consumes: one existing gaming PDF and a mapping of stale URI annotations.
- Produces: two byte-identical PDFs with portfolio and Hidden destinations updated.

- [ ] **Step 1: Create the deterministic PDF update script**

Create `scripts/update-resume-pdf-links.py`:

```python
from pathlib import Path
from pypdf import PdfReader, PdfWriter
from pypdf.generic import NameObject, TextStringObject

ROOT = Path(__file__).resolve().parents[1]
PRIMARY = ROOT / "public" / "assets" / "img" / "resume.pdf"
SECONDARY = ROOT / "public" / "img" / "resume.pdf"
OUTPUT = ROOT / "output" / "pdf" / "default-gaming-resume.pdf"

REPLACEMENTS = {
    "https://philippeho27.github.io/my-website/": "https://philippeho.dev/",
    "https://philippeho27.github.io/ChatroomWars/": "https://hidden.philippeho.dev",
}

reader = PdfReader(PRIMARY)
writer = PdfWriter()
writer.clone_document_from_reader(reader)
replaced = set()

for page in writer.pages:
    for annotation_ref in page.get("/Annots", []):
        annotation = annotation_ref.get_object()
        action = annotation.get("/A")
        if not action:
            continue
        uri = action.get("/URI")
        if uri in REPLACEMENTS:
            action[NameObject("/URI")] = TextStringObject(REPLACEMENTS[uri])
            replaced.add(str(uri))

missing = set(REPLACEMENTS) - replaced
if missing:
    raise SystemExit(f"Expected PDF links not found: {sorted(missing)}")

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
with OUTPUT.open("wb") as stream:
    writer.write(stream)

payload = OUTPUT.read_bytes()
PRIMARY.write_bytes(payload)
SECONDARY.write_bytes(payload)
```

- [ ] **Step 2: Install the PDF dependency and run the script**

Run:

```powershell
python -m pip install pypdf
python scripts/update-resume-pdf-links.py
```

Expected: exit `0`, and both public PDFs are rewritten.

- [ ] **Step 3: Verify logical PDF destinations and equality**

Run:

```powershell
@'
from pathlib import Path
from pypdf import PdfReader
paths = [
    Path(r"public\assets\img\resume.pdf"),
    Path(r"public\img\resume.pdf"),
]
assert paths[0].read_bytes() == paths[1].read_bytes()
uris = []
for page in PdfReader(paths[0]).pages:
    for ref in page.get("/Annots", []):
        action = ref.get_object().get("/A")
        if action and action.get("/URI"):
            uris.append(str(action.get("/URI")))
assert "https://philippeho.dev/" in uris
assert "https://hidden.philippeho.dev" in uris
assert not any("my-website" in uri or "ChatroomWars" in uri for uri in uris)
print("\n".join(uris))
'@ | python -
```

Expected: both new destinations print, no stale destination prints, and the assertion succeeds.

- [ ] **Step 4: Render and inspect the updated PDF**

Use the bundled/system Poppler executable:

```powershell
New-Item -ItemType Directory -Force 'tmp\\pdfs' | Out-Null
pdftoppm -png 'public\\assets\\img\\resume.pdf' 'tmp\\pdfs\\resume'
```

If `pdftoppm` is not on `PATH`, locate the bundled executable under the Codex primary PDF runtime and invoke it by absolute path. Inspect every resulting PNG at original detail. Verify no clipped text, missing icons, black boxes, or changed page count.

Use this lookup if required:

```powershell
$poppler = Get-ChildItem 'C:\Users\phili\.cache\codex-runtimes' -Recurse -Filter 'pdftoppm.exe' |
  Select-Object -First 1 -ExpandProperty FullName
if (-not $poppler) { throw 'pdftoppm.exe was not found in the PDF runtime' }
& $poppler -png 'public\assets\img\resume.pdf' 'tmp\pdfs\resume'
```

- [ ] **Step 5: Commit**

```powershell
git add -- scripts/update-resume-pdf-links.py public/img/resume.pdf public/assets/img/resume.pdf output/pdf/default-gaming-resume.pdf
git commit -m "fix: update CV portfolio links"
```

### Task 10: Run the portfolio through the Node production container

**Files:**
- Modify: `Dockerfile`
- Modify: `.dockerignore`
- Modify: `package.json`
- Modify: `package-lock.json`
- Delete: `public/data/resume.json`

**Interfaces:**
- Container listens on `8080`.
- Runtime environment uses `CV_DATA_DIR=/app/runtime/cv`.
- Health check is `GET /healthz`.

- [ ] **Step 1: Add a failing production-runtime check**

Add this script to `package.json`:

```json
"test": "node --test --test-concurrency=1 tests"
```

Run the existing image and prove it lacks the API:

```powershell
docker build -t portfolio-before-cv-manager .
docker run --rm -d --name portfolio-before-cv-manager -p 127.0.0.1:18080:80 portfolio-before-cv-manager
try {
  $response = Invoke-WebRequest -Uri 'http://127.0.0.1:18080/healthz' -SkipHttpErrorCheck
  if ($response.StatusCode -eq 200) { throw 'Expected the old nginx image to lack /healthz' }
} finally {
  docker stop portfolio-before-cv-manager
}
```

Expected: `/healthz` is not `200`.

- [ ] **Step 2: Replace the nginx runtime stage**

Use this Dockerfile:

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
ENV CV_DATA_DIR=/app/runtime/cv
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY server.cjs ./server.cjs
COPY server ./server
COPY public/data/resumes ./public/data/resumes
RUN mkdir -p /app/runtime/cv && chown -R node:node /app
USER node
EXPOSE 8080
CMD ["node", "server.cjs"]
```

Add `runtime` and `tmp` to `.dockerignore`. Remove the legacy `public/data/resume.json` only after:

```powershell
rg -n "data/resume\\.json|public/data/resume\\.json" src server tests
```

returns no active reference.

- [ ] **Step 3: Build and run the production image**

Use an explicit test volume:

```powershell
$image = 'portfolio-cv-manager:test'
$volume = 'portfolio-cv-manager-test-data'
docker build -t $image .
docker volume create $volume
docker run -d --name portfolio-cv-manager-test `
  -p 127.0.0.1:18080:8080 `
  -e CV_EDITOR_PASSWORD=0000 `
  -e CV_COOKIE_SECURE=false `
  --mount "type=volume,source=$volume,target=/app/runtime/cv" `
  $image
```

- [ ] **Step 4: Verify API and restart persistence**

Run:

```powershell
$base = 'http://127.0.0.1:18080'
if ((Invoke-RestMethod "$base/healthz").status -ne 'ok') { throw 'Health check failed' }
$registry = Invoke-RestMethod "$base/api/cvs"
if ($registry.defaultResumeId -ne 'game-full-stack') { throw 'Wrong default CV' }

$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
Invoke-WebRequest "$base/api/cv-editor/login" -Method Post -WebSession $session `
  -ContentType 'application/json' -Body '{"password":"0000"}' | Out-Null
Invoke-RestMethod "$base/api/cvs/backend-software-developer/name" -Method Patch `
  -WebSession $session -ContentType 'application/json' `
  -Body '{"name":"Backend Software Developer – Persisted"}' | Out-Null

docker restart portfolio-cv-manager-test | Out-Null
Start-Sleep -Seconds 2
$after = Invoke-RestMethod "$base/api/cvs"
if (($after.resumes | Where-Object id -eq 'backend-software-developer').name -ne 'Backend Software Developer – Persisted') {
  throw 'CV data did not persist across restart'
}
```

- [ ] **Step 5: Clean up only the named test resources**

```powershell
docker rm -f portfolio-cv-manager-test
docker volume rm portfolio-cv-manager-test-data
docker image rm portfolio-before-cv-manager
```

Keep `portfolio-cv-manager:test` until final local browser verification is complete.

- [ ] **Step 6: Run the complete suite**

```powershell
npm test
npm run build
git diff --check
```

Expected: all tests pass, the build succeeds, and no whitespace errors appear.

- [ ] **Step 7: Commit**

```powershell
git add -- Dockerfile .dockerignore package.json package-lock.json public/data/resume.json
git commit -m "feat: run portfolio with persistent CV API"
```

### Task 11: Browser verification and production deployment

**Files:**
- Modify only if verification exposes a tested defect.
- Deployment state: Coolify application `vm871iggnjyzcufbzyvxbssq`.
- Persistent host directory: `/home/phil/app-data/portfolio-cv`.
- Container destination: `/app/runtime/cv`.

**Interfaces:**
- Consumes: the verified Docker image behavior and all prior commits.
- Produces: live portfolio and CV manager on `philippeho.dev`.

- [ ] **Step 1: Run fresh local verification**

Run:

```powershell
npm test
npm run build
docker build -t portfolio-cv-manager:test .
git status --short
```

Expected: tests and build exit `0`; Docker builds; the worktree contains only intentional uncommitted verification fixes or is clean.

- [ ] **Step 2: Verify the public and editor flows locally**

Run the image with the named volume from Task 10 and use Browser against `http://127.0.0.1:18080/resume`.

Desktop checks:

1. Default selector is Game & Full-Stack Developer.
2. Backend selection updates `?cv=backend-software-developer`.
3. Refresh preserves the selected version.
4. EN/FR switches within the selected version.
5. Portfolio navigates to `/#projects`.
6. Wrong password shows an inline error.
7. `0000` reveals management controls.
8. Rename preserves the URL ID.
9. Duplicate creates and selects a copy.
10. New Blank preserves sidebar content and clears the specified content.
11. Save survives a page reload.
12. History lists a backup and restore works after confirmation.
13. Exit editing hides every management action.

Phone checks at 390×844:

1. Toolbar forms two compact rows.
2. CV content is single-column and readable.
3. No horizontal overflow exists: `document.documentElement.scrollWidth === document.documentElement.clientWidth`.
4. Toolbar does not cover content.
5. Portfolio, selector, language, print, and edit targets remain reachable.

Print checks:

1. Print preview uses letter paper and two columns.
2. Toolbar, dialogs, status, and edit outlines are absent.
3. Sidebar colors and text remain legible.

Read `tab.dev.logs({ levels: ['error', 'warn'] })` and require no application errors.

- [ ] **Step 3: Verify PDFs and public asset paths locally**

Open:

```text
http://127.0.0.1:18080/img/resume.pdf
http://127.0.0.1:18080/assets/img/resume.pdf
```

Require `200` for both. Confirm their SHA-256 hashes match.

- [ ] **Step 4: Prepare the persistent host directory**

Run as `phil`:

```powershell
ssh -i C:\Users\phili\.ssh\hetzner_ed25519 phil@95.217.6.255 "install -d -m 0750 /home/phil/app-data/portfolio-cv && stat -c '%U %G %a %n' /home/phil/app-data/portfolio-cv"
```

Expected: owner/group are `phil`, mode is `750`, and the exact path is printed.

- [ ] **Step 5: Configure Coolify before the new deployment**

Open the existing `portfolio` application in Coolify.

Under **Persistent Storage**, add one bind mount:

```text
Name: portfolio-cv
Source Path: /home/phil/app-data/portfolio-cv
Destination Path: /app/runtime/cv
```

Under **Environment Variables**, add:

```text
CV_EDITOR_PASSWORD=0000
```

Enable Runtime Variable, disable Build Variable, and do not mark it multiline. Under General configuration, set the exposed application port to `8080` if Coolify has not inferred `EXPOSE 8080` from the Dockerfile.

Re-open each setting and verify the saved source path, destination path, runtime-only flag, and exposed port. Do not print the password or token in tool output.

Official references:

- `https://coolify.io/docs/knowledge-base/persistent-storage`
- `https://coolify.io/docs/knowledge-base/environment-variables`

- [ ] **Step 6: Push the verified commits**

Confirm only the intended commit series is ahead of origin:

```powershell
git status --short
git log --oneline origin/main..HEAD
git push origin main
```

The existing GitHub Actions workflow should trigger the Coolify deployment. If its token is rejected, create a replacement deploy-only token and update the `COOLIFY_TOKEN` GitHub organization secret. Separately refresh the local `laptop-agents` token with only `read`, `write`, and `deploy` permissions in `C:\Users\phili\.config\coolify\env.ps1`, then re-run the failed workflow. Never print either token.

- [ ] **Step 7: Inspect deployment state**

Use the Coolify deployment page or:

```powershell
. 'C:\Users\phili\.config\coolify\env.ps1'
$headers = @{ Authorization = "Bearer $env:COOLIFY_TOKEN"; Accept = 'application/json' }
Invoke-RestMethod "$env:COOLIFY_URL/api/v1/deployments/applications/vm871iggnjyzcufbzyvxbssq?take=1" -Headers $headers
```

Require a successful terminal deployment state. If non-terminal, poll without waits longer than 60 seconds. If failed, inspect only the relevant application logs and fix through a new tested commit.

- [ ] **Step 8: Verify production**

Check:

```text
https://philippeho.dev/
https://www.philippeho.dev/
https://philippeho.dev/resume
https://philippeho.dev/api/cvs
https://philippeho.dev/img/resume.pdf
https://philippeho.dev/assets/img/resume.pdf
```

Repeat the critical local flows in production:

- Hidden card content, expansion, screenshot, and live link.
- Game CV default and Backend CV selection.
- `?cv=` sharing and refresh.
- Portfolio navigation on phone.
- `0000` editor login.
- Rename, New Blank, Save, reload, history, and restore.
- A second deployment/restart or container restart must retain the saved test name, after which rename it back to its intended label.
- Print preview and both PDFs.
- No console errors and no horizontal overflow at 390×844.

Inspect `/home/phil/app-data/portfolio-cv` only to confirm registry, version, and backup files exist; do not print the CV documents if they later contain private tailoring content.

- [ ] **Step 9: Final verification record**

Run locally after production fixes:

```powershell
npm test
npm run build
git status --short
git log -1 --oneline --decorate
```

Record the exact passing test count, build exit code, deployed commit SHA, Coolify deployment identifier, and production URLs in the final handoff.
