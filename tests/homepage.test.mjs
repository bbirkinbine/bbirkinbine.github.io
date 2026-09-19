import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

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
  assert.doesNotMatch(portrait, /\.(?:jpe?g|png|webp)/i);
});
