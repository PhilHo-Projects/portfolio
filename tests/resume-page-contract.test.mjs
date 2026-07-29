import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const build = spawnSync('npm', ['run', 'build'], {
  cwd: process.cwd(),
  encoding: 'utf8',
  shell: process.platform === 'win32',
});
assert.equal(build.status, 0, `${build.stdout}\n${build.stderr}`);

const html = readFileSync(new URL('../dist/resume/index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/styles/resume.css', import.meta.url), 'utf8');
const hero = readFileSync(new URL('../src/components/Hero.astro', import.meta.url), 'utf8');
const portfolioScript = readFileSync(new URL('../src/scripts/main.ts', import.meta.url), 'utf8');

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
  assert.match(html, /id="editor-actions"[^>]+hidden/);
});

test('provides accessible editor dialogs and embedded fallbacks', () => {
  for (const [dialogId, headingId] of [
    ['editor-login-dialog', 'editor-login-title'],
    ['cv-name-dialog', 'cv-name-title'],
    ['cv-history-dialog', 'cv-history-title'],
  ]) {
    assert.match(
      html,
      new RegExp(`<dialog[^>]+id="${dialogId}"[^>]+aria-labelledby="${headingId}"`),
    );
    assert.match(html, new RegExp(`<h2[^>]+id="${headingId}"`));
  }
  assert.match(html, /id="initial-resume-data"[^>]+type="application\/json"/);
  assert.match(html, /id="initial-resume-registry"[^>]+type="application\/json"/);
});

test('uses a single-column phone layout and clean two-column print output', () => {
  assert.match(
    css,
    /@media screen and \(max-width: 640px\)[\s\S]+#resume-body \.container\s*\{[\s\S]*?grid-template-columns:\s*1fr;/,
  );
  const print = css.slice(css.indexOf('@media print'));
  assert.match(print, /#resume-toolbar/);
  assert.match(print, /dialog/);
  assert.match(print, /#editor-actions/);
  assert.match(print, /\.editable-highlight/);
  assert.match(
    print,
    /#resume-body \.container\s*\{[\s\S]*?grid-template-columns:\s*31% 69%;/,
  );
});

test('links to the CV normally from the portfolio', () => {
  assert.match(hero, /href="\/resume"/);
  assert.doesNotMatch(hero, /window\.openResume/);
  assert.doesNotMatch(portfolioScript, /openResume/);
});
