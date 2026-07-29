const assert = require('node:assert/strict');
const { existsSync, mkdirSync, rmSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { afterEach, test } = require('node:test');
const { mkdtempSync } = require('node:fs');
const { CvError } = require('../server/cv-data.cjs');
const { createCvStore } = require('../server/cv-store.cjs');

const seedDir = join(__dirname, '..', 'public', 'data', 'resumes');
const testDirs = [];

function makeStore(overrides = {}) {
  const dataDir = mkdtempSync(join(tmpdir(), 'portfolio-cv-'));
  testDirs.push(dataDir);
  let tick = 0;
  const warnings = [];
  const store = createCvStore({
    dataDir,
    seedDir,
    now: () => new Date(Date.UTC(2026, 6, 29, 12, 0, tick++)),
    idFactory: () => 'testid',
    onWarning: (warning) => warnings.push(warning),
    ...overrides,
  });
  return { dataDir, store, warnings };
}

afterEach(() => {
  while (testDirs.length) rmSync(testDirs.pop(), { recursive: true, force: true });
});

test('initializes an empty runtime directory from seeds without overwriting later edits', () => {
  const { store } = makeStore();
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

test('renames without changing the stable ID and rejects duplicate visible names', () => {
  const { store } = makeStore();
  store.initialize();
  const renamed = store.rename('backend-software-developer', 'Platform Engineer');
  assert.equal(renamed.id, 'backend-software-developer');
  assert.equal(renamed.name, 'Platform Engineer');
  assert.equal(store.read('backend-software-developer').en.sidebar.role, 'Backend Software Developer');
  assert.throws(
    () => store.rename('game-full-stack', ' platform engineer '),
    (error) => error instanceof CvError && error.code === 'duplicate_name',
  );
});

test('duplicates a CV independently and leaves the default unchanged', () => {
  const { store } = makeStore();
  store.initialize();
  const copy = store.duplicate('backend-software-developer', 'Backend Copy');
  assert.match(copy.id, /^backend-copy/);
  assert.equal(store.list().defaultResumeId, 'game-full-stack');

  const changed = store.read(copy.id);
  changed.en.sidebar.role = 'Independent';
  store.save(copy.id, changed);
  assert.equal(store.read('backend-software-developer').en.sidebar.role, 'Backend Software Developer');
});

test('creates a blank CV with the contact and skill sidebar intact', () => {
  const { store } = makeStore();
  store.initialize();
  const created = store.createBlank('General AI');
  const blank = store.read(created.id);
  const gaming = store.read('game-full-stack');

  assert.deepEqual(blank.en.sidebar.sections, gaming.en.sidebar.sections);
  assert.equal(blank.en.sidebar.website.url, 'https://philippeho.dev/');
  assert.equal(blank.en.sidebar.role, '');
  assert.equal(blank.en.main.summary.content, '');
  assert.deepEqual(blank.en.main.experience.items, []);
  assert.deepEqual(blank.en.main.projects.items, []);
  assert.deepEqual(blank.en.main.education.items, []);
});

test('retains only the ten newest backups after repeated saves', () => {
  const { store } = makeStore();
  store.initialize();
  for (let index = 0; index < 11; index += 1) {
    const resume = store.read('game-full-stack');
    resume.en.sidebar.role = `Role ${index}`;
    store.save('game-full-stack', resume);
  }
  const backups = store.listBackups('game-full-stack');
  assert.equal(backups.length, 10);
  assert.deepEqual([...backups].sort().reverse(), backups);
});

test('restore backs up outgoing content before replacing it', () => {
  const { store } = makeStore();
  store.initialize();
  const first = store.read('game-full-stack');
  first.en.sidebar.role = 'First Revision';
  store.save('game-full-stack', first);
  const backupToRestore = store.listBackups('game-full-stack')[0];

  const second = store.read('game-full-stack');
  second.en.sidebar.role = 'Second Revision';
  store.save('game-full-stack', second);
  const countBefore = store.listBackups('game-full-stack').length;

  store.restore('game-full-stack', backupToRestore);
  assert.equal(store.read('game-full-stack').en.sidebar.role, 'Full-Stack Developer');
  assert.equal(store.listBackups('game-full-stack').length, countBefore + 1);
});

test('rejects unknown IDs, traversal strings, and unknown backup names', () => {
  const { store } = makeStore();
  store.initialize();
  for (const action of [
    () => store.read('does-not-exist'),
    () => store.read('../index'),
    () => store.restore('game-full-stack', '../secret.json'),
    () => store.restore('game-full-stack', 'missing.json'),
  ]) {
    assert.throws(action, (error) => error instanceof CvError && error.status === 404);
  }
});

test('does not overwrite an existing corrupt registry with seeds', () => {
  const { dataDir, store } = makeStore();
  writeFileSync(join(dataDir, 'index.json'), '{broken', 'utf8');
  assert.throws(
    () => store.initialize(),
    (error) => error instanceof CvError && error.code === 'corrupt_registry',
  );
  assert.equal(existsSync(join(dataDir, 'game-full-stack.json')), false);
});

test('omits a missing non-default document and reports a warning', () => {
  const { dataDir, store, warnings } = makeStore();
  store.initialize();
  rmSync(join(dataDir, 'backend-software-developer.json'));
  assert.deepEqual(store.list().resumes.map(({ id }) => id), ['game-full-stack']);
  assert.deepEqual(warnings, [{ code: 'missing_cv_file', id: 'backend-software-developer' }]);
});

test('treats a missing default document as a corrupt registry', () => {
  const { dataDir, store } = makeStore();
  store.initialize();
  rmSync(join(dataDir, 'game-full-stack.json'));
  assert.throws(
    () => store.list(),
    (error) => error instanceof CvError && error.code === 'corrupt_registry',
  );
});
