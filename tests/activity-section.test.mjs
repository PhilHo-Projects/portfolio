import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = join(import.meta.dirname, '..');
const component = readFileSync(join(root, 'src/components/Activity.astro'), 'utf8');
const index = readFileSync(join(root, 'src/pages/index.astro'), 'utf8');

test('fetches the summary from the portfolio origin', () => {
  assert.match(component, /['"]\/api\/activity['"]/);
  // A cross-origin fetch to the gated tracker would fail and would defeat the
  // point of serving this from the apex.
  assert.doesNotMatch(component, /tokens\.philippeho\.dev/);
});

test('hides the section until real data arrives', () => {
  assert.match(component, /id="activity"/);
  assert.match(component, /hidden/);
});

test('carries no cost, pricing, or weighted framing', () => {
  // A bare $ would match JS template interpolation, so look for a currency
  // amount instead. The word checks run against the whole source.
  const banned = [/\$\s?\d/, /\bcost\b/i, /\bprice/i, /\bcredit/i, /\bweighted\b/i, /\bspend/i];
  for (const pattern of banned) {
    assert.doesNotMatch(component, pattern);
  }
});

test('is composed into the home page', () => {
  assert.match(index, /import Activity from '\.\.\/components\/Activity\.astro'/);
  assert.match(index, /<Activity \/>/);
});
