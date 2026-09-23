export const GAME_IDS = ['vector-break', 'vector-snake', 'vector-invaders', 'vector-asteroids', 'vector-lander'];

export const VECTOR_BREAK_LEVELS = [
  {
    name: 'SIGNAL WALL',
    rows: [
      '11111111',
      '11111111',
      '22222222',
      '11111111',
    ],
  },
  {
    name: 'DIAMOND RELAY',
    rows: [
      '1......1',
      '.11..11.',
      '..1221..',
      '...11...',
      '..1221..',
      '.11..11.',
      '1......1',
    ],
  },
  {
    name: 'LOCKED CHANNELS',
    rows: [
      'X11..11X',
      'X.1221.X',
      'X..11..X',
      'X.1221.X',
      'X11..11X',
    ],
  },
  {
    name: 'WAVE DISTORTION',
    rows: [
      '11....11',
      '.11..11.',
      '..1111..',
      '.111111.',
      '111..111',
      '11....11',
    ],
  },
  {
    name: 'THE FORTRESS',
    rows: [
      'XXXXXXXX',
      'X222222X',
      'X21..12X',
      'X212212X',
      'X222222X',
      'X......X',
    ],
  },
  {
    name: 'FINAL ARRAY',
    rows: [
      '2X2XX2X2',
      '22222222',
      '.221122.',
      '1X1111X1',
      '..1221..',
      '...11...',
    ],
  },
];

export const VECTOR_LANDER_MISSIONS = [
  {
    name: 'TRANQUILITY',
    gravity: 32,
    fuel: 100,
    start: { x: 300, y: 60, vx: 42 },
    pad: { x: 500, y: 382, w: 140 },
    terrain: [
      { x: 0, y: 370 }, { x: 90, y: 415 }, { x: 170, y: 345 },
      { x: 260, y: 400 }, { x: 360, y: 330 }, { x: 450, y: 410 },
      { x: 500, y: 382 }, { x: 640, y: 382 }, { x: 710, y: 420 },
      { x: 820, y: 350 }, { x: 930, y: 410 }, { x: 1030, y: 355 },
      { x: 1100, y: 390 },
    ],
  },
  {
    name: 'CRATER RUN',
    gravity: 35,
    fuel: 115,
    start: { x: 1050, y: 58, vx: -95 },
    pad: { x: 150, y: 405, w: 110 },
    terrain: [
      { x: 0, y: 350 }, { x: 80, y: 430 }, { x: 130, y: 420 },
      { x: 150, y: 405 }, { x: 260, y: 405 }, { x: 310, y: 350 },
      { x: 410, y: 430 }, { x: 520, y: 360 }, { x: 640, y: 425 },
      { x: 760, y: 335 }, { x: 880, y: 415 }, { x: 990, y: 350 },
      { x: 1100, y: 430 }, { x: 1200, y: 365 }, { x: 1280, y: 390 },
    ],
  },
  {
    name: 'NARROW VECTOR',
    gravity: 38,
    fuel: 125,
    start: { x: 300, y: 62, vx: 140 },
    pad: { x: 1160, y: 360, w: 85 },
    terrain: [
      { x: 0, y: 400 }, { x: 100, y: 340 }, { x: 210, y: 430 },
      { x: 330, y: 360 }, { x: 440, y: 420 }, { x: 560, y: 330 },
      { x: 690, y: 435 }, { x: 810, y: 350 }, { x: 930, y: 425 },
      { x: 1060, y: 340 }, { x: 1120, y: 390 }, { x: 1160, y: 360 },
      { x: 1245, y: 360 }, { x: 1300, y: 415 }, { x: 1380, y: 350 },
      { x: 1440, y: 390 },
    ],
  },
  {
    name: 'TWIN PEAKS',
    gravity: 34,
    fuel: 110,
    start: { x: 690, y: 55, vx: -30 },
    pad: { x: 240, y: 410, w: 110 },
    terrain: [
      { x: 0, y: 430 }, { x: 100, y: 350 }, { x: 190, y: 430 },
      { x: 220, y: 420 }, { x: 240, y: 410 }, { x: 350, y: 410 },
      { x: 420, y: 340 }, { x: 520, y: 270 }, { x: 620, y: 390 },
      { x: 690, y: 320 }, { x: 760, y: 390 }, { x: 860, y: 260 },
      { x: 950, y: 350 }, { x: 1060, y: 430 }, { x: 1180, y: 340 },
      { x: 1280, y: 410 }, { x: 1380, y: 370 },
    ],
  },
  {
    name: 'LONG TRAVERSE',
    gravity: 33,
    fuel: 145,
    start: { x: 180, y: 52, vx: 165 },
    pad: { x: 1420, y: 405, w: 120 },
    terrain: [
      { x: 0, y: 390 }, { x: 100, y: 340 }, { x: 200, y: 410 },
      { x: 320, y: 330 }, { x: 450, y: 430 }, { x: 570, y: 350 },
      { x: 700, y: 420 }, { x: 840, y: 300 }, { x: 960, y: 380 },
      { x: 1100, y: 435 }, { x: 1230, y: 340 }, { x: 1350, y: 420 },
      { x: 1420, y: 405 }, { x: 1540, y: 405 }, { x: 1600, y: 350 },
      { x: 1680, y: 390 },
    ],
  },
  {
    name: 'BROKEN HORIZON',
    gravity: 40,
    fuel: 120,
    start: { x: 1280, y: 55, vx: -130 },
    pad: { x: 650, y: 370, w: 75 },
    terrain: [
      { x: 0, y: 420 }, { x: 110, y: 350 }, { x: 230, y: 430 },
      { x: 350, y: 320 }, { x: 470, y: 410 }, { x: 570, y: 345 },
      { x: 620, y: 395 }, { x: 650, y: 370 }, { x: 725, y: 370 },
      { x: 770, y: 410 }, { x: 870, y: 300 }, { x: 990, y: 430 },
      { x: 1110, y: 340 }, { x: 1230, y: 415 }, { x: 1350, y: 325 },
      { x: 1450, y: 420 }, { x: 1550, y: 380 },
    ],
  },
];

