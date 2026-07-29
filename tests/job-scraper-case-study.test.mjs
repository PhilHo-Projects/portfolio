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
const html = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');

function tagWithAttribute(tagName, attribute, value) {
  return [...html.matchAll(new RegExp(`<${tagName}\\b[^>]*>`, 'g'))]
    .map(([tag]) => tag)
    .find((tag) => tag.includes(`${attribute}="${value}"`));
}

test('renders the verified Job Scraper case study', () => {
  assert.match(html, /data-case-study="job-scraper"/);
  assert.match(html, /Automated Job Intelligence Pipeline/);
  assert.match(html, /15 workflow nodes/);
  assert.match(html, /3 targeted searches/);
  assert.match(html, /Schedule \+ webhook/);
});

test('shows both workflow and dashboard visuals with useful actions', () => {
  assert.match(html, /assets\/img\/n8n-workflow\.png/);
  assert.match(html, /assets\/img\/job-viewer-dashboard\.png/);
  assert.ok(tagWithAttribute('figure', 'data-job-media', 'workflow'));
  assert.ok(tagWithAttribute('figure', 'data-job-media', 'dashboard'));

  const workflowAction = tagWithAttribute('a', 'href', '/assets/img/n8n-workflow.png');
  const dashboardAction = tagWithAttribute('a', 'href', 'https://jobs.philippeho.dev/job-viewer/');
  for (const action of [workflowAction, dashboardAction]) {
    assert.ok(action);
    assert.match(action, /target="_blank"/);
    assert.match(action, /rel="noreferrer"/);
  }
  assert.match(html, /View workflow/);
  assert.match(html, /Open live dashboard/);
  assert.match(html, /https:\/\/jobs\.philippeho\.dev\/job-viewer\//);
  assert.doesNotMatch(html, /type="button"\s+type="button"/);
});

test('does not render redundant Job Scraper and Job Viewer cards', () => {
  assert.doesNotMatch(html, /<h4[^>]*>n8n Job Scraper<\/h4>/);
  assert.doesNotMatch(html, /<h4[^>]*>Job Viewer<\/h4>/);
});
