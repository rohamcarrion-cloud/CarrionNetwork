import { test, expect } from '@playwright/test';
import sharp from 'sharp';
// @ts-expect-error Shared generated MP3 fixture is plain Node JavaScript.
import { silentMp3 } from '../../api/test/helpers/audio.js';

test('RSS publishes snapshots, safe artwork and stable enclosures through withdrawal and restore', async ({
  page,
}, testInfo) => {
  const email = `rss-${testInfo.project.name}-${Date.now()}@example.test`;
  const password = 'publishing-test-password';
  await page.goto('/sign-up');
  await page.getByLabel('Display name').fill('Publishing Creator');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page
    .getByRole('button', { name: 'Create account', exact: true })
    .click();
  await expect(page.getByRole('status')).toContainText('Account created');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Welcome back, Publishing Creator.' }),
  ).toBeVisible();
  await page.goto('/shows/new');
  await page.getByLabel('Title', { exact: true }).fill('Publishable podcast');
  await page
    .getByLabel('Description', { exact: true })
    .fill('A podcast about making things.');
  await page.getByText('More podcast details', { exact: true }).click();
  await page.getByLabel('Author / creator').fill('Publishing Creator');
  await page.getByLabel('Category', { exact: true }).fill('Technology');
  await page.getByLabel('Website URL').fill('https://example.test/podcast');
  await page.getByRole('button', { name: 'Create show', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Publishable podcast', exact: true }),
  ).toBeVisible();
  const artwork = await sharp({
    create: { width: 1400, height: 1400, channels: 3, background: 'purple' },
  })
    .png()
    .toBuffer();
  await page.getByRole('button', { name: 'Choose or upload cover' }).click();
  await page.getByLabel('Upload image').setInputFiles({
    name: 'cover.png',
    mimeType: 'image/png',
    buffer: artwork,
  });
  await expect(page.getByRole('img', { name: 'Selected cover' })).toBeVisible();
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Show saved' }),
  ).toBeVisible();
  const showUrl = page.url();
  const rss = page.getByRole('region', { name: 'RSS publishing', exact: true });
  await expect(
    rss.getByText('Ready to enable RSS', { exact: true }),
  ).toBeVisible();
  const feedUrl = await rss.getByLabel('RSS Feed URL').inputValue();
  await rss.getByRole('button', { name: 'Enable RSS', exact: true }).click();
  await expect(
    rss.getByText('No published Episodes yet', { exact: true }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'New episode' }).click();
  await expect(
    page.getByRole('heading', { name: 'Draft a new episode' }),
  ).toBeVisible();
  await page
    .getByLabel('Title', { exact: true })
    .fill('First published conversation');
  await page
    .getByLabel('Description', { exact: true })
    .fill('The first conversation.');
  await page.getByRole('button', { name: 'Choose or upload cover' }).click();
  await page.getByLabel('Upload image').setInputFiles({
    name: 'episode-cover.png',
    mimeType: 'image/png',
    buffer: artwork,
  });
  await expect(page.getByRole('img', { name: 'Selected cover' })).toBeVisible();
  await page
    .getByRole('button', { name: 'Create episode', exact: true })
    .click();
  const controls = page.getByRole('region', {
    name: 'Publishing',
    exact: true,
  });
  await expect(
    controls.getByText('Not ready to publish', { exact: true }),
  ).toBeVisible();
  await expect(
    controls.getByRole('button', { name: 'Publish', exact: true }),
  ).toBeDisabled();
  await page.getByRole('button', { name: 'Choose or upload audio' }).click();
  const bytes = silentMp3();
  await page.getByLabel('Upload audio').setInputFiles({
    name: 'published.mp3',
    mimeType: 'audio/mpeg',
    buffer: bytes,
  });
  await expect(
    page.getByRole('button', { name: 'Detach audio' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(
    controls.getByText('Ready to publish', { exact: true }),
  ).toBeVisible();
  const episodeId = page.url().split('/').pop()!;
  const token = await page.evaluate(() =>
    sessionStorage.getItem('carrion.session'),
  );
  const headers = { Authorization: `Bearer ${token}` };
  const before = (
    await (
      await page.request.get(`/api/episodes/${episodeId}`, { headers })
    ).json()
  ).episode;
  await controls.getByRole('button', { name: 'Publish', exact: true }).click();
  await expect(controls.getByText('Published', { exact: true })).toBeVisible();
  const first = (
    await (
      await page.request.get(`/api/episodes/${episodeId}/publication`, {
        headers,
      })
    ).json()
  ).publication;
  expect(first.guid).toBe(before.guid);
  async function readFeed() {
    const response = await page.request.get(feedUrl);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/rss+xml');
    const xml = await response.text();
    return page.evaluate((xml) => {
      const doc = new DOMParser().parseFromString(xml, 'application/xml');
      if (doc.querySelector('parsererror')) throw new Error('Invalid XML');
      return {
        guids: Array.from(doc.querySelectorAll('guid')).map(
          (n) => n.textContent,
        ),
        enclosure: doc.querySelector('enclosure')?.getAttribute('url'),
        art: Array.from(
          doc.getElementsByTagNameNS(
            'http://www.itunes.com/dtds/podcast-1.0.dtd',
            'image',
          ),
        ).map((n) => n.getAttribute('href')),
      };
    }, xml);
  }
  const feed = await readFeed();
  expect(feed.guids).toEqual([first.guid]);
  expect(feed.enclosure).toContain(
    `/public/media/${first.representation_id}/${first.guid}.mp3`,
  );
  expect(feed.art.length).toBe(2);
  for (const url of feed.art)
    expect((await page.request.head(url!)).status()).toBe(200);
  expect((await page.request.head(feed.enclosure!)).status()).toBe(200);
  expect(
    (
      await page.request.get(feed.enclosure!, {
        headers: { Range: 'bytes=0-9' },
      })
    ).status(),
  ).toBe(206);

  await page.reload();
  await expect(controls.getByText('Published', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Detach audio' }),
  ).toBeVisible();
  await controls
    .getByRole('button', { name: 'Unpublish', exact: true })
    .click();
  await expect(
    controls.getByText('Unpublished — archived', { exact: true }),
  ).toBeVisible();
  expect((await readFeed()).guids).toEqual([]);
  const publicPath = '/api' + first.media_url;
  expect((await page.request.head(publicPath)).status()).toBe(200);
  await controls
    .getByRole('button', { name: 'Republish', exact: true })
    .click();
  await expect(controls.getByText('Published', { exact: true })).toBeVisible();
  await page.reload();
  await expect(controls.getByText('Published', { exact: true })).toBeVisible();
  const after = (
    await (
      await page.request.get(`/api/episodes/${episodeId}/publication`, {
        headers,
      })
    ).json()
  ).publication;
  expect(after.guid).toBe(first.guid);
  expect(after.representation_id).toBe(first.representation_id);
  expect(after.published_at).toBe(first.published_at);
  expect(after.media_url).toBe(first.media_url);
  expect((await readFeed()).guids).toEqual([first.guid]);
  expect((await readFeed()).enclosure).toBe(feed.enclosure);
  const head = await page.request.head(publicPath);
  expect(head.status()).toBe(200);
  expect(head.headers()['content-type']).toBe('audio/mpeg');
  expect(head.headers()['content-length']).toBe(String(bytes.length));
  const range = await page.request.get(publicPath, {
    headers: { Range: 'bytes=0-9' },
  });
  expect(range.status()).toBe(206);
  expect(await range.body()).toEqual(bytes.subarray(0, 10));
  expect(
    (
      await page.request.get(publicPath, {
        headers: { Range: 'bytes=999999-' },
      })
    ).status(),
  ).toBe(416);
  const user = (
    await (await page.request.get('/api/auth/me', { headers })).json()
  ).user;
  expect(
    (
      await page.request.get(
        `/api/workspaces/${user.id}/media/${before.primary_audio_asset_id}/content`,
      )
    ).status(),
  ).toBe(401);
  expect(
    (
      await page.request.get(
        `/api/public/media/${before.primary_audio_asset_id}`,
      )
    ).status(),
  ).toBe(404);
  await page.goto(showUrl);
  await expect(rss.getByText('Feed ready', { exact: true })).toBeVisible();
  await expect(rss.getByLabel('RSS Feed URL')).toHaveValue(feedUrl);
  const popupPromise = page.waitForEvent('popup');
  await rss.getByRole('link', { name: 'View Feed' }).click();
  const popup = await popupPromise;
  await popup.waitForLoadState();
  expect(popup.url()).toBe(feedUrl);
  await popup.close();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page
    .getByRole('heading', { name: 'Publishable podcast', exact: true })
    .click();
  await page.screenshot({
    path: testInfo.outputPath('rss-publishing.png'),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
