export const GAME_IDS = ['vector-break', 'star-dodge', 'vector-snake', 'vector-invaders', 'vector-asteroids'];

export function chooseGame(random = Math.random) {
  const index = Math.min(GAME_IDS.length - 1, Math.floor(random() * GAME_IDS.length));
  return GAME_IDS[index];
}

export function starfieldSpeed(baseSpeed, elapsedSeconds) {
  const multiplier = 1 + Math.min(Math.max(elapsedSeconds, 0), 45) / 15;
  return baseSpeed * multiplier;
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
