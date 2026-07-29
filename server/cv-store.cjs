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
const { randomUUID } = require('node:crypto');
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
  try {
    writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
    renameSync(temporary, path);
  } finally {
    rmSync(temporary, { force: true });
  }
}

function corruptRegistry() {
  return new CvError(500, 'corrupt_registry', 'CV registry is unavailable.');
}

function validateRegistry(value) {
  if (
    !value
    || typeof value !== 'object'
    || value.schemaVersion !== 1
    || typeof value.defaultResumeId !== 'string'
    || !Array.isArray(value.resumes)
    || value.resumes.length === 0
  ) {
    throw corruptRegistry();
  }

  const ids = new Set();
  const names = new Set();
  for (const entry of value.resumes) {
    if (
      !entry
      || typeof entry !== 'object'
      || typeof entry.id !== 'string'
      || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.id)
      || typeof entry.name !== 'string'
      || !entry.name.trim()
      || typeof entry.createdAt !== 'string'
      || typeof entry.updatedAt !== 'string'
      || ids.has(entry.id)
      || names.has(entry.name.trim().toLocaleLowerCase('en'))
    ) {
      throw corruptRegistry();
    }
    ids.add(entry.id);
    names.add(entry.name.trim().toLocaleLowerCase('en'));
  }

  if (!ids.has(value.defaultResumeId)) throw corruptRegistry();
  return value;
}

