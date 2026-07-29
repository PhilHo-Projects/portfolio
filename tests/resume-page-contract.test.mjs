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
const resumeMain = readFileSync(new URL('../src/scripts/resume/main.ts', import.meta.url), 'utf8');
const editorSource = readFileSync(new URL('../src/components/resume/Editor.ts', import.meta.url), 'utf8');
const rendererSource = readFileSync(
  new URL('../src/scripts/resume/renderer.ts', import.meta.url),
  'utf8',
);
const domUtilsSource = readFileSync(
  new URL('../src/components/resume/domUtils.ts', import.meta.url),
  'utf8',
);

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
  const printContainer = print.match(/#resume-body \.container\s*\{([^}]*)\}/)?.[1] ?? '';
  const printContent = print.match(/#resume-body \.content\s*\{([^}]*)\}/)?.[1] ?? '';
  assert.doesNotMatch(printContainer, /(?:max-)?height:\s*100vh|overflow:\s*hidden/);
  assert.doesNotMatch(printContent, /height:\s*100%|overflow:\s*hidden/);
});

test('links to the CV normally from the portfolio', () => {
  assert.match(hero, /href="\/resume"/);
  assert.doesNotMatch(hero, /window\.openResume/);
  assert.doesNotMatch(portfolioScript, /openResume/);
});

test('wires the toolbar to the API controller without browser-side password checks', () => {
  assert.match(resumeMain, /import\s+\{\s*createResumeController\s*\}/);
  assert.match(resumeMain, /import\s+\{\s*createResumeApi/);
  assert.match(resumeMain, /window\.print\(\)/);
  assert.match(resumeMain, /new-blank-cv/);
  assert.match(resumeMain, /duplicate-cv/);
  assert.doesNotMatch(`${resumeMain}\n${editorSource}`, /password\s*!==\s*['"]0000['"]/);
  assert.doesNotMatch(`${resumeMain}\n${editorSource}`, /\b(?:prompt|alert|confirm)\s*\(/);
  assert.match(html, /id="restore-confirmation"/);
  assert.match(html, /id="confirm-restore"/);
  assert.match(html, /id="discard-edit-dialog"/);
});

test('renders stored CV content without dynamic HTML interpretation', () => {
  assert.doesNotMatch(rendererSource, /\.innerHTML\s*=/);
  assert.doesNotMatch(domUtilsSource, /\.innerHTML\s*=/);
  assert.match(rendererSource, /createTextNode/);
  assert.match(rendererSource, /createElement\(['"]br['"]\)/);
});
