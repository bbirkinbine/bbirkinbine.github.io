import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('the homepage exposes an accessible, text-native ASCII portrait', async () => {
  const homepage = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const styles = await readFile(new URL('../styles.css', import.meta.url), 'utf8');

  assert.match(homepage, /<figure class="ascii-portrait" role="img" aria-label="ASCII portrait of Brian Birkinbine">/);
  assert.match(homepage, /<pre aria-hidden="true">[\s\S]+<\/pre>/);
  assert.doesNotMatch(homepage, /<figure class="ascii-portrait"[\s\S]*?<img\b/);
  assert.match(styles, /\.ascii-portrait pre\s*\{/);
  assert.match(styles, /font-size:\s*clamp\(/);
});
