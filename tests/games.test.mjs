import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  GAME_IDS,
  VECTOR_BREAK_LEVELS,
  VECTOR_LANDER_MISSIONS,
  circleRectBounceAxis,
  circleRectHit,
  createVectorBreakBricks,
  isVectorBreakLevelClear,
  isSafeLanderTouchdown,
  nextMenuGridIndex,
  nextSnakeHead,
  rectsOverlap,
  shouldOpenArcade,
  terrainHeightAtX,
  wrapPoint,
} from '../games/game-core.mjs';

test('the game menu exposes five distinct arcade programs', () => {
  assert.deepEqual(GAME_IDS, ['vector-break', 'vector-snake', 'vector-invaders', 'vector-asteroids', 'vector-lander']);
});

test('the game menu navigates its two-column grid in every direction', () => {
  assert.equal(nextMenuGridIndex(0, 'right', 5), 1);
  assert.equal(nextMenuGridIndex(1, 'left', 5), 0);
  assert.equal(nextMenuGridIndex(0, 'down', 5), 2);
  assert.equal(nextMenuGridIndex(2, 'down', 5), 4);
  assert.equal(nextMenuGridIndex(4, 'up', 5), 2);
  assert.equal(nextMenuGridIndex(1, 'down', 5), 3);
  assert.equal(nextMenuGridIndex(3, 'down', 5), 1);
  assert.equal(nextMenuGridIndex(4, 'right', 5), 4);
  assert.equal(nextMenuGridIndex(4, 'down', 5), 0);
});

test('Vector Lander missions contain ordered terrain and reachable landing pads', () => {
  assert.equal(VECTOR_LANDER_MISSIONS.length, 3);
  VECTOR_LANDER_MISSIONS.forEach((mission) => {
    assert.ok(mission.name);
    assert.ok(mission.gravity > 0);
    assert.ok(mission.terrain.length >= 2);
    for (let index = 1; index < mission.terrain.length; index += 1) {
      assert.ok(mission.terrain[index].x > mission.terrain[index - 1].x);
    }
    assert.equal(terrainHeightAtX(mission.terrain, mission.pad.x), mission.pad.y);
    assert.equal(terrainHeightAtX(mission.terrain, mission.pad.x + mission.pad.w), mission.pad.y);
  });
});

test('Vector Lander interpolates terrain and enforces safe touchdown limits', () => {
  assert.equal(terrainHeightAtX([{ x: 0, y: 100 }, { x: 100, y: 200 }], 25), 125);
  const pad = { x: 100, y: 300, w: 100 };
  const safeShip = { x: 150, r: 13, vx: 20, vy: 40, angle: 0.1 };
  assert.equal(isSafeLanderTouchdown(safeShip, pad), true);
  assert.equal(isSafeLanderTouchdown({ ...safeShip, vy: 60 }, pad), false);
  assert.equal(isSafeLanderTouchdown({ ...safeShip, angle: 0.4 }, pad), false);
  assert.equal(isSafeLanderTouchdown({ ...safeShip, x: 105 }, pad), false);
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

test('the unlinked games page exposes a canvas and the five-game selector', async () => {
  const page = await readFile(new URL('../games/index.html', import.meta.url), 'utf8');
  assert.match(page, /<canvas[^>]+id="game-canvas"/);
  assert.match(page, /<nav[^>]+id="game-menu"/);
  assert.match(page, /VECTOR BREAK/);
  assert.match(page, /VECTOR SNAKE/);
  assert.match(page, /VECTOR INVADERS/);
  assert.match(page, /VECTOR ASTEROIDS/);
  assert.match(page, /VECTOR LANDER/);
  assert.doesNotMatch(page, /STAR DODGE/);
});
