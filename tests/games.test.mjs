import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  GAME_IDS,
  KONAMI_SEQUENCE,
  ORIGIN_POWER_STEPS,
  VECTOR_BREAK_LEVELS,
  VECTOR_LANDER_MISSIONS,
  advanceSequenceProgress,
  advanceOriginPower,
  appendTypedSecret,
  arcadeEscapeAction,
  burnLanderFuel,
  circleRectBounceAxis,
  circleRectHit,
  closestArmedSilo,
  createVectorBreakBricks,
  estimateLanderFuelUse,
  isVectorBreakLevelClear,
  isSafeLanderTouchdown,
  landerCameraTarget,
  missilePointAt,
  nextMenuGridIndex,
  nextSnakeHead,
  originTunnelBoundsAt,
  rectsOverlap,
  shouldOpenArcade,
  terrainHeightAtX,
  typedSecretAction,
  wrapPoint,
} from '../games/game-core.mjs';

test('the game menu exposes five core programs and two secret-code exclusives', () => {
  assert.deepEqual(GAME_IDS, [
    'vector-break',
    'vector-snake',
    'vector-invaders',
    'vector-asteroids',
    'vector-lander',
    'defcon-command',
    'origin-flight',
  ]);
});

test('the game menu navigates its two-column grid in every direction', () => {
  assert.equal(nextMenuGridIndex(0, 'right', 6), 1);
  assert.equal(nextMenuGridIndex(1, 'left', 6), 0);
  assert.equal(nextMenuGridIndex(0, 'down', 6), 2);
  assert.equal(nextMenuGridIndex(2, 'down', 6), 4);
  assert.equal(nextMenuGridIndex(4, 'up', 6), 2);
  assert.equal(nextMenuGridIndex(1, 'down', 6), 3);
  assert.equal(nextMenuGridIndex(3, 'down', 6), 5);
  assert.equal(nextMenuGridIndex(5, 'down', 6), 1);
  assert.equal(nextMenuGridIndex(4, 'right', 6), 5);
  assert.equal(nextMenuGridIndex(6, 'right', 7), 6);
  assert.equal(nextMenuGridIndex(4, 'down', 7), 6);
});

test('DEFCON Command interpolates missile flight and chooses the nearest armed silo', () => {
  const missile = { startX: 100, startY: 20, targetX: 500, targetY: 420 };
  assert.deepEqual(missilePointAt(missile, 0.25), { x: 200, y: 120 });
  assert.deepEqual(missilePointAt(missile, 2), { x: 500, y: 420 });
  const silos = [
    { x: 80, ammo: 0, active: true },
    { x: 400, ammo: 4, active: true },
    { x: 720, ammo: 7, active: false },
  ];
  assert.equal(closestArmedSilo(silos, 120), silos[1]);
  assert.equal(closestArmedSilo(silos.map((silo) => ({ ...silo, ammo: 0 })), 120), null);
});

test('Origin Flight cycles through the classic six-slot power meter', () => {
  assert.deepEqual(ORIGIN_POWER_STEPS, ['SPEED UP', 'MISSILE', 'DOUBLE', 'LASER', 'OPTION', 'SHIELD']);
  assert.deepEqual(advanceOriginPower(0), { upgrade: 'SPEED UP', nextIndex: 1 });
  assert.deepEqual(advanceOriginPower(5), { upgrade: 'SHIELD', nextIndex: 0 });
  assert.deepEqual(advanceOriginPower(-1), { upgrade: 'SPEED UP', nextIndex: 1 });
});

