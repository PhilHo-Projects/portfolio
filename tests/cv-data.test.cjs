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
  assert.throws(
    () => normalizeDisplayName('   '),
    (error) => error instanceof CvError && error.code === 'invalid_name',
  );
});

test('accepts the existing bilingual CV and rejects incomplete payloads', () => {
  assert.equal(assertResumeData(gaming), gaming);
  assert.throws(
    () => assertResumeData({ en: gaming.en }),
    (error) => error instanceof CvError && error.code === 'invalid_resume',
  );
});

test('rejects executable link schemes and malformed icon classes', () => {
  const unsafeLink = structuredClone(gaming);
  unsafeLink.en.sidebar.website.url = 'javascript:alert(1)';
  assert.throws(
    () => assertResumeData(unsafeLink),
    (error) => error instanceof CvError && error.code === 'invalid_resume',
  );

  const unsafeIcon = structuredClone(gaming);
  unsafeIcon.en.sidebar.sections[0].icon = 'fas fa-robot" onclick="alert(1)';
  assert.throws(
    () => assertResumeData(unsafeIcon),
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