export function createVectorBreakBricks(level, geometry = {}) {
  const left = geometry.left ?? 44;
  const top = geometry.top ?? 54;
  const columnStep = geometry.columnStep ?? 90;
  const rowStep = geometry.rowStep ?? 34;
  const width = geometry.width ?? 72;
  const height = geometry.height ?? 20;

  return level.rows.flatMap((row, rowIndex) => [...row].flatMap((type, columnIndex) => {
    if (type === '.') return [];
    if (!['1', '2', 'X'].includes(type)) throw new Error(`Unknown Vector Break brick type: ${type}`);
    const indestructible = type === 'X';
    const hits = indestructible ? Number.POSITIVE_INFINITY : Number(type);
    return [{
      x: left + columnIndex * columnStep,
      y: top + rowIndex * rowStep,
      w: width,
      h: height,
      alive: true,
      hits,
      maxHits: hits,
      indestructible,
    }];
  }));
}

export function isVectorBreakLevelClear(bricks) {
  return bricks.every((brick) => brick.indestructible || !brick.alive);
}

export function nextMenuGridIndex(currentIndex, direction, itemCount, columns = 2) {
  if (itemCount <= 0) return -1;
  const safeIndex = currentIndex >= 0 && currentIndex < itemCount ? currentIndex : 0;
  const row = Math.floor(safeIndex / columns);
  const column = safeIndex % columns;

  if (direction === 'left' || direction === 'right') {
    const itemsInRow = Math.min(columns, itemCount - row * columns);
    const offset = direction === 'left' ? -1 : 1;
    const nextColumn = (column + offset + itemsInRow) % itemsInRow;
    return row * columns + nextColumn;
  }

  if (direction === 'up' || direction === 'down') {
    const rows = Math.ceil(itemCount / columns);
    const offset = direction === 'up' ? -1 : 1;
    for (let distance = 1; distance <= rows; distance += 1) {
      const nextRow = (row + offset * distance + rows) % rows;
      const nextIndex = nextRow * columns + column;
      if (nextIndex < itemCount) return nextIndex;
    }
  }

  return safeIndex;
}

export function arcadeEscapeAction(menuOpen) {
  return menuOpen ? 'home' : 'menu';
}

export function terrainHeightAtX(terrain, x) {
  if (x <= terrain[0].x) return terrain[0].y;
  for (let index = 1; index < terrain.length; index += 1) {
    const right = terrain[index];
    if (x <= right.x) {
      const left = terrain[index - 1];
      const progress = (x - left.x) / (right.x - left.x);
      return left.y + (right.y - left.y) * progress;
    }
  }
  return terrain.at(-1).y;
}

