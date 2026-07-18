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
  const demoLinks = [...billingHubHtml.matchAll(/<a[^>]*href="https:\/\/philippeho\.dev\/InvoicingAndTrackingTool\/"[^>]*>/g)].map((match) => match[0]);

  assert.match(billingHubHtml, /assets\/img\/billing-hub-dashboard\.png/);
  assert.match(billingHubHtml, /assets\/img\/billing-hub-invoice\.png/);
  assert.match(billingHubHtml, /alt="Billing Hub Gazette dashboard showing companies, time entries, expenses, current totals, and archived invoices"/);
  assert.match(billingHubHtml, /alt="Billing Hub invoice preview showing billable work, expenses, totals, and PDF controls"/);
  assert.equal(demoLinks.length, 2);
  for (const link of demoLinks) {
    assert.match(link, /target="_blank"/);
    assert.match(link, /rel="noreferrer"/);
  }
  assert.match(billingHubHtml, /Open public demo/);
});

test('defers both below-the-fold Billing Hub screenshots', () => {
  const billingHubImages = [...billingHubHtml.matchAll(/<img[^>]+billing-hub-(?:dashboard|invoice)\.png[^>]*>/g)].map((match) => match[0]);

  assert.equal(billingHubImages.length, 2);
  for (const image of billingHubImages) {
    assert.match(image, /loading="lazy"/);
    assert.match(image, /decoding="async"/);
  }
  assert.match(billingHubImages[0], /width="1408"/);
  assert.match(billingHubImages[0], /height="1082"/);
  assert.match(billingHubImages[1], /width="1440"/);
  assert.match(billingHubImages[1], /height="1000"/);
});

test('stacks the screenshots before enabling wider-screen overlap', () => {
  assert.match(billingHubHtml, /data-invoice-preview[^>]*class="[^"]*mt-3[^"]*w-full[^"]*sm:-mt-16/);
});

test('keeps the screenshot stage vertically composed on wide cards', () => {
  assert.match(html, /data-media-stage[^>]*class="[^"]*lg:flex[^"]*lg:h-full[^"]*lg:flex-col[^"]*lg:justify-center/);
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
