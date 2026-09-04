const assert = require('node:assert/strict');
const { mkdtempSync, rmSync, writeFileSync } = require('node:fs');
const { once } = require('node:events');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { afterEach, test } = require('node:test');
const { createPortfolioApp } = require('../server/app.cjs');

const rootDir = join(__dirname, '..');
const seedDir = join(rootDir, 'public', 'data', 'resumes');
const servers = [];
const testDirs = [];

const SUMMARY = {
  generatedAt: '2026-09-03T04:00:00.000Z',
  from: '2025-09-04',
  days: Array.from({ length: 365 }, (_, i) => (i === 364 ? 1040 : 0)),
  totals: {
    raw: 1040,
    activeDays: 1,
    input: 1000,
    output: 40,
    reasoning: 10,
    cacheRead: 900,
    freshInput: 100,
  },
  tools: [
    { tool: 'codex', raw: 1040, sessions: 1 },
    { tool: 'claude', raw: 0, sessions: 0 },
  ],
};

async function startApp(options = {}) {
  const dataDir = mkdtempSync(join(tmpdir(), 'portfolio-activity-'));
  testDirs.push(dataDir);
  const app = createPortfolioApp({
    dataDir,
    seedDir,
    distDir: join(rootDir, 'dist'),
    password: '0000',
    secure: false,
    ...options,
  });
  const server = app.listen(0, '127.0.0.1');
  servers.push(server);
  await once(server, 'listening');
  return { baseUrl: `http://127.0.0.1:${server.address().port}` };
}

function makeActivityDir(contents) {
  const dir = mkdtempSync(join(tmpdir(), 'portfolio-activity-src-'));
  testDirs.push(dir);
  for (const [name, body] of Object.entries(contents)) {
    writeFileSync(join(dir, name), body);
  }
  return dir;
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

test('serves the activity summary with a cacheable response', async () => {
  const activityDir = makeActivityDir({ 'summary.json': JSON.stringify(SUMMARY) });
  const { baseUrl } = await startApp({ activityDir });

  const response = await fetch(`${baseUrl}/api/activity`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'public, max-age=1800');
  assert.deepEqual(await response.json(), SUMMARY);
});

test('reports the summary as unavailable rather than failing the page', async () => {
  const { baseUrl } = await startApp({ activityDir: makeActivityDir({}) });

  const response = await fetch(`${baseUrl}/api/activity`);
  assert.equal(response.status, 404);
  assert.equal((await response.json()).error.code, 'activity_unavailable');
});

test('treats a corrupt summary as unavailable', async () => {
  const activityDir = makeActivityDir({ 'summary.json': '{ truncated' });
  const { baseUrl } = await startApp({ activityDir });

  assert.equal((await fetch(`${baseUrl}/api/activity`)).status, 404);
});

// The route reads one fixed filename. Anything else that lands in that
// directory must stay unreachable over HTTP.
test('serves nothing else out of the activity directory', async () => {
  const activityDir = makeActivityDir({
    'summary.json': JSON.stringify(SUMMARY),
    'desktop.json': JSON.stringify({ secret: 'E:\WebDev\PersonalSoundCloud' }),
  });
  const { baseUrl } = await startApp({ activityDir });

  for (const path of ['/api/activity/desktop.json', '/api/desktop.json', '/api/activity/summary.json']) {
    const response = await fetch(`${baseUrl}${path}`);
    assert.equal(response.status, 404, `${path} must not be served`);
    assert.equal((await response.json()).error.code, 'api_route_not_found');
  }

  // Express 5 routing is non-strict, so the trailing slash reaches the same
  // route and the same fixed file. Asserted rather than left to surprise.
  const trailing = await fetch(`${baseUrl}/api/activity/`);
  assert.equal(trailing.status, 200);
  assert.deepEqual(await trailing.json(), SUMMARY);
});

test('omits the route entirely when no activity directory is configured', async () => {
  const { baseUrl } = await startApp();

  const response = await fetch(`${baseUrl}/api/activity`);
  assert.equal(response.status, 404);
  assert.equal((await response.json()).error.code, 'api_route_not_found');
});
