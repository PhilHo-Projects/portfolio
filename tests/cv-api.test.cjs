const assert = require('node:assert/strict');
const { mkdtempSync, rmSync, writeFileSync } = require('node:fs');
const { once } = require('node:events');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { afterEach, test } = require('node:test');
const { createPortfolioApp } = require('../server/app.cjs');

const rootDir = join(__dirname, '..');
const seedDir = join(rootDir, 'public', 'data', 'resumes');
const gaming = require('../public/data/resumes/game-full-stack.json');
const servers = [];
const testDirs = [];

async function startApp(options = {}) {
  const dataDir = mkdtempSync(join(tmpdir(), 'portfolio-cv-api-'));
  testDirs.push(dataDir);
  const app = createPortfolioApp({
    dataDir,
    seedDir,
    distDir: join(rootDir, 'dist'),
    password: '0000',
    secure: false,
    authOptions: { tokenFactory: () => 'api-test-token' },
    storeOptions: { idFactory: () => 'apiid' },
    ...options,
  });
  const server = app.listen(0, '127.0.0.1');
  servers.push(server);
  await once(server, 'listening');
  return {
    baseUrl: `http://127.0.0.1:${server.address().port}`,
    dataDir,
  };
}

async function json(response) {
  return response.status === 204 ? null : response.json();
}

afterEach(async () => {
  while (servers.length) {
    const server = servers.pop();
    if (server.listening) {
      server.close();
      await once(server, 'close');
    }
  }
  while (testDirs.length) rmSync(testDirs.pop(), { recursive: true, force: true });
});

test('serves health and the public seeded CV registry', async () => {
  const { baseUrl } = await startApp();
  const health = await fetch(`${baseUrl}/healthz`);
  assert.equal(health.status, 200);
  assert.deepEqual(await json(health), { status: 'ok' });

  const registryResponse = await fetch(`${baseUrl}/api/cvs`);
  const registry = await json(registryResponse);
  assert.equal(registryResponse.status, 200);
  assert.equal(registry.defaultResumeId, 'game-full-stack');
  assert.deepEqual(
    registry.resumes.map(({ id }) => id),
    ['game-full-stack', 'backend-software-developer'],
  );

  const resumeResponse = await fetch(`${baseUrl}/api/cvs/game-full-stack`);
  assert.equal(resumeResponse.status, 200);
  assert.deepEqual(await json(resumeResponse), gaming);

  const missing = await fetch(`${baseUrl}/api/cvs/not-real`);
  assert.equal(missing.status, 404);
  assert.equal((await json(missing)).error.code, 'cv_not_found');
});

test('protects writes and exposes login, session, and logout state', async () => {
  const { baseUrl } = await startApp();
  const unauthorized = await fetch(`${baseUrl}/api/cvs/game-full-stack`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(gaming),
  });
  assert.equal(unauthorized.status, 401);
  assert.equal((await json(unauthorized)).error.code, 'editor_session_required');

  const wrong = await fetch(`${baseUrl}/api/cv-editor/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ password: 'wrong' }),
  });
  assert.equal(wrong.status, 401);
  assert.equal((await json(wrong)).error.code, 'invalid_editor_password');

  const login = await fetch(`${baseUrl}/api/cv-editor/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ password: '0000' }),
  });
  assert.equal(login.status, 204);
  const setCookie = login.headers.get('set-cookie');
  assert.match(setCookie, /^cv_editor_session=api-test-token;/);
  const cookie = setCookie.split(';')[0];

  const session = await fetch(`${baseUrl}/api/cv-editor/session`, {
    headers: { cookie },
  });
  assert.deepEqual(await json(session), { authenticated: true, available: true });

  const logout = await fetch(`${baseUrl}/api/cv-editor/logout`, {
    method: 'POST',
    headers: { cookie },
  });
  assert.equal(logout.status, 204);
  assert.match(logout.headers.get('set-cookie'), /Max-Age=0/);

  const after = await fetch(`${baseUrl}/api/cv-editor/session`, {
    headers: { cookie },
  });
  assert.deepEqual(await json(after), { authenticated: false, available: true });
});

