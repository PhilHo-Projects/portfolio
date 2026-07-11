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
  assert.match(html, /View workflow/);
  assert.match(html, /Open live dashboard/);
  assert.match(html, /https:\/\/jobs\.philippeho\.dev\/job-viewer\//);
});

test('does not render redundant Job Scraper and Job Viewer cards', () => {
  assert.doesNotMatch(html, /<h4[^>]*>n8n Job Scraper<\/h4>/);
  assert.doesNotMatch(html, /<h4[^>]*>Job Viewer<\/h4>/);
});
