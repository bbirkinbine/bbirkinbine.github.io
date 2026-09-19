import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { chooseGame, circleRectHit, nextSnakeHead, shouldOpenArcade } from '../games/game-core.mjs';

test('chooseGame maps an injected random value to one of three game IDs', () => {
  assert.equal(chooseGame(() => 0), 'vector-break');
  assert.equal(chooseGame(() => 0.34), 'star-dodge');
  assert.equal(chooseGame(() => 0.67), 'vector-snake');
  assert.equal(chooseGame(() => 0.999), 'vector-snake');
});

test('shouldOpenArcade accepts a plain non-repeating Enter press only', () => {
  const enter = { key: 'Enter', repeat: false, altKey: false, ctrlKey: false, metaKey: false, shiftKey: false };
  assert.equal(shouldOpenArcade(enter, false), true);
  assert.equal(shouldOpenArcade({ ...enter, repeat: true }, false), false);
  assert.equal(shouldOpenArcade({ ...enter, ctrlKey: true }, false), false);
  assert.equal(shouldOpenArcade({ ...enter, key: ' ' }, false), false);
  assert.equal(shouldOpenArcade(enter, true), false);
});

test('circleRectHit detects contact and rejects a clear miss', () => {
  assert.equal(circleRectHit({ x: 10, y: 10, r: 3 }, { x: 12, y: 8, w: 10, h: 6 }), true);
  assert.equal(circleRectHit({ x: 1, y: 1, r: 1 }, { x: 12, y: 8, w: 10, h: 6 }), false);
});

test('nextSnakeHead advances one grid unit and wraps at the board edge', () => {
  assert.deepEqual(nextSnakeHead({ x: 9, y: 4 }, { x: 1, y: 0 }, 10, 8), { x: 0, y: 4 });
  assert.deepEqual(nextSnakeHead({ x: 0, y: 0 }, { x: 0, y: -1 }, 10, 8), { x: 0, y: 7 });
});

test('the homepage loads the hidden Enter-key launcher', async () => {
  const homepage = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(homepage, /easter-egg\.mjs/);
});

test('the unlinked games page exposes a canvas and all three game labels', async () => {
  const page = await readFile(new URL('../games/index.html', import.meta.url), 'utf8');
  assert.match(page, /<canvas[^>]+id="game-canvas"/);
  assert.match(page, /VECTOR BREAK/);
  assert.match(page, /STAR DODGE/);
  assert.match(page, /VECTOR SNAKE/);
});
