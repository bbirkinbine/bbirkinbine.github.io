import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

const runThemeScript = (
  themeScript,
  { savedStyle = null, originUnlocked = false, joshuaUnlocked = false, reset = false } = {},
) => {
  const documentListeners = {};
  const toggleListeners = {};
  const attributes = {};
  const removed = [];
  const historyState = { url: null };
  const writes = [];
  const toggleState = { blurCount: 0 };
  const root = { dataset: {} };
  const storage = new Map();
  if (savedStyle) storage.set('bb-style', savedStyle);
  if (originUnlocked) storage.set('bb-origin-code-unlocked', '1');
  if (joshuaUnlocked) storage.set('bb-joshua-game-unlocked', '1');
  const toggle = {
    addEventListener(type, listener) {
      toggleListeners[type] = listener;
    },
    setAttribute(name, value) {
      attributes[name] = value;
    },
    blur() {
      toggleState.blurCount += 1;
    },
  };

  const context = {
    document: {
      documentElement: root,
      addEventListener(type, listener) {
        documentListeners[type] = listener;
      },
      querySelectorAll() {
        return [toggle];
      },
    },
    localStorage: {
      getItem(key) {
        return storage.get(key) ?? null;
      },
      setItem(key, value) {
        storage.set(key, value);
        writes.push([key, value]);
      },
      removeItem(key) {
        storage.delete(key);
        removed.push(key);
      },
    },
    location: {
      search: reset ? '?reset-easter-eggs=1' : '',
      pathname: '/index.html',
      hash: '',
    },
    history: {
      replaceState(_state, _title, url) {
        historyState.url = url;
      },
    },
  };

  runInNewContext(themeScript, context);
  return {
    attributes,
    documentListeners,
    historyState,
    removed,
    root,
    storage,
    toggleListeners,
    toggleState,
    writes,
  };
};

