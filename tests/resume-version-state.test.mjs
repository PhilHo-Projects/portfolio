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
