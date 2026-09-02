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
const billingHubStart = html.indexOf('data-featured-project="billing-hub"');
const billingHubEnd = html.indexOf('</article>', billingHubStart);
const billingHubHtml = html.slice(billingHubStart, billingHubEnd);

test('renders Billing Hub as the featured Web Development project', () => {
  const billingHubIndex = html.indexOf('data-featured-project="billing-hub"');
  const genericProjectIndex = html.indexOf('TurboReader');

  assert.ok(billingHubIndex >= 0, 'Billing Hub feature should render');
  assert.ok(genericProjectIndex >= 0, 'generic web project grid should render');
  assert.ok(billingHubIndex < genericProjectIndex, 'Billing Hub should precede the generic web project grid');
  assert.match(html, /Freelance operations workspace/);
  assert.match(html, /Billing Hub/);
});

test('uses real public-demo visuals and a safe live action', () => {
  const demoLinks = [...billingHubHtml.matchAll(/<a[^>]*href="https:\/\/billinghub\.philippeho\.dev\/"[^>]*>/g)].map((match) => match[0]);

  assert.match(billingHubHtml, /assets\/img\/billing-hub-dashboard\.png/);
  assert.match(billingHubHtml, /alt="Billing Hub Gazette dashboard showing companies, time entries, expenses, current totals, and archived invoices"/);
  assert.doesNotMatch(billingHubHtml, /billing-hub-invoice\.png/);
  assert.doesNotMatch(billingHubHtml, /Gazette interface/);
  assert.equal(demoLinks.length, 1);
  for (const link of demoLinks) {
    assert.match(link, /target="_blank"/);
    assert.match(link, /rel="noreferrer"/);
  }
  assert.match(billingHubHtml, /Open public demo/);
});

test('defers the Billing Hub dashboard screenshot', () => {
  const billingHubImages = [...billingHubHtml.matchAll(/<img[^>]+billing-hub-dashboard\.png[^>]*>/g)].map((match) => match[0]);

  assert.equal(billingHubImages.length, 1);
  for (const image of billingHubImages) {
    assert.match(image, /loading="lazy"/);
    assert.match(image, /decoding="async"/);
  }
  assert.match(billingHubImages[0], /width="1408"/);
  assert.match(billingHubImages[0], /height="1082"/);
});

test('keeps the screenshot static while retaining the demo action', () => {
  assert.match(billingHubHtml, /<figure data-media-stage/);
  assert.doesNotMatch(billingHubHtml, /data-media-stage[^>]*href=/);
});

test('explains the workflow without advertising private source code', () => {
  assert.match(html, /Multiple companies and timesheets/);
  assert.match(html, /Expenses flow into invoice-ready totals/);
  assert.match(html, /PDF, archive, download, and paid-state workflows/);
  assert.match(html, /data-repository-visibility="private"/);
  assert.match(html, /Private repository/);
  assert.doesNotMatch(billingHubHtml, /github\.com\/PhilHo-Projects\/InvoicingAndTrackingTool/);
  assert.doesNotMatch(billingHubHtml, /View source/);
});