test('the homepage exposes an accessible responsive halftone portrait', async () => {
  const homepage = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const styles = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  const portrait = await readFile(new URL('../dot-portrait.mjs', import.meta.url), 'utf8');

  assert.match(homepage, /<figure class="dot-portrait" role="img" aria-label="Halftone portrait of Brian Birkinbine">/);
  assert.match(homepage, /<canvas data-dot-portrait aria-hidden="true"><\/canvas>/);
  assert.doesNotMatch(homepage, /<figure class="dot-portrait"[\s\S]*?<img\b/);
  assert.match(styles, /\.dot-portrait canvas\s*\{/);
  assert.match(styles, /aspect-ratio:\s*96 \/ 105/);
  assert.match(styles, /--portrait-dot:/);
  assert.match(portrait, /const portraitColumns = 96/);
  assert.match(portrait, /const portraitRowCount = 105/);
  assert.match(portrait, /context\.arc\(/);
  assert.doesNotMatch(portrait, /1\s*-\s*normalized/);
  assert.match(portrait, /attributeFilter:\s*\["data-style"\]/);
  assert.doesNotMatch(portrait, /\.(?:jpe?g|png|webp)/i);
});

test('the homepage is a focused calling card without an empty Work section', async () => {
  const homepage = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const styles = await readFile(new URL('../styles.css', import.meta.url), 'utf8');

  assert.match(homepage, /<p class="profile-intro">/);
  assert.match(homepage, /I work in cybersecurity\. My current obsession is building local AI systems and agent workflows\./);
  assert.match(homepage, /20\+ years in product security, security architecture, and offensive assessment\./);
  assert.doesNotMatch(homepage, /class="work-card"|id="work-title"/);
  assert.match(styles, /\.profile-intro\s*\{/);
  assert.match(styles, /grid-area:\s*intro/);
  assert.doesNotMatch(styles, /\.work-card/);
});

test('public pages declare the shared SVG favicon', async () => {
  const pages = await Promise.all([
    readFile(new URL('../index.html', import.meta.url), 'utf8'),
    readFile(new URL('../privacy.html', import.meta.url), 'utf8'),
    readFile(new URL('../terms.html', import.meta.url), 'utf8'),
    readFile(new URL('../games/index.html', import.meta.url), 'utf8'),
  ]);

  for (const page of pages) {
    assert.match(page, /<link rel="icon" href="\/favicon\.svg" type="image\/svg\+xml" \/>/);
  }
});

test('the site exposes four standard styles and a persistent hidden Origin Code style', async () => {
  const [homepage, privacy, terms, styles, themeScript] = await Promise.all([
    readFile(new URL('../index.html', import.meta.url), 'utf8'),
    readFile(new URL('../privacy.html', import.meta.url), 'utf8'),
    readFile(new URL('../terms.html', import.meta.url), 'utf8'),
    readFile(new URL('../styles.css', import.meta.url), 'utf8'),
    readFile(new URL('../theme.js', import.meta.url), 'utf8'),
  ]);

  for (const page of [homepage, privacy, terms]) {
    assert.match(page, /class="style-toggle"/);
    assert.doesNotMatch(page, /class="theme-toggle"/);
  }

  for (const style of ['terminal', 'arcade-night', 'vector-field', 'red-grid', 'origin-code']) {
    assert.match(themeScript, new RegExp(`["']${style}["']`));
    assert.match(styles, new RegExp(`data-style="${style}"`));
  }

  assert.match(themeScript, /bb-style/);
  assert.match(themeScript, /bb-origin-code-unlocked/);
  assert.match(themeScript, /findStyle\("vector-field"\)/);
  assert.doesNotMatch(themeScript, /randomStyle/);
  assert.match(styles, /color-scheme:\s*dark/);
  assert.doesNotMatch(styles, /prefers-color-scheme/);
  assert.match(styles, /@media \(forced-colors: active\)/);
  assert.match(styles, /@media print/);
});

test('the Konami event unlocks Origin Code and keeps it in later selector cycles', async () => {
  const themeScript = await readFile(new URL('../theme.js', import.meta.url), 'utf8');
  const firstUnlock = runThemeScript(themeScript);
  firstUnlock.documentListeners.DOMContentLoaded();
  firstUnlock.documentListeners['bb:unlock-origin-code']();

  assert.equal(firstUnlock.root.dataset.style, 'origin-code');
  assert.deepEqual(firstUnlock.writes, [
    ['bb-origin-code-unlocked', '1'],
    ['bb-style', 'origin-code'],
  ]);
  assert.equal(
    firstUnlock.attributes['aria-label'],
    'Switch visual style. Current: Origin Code. Next: Terminal',
  );

  const reload = runThemeScript(themeScript, {
    savedStyle: 'origin-code',
    originUnlocked: true,
  });
  assert.equal(reload.root.dataset.style, 'origin-code');

  const unlockedRedGrid = runThemeScript(themeScript, {
    savedStyle: 'red-grid',
    originUnlocked: true,
  });
  unlockedRedGrid.documentListeners.DOMContentLoaded();
  unlockedRedGrid.toggleListeners.click({ detail: 1 });
  assert.equal(unlockedRedGrid.root.dataset.style, 'origin-code');
});

test('the reset URL clears both exclusive unlocks before the style selector initializes', async () => {
  const themeScript = await readFile(new URL('../theme.js', import.meta.url), 'utf8');
  const resetVisit = runThemeScript(themeScript, {
    savedStyle: 'origin-code',
    originUnlocked: true,
    joshuaUnlocked: true,
    reset: true,
  });

  assert.equal(resetVisit.root.dataset.style, 'vector-field');
  assert.deepEqual([...resetVisit.storage.entries()], []);
  assert.deepEqual(resetVisit.removed, [
    'bb-style',
    'bb-origin-code-unlocked',
    'bb-joshua-game-unlocked',
  ]);
  assert.equal(resetVisit.historyState.url, '/index.html');
});

test('Origin Code uses a dedicated pixel-shooter scene rather than Vector Field artwork', async () => {
  const homepage = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const styles = await readFile(new URL('../styles.css', import.meta.url), 'utf8');

  assert.match(homepage, /class="origin-flight"/);
  assert.match(homepage, /class="origin-ship"/);
  assert.match(homepage, /class="origin-power-meter"/);
  assert.match(homepage, />SPEED UP</);
  assert.match(homepage, />OPTION</);
  assert.match(styles, /shape-rendering='crispEdges'/);
  assert.match(styles, /animation:\s*origin-scroll/);
  assert.match(styles, /image-rendering:\s*pixelated/);
});

test('Vector Field is the default until the visitor uses the selector', async () => {
  const themeScript = await readFile(new URL('../theme.js', import.meta.url), 'utf8');
  const firstVisit = runThemeScript(themeScript);

  assert.equal(firstVisit.root.dataset.style, 'vector-field');
  assert.deepEqual(firstVisit.writes, []);

  firstVisit.documentListeners.DOMContentLoaded();
  firstVisit.toggleListeners.click({ detail: 1 });

  assert.equal(firstVisit.root.dataset.style, 'red-grid');
  assert.deepEqual(firstVisit.writes, [['bb-style', 'red-grid']]);
  assert.equal(
    firstVisit.attributes['aria-label'],
    'Switch visual style. Current: Red Grid City. Next: Terminal',
  );

  const laterVisit = runThemeScript(themeScript, {
    savedStyle: 'red-grid',
  });

  assert.equal(laterVisit.root.dataset.style, 'red-grid');
  assert.deepEqual(laterVisit.writes, []);
});

test('pointer style selection releases focus for the global Enter shortcut', async () => {
  const themeScript = await readFile(new URL('../theme.js', import.meta.url), 'utf8');
  const pointerVisit = runThemeScript(themeScript);
  pointerVisit.documentListeners.DOMContentLoaded();
  pointerVisit.toggleListeners.click({ detail: 1 });

  assert.equal(pointerVisit.toggleState.blurCount, 1);

  const keyboardVisit = runThemeScript(themeScript);
  keyboardVisit.documentListeners.DOMContentLoaded();
  keyboardVisit.toggleListeners.click({ detail: 0 });

  assert.equal(keyboardVisit.toggleState.blurCount, 0);
});
