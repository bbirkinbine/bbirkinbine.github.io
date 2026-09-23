import { shouldOpenArcade } from './games/game-core.mjs?v=20260923-6';

window.addEventListener('keydown', (event) => {
  const target = event.target;
  const interactiveTarget = target instanceof Element
    && Boolean(target.closest('a, button, input, select, textarea, [contenteditable="true"]'));

  if (!event.defaultPrevented && shouldOpenArcade(event, interactiveTarget)) {
    event.preventDefault();
    window.location.assign('/games/?v=20260923-6');
  }
});
