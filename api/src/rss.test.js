import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { escapeXml, generateFeed, publicBase, matchesEtag } from './rss.js';
const show = {
  feed_id: 'feed-id',
  title: 'Voices & <Stories> "世界"',
  description: 'A show & stories',
  website_url: 'https://example.test/?a=1&b=2',
  language: 'en-US',
  author: 'The creators',
  category: 'Society & Culture',
  explicit: false,
  show_type: 'episodic',
  artwork: { id: 'art-id', mime_type: 'image/png' },
};
const item = {
  title: 'A <great> story',
  description: 'Text & "quotes" ]]> 😀\u0000',
  guid: 'stable-guid',
  published_at: '2026-09-28T12:00:00Z',
  representation_id: 'rep-id',
  size_bytes: '12345',
  mime_type: 'audio/mpeg',
  duration_seconds: 61.4,
  explicit: true,
  episode_number: 3,
  season_number: 2,
  episode_type: 'full',
};
const changed = new Date('2026-09-28T12:00:00Z');
export function parseXml(xml) {
  const dom = new JSDOM('');
  const doc = new dom.window.DOMParser().parseFromString(
    xml,
    'application/xml',
  );
  assert.equal(doc.querySelector('parsererror'), null);
  dom.window.close();
  return doc;
}
test('RSS is well-formed UTF-8 XML with namespaces, escaped metadata and real enclosure values', () => {
  const { xml } = generateFeed(
    show,
    [item],
    'https://public.test/api',
    changed,
  );
  const doc = parseXml(xml);
  assert.equal(doc.documentElement.getAttribute('version'), '2.0');
  assert.equal(doc.querySelector('channel > title').textContent, show.title);
  assert.equal(doc.querySelector('item > title').textContent, item.title);
  assert.equal(
    doc.querySelector('item > description').textContent,
    'Text & "quotes" ]]> 😀',
  );
  assert.equal(doc.querySelector('guid').getAttribute('isPermaLink'), 'false');
  assert.equal(doc.querySelector('guid').textContent, 'stable-guid');
  const enc = doc.querySelector('enclosure');
  assert.equal(
    enc.getAttribute('url'),
    'https://public.test/api/public/media/rep-id/stable-guid.mp3',
  );
  assert.equal(enc.getAttribute('length'), '12345');
  assert.equal(enc.getAttribute('type'), 'audio/mpeg');
  assert.equal(
    doc.getElementsByTagNameNS(
      'http://www.itunes.com/dtds/podcast-1.0.dtd',
      'duration',
    )[0].textContent,
    '61',
  );
  assert.equal(
    doc
      .getElementsByTagNameNS('http://www.w3.org/2005/Atom', 'link')[0]
      .getAttribute('rel'),
    'self',
  );
  assert.equal(
    doc.querySelector('pubDate').textContent,
    'Mon, 28 Sep 2026 12:00:00 GMT',
  );
  assert.equal(
    doc.querySelector('lastBuildDate').textContent,
    changed.toUTCString(),
  );
});
test('empty feeds, optional episode artwork, serial metadata and deterministic output', () => {
  assert.equal(
    parseXml(
      generateFeed(show, [], 'https://public.test', changed).xml,
    ).querySelectorAll('item').length,
    0,
  );
  const a = generateFeed(
    show,
    [{ ...item, artwork: { id: 'episode-art', mime_type: 'image/jpeg' } }],
    'https://public.test',
    changed,
  );
  assert.deepEqual(
    a,
    generateFeed(
      show,
      [{ ...item, artwork: { id: 'episode-art', mime_type: 'image/jpeg' } }],
      'https://public.test',
      changed,
    ),
  );
  assert.notEqual(
    a.etag,
    generateFeed(
      { ...show, title: 'Changed' },
      [item],
      'https://public.test',
      changed,
    ).etag,
  );
  assert.match(a.xml, /episode-art.jpg/);
  assert.match(a.xml, /<itunes:episode>3/);
  assert.match(a.xml, /<itunes:season>2/);
  assert.equal(
    parseXml(generateFeed(show, [item], 'https://public.test', changed).xml)
      .querySelector('item')
      .getElementsByTagNameNS(
        'http://www.itunes.com/dtds/podcast-1.0.dtd',
        'image',
      ).length,
    0,
  );
});
test('XML rejects injection by encoding markup and stripping XML 1.0 forbidden code points', () => {
  const input = '\u0000\u0001\ud800\ufffe\uffff & < > " \' ]]>\n\t😀';
  const doc = parseXml(`<root>${escapeXml(input)}</root>`);
  assert.equal(doc.documentElement.textContent, ' & < > " \' ]]>\n\t😀');
  assert.equal(doc.documentElement.children.length, 0);
});
test('canonical base is configured, prefix-safe, and never derived from a request Host', () => {
  const prior = process.env.PUBLIC_BASE_URL;
  try {
    for (const base of ['https://public.test/api/', 'http://localhost:3010/']) {
      process.env.PUBLIC_BASE_URL = base;
      assert.equal(publicBase(), base.slice(0, -1));
    }
    for (const base of [
      '',
      'http://public.test',
      'https://user:pass@public.test',
      'https://public.test/#x',
      'https://public.test/?x=1',
      'file:///tmp/feed',
    ]) {
      process.env.PUBLIC_BASE_URL = base;
      assert.throws(publicBase, /PUBLIC_BASE_URL/);
    }
  } finally {
    if (prior === undefined) delete process.env.PUBLIC_BASE_URL;
    else process.env.PUBLIC_BASE_URL = prior;
  }
});
test('conditional ETags support weak comparison, lists and wildcard', () => {
  assert.equal(matchesEtag(undefined, '"a"'), false);
  assert.equal(matchesEtag('W/"a", "b"', '"a"'), true);
  assert.equal(matchesEtag('*', '"a"'), true);
  assert.equal(matchesEtag('"b"', '"a"'), false);
});
