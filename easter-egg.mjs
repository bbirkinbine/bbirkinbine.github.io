import {
  KONAMI_SEQUENCE,
  advanceSequenceProgress,
  appendTypedSecret,
  shouldOpenArcade,
  typedSecretAction,
} from './games/game-core.mjs?v=20260924-11';

let konamiProgress = 0;
let typedBuffer = '';
let messageTimer;
let navigating = false;

function showMessage(lines, variant, duration = 2200, onComplete) {
  window.clearTimeout(messageTimer);
  document.querySelector('.easter-egg-message')?.remove();

  const message = document.createElement('div');
  message.className = `easter-egg-message easter-egg-message--${variant}`;
  message.setAttribute('role', 'status');
  message.setAttribute('aria-live', 'assertive');

  const panel = document.createElement('div');
  panel.className = 'easter-egg-message__panel';
  lines.forEach((line) => {
    const paragraph = document.createElement('p');
    paragraph.textContent = line;
    panel.append(paragraph);
  });
  message.append(panel);
  document.body.append(message);

  requestAnimationFrame(() => message.classList.add('is-visible'));
  messageTimer = window.setTimeout(() => {
    message.classList.remove('is-visible');
    window.setTimeout(() => message.remove(), 180);
    onComplete?.();
  }, duration);
}

function openArcade(source = 'enter') {
  if (navigating) return;
  navigating = true;
  window.location.assign(`games/index.html?v=20260924-11&source=${source}`);
}

window.addEventListener('keydown', (event) => {
  const target = event.target;
  const interactiveTarget = target instanceof Element
    && Boolean(target.closest('a, button, input, select, textarea, [contenteditable="true"]'));

  if (event.defaultPrevented || interactiveTarget) return;

  konamiProgress = advanceSequenceProgress(KONAMI_SEQUENCE, konamiProgress, event.code);
  if (konamiProgress === KONAMI_SEQUENCE.length) {
    konamiProgress = 0;
    typedBuffer = '';
    document.dispatchEvent(new CustomEvent('bb:unlock-origin-code'));
    showMessage(['ORIGIN CODE ACCEPTED', 'GRADIUS // 1986'], 'origin', 2100);
    return;
  }

  if (!event.repeat && !event.altKey && !event.ctrlKey && !event.metaKey) {
    typedBuffer = appendTypedSecret(typedBuffer, event.key);
    const secretAction = typedSecretAction(typedBuffer);

    if (secretAction === 'wargames') {
      typedBuffer = '';
      navigating = true;
      showMessage(
        ['LOGON: JOSHUA', 'GREETINGS PROFESSOR FALKEN.', 'SHALL WE PLAY A GAME?'],
        'wargames',
        1800,
        () => window.location.assign('games/index.html?v=20260924-11&source=joshua'),
      );
      return;
    }

    if (secretAction === 'sudo') {
      typedBuffer = '';
      showMessage(
        ['$ sudo', 'visitor is not in the sudoers file.', 'This incident will be reported.'],
        'sudo',
      );
      return;
    }
  }

  if (shouldOpenArcade(event, interactiveTarget)) {
    event.preventDefault();
    openArcade();
  }
});
