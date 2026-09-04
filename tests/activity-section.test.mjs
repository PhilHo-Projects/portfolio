import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = join(import.meta.dirname, '..');
const component = readFileSync(join(root, 'src/components/Activity.astro'), 'utf8');
const index = readFileSync(join(root, 'src/pages/index.astro'), 'utf8');
const render = readFileSync(join(root, 'src/scripts/activity/render.js'), 'utf8');

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

test('gives the heatmap a tooltip layer that cannot be clipped', () => {
  assert.match(component, /data-activity="heatmap-card"/);
  assert.match(component, /data-activity="tooltip"/);
  // The card is the positioning context, so it must not be the scroll
  // container: overflow-x-auto computes overflow-y to auto and would clip.
  assert.doesNotMatch(component, /heatmap-card"[^>]*overflow-x-auto/);
});

test('does not also emit native SVG titles', () => {
  // Both mechanisms at once means the OS bubble fights the styled tooltip.
  assert.doesNotMatch(render, /createElementNS\(SVG_NS, 'title'\)/);
  assert.match(render, /addEventListener\('pointermove'/);
});

test('is composed into the home page', () => {
  assert.match(index, /import Activity from '\.\.\/components\/Activity\.astro'/);
  assert.match(index, /<Activity \/>/);
});