test('Origin Flight terrain stays stepped and leaves a playable tunnel', () => {
  for (let wave = 1; wave <= 12; wave += 1) {
    for (let x = 0; x <= 2400; x += 37) {
      const bounds = originTunnelBoundsAt(x, 813, wave);
      assert.equal(bounds.top % 8, 0);
      assert.equal(bounds.bottom % 8, 0);
      assert.ok(bounds.top >= 32);
      assert.ok(bounds.bottom <= 448);
      assert.ok(bounds.bottom - bounds.top >= 190);
    }
  }
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

test('the Konami sequence progresses, recovers, and completes deterministically', () => {
  let progress = 0;
  KONAMI_SEQUENCE.forEach((code) => {
    progress = advanceSequenceProgress(KONAMI_SEQUENCE, progress, code);
  });
  assert.equal(progress, KONAMI_SEQUENCE.length);
  assert.equal(advanceSequenceProgress(KONAMI_SEQUENCE, 5, 'Escape'), 0);
  assert.equal(advanceSequenceProgress(KONAMI_SEQUENCE, 5, 'ArrowUp'), 1);
});

test('typed Easter-egg commands recognize JOSHUA and sudo without capturing punctuation', () => {
  let buffer = '';
  for (const key of ['J', 'o', 's', 'h', 'u', 'a']) buffer = appendTypedSecret(buffer, key);
  assert.equal(buffer, 'joshua');
  assert.equal(typedSecretAction(buffer), 'wargames');

  buffer = '';
  for (const key of ['s', 'u', '-', 'd', 'o']) buffer = appendTypedSecret(buffer, key);
  assert.equal(buffer, 'sudo');
  assert.equal(typedSecretAction(buffer), 'sudo');
  assert.equal(typedSecretAction('ordinary'), null);
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
  assert.match(homepage, /easter-egg\.mjs\?v=\d+/);
});

test('the homepage launcher includes the Konami, WarGames, sudo, and source-code clues', async () => {
  const homepage = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const launcher = await readFile(new URL('../easter-egg.mjs', import.meta.url), 'utf8');

  assert.match(homepage, /Some passwords are names\. Some codes begin with two steps up\./);
  assert.match(launcher, /ORIGIN CODE ACCEPTED/);
  assert.match(launcher, /GREETINGS PROFESSOR FALKEN\./);
  assert.match(launcher, /dataset\.choice = 'yes'/);
  assert.match(launcher, /dataset\.choice = 'no'/);
  assert.match(launcher, /event\.key\.toLowerCase\(\) === 'y'/);
  assert.match(launcher, /event\.key\.toLowerCase\(\) === 'n'/);
  assert.match(launcher, /\['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown'\]/);
  assert.match(launcher, /nextChoice\.focus\(\{ preventScroll: true \}\)/);
  assert.match(launcher, /duration = 5000/);
  assert.match(launcher, /visitor is not in the sudoers file\./);
  assert.match(launcher, /openArcade\('joshua'\)/);
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
  assert.match(launcher, new RegExp(`games/index\\.html\\?v=${version}`));
  assert.match(page, new RegExp(`renderedVersion = '${version}'`));
  assert.match(page, new RegExp(`arcade\\.css\\?v=${version}`));
  assert.match(page, new RegExp(`arcade\\.mjs\\?v=${version}`));
  assert.match(arcade, new RegExp(`game-core\\.mjs\\?v=${version}`));
});

test('the unlinked games page exposes a cache refresh check and the seven-game selector', async () => {
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
  assert.match(page, /DEFCON COMMAND/);
  assert.match(page, /\[JOSHUA EXCLUSIVE\]/);
  assert.match(page, /data-game-id="defcon-command" hidden/);
  assert.match(page, /ORIGIN FLIGHT/);
  assert.match(page, /\[KONAMI CODE EXCLUSIVE\]/);
  assert.match(page, /data-game-id="origin-flight" hidden/);
  assert.doesNotMatch(page, /STAR DODGE/);
});

test('DEFCON Command is a persistent JOSHUA-exclusive missile-defense program', async () => {
  const [launcher, arcade] = await Promise.all([
    readFile(new URL('../easter-egg.mjs', import.meta.url), 'utf8'),
    readFile(new URL('../games/arcade.mjs', import.meta.url), 'utf8'),
  ]);
  assert.match(launcher, /localStorage\.setItem\('bb-joshua-game-unlocked', '1'\)/);
  assert.match(arcade, /class DefconCommand/);
  assert.match(arcade, /localStorage\.getItem\('bb-joshua-game-unlocked'\) === '1'/);
  assert.match(arcade, /launchSource === 'joshua'/);
  assert.match(arcade, /closestArmedSilo/);
  assert.match(arcade, /missilePointAt/);
  assert.match(arcade, /if \(id === 'defcon-command'\) return new DefconCommand\(\)/);
  assert.match(arcade, /body\.classList\.toggle\('wargames-game', id === 'defcon-command'\)/);
});

test('Origin Flight renders a dedicated pixel scroller with upgrades and touch-compatible controls', async () => {
  const arcade = await readFile(new URL('../games/arcade.mjs', import.meta.url), 'utf8');
  assert.match(arcade, /class OriginFlight/);
  assert.match(arcade, /originTunnelBoundsAt/);
  assert.match(arcade, /ORIGIN_POWER_STEPS/);
  assert.match(arcade, /drawPixelShip/);
  assert.match(arcade, /localStorage\.getItem\('bb-origin-code-unlocked'\) === '1'/);
  assert.match(arcade, /originFlightButton\.hidden = !originFlightUnlocked/);
  assert.match(arcade, /data-control="action"|touchActionButton/);
  assert.match(arcade, /if \(id === 'origin-flight'\) return new OriginFlight\(\)/);
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
