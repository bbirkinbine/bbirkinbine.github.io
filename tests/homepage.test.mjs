import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('the homepage exposes an accessible ANSI half-block portrait', async () => {
  const homepage = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const styles = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  const portrait = await readFile(new URL('../ansi-portrait.mjs', import.meta.url), 'utf8');

  assert.match(homepage, /<figure class="ansi-portrait" role="img" aria-label="ANSI portrait of Brian Birkinbine">/);
  assert.match(homepage, /<pre data-ansi-portrait aria-hidden="true"><\/pre>/);
  assert.doesNotMatch(homepage, /<figure class="ansi-portrait"[\s\S]*?<img\b/);
  assert.match(styles, /\.ansi-portrait pre\s*\{/);
  assert.match(styles, /font-size:\s*clamp\(/);
  assert.match(portrait, /"▀"\.repeat/);
});
