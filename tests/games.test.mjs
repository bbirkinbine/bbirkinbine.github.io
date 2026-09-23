import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  GAME_IDS,
  VECTOR_BREAK_LEVELS,
  circleRectBounceAxis,
  circleRectHit,
  createVectorBreakBricks,
  isVectorBreakLevelClear,
  nextSnakeHead,
  rectsOverlap,
  shouldOpenArcade,
  wrapPoint,
} from '../games/game-core.mjs';

test('the game menu exposes four distinct arcade programs', () => {
  assert.deepEqual(GAME_IDS, ['vector-break', 'vector-snake', 'vector-invaders', 'vector-asteroids']);
});

test('Vector Break provides six valid, distinct level layouts', () => {
  assert.equal(VECTOR_BREAK_LEVELS.length, 6);
  assert.equal(new Set(VECTOR_BREAK_LEVELS.map((level) => level.rows.join('/'))).size, 6);
  VECTOR_BREAK_LEVELS.forEach((level) => {
    assert.ok(level.name);
    assert.ok(level.rows.length >= 4);
    level.rows.forEach((row) => {
      assert.equal(row.length, 8);
      assert.match(row, /^[.12X]+$/);
    });
    assert.match(level.rows.join(''), /[12]/);
  });
});

test('Vector Break builds normal, reinforced, and indestructible bricks', () => {
  const bricks = createVectorBreakBricks({ rows: ['12X.....'] });
  assert.deepEqual(bricks.map(({ hits, indestructible }) => ({ hits, indestructible })), [
    { hits: 1, indestructible: false },
    { hits: 2, indestructible: false },
    { hits: Number.POSITIVE_INFINITY, indestructible: true },
  ]);
  assert.deepEqual(bricks.map(({ x, y }) => ({ x, y })), [
    { x: 44, y: 54 },
    { x: 134, y: 54 },
    { x: 224, y: 54 },
  ]);
});

test('Vector Break level completion ignores surviving obstacle bricks', () => {
  const bricks = createVectorBreakBricks({ rows: ['1X......'] });
  assert.equal(isVectorBreakLevelClear(bricks), false);
  bricks[0].alive = false;
  assert.equal(isVectorBreakLevelClear(bricks), true);
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

test('circleRectBounceAxis distinguishes side and vertical brick impacts', () => {
  const brick = { x: 20, y: 20, w: 20, h: 10 };
  assert.equal(circleRectBounceAxis({ x: 18, y: 25, r: 3 }, brick, { x: 14, y: 25 }), 'x');
  assert.equal(circleRectBounceAxis({ x: 30, y: 18, r: 3 }, brick, { x: 30, y: 14 }), 'y');
});

test('rectsOverlap detects projectile contact and edge separation', () => {
  assert.equal(rectsOverlap({ x: 10, y: 10, w: 4, h: 12 }, { x: 12, y: 18, w: 24, h: 16 }), true);
  assert.equal(rectsOverlap({ x: 10, y: 10, w: 4, h: 8 }, { x: 14, y: 18, w: 24, h: 16 }), false);
});

test('wrapPoint carries objects cleanly across every playfield edge', () => {
  assert.deepEqual(wrapPoint({ x: -6, y: 120 }, 800, 480, 5), { x: 805, y: 120 });
  assert.deepEqual(wrapPoint({ x: 806, y: 120 }, 800, 480, 5), { x: -5, y: 120 });
  assert.deepEqual(wrapPoint({ x: 120, y: -6 }, 800, 480, 5), { x: 120, y: 485 });
  assert.deepEqual(wrapPoint({ x: 120, y: 486 }, 800, 480, 5), { x: 120, y: -5 });
});

test('nextSnakeHead advances one grid unit and wraps at the board edge', () => {
  assert.deepEqual(nextSnakeHead({ x: 9, y: 4 }, { x: 1, y: 0 }, 10, 8), { x: 0, y: 4 });
  assert.deepEqual(nextSnakeHead({ x: 0, y: 0 }, { x: 0, y: -1 }, 10, 8), { x: 0, y: 7 });
});

test('the homepage loads the hidden Enter-key launcher', async () => {
  const homepage = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(homepage, /easter-egg\.mjs/);
});

test('the unlinked games page exposes a canvas and the four-game selector', async () => {
  const page = await readFile(new URL('../games/index.html', import.meta.url), 'utf8');
  assert.match(page, /<canvas[^>]+id="game-canvas"/);
  assert.match(page, /<nav[^>]+id="game-menu"/);
  assert.match(page, /VECTOR BREAK/);
  assert.match(page, /VECTOR SNAKE/);
  assert.match(page, /VECTOR INVADERS/);
  assert.match(page, /VECTOR ASTEROIDS/);
  assert.doesNotMatch(page, /STAR DODGE/);
});
