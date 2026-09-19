import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('homepage publishes canonical search and social metadata without visible copy', async () => {
  const homepage = await read('../index.html');
  const head = homepage.match(/<head>([\s\S]*?)<\/head>/)?.[1] ?? '';

  assert.match(head, /<title>Brian Birkinbine \| Cybersecurity &amp; Security Architecture<\/title>/);
  assert.match(head, /<meta name="description" content="Brian Birkinbine is a senior cybersecurity practitioner focused on product security, security architecture, offensive assessment, and AI-assisted engineering\." \/>/);
  assert.match(head, /<link rel="canonical" href="https:\/\/brianbirkinbine\.com\/" \/>/);
  assert.match(head, /<meta property="og:url" content="https:\/\/brianbirkinbine\.com\/" \/>/);
  assert.match(head, /<meta property="og:title" content="Brian Birkinbine \| Cybersecurity &amp; Security Architecture" \/>/);
  assert.match(head, /<meta name="twitter:card" content="summary" \/>/);
});

test('homepage identifies Brian and his public profiles with valid JSON-LD', async () => {
  const homepage = await read('../index.html');
  const jsonText = homepage.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
  assert.ok(jsonText, 'expected JSON-LD in the document head');

  const data = JSON.parse(jsonText);
  assert.equal(data['@context'], 'https://schema.org');
  const graph = data['@graph'];
  const website = graph.find((entry) => entry['@type'] === 'WebSite');
  const profile = graph.find((entry) => entry['@type'] === 'ProfilePage');
  const person = graph.find((entry) => entry['@type'] === 'Person');

  assert.equal(website.url, 'https://brianbirkinbine.com/');
  assert.equal(profile.mainEntity['@id'], 'https://brianbirkinbine.com/#person');
  assert.equal(person.name, 'Brian Birkinbine');
  assert.equal(person.url, 'https://brianbirkinbine.com/');
  assert.deepEqual(person.sameAs, [
    'https://github.com/bbirkinbine',
    'https://www.linkedin.com/in/brianbirkinbine/',
    'https://www.instagram.com/brianbirkinbine/',
    'https://bsky.app/profile/brianbirkinbine.bsky.social',
    'https://x.com/brianbirkinbine',
    'https://keybase.io/brianbirkinbine',
  ]);
});

test('public policy pages declare their own canonical URLs', async () => {
  const [privacy, terms] = await Promise.all([read('../privacy.html'), read('../terms.html')]);
  assert.match(privacy, /<link rel="canonical" href="https:\/\/brianbirkinbine\.com\/privacy\.html" \/>/);
  assert.match(terms, /<link rel="canonical" href="https:\/\/brianbirkinbine\.com\/terms\.html" \/>/);
});

test('sitemap lists canonical public pages and excludes the hidden arcade', async () => {
  const sitemap = await read('../sitemap.xml');
  assert.match(sitemap, /<loc>https:\/\/brianbirkinbine\.com\/<\/loc>/);
  assert.match(sitemap, /<loc>https:\/\/brianbirkinbine\.com\/privacy\.html<\/loc>/);
  assert.match(sitemap, /<loc>https:\/\/brianbirkinbine\.com\/terms\.html<\/loc>/);
  assert.doesNotMatch(sitemap, /games/);
  assert.doesNotMatch(sitemap, /bbirkinbine\.github\.io/);
});

test('robots file allows crawling and advertises the canonical sitemap', async () => {
  const robots = await read('../robots.txt');
  assert.match(robots, /^User-agent: \*$/m);
  assert.match(robots, /^Allow: \/$/m);
  assert.match(robots, /^Sitemap: https:\/\/brianbirkinbine\.com\/sitemap\.xml$/m);
});
