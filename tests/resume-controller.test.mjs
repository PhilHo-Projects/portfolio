import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { createResumeController } from '../src/scripts/resume/resume-controller.js';

const gaming = JSON.parse(
  readFileSync(new URL('../public/data/resumes/game-full-stack.json', import.meta.url), 'utf8'),
);
const backend = JSON.parse(
  readFileSync(new URL('../public/data/resumes/backend-software-developer.json', import.meta.url), 'utf8'),
);
const seedRegistry = JSON.parse(
  readFileSync(new URL('../public/data/resumes/index.json', import.meta.url), 'utf8'),
);

function makeHarness(
  initialHref = 'https://philippeho.dev/resume',
  {
    failPublic = false,
    session = { authenticated: false, available: true },
    saveError = null,
  } = {},
) {
  let registry = structuredClone(seedRegistry);
  const documents = new Map([
    ['game-full-stack', structuredClone(gaming)],
    ['backend-software-developer', structuredClone(backend)],
  ]);
  const rendered = [];
  const renderedLanguages = [];
  const urls = [];
  const states = [];
  const calls = {
    createBlank: [],
    duplicate: [],
    login: [],
    logout: 0,
    save: [],
    read: [],
    restore: [],
  };

  const api = {
    async list() {
      if (failPublic) throw new Error('offline');
      return structuredClone(registry);
    },
    async read(id) {
      calls.read.push(id);
      if (failPublic || !documents.has(id)) throw new Error('missing');
      return structuredClone(documents.get(id));
    },
    async session() {
      return structuredClone(session);
    },
    async login(password) {
      calls.login.push(password);
      if (password !== '0000') throw new Error('wrong');
    },
    async logout() {
      calls.logout += 1;
    },
    async save(id, data) {
      calls.save.push({ id, data: structuredClone(data) });
      if (saveError) throw saveError;
      documents.set(id, structuredClone(data));
    },
    async rename(id, name) {
      const entry = registry.resumes.find((candidate) => candidate.id === id);
      entry.name = name;
      return structuredClone(entry);
    },
    async duplicate(id, name) {
      calls.duplicate.push({ id, name });
      const entry = {
        id: 'backend-copy',
        name,
        createdAt: '2026-07-29T13:00:00.000Z',
        updatedAt: '2026-07-29T13:00:00.000Z',
      };
      registry.resumes.push(entry);
      documents.set(entry.id, structuredClone(documents.get(id)));
      return structuredClone(entry);
    },
    async createBlank(name) {
      calls.createBlank.push(name);
      const entry = {
        id: 'general-ai',
        name,
        createdAt: '2026-07-29T14:00:00.000Z',
        updatedAt: '2026-07-29T14:00:00.000Z',
      };
      const blank = structuredClone(gaming);
      blank.en.sidebar.role = '';
      blank.fr.sidebar.role = '';
      blank.en.main.projects.items = [];
      blank.fr.main.projects.items = [];
      registry.resumes.push(entry);
      documents.set(entry.id, blank);
      return structuredClone(entry);
    },
    async backups() {
      return [{ id: 'backup.json', createdAt: '2026-07-29T12:00:00.000Z' }];
    },
    async restore(id, backupId) {
      calls.restore.push({ id, backupId });
      const restored = structuredClone(documents.get(id));
      restored.en.sidebar.role = 'Restored Role';
      return restored;
    },
  };

  return {
    api,
    calls,
    documents,
    rendered,
    renderedLanguages,
    registry: () => registry,
    states,
    urls,
    dependencies: {
      api,
      embeddedRegistry: structuredClone(seedRegistry),
      embeddedData: structuredClone(gaming),
      initialHref,
      render: (data, language) => {
        rendered.push(data);
        renderedLanguages.push(language);
      },
      replaceUrl: (url) => urls.push(url),
      onState: (state) => states.push(state),
    },
  };
}

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

test('falls back to gaming for an unknown requested ID', async () => {
  const harness = makeHarness('https://philippeho.dev/resume?cv=made-up');
  const controller = createResumeController(harness.dependencies);
  await controller.initialize();
  assert.equal(controller.state.activeId, 'game-full-stack');
  assert.equal(harness.urls.at(-1), '/resume?cv=game-full-stack');
});

test('uses embedded gaming data in degraded mode when public APIs fail', async () => {
  const harness = makeHarness('https://philippeho.dev/resume?cv=backend-software-developer', {
    failPublic: true,
  });
  const controller = createResumeController(harness.dependencies);
  await controller.initialize();
  assert.equal(controller.state.activeId, 'game-full-stack');
  assert.equal(controller.state.degraded, true);
  assert.equal(controller.state.managementAvailable, false);
  assert.equal(harness.rendered.at(-1).sidebar.role, 'Full-Stack Developer');
});

test('keeps public switching available when management is unavailable', async () => {
  const harness = makeHarness('https://philippeho.dev/resume', {
    session: { authenticated: false, available: false },
  });
  const controller = createResumeController(harness.dependencies);
  await controller.initialize();
  assert.equal(controller.state.degraded, false);
  assert.equal(controller.state.managementAvailable, false);
  await controller.selectVersion('backend-software-developer');
  assert.equal(controller.state.activeId, 'backend-software-developer');
});

