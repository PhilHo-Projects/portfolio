import assert from 'node:assert/strict';
import test from 'node:test';

import { gridColumnCount, projectRowEndIndex } from '../src/scripts/project-grid-layout.js';

test('derives the active grid column count from the computed template', () => {
  assert.equal(gridColumnCount('320px'), 1);
  assert.equal(gridColumnCount('320px 320px'), 2);
  assert.equal(gridColumnCount('320px 320px 320px'), 3);
  assert.equal(gridColumnCount(''), 1);
});

test('moves a detail panel to the end of its responsive card row', () => {
  assert.equal(projectRowEndIndex(1, 2, 7), 1);
  assert.equal(projectRowEndIndex(1, 3, 7), 2, 'widening from two to three columns must include the third card');
  assert.equal(projectRowEndIndex(4, 3, 7), 5);
  assert.equal(projectRowEndIndex(6, 3, 7), 6);
  assert.equal(projectRowEndIndex(4, 1, 7), 4);
});