export function landerCameraTarget(ship, mission, viewport = {}) {
  const width = viewport.width ?? 800;
  const height = viewport.height ?? 480;
  const worldWidth = mission.terrain.at(-1).x;
  const groundY = terrainHeightAtX(mission.terrain, ship.x);
  const altitude = Math.max(0, groundY - ship.y - (ship.r ?? 0));
  const padCenter = mission.pad.x + mission.pad.w / 2;
  const padDistance = Math.abs(ship.x - padCenter);
  const overviewZoom = Math.min(0.92, (width - 48) / worldWidth);
  const closeZoom = mission.closeZoom ?? 1.18;
  const altitudeProgress = Math.max(0, Math.min(1, (260 - altitude) / 190));
  const smoothAltitude = altitudeProgress * altitudeProgress * (3 - 2 * altitudeProgress);
  const padProgress = 1 - Math.max(0, Math.min(1, (padDistance - mission.pad.w / 2) / 520));
  const approach = smoothAltitude * (0.45 + 0.55 * padProgress);
  const zoom = overviewZoom + (closeZoom - overviewZoom) * approach;
  const approachCenterX = (ship.x + padCenter) / 2;
  const unclampedX = worldWidth / 2 + (approachCenterX - worldWidth / 2) * approach;
  const halfVisibleWidth = width / (2 * zoom);
  const x = worldWidth <= halfVisibleWidth * 2
    ? worldWidth / 2
    : Math.max(halfVisibleWidth, Math.min(worldWidth - halfVisibleWidth, unclampedX));
  const closeY = mission.pad.y - (height * 0.24) / zoom;
  const y = height / 2 + (closeY - height / 2) * approach;
  return { x, y, zoom, altitude };
}

export function estimateLanderFuelUse(mission, physics = {}) {
  const thrust = physics.thrust ?? 105;
  const burnRate = physics.burnRate ?? 14;
  const landingSpeed = physics.landingSpeed ?? 42;
  const padCenter = mission.pad.x + mission.pad.w / 2;
  const verticalDistance = Math.max(1, mission.pad.y - mission.start.y - 13);
  const coastTime = Math.sqrt((2 * verticalDistance) / mission.gravity);
  const cruiseVelocity = (padCenter - mission.start.x) / coastTime;
  const horizontalDelta = Math.abs(cruiseVelocity - mission.start.vx)
    + Math.max(0, Math.abs(cruiseVelocity) - 30);
  const verticalDelta = Math.max(0, mission.gravity * coastTime - landingSpeed);
  const effectiveAcceleration = Math.max(1, thrust - mission.gravity / 2);
  return Math.ceil((Math.hypot(horizontalDelta, verticalDelta) / effectiveAcceleration) * burnRate * 1.2);
}

export function isSafeLanderTouchdown(ship, pad, limits = {}) {
  const maxHorizontalSpeed = limits.maxHorizontalSpeed ?? 30;
  const maxVerticalSpeed = limits.maxVerticalSpeed ?? 48;
  const maxAngle = limits.maxAngle ?? 0.2;
  const radius = ship.r ?? 0;
  return ship.x - radius >= pad.x
    && ship.x + radius <= pad.x + pad.w
    && Math.abs(ship.vx) <= maxHorizontalSpeed
    && ship.vy >= 0
    && ship.vy <= maxVerticalSpeed
    && Math.abs(ship.angle) <= maxAngle;
}

export function burnLanderFuel(fuel, amount, unlimitedFuel = false) {
  return unlimitedFuel ? fuel : Math.max(0, fuel - amount);
}

export function shouldOpenArcade(event, interactiveTarget = false) {
  return event.key === 'Enter'
    && !event.repeat
    && !event.altKey
    && !event.ctrlKey
    && !event.metaKey
    && !event.shiftKey
    && !interactiveTarget;
}

export function circleRectHit(circle, rect) {
  const nearestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.w));
  const nearestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.h));
  const dx = circle.x - nearestX;
  const dy = circle.y - nearestY;
  return (dx * dx) + (dy * dy) <= circle.r * circle.r;
}

export function circleRectBounceAxis(circle, rect, previousPosition) {
  const approachedFromSide = previousPosition.x + circle.r <= rect.x
    || previousPosition.x - circle.r >= rect.x + rect.w;
  const approachedVertically = previousPosition.y + circle.r <= rect.y
    || previousPosition.y - circle.r >= rect.y + rect.h;
  if (approachedFromSide && !approachedVertically) return 'x';
  if (approachedVertically && !approachedFromSide) return 'y';
  return Math.abs(circle.x - previousPosition.x) > Math.abs(circle.y - previousPosition.y) ? 'x' : 'y';
}

export function rectsOverlap(a, b) {
  return a.x < b.x + b.w
    && a.x + a.w > b.x
    && a.y < b.y + b.h
    && a.y + a.h > b.y;
}

export function wrapPoint(point, width, height, margin = 0) {
  let { x, y } = point;
  if (x < -margin) x = width + margin;
  else if (x > width + margin) x = -margin;
  if (y < -margin) y = height + margin;
  else if (y > height + margin) y = -margin;
  return { x, y };
}

export function nextSnakeHead(head, direction, columns, rows) {
  return {
    x: (head.x + direction.x + columns) % columns,
    y: (head.y + direction.y + rows) % rows,
  };
}
