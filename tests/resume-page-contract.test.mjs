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

test('closes dialogs from Cancel without tripping form validation', () => {
  // formmethod="dialog" does not bypass constraint validation, so a required
  // input would block Cancel. Both cancels must be plain buttons instead.
  assert.doesNotMatch(html, /formmethod="dialog"/);
  const sliceDialog = (id) => {
    const start = html.indexOf('id="' + id + '"');
    const end = html.indexOf('</dialog>', start);
    return start === -1 || end === -1 ? '' : html.slice(start, end);
  };
  const loginDialog = sliceDialog('editor-login-dialog');
  const nameDialog = sliceDialog('cv-name-dialog');
  assert.notEqual(loginDialog, '');
  assert.notEqual(nameDialog, '');
  for (const dialog of [loginDialog, nameDialog]) {
    assert.match(dialog, /<button[^>]+type="button"[^>]+data-dialog-close/);
  }
  assert.match(resumeMain, /data-dialog-close/);
});

test('splits the toolbar into a view row and an edit row', () => {
  assert.match(html, /class="toolbar-row toolbar-row-view"/);
  assert.match(html, /id="editor-actions"[^>]+class="toolbar-row toolbar-row-edit"[^>]+hidden/);
  // The edit controls must not share a row with the view controls: that
  // competition for width is what made the bar collide when editing.
  const viewStart = html.indexOf('toolbar-row-view');
  const editStart = html.indexOf('id="editor-actions"');
  assert.ok(viewStart !== -1 && editStart > viewStart);
  const viewRow = html.slice(viewStart, editStart);
  assert.match(viewRow, /id="print-resume"/);
  assert.doesNotMatch(viewRow, /id="save-cv"/);
  assert.doesNotMatch(viewRow, /id="history-cv"/);
});

test('renders the toolbar uniformly white on black', () => {
  // #resume-body a has ID specificity and beats a bare .toolbar-link rule.
  assert.match(css, /#resume-body \.toolbar-link\s*\{[^}]*color:\s*#f4f6f8/);
});

test('centres the sidebar social icons', () => {
  assert.match(css, /\.social-row\s*\{[^}]*justify-content:\s*center/);
});

test('keeps every toolbar row label legible on the dark bar', () => {
  // #resume-body span / p carry ID specificity and would otherwise paint
  // toolbar text near-black on near-black.
  assert.match(css, /#resume-body \.toolbar-row span[\s\S]{0,60}color:\s*#f4f6f8/);
});

test('keeps the status line legible against #resume-body p', () => {
  // #resume-body p is (1,0,1) and outranks a bare #resume-status (1,0,0),
  // which left every status and error message black on the dark bar.
  assert.match(css, /#resume-body #resume-status\s*\{[^}]*color:/);
});

test('defines a five-step density ladder down to a 0.92 type floor', () => {
  for (const step of [1, 2, 3, 4]) {
    assert.match(css, new RegExp(`\[data-density="${step}"\]`));
  }
  assert.match(css, /--fit-scale:\s*0\.92/);
  assert.doesNotMatch(css, /\[data-density="5"\]/);
  // Sizing must flow through the custom properties, not hardcoded overrides.
  assert.match(css, /font-size:\s*calc\([^)]*var\(--fit-scale\)/);
  assert.match(css, /line-height:\s*var\(--fit-leading/);
});

test('measures the same layout it prints', () => {
  // The fitter measures the screen layout to predict the printed page, so a
  // different print padding would rewrap the text and invalidate the result.
  const print = css.slice(css.indexOf('@media print'));
  const printContent = print.match(/#resume-body \.content\s*\{([^}]*)\}/)?.[1] ?? '';
  const printSidebar = print.match(/#resume-body \.sidebar\s*\{([^}]*)\}/)?.[1] ?? '';
  assert.doesNotMatch(printContent, /padding/);
  assert.doesNotMatch(printSidebar, /padding/);
  const screen = css.slice(0, css.indexOf('@media screen'));
  assert.match(screen, /#resume-body \.content\s*\{[^}]*padding:\s*1\.5rem 2\.5rem/);
  assert.match(screen, /#resume-body \.sidebar\s*\{[^}]*padding:\s*1\.5rem 1rem/);
});

test('runs the page fitter from the resume entry point', () => {
  assert.match(resumeMain, /createPageFitter/);
  assert.match(resumeMain, /data-density|dataset\.density/);
  assert.match(resumeMain, /document\.fonts/);
});

test('shows a page fill gauge and a page break ruler in edit mode', () => {
  assert.match(html, /id="page-fit-gauge"[^>]+role="progressbar"/);
  assert.match(html, /id="page-fit-fill"/);
  assert.match(html, /id="page-fit-label"/);
  assert.match(html, /class="page-break-ruler"/);
  // The ruler is an editing aid: never on screen for visitors, never in print.
  assert.match(css, /#resume-body\.is-editing \.page-break-ruler/);
  const print = css.slice(css.indexOf('@media print'));
  assert.match(print, /\.page-break-ruler/);
  assert.match(resumeMain, /page-fit-label/);
  assert.match(resumeMain, /is-editing/);
});
