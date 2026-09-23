import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  GAME_IDS,
  VECTOR_BREAK_LEVELS,
  VECTOR_LANDER_MISSIONS,
  arcadeEscapeAction,
  burnLanderFuel,
  circleRectBounceAxis,
  circleRectHit,
  createVectorBreakBricks,
  estimateLanderFuelUse,
  isVectorBreakLevelClear,
  isSafeLanderTouchdown,
  landerCameraTarget,
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

test('Escape opens the menu from a game and returns home from the menu', () => {
  assert.equal(arcadeEscapeAction(false), 'menu');
  assert.equal(arcadeEscapeAction(true), 'home');
});

test('Vector Lander missions contain ordered terrain and reachable landing pads', () => {
  assert.equal(VECTOR_LANDER_MISSIONS.length, 6);
  assert.equal(new Set(VECTOR_LANDER_MISSIONS.map((mission) => mission.name)).size, 6);
  assert.ok(new Set(VECTOR_LANDER_MISSIONS.map((mission) => mission.terrain.at(-1).x)).size >= 4);
  VECTOR_LANDER_MISSIONS.forEach((mission) => {
    const elevations = mission.terrain.map((point) => point.y);
    const padCenter = mission.pad.x + mission.pad.w / 2;
    const routeLeft = Math.min(mission.start.x, padCenter);
    const routeRight = Math.max(mission.start.x, padCenter);
    const routePeakY = Math.min(
      ...mission.terrain
        .filter((point) => point.x >= routeLeft && point.x <= routeRight)
        .map((point) => point.y),
    );
    const steepSegments = mission.terrain.slice(1).filter((point, index) => {
      const previous = mission.terrain[index];
      const isPad = previous.x === mission.pad.x && point.x === mission.pad.x + mission.pad.w;
      return !isPad && Math.abs((point.y - previous.y) / (point.x - previous.x)) >= 1;
    });

    assert.ok(mission.name);
    assert.ok(mission.gravity > 0);
    assert.ok(mission.fuel >= estimateLanderFuelUse(mission) * 1.5);
    assert.ok(mission.terrain.at(-1).x > 800);
    assert.ok(mission.start.x > 0 && mission.start.x < mission.terrain.at(-1).x);
    assert.ok(mission.pad.x > 0 && mission.pad.x + mission.pad.w < mission.terrain.at(-1).x);
    assert.ok(mission.terrain.length >= 18);
    assert.ok(Math.max(...elevations) - Math.min(...elevations) >= 180);
    assert.ok(mission.pad.y - routePeakY >= 140);
    assert.ok(steepSegments.length >= 6);
    for (let index = 1; index < mission.terrain.length; index += 1) {
      assert.ok(mission.terrain[index].x > mission.terrain[index - 1].x);
    }
    assert.equal(terrainHeightAtX(mission.terrain, mission.pad.x), mission.pad.y);
    assert.equal(terrainHeightAtX(mission.terrain, mission.pad.x + mission.pad.w), mission.pad.y);
  });
});

test('Vector Lander camera starts wide and closes in near the landing pad', () => {
  const mission = VECTOR_LANDER_MISSIONS[4];
  const startCamera = landerCameraTarget({ ...mission.start, vy: 0, angle: 0, r: 13 }, mission);
  const approachCamera = landerCameraTarget({
    x: mission.pad.x + mission.pad.w / 2,
    y: mission.pad.y - 70,
    vx: 0,
    vy: 30,
    angle: 0,
    r: 13,
  }, mission);

  assert.ok(startCamera.zoom < 0.6);
  assert.ok(approachCamera.zoom > 1);
  assert.ok(approachCamera.zoom > startCamera.zoom + 0.5);
  assert.ok(approachCamera.altitude < startCamera.altitude);
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

test('Vector Lander unlimited fuel mode preserves the current fuel reserve', () => {
  assert.equal(burnLanderFuel(75, 14, false), 61);
  assert.equal(burnLanderFuel(8, 14, false), 0);
  assert.equal(burnLanderFuel(0, 14, true), 0);
  assert.equal(burnLanderFuel(75, 14, true), 75);
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
  assert.match(homepage, /easter-egg\.mjs\?v=20260923-10/);
});

test('the arcade build uses one version across its page and launchers', async () => {
  const version = JSON.parse(await readFile(new URL('../games/version.json', import.meta.url), 'utf8')).version;
  const homepage = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const launcher = await readFile(new URL('../easter-egg.mjs', import.meta.url), 'utf8');
  const page = await readFile(new URL('../games/index.html', import.meta.url), 'utf8');
  const arcade = await readFile(new URL('../games/arcade.mjs', import.meta.url), 'utf8');

  assert.ok(version);
  assert.match(homepage, new RegExp(`easter-egg\\.mjs\\?v=${version}`));
  assert.match(launcher, new RegExp(`game-core\\.mjs\\?v=${version}`));
  assert.match(launcher, new RegExp(`/games/\\?v=${version}`));
  assert.match(page, new RegExp(`renderedVersion = '${version}'`));
  assert.match(page, new RegExp(`arcade\\.mjs\\?v=${version}`));
  assert.match(arcade, new RegExp(`game-core\\.mjs\\?v=${version}`));
});

test('the unlinked games page exposes a cache refresh check and the five-game selector', async () => {
  const page = await readFile(new URL('../games/index.html', import.meta.url), 'utf8');
  assert.match(page, /<canvas[^>]+id="game-canvas"/);
  assert.match(page, /<nav[^>]+id="game-menu"/);
  assert.match(page, /version\.json/);
  assert.match(page, /cache: 'no-store'/);
  assert.match(page, /ESC TO RETURN HOME/);
  assert.match(page, /VECTOR LANDER/);
  assert.match(page, /VECTOR BREAK/);
  assert.match(page, /VECTOR SNAKE/);
  assert.match(page, /VECTOR INVADERS/);
  assert.match(page, /VECTOR ASTEROIDS/);
  assert.doesNotMatch(page, /STAR DODGE/);
});

test('Vector Lander exposes an unlimited fuel hotkey and status display', async () => {
  const arcade = await readFile(new URL('../games/arcade.mjs', import.meta.url), 'utf8');
  assert.match(arcade, /event\.code === 'KeyF'/);
  assert.match(arcade, /F: FUEL \$\{fuelMode\}/);
  assert.match(arcade, /FUEL INF/);
});

test('mouse hover transfers the game menu keyboard focus', async () => {
  const arcade = await readFile(new URL('../games/arcade.mjs', import.meta.url), 'utf8');
  assert.match(arcade, /button\.addEventListener\('pointerenter'/);
  assert.match(arcade, /event\.pointerType === 'mouse'/);
  assert.match(arcade, /button\.focus\(\{ preventScroll: true \}\)/);
});
