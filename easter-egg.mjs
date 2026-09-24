import {
  KONAMI_SEQUENCE,
  advanceSequenceProgress,
  appendTypedSecret,
  shouldOpenArcade,
  typedSecretAction,
} from './games/game-core.mjs?v=20260924-14';

let konamiProgress = 0;
let typedBuffer = '';
let messageTimer;
let navigating = false;

function showMessage(lines, variant, duration = 5000, onComplete) {
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

function showChoicePrompt(lines, { onYes, onNo }) {
  window.clearTimeout(messageTimer);
  document.querySelector('.easter-egg-message')?.remove();

  const previousFocus = document.activeElement;
  const message = document.createElement('div');
  message.className = 'easter-egg-message easter-egg-message--wargames easter-egg-message--prompt';
  message.setAttribute('role', 'dialog');
  message.setAttribute('aria-modal', 'true');
  message.setAttribute('aria-label', 'Shall we play a game?');

  const panel = document.createElement('div');
  panel.className = 'easter-egg-message__panel';
  lines.forEach((line) => {
    const paragraph = document.createElement('p');
    paragraph.textContent = line;
    panel.append(paragraph);
  });

  const choices = document.createElement('div');
  choices.className = 'easter-egg-choices';
  const yesButton = document.createElement('button');
  yesButton.type = 'button';
  yesButton.className = 'easter-egg-choice';
  yesButton.dataset.choice = 'yes';
  yesButton.textContent = 'YES';
  const noButton = document.createElement('button');
  noButton.type = 'button';
  noButton.className = 'easter-egg-choice';
  noButton.dataset.choice = 'no';
  noButton.textContent = 'NO';
  choices.append(yesButton, noButton);
  panel.append(choices);
  message.append(panel);

  let answered = false;
  const answer = (accepted) => {
    if (answered) return;
    answered = true;
    message.classList.remove('is-visible');
    window.setTimeout(() => {
      message.remove();
      if (accepted) onYes();
      else {
        onNo?.();
        if (previousFocus instanceof HTMLElement) previousFocus.focus({ preventScroll: true });
      }
    }, 160);
  };

  yesButton.addEventListener('click', () => answer(true));
  noButton.addEventListener('click', () => answer(false));
  message.addEventListener('click', (event) => {
    if (event.target === message) answer(false);
  });
  message.addEventListener('keydown', (event) => {
    if (['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown'].includes(event.key)) {
      event.preventDefault();
      event.stopPropagation();
      const nextChoice = ['ArrowLeft', 'ArrowUp'].includes(event.key) ? yesButton : noButton;
      nextChoice.focus({ preventScroll: true });
    } else if (event.key.toLowerCase() === 'y') {
      event.preventDefault();
      event.stopPropagation();
      answer(true);
    } else if (event.key.toLowerCase() === 'n' || event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      answer(false);
    }
  });

  document.body.append(message);
  requestAnimationFrame(() => {
    message.classList.add('is-visible');
    yesButton.focus({ preventScroll: true });
  });
}

function openArcade(source = 'enter') {
  if (navigating) return;
  navigating = true;
  window.location.assign(`games/index.html?v=20260924-14&source=${source}`);
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
    showMessage(['ORIGIN CODE ACCEPTED', 'GRADIUS // 1986'], 'origin');
    return;
  }

  if (!event.repeat && !event.altKey && !event.ctrlKey && !event.metaKey) {
    typedBuffer = appendTypedSecret(typedBuffer, event.key);
    const secretAction = typedSecretAction(typedBuffer);

    if (secretAction === 'wargames') {
      typedBuffer = '';
      showChoicePrompt(
        ['LOGON: JOSHUA', 'GREETINGS PROFESSOR FALKEN.', 'SHALL WE PLAY A GAME?'],
        {
          onYes: () => openArcade('joshua'),
          onNo: () => { navigating = false; },
        },
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