test('restores editing for an existing authenticated session', async () => {
  const harness = makeHarness('https://philippeho.dev/resume', {
    session: { authenticated: true, available: true },
  });
  const controller = createResumeController(harness.dependencies);
  await controller.initialize();
  assert.equal(controller.state.editing, true);
});

test('selects versions and toggles language within the active document', async () => {
  const harness = makeHarness();
  const controller = createResumeController(harness.dependencies);
  await controller.initialize();
  await controller.selectVersion('backend-software-developer');
  assert.equal(harness.urls.at(-1), '/resume?cv=backend-software-developer');
  controller.toggleLanguage();
  assert.equal(controller.state.language, 'fr');
  assert.equal(harness.rendered.at(-1).sidebar.role, 'Développeur logiciel back-end');
  assert.equal(harness.renderedLanguages.at(-1), 'fr');
});

test('ignores a stale version response that finishes after a newer selection', async () => {
  const harness = makeHarness();
  const originalRead = harness.api.read;
  let releaseBackend;
  harness.api.read = async (id) => {
    if (id === 'backend-software-developer') {
      await new Promise((resolve) => {
        releaseBackend = resolve;
      });
    }
    return originalRead(id);
  };

  const controller = createResumeController(harness.dependencies);
  await controller.initialize();
  const staleSelection = controller.selectVersion('backend-software-developer');
  await Promise.resolve();
  await controller.selectVersion('game-full-stack');
  releaseBackend();
  assert.equal(await staleSelection, false);
  assert.equal(controller.state.activeId, 'game-full-stack');
  assert.equal(harness.rendered.at(-1).sidebar.role, 'Full-Stack Developer');
});

test('unlocks editing only after the login API succeeds', async () => {
  const harness = makeHarness();
  const controller = createResumeController(harness.dependencies);
  await controller.initialize();
  await assert.rejects(() => controller.unlock('wrong'));
  assert.equal(controller.state.editing, false);
  await controller.unlock('0000');
  assert.equal(controller.state.editing, true);
  assert.deepEqual(harness.calls.login, ['wrong', '0000']);
});

test('renames without changing ID and switches to duplicated and blank IDs', async () => {
  const harness = makeHarness();
  const controller = createResumeController(harness.dependencies);
  await controller.initialize();
  await controller.unlock('0000');

  await controller.rename('Gaming Main');
  assert.equal(controller.state.activeId, 'game-full-stack');
  assert.equal(
    controller.state.registry.resumes.find(({ id }) => id === 'game-full-stack').name,
    'Gaming Main',
  );

  await controller.duplicate('Backend Copy');
  assert.equal(controller.state.activeId, 'backend-copy');
  await controller.createBlank('General AI');
  assert.equal(controller.state.activeId, 'general-ai');
  assert.deepEqual(controller.state.data.en.main.projects.items, []);
});

test('saves complete bilingual data and clears dirty state', async () => {
  const harness = makeHarness();
  const controller = createResumeController(harness.dependencies);
  await controller.initialize();
  await controller.unlock('0000');
  harness.rendered.at(-1).sidebar.role = 'Edited Role';
  controller.markDirty();
  await controller.save();

  assert.equal(harness.calls.save.length, 1);
  assert.equal(harness.calls.save[0].data.en.sidebar.role, 'Edited Role');
  assert.ok(harness.calls.save[0].data.fr);
  assert.equal(controller.state.dirty, false);
});

test('dirty edits block duplicate, blank, and restore transitions', async () => {
  const harness = makeHarness();
  const controller = createResumeController(harness.dependencies);
  await controller.initialize();
  await controller.unlock('0000');
  harness.rendered.at(-1).sidebar.role = 'Unsaved Role';
  controller.markDirty();

  for (const transition of [
    () => controller.duplicate('Should Not Exist'),
    () => controller.createBlank('Should Not Exist'),
    () => controller.restore('backup.json'),
  ]) {
    await assert.rejects(transition, /Save or exit editing before/);
  }

  assert.equal(controller.state.activeId, 'game-full-stack');
  assert.equal(controller.state.data.en.sidebar.role, 'Unsaved Role');
  assert.equal(controller.state.dirty, true);
  assert.deepEqual(harness.calls.duplicate, []);
  assert.deepEqual(harness.calls.createBlank, []);
  assert.deepEqual(harness.calls.restore, []);
});

test('a 401 save exits editing while preserving dirty data', async () => {
  const error = Object.assign(new Error('expired'), { status: 401 });
  const harness = makeHarness(undefined, { saveError: error });
  const controller = createResumeController(harness.dependencies);
  await controller.initialize();
  await controller.unlock('0000');
  harness.rendered.at(-1).sidebar.role = 'Unsaved Role';
  controller.markDirty();

  await assert.rejects(() => controller.save(), error);
  assert.equal(controller.state.editing, false);
  assert.equal(controller.state.dirty, true);
  assert.equal(controller.state.data.en.sidebar.role, 'Unsaved Role');
});

test('restores returned data and exits editing through logout', async () => {
  const harness = makeHarness();
  const controller = createResumeController(harness.dependencies);
  await controller.initialize();
  await controller.unlock('0000');
  await controller.restore('backup.json');
  assert.equal(harness.rendered.at(-1).sidebar.role, 'Restored Role');
  await controller.exitEditing();
  assert.equal(harness.calls.logout, 1);
  assert.equal(controller.state.editing, false);
  assert.equal(controller.state.dirty, false);
});
