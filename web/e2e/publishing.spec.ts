import { test, expect } from '@playwright/test';
import sharp from 'sharp';
// @ts-expect-error Shared generated MP3 fixture is plain Node JavaScript.
import { silentMp3 } from '../../api/test/helpers/audio.js';

test('publish, restore session, unpublish and republish preserve identity and public media', async ({
  page,
}, testInfo) => {
  const email = `publishing-${testInfo.project.name}-${Date.now()}@example.test`;
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
  await page.getByRole('button', { name: 'Create show', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Publishable podcast', exact: true }),
  ).toBeVisible();
  const artwork = await sharp({
    create: { width: 48, height: 48, channels: 3, background: 'purple' },
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
  await page.screenshot({
    path: testInfo.outputPath('published-episode.png'),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
