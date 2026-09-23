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
    start: { x: 400, y: 68, vx: 18 },
    pad: { x: 340, y: 370, w: 120 },
    terrain: [
      { x: 0, y: 350 }, { x: 70, y: 382 }, { x: 160, y: 345 },
      { x: 270, y: 405 }, { x: 320, y: 390 }, { x: 340, y: 370 },
      { x: 460, y: 370 }, { x: 530, y: 415 }, { x: 650, y: 365 },
      { x: 740, y: 400 }, { x: 800, y: 380 },
    ],
  },
  {
    name: 'CRATER RUN',
    gravity: 35,
    start: { x: 520, y: 64, vx: -32 },
    pad: { x: 90, y: 392, w: 100 },
    terrain: [
      { x: 0, y: 360 }, { x: 60, y: 425 }, { x: 90, y: 392 },
      { x: 190, y: 392 }, { x: 250, y: 348 }, { x: 335, y: 418 },
      { x: 430, y: 372 }, { x: 520, y: 430 }, { x: 610, y: 355 },
      { x: 700, y: 410 }, { x: 800, y: 368 },
    ],
  },
  {
    name: 'NARROW VECTOR',
    gravity: 38,
    start: { x: 260, y: 62, vx: 38 },
    pad: { x: 610, y: 352, w: 80 },
    terrain: [
      { x: 0, y: 405 }, { x: 85, y: 350 }, { x: 175, y: 420 },
      { x: 275, y: 365 }, { x: 360, y: 432 }, { x: 455, y: 355 },
      { x: 545, y: 415 }, { x: 590, y: 380 }, { x: 610, y: 352 },
      { x: 690, y: 352 }, { x: 735, y: 405 }, { x: 800, y: 375 },
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
