export const GAME_IDS = ['vector-break', 'vector-snake', 'vector-invaders', 'vector-asteroids'];

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
