import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

const runThemeScript = (themeScript, { savedStyle = null } = {}) => {
  const documentListeners = {};
  const toggleListeners = {};
  const attributes = {};
  const writes = [];
  const toggleState = { blurCount: 0 };
  const root = { dataset: {} };
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
      getItem() {
        return savedStyle;
      },
      setItem(key, value) {
        writes.push([key, value]);
      },
    },
  };

  runInNewContext(themeScript, context);
  return { attributes, documentListeners, root, toggleListeners, toggleState, writes };
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

test('the site exposes four persistent dark-only visual styles', async () => {
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

  for (const style of ['terminal', 'arcade-night', 'vector-field', 'red-grid']) {
    assert.match(themeScript, new RegExp(`["']${style}["']`));
    assert.match(styles, new RegExp(`data-style="${style}"`));
  }

  assert.match(themeScript, /bb-style/);
  assert.equal(themeScript.match(/localStorage\.setItem/g)?.length, 1);
  assert.match(themeScript, /findStyle\("vector-field"\)/);
  assert.doesNotMatch(themeScript, /randomStyle/);
  assert.match(styles, /color-scheme:\s*dark/);
  assert.doesNotMatch(styles, /prefers-color-scheme/);
  assert.match(styles, /@media \(forced-colors: active\)/);
  assert.match(styles, /@media print/);
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