function createCvStore({
  dataDir,
  seedDir,
  now = () => new Date(),
  idFactory = () => randomUUID().slice(0, 8),
  onWarning = () => {},
}) {
  const registryPath = join(dataDir, 'index.json');

  function readRegistry() {
    try {
      return validateRegistry(readJson(registryPath));
    } catch (error) {
      if (error instanceof CvError && error.code === 'corrupt_registry') throw error;
      throw corruptRegistry();
    }
  }

  function documentPath(id) {
    return join(dataDir, `${id}.json`);
  }

  function findEntry(registry, id) {
    const entry = registry.resumes.find((candidate) => candidate.id === id);
    if (!entry) throw new CvError(404, 'cv_not_found', 'CV not found.');
    return entry;
  }

  function readDocument(registry, id) {
    const entry = findEntry(registry, id);
    const path = documentPath(entry.id);
    if (!existsSync(path)) {
      if (entry.id === registry.defaultResumeId) throw corruptRegistry();
      throw new CvError(404, 'cv_not_found', 'CV not found.');
    }
    try {
      return assertResumeData(readJson(path));
    } catch (error) {
      if (error instanceof CvError && error.code === 'invalid_resume') throw corruptRegistry();
      if (error instanceof CvError) throw error;
      throw corruptRegistry();
    }
  }

  function publicRegistry(registry) {
    const entries = [];
    for (const entry of registry.resumes) {
      const path = documentPath(entry.id);
      if (!existsSync(path)) {
        if (entry.id === registry.defaultResumeId) throw corruptRegistry();
        onWarning({ code: 'missing_cv_file', id: entry.id });
        continue;
      }
      try {
        assertResumeData(readJson(path));
      } catch {
        if (entry.id === registry.defaultResumeId) throw corruptRegistry();
        onWarning({ code: 'corrupt_cv_file', id: entry.id });
        continue;
      }
      entries.push(structuredClone(entry));
    }

    return {
      schemaVersion: 1,
      defaultResumeId: registry.defaultResumeId,
      resumes: entries,
    };
  }

  function initialize() {
    mkdirSync(dataDir, { recursive: true });
    if (!existsSync(registryPath)) cpSync(seedDir, dataDir, { recursive: true });
    return list();
  }

  function list() {
    return publicRegistry(readRegistry());
  }

  function read(id) {
    return structuredClone(readDocument(readRegistry(), id));
  }

  function backupDirectory(id) {
    return join(dataDir, 'backups', id);
  }

  function listBackups(id) {
    const registry = readRegistry();
    const entry = findEntry(registry, id);
    const directory = backupDirectory(entry.id);
    if (!existsSync(directory)) return [];
    return readdirSync(directory)
      .filter((name) => name.endsWith('.json') && basename(name) === name)
      .sort()
      .reverse();
  }

  function pruneBackups(id) {
    for (const stale of listBackups(id).slice(10)) {
      rmSync(join(backupDirectory(id), stale), { force: true });
    }
  }

  function backupCurrent(registry, id) {
    const current = readDocument(registry, id);
    const directory = backupDirectory(id);
    mkdirSync(directory, { recursive: true });
    const timestamp = now().toISOString().replace(/[:.]/g, '-');
    let backupId = `${timestamp}.json`;
    let suffix = 1;
    while (existsSync(join(directory, backupId))) {
      backupId = `${timestamp}-${suffix}.json`;
      suffix += 1;
    }
    writeJsonAtomic(join(directory, backupId), current);
    pruneBackups(id);
    return backupId;
  }

  function touchEntry(registry, entry) {
    entry.updatedAt = now().toISOString();
    writeJsonAtomic(registryPath, registry);
    return structuredClone(entry);
  }

  function save(id, value) {
    const resume = assertResumeData(value);
    const registry = readRegistry();
    const entry = findEntry(registry, id);
    backupCurrent(registry, entry.id);
    writeJsonAtomic(documentPath(entry.id), resume);
    touchEntry(registry, entry);
    return structuredClone(resume);
  }

  function ensureUniqueName(registry, displayName, excludingId) {
    const name = normalizeDisplayName(displayName);
    const duplicate = registry.resumes.some(
      (entry) =>
        entry.id !== excludingId
        && entry.name.toLocaleLowerCase('en') === name.toLocaleLowerCase('en'),
    );
    if (duplicate) {
      throw new CvError(409, 'duplicate_name', 'A CV with that name already exists.');
    }
    return name;
  }

  function rename(id, displayName) {
    const registry = readRegistry();
    const entry = findEntry(registry, id);
    entry.name = ensureUniqueName(registry, displayName, entry.id);
    return touchEntry(registry, entry);
  }

  function slugify(name) {
    return name
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      || 'cv';
  }

  function createId(registry, displayName) {
    const slug = slugify(displayName);
    if (!registry.resumes.some(({ id }) => id === slug)) return slug;
    let suffix = String(idFactory()).toLowerCase().replace(/[^a-z0-9]+/g, '') || 'copy';
    let candidate = `${slug}-${suffix}`;
    let attempt = 2;
    while (registry.resumes.some(({ id }) => id === candidate)) {
      candidate = `${slug}-${suffix}-${attempt}`;
      attempt += 1;
    }
    return candidate;
  }

  function createDocument(registry, displayName, resume) {
    const name = ensureUniqueName(registry, displayName);
    const id = createId(registry, name);
    const timestamp = now().toISOString();
    const entry = { id, name, createdAt: timestamp, updatedAt: timestamp };
    const path = documentPath(id);
    writeJsonAtomic(path, assertResumeData(resume));
    try {
      registry.resumes.push(entry);
      writeJsonAtomic(registryPath, registry);
    } catch (error) {
      rmSync(path, { force: true });
      throw error;
    }
    return structuredClone(entry);
  }

  function duplicate(id, displayName) {
    const registry = readRegistry();
    const source = structuredClone(readDocument(registry, id));
    return createDocument(registry, displayName, source);
  }

  function createBlank(displayName) {
    const registry = readRegistry();
    const template = readDocument(registry, registry.defaultResumeId);
    const blank = createBlankResume(template, displayName);
    return createDocument(registry, displayName, blank);
  }

  function restore(id, backupId) {
    const registry = readRegistry();
    const entry = findEntry(registry, id);
    if (basename(backupId) !== backupId || !listBackups(entry.id).includes(backupId)) {
      throw new CvError(404, 'backup_not_found', 'CV backup not found.');
    }
    let restored;
    try {
      restored = assertResumeData(readJson(join(backupDirectory(entry.id), backupId)));
    } catch {
      throw new CvError(404, 'backup_not_found', 'CV backup not found.');
    }
    backupCurrent(registry, entry.id);
    writeJsonAtomic(documentPath(entry.id), restored);
    touchEntry(registry, entry);
    return structuredClone(restored);
  }

  return {
    initialize,
    list,
    read,
    save,
    rename,
    duplicate,
    createBlank,
    listBackups,
    restore,
  };
}

module.exports = { createCvStore };