test('supports authenticated rename, duplicate, blank, save, history, and restore', async () => {
  const { baseUrl } = await startApp();
  const login = await fetch(`${baseUrl}/api/cv-editor/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ password: '0000' }),
  });
  const cookie = login.headers.get('set-cookie').split(';')[0];
  const headers = { 'content-type': 'application/json', cookie };

  const renamed = await fetch(`${baseUrl}/api/cvs/backend-software-developer/name`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ name: 'Platform Engineer' }),
  });
  assert.equal(renamed.status, 200);
  assert.equal((await json(renamed)).name, 'Platform Engineer');

  const duplicated = await fetch(`${baseUrl}/api/cvs/backend-software-developer/duplicate`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: 'Backend Copy' }),
  });
  assert.equal(duplicated.status, 201);
  const duplicateEntry = await json(duplicated);
  assert.match(duplicateEntry.id, /^backend-copy/);

  const blankResponse = await fetch(`${baseUrl}/api/cvs`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: 'General AI' }),
  });
  assert.equal(blankResponse.status, 201);
  const blankEntry = await json(blankResponse);
  const blank = await json(await fetch(`${baseUrl}/api/cvs/${blankEntry.id}`));
  assert.deepEqual(blank.en.main.projects.items, []);
  assert.deepEqual(blank.en.sidebar.sections, gaming.en.sidebar.sections);

  const changed = structuredClone(gaming);
  changed.en.sidebar.role = 'Saved Through API';
  const saved = await fetch(`${baseUrl}/api/cvs/game-full-stack`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(changed),
  });
  assert.equal(saved.status, 200);
  assert.equal((await json(saved)).en.sidebar.role, 'Saved Through API');

  const history = await fetch(`${baseUrl}/api/cvs/game-full-stack/backups`, {
    headers: { cookie },
  });
  const backups = (await json(history)).backups;
  assert.equal(backups.length, 1);

  const restored = await fetch(
    `${baseUrl}/api/cvs/game-full-stack/backups/${encodeURIComponent(backups[0])}/restore`,
    { method: 'POST', headers: { cookie } },
  );
  assert.equal(restored.status, 200);
  assert.equal((await json(restored)).en.sidebar.role, 'Full-Stack Developer');
});

test('returns a stable payload-too-large API error', async () => {
  const { baseUrl } = await startApp();
  const response = await fetch(`${baseUrl}/api/cv-editor/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ password: 'x'.repeat(300 * 1024) }),
  });
  assert.equal(response.status, 413);
  assert.equal((await json(response)).error.code, 'payload_too_large');
});

test('rate limits by the original client across Cloudflare and Traefik', async () => {
  const { baseUrl } = await startApp({
    authOptions: {
      maxAttempts: 2,
      tokenFactory: () => 'api-test-token',
    },
  });
  const login = (forwardedFor) => fetch(`${baseUrl}/api/cv-editor/login`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': forwardedFor,
    },
    body: JSON.stringify({ password: 'wrong' }),
  });

  const firstClient = await login('203.0.113.10, 173.245.48.5');
  const secondClient = await login('198.51.100.4, 173.245.48.5');
  assert.equal(firstClient.status, 401);
  assert.equal(secondClient.status, 401);

  const firstClientAgain = await login('203.0.113.10, 173.245.48.5');
  assert.equal(firstClientAgain.status, 429);
});

test('falls back to immutable seeds when the runtime registry is corrupt', async () => {
  const corruptDir = mkdtempSync(join(tmpdir(), 'portfolio-cv-corrupt-'));
  testDirs.push(corruptDir);
  writeFileSync(join(corruptDir, 'index.json'), '{broken', 'utf8');
  const { baseUrl } = await startApp({ dataDir: corruptDir });

  const registry = await json(await fetch(`${baseUrl}/api/cvs`));
  assert.equal(registry.defaultResumeId, 'game-full-stack');

  const resume = await json(await fetch(`${baseUrl}/api/cvs/game-full-stack`));
  assert.equal(resume.en.sidebar.role, 'Full-Stack Developer');

  const session = await json(await fetch(`${baseUrl}/api/cv-editor/session`));
  assert.deepEqual(session, { authenticated: false, available: false });

  const management = await fetch(`${baseUrl}/api/cvs/game-full-stack`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(gaming),
  });
  assert.equal(management.status, 503);
  assert.equal((await json(management)).error.code, 'cv_store_unavailable');
});
