import { createHash } from 'node:crypto';

// Conservative top-level categories; subcategories are a future explicit contract.
export const categories = [
  'Arts',
  'Business',
  'Comedy',
  'Education',
  'Fiction',
  'Government',
  'History',
  'Health & Fitness',
  'Kids & Family',
  'Leisure',
  'Music',
  'News',
  'Religion & Spirituality',
  'Science',
  'Society & Culture',
  'Sports',
  'Technology',
  'True Crime',
  'TV & Film',
];
export function xmlText(value) {
  return String(value ?? '').replace(
    /[^\u0009\u000A\u000D\u0020-\uD7FF\uE000-\uFFFD\u{10000}-\u{10FFFF}]/gu,
    '',
  );
}
export function escapeXml(value) {
  return xmlText(value).replace(
    /[&<>"']/g,
    (c) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&apos;',
      })[c],
  );
}
export function publicBase() {
  try {
    const u = new URL(process.env.PUBLIC_BASE_URL);
    if (
      u.username ||
      u.password ||
      u.search ||
      u.hash ||
      !(
        u.protocol === 'https:' ||
        (u.protocol === 'http:' &&
          ['localhost', '127.0.0.1', '[::1]'].includes(u.hostname))
      )
    )
      throw Error();
    return u.href.replace(/\/$/, '');
  } catch {
    throw Object.assign(
      new Error(
        'Configure PUBLIC_BASE_URL with HTTPS (HTTP is allowed only for local development).',
      ),
      { status: 503 },
    );
  }
}
export const artworkPath = (a) =>
  `/public/artwork/${a.id}.${a.mime_type === 'image/png' ? 'png' : 'jpg'}`;
const tag = (name, value) => `<${name}>${escapeXml(value)}</${name}>`;
export function generateFeed(show, items, base, lastModified) {
  const feedUrl = `${base}/feeds/${show.feed_id}.xml`;
  const artwork = `${base}${artworkPath(show.artwork)}`;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
${tag('title', show.title)}
${tag('description', show.description)}
${tag('link', show.website_url)}
${tag('language', show.language)}
${show.copyright ? tag('copyright', show.copyright) : ''}
${tag('itunes:author', show.author)}
<itunes:category text="${escapeXml(show.category)}"/>
${tag('itunes:explicit', show.explicit)}
${tag('itunes:type', show.show_type)}
<itunes:image href="${escapeXml(artwork)}"/>
<image>${tag('url', artwork)}${tag('title', show.title)}${tag('link', show.website_url)}</image>
<atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml"/>
${tag('lastBuildDate', lastModified.toUTCString())}
<generator>Carrion Network</generator>
${items
  .map(
    (p) => `<item>
${tag('title', p.title)}
${tag('description', p.description)}
${tag('pubDate', new Date(p.published_at).toUTCString())}
<guid isPermaLink="false">${escapeXml(p.guid)}</guid>
<enclosure url="${escapeXml(`${base}/public/media/${p.representation_id}/${p.guid}.mp3`)}" length="${escapeXml(p.size_bytes)}" type="${escapeXml(p.mime_type)}"/>
${tag('itunes:duration', Math.max(1, Math.round(p.duration_seconds)))}
${tag('itunes:explicit', p.explicit)}
${tag('itunes:episodeType', p.episode_type)}
${p.episode_number ? tag('itunes:episode', p.episode_number) : ''}
${p.season_number ? tag('itunes:season', p.season_number) : ''}
${p.artwork ? `<itunes:image href="${escapeXml(base + artworkPath(p.artwork))}"/>` : ''}
</item>`,
  )
  .join('\n')}
</channel>
</rss>\n`;
  return {
    xml,
    etag: `"${createHash('sha256').update(xml).digest('hex')}"`,
    lastModified: lastModified.toUTCString(),
  };
}
export function matchesEtag(header, etag) {
  return (
    header
      ?.split(',')
      .some((v) => v.trim() === '*' || v.trim().replace(/^W\//, '') === etag) ??
    false
  );
}
