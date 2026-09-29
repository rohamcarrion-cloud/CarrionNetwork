import { test, expect } from '@playwright/test';
// @ts-expect-error Shared generated MP3 fixture is plain Node JavaScript.
import { silentMp3 } from '../../api/test/helpers/audio.js';

test('audio library, episode assignment, replacement, detach and isolation', async ({
  page,
}, testInfo) => {
  const email = `media-${testInfo.project.name}-${Date.now()}@example.test`;
  const audioBytes = silentMp3();
  await page.goto('/sign-up');
  await page.getByLabel('Display name').fill('Audio Creator');
  await page.getByLabel('Email address').fill(email);
  await page
    .getByLabel('Password', { exact: true })
    .fill('media-test-password');
  await page
    .getByRole('button', { name: 'Create account', exact: true })
    .click();
  await expect(page.getByRole('status')).toContainText('Account created');
  await page.getByLabel('Email address').fill(email);
  await page
    .getByLabel('Password', { exact: true })
    .fill('media-test-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Welcome back, Audio Creator.' }),
  ).toBeVisible();
  await page.goto('/media');
  await page.getByLabel('Media type').selectOption('audio');
  await page.getByLabel('Upload audio').setInputFiles({
    name: 'first.mp3',
    mimeType: 'audio/mpeg',
    buffer: audioBytes,
  });
  await expect(page.getByText('first.mp3', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Preview audio' }).click();
  await expect(page.locator('audio')).toHaveAttribute('src', /^blob:/);
  await expect
    .poll(() =>
      page
        .locator('audio')
        .evaluate((audio: HTMLAudioElement) => audio.duration),
    )
    .toBeGreaterThan(0);
  await page.goto('/shows/new');
  await page.getByLabel('Title', { exact: true }).fill('Podcast show');
  await page.getByRole('button', { name: 'Create show', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Podcast show', exact: true }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole('link', { name: 'New episode' }).click();
  await expect(page.getByText(/No audio selected/)).toBeVisible();
  await page.getByLabel('Title', { exact: true }).fill('Podcast episode');
  await page.getByRole('button', { name: 'Choose or upload audio' }).click();
  await page.getByRole('button', { name: 'Select first.mp3' }).click();
  await expect(
    page.getByRole('button', { name: 'Detach audio' }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Create episode', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Podcast episode', exact: true }),
  ).toBeVisible();
  const episodeUrl = page.url();
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Detach audio' }),
  ).toBeVisible();
  await page.goto('/media');
  await page.getByLabel('Media type').selectOption('audio');
  const first = page
    .getByRole('article')
    .filter({ has: page.getByText('first.mp3', { exact: true }) });
  await first
    .getByRole('button', { name: 'Delete audio', exact: true })
    .click();
  await first.getByRole('button', { name: 'Confirm delete audio' }).click();
  await expect(first.getByRole('alert')).toContainText('Audio is used');
  await page.goto(episodeUrl);
  await page.getByRole('button', { name: 'Replace audio' }).click();
  await page.getByLabel('Upload audio').setInputFiles({
    name: 'second.mp3',
    mimeType: 'audio/mpeg',
    buffer: audioBytes,
  });
  await expect(
    page.getByRole('button', { name: 'Detach audio' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Episode saved' }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Detach audio' }),
  ).toBeVisible();
  await page.goto('/media');
  await page.getByLabel('Media type').selectOption('audio');
  await expect(page.getByText('first.mp3', { exact: true })).toBeVisible();
  await expect(page.getByText('second.mp3', { exact: true })).toBeVisible();
  await page.goto(episodeUrl);
  await page.getByRole('button', { name: 'Detach audio' }).click();
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Episode saved' }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByText(/No audio selected/)).toBeVisible();
  await page.goto('/media');
  await page.getByLabel('Media type').selectOption('audio');
  await expect(page.getByText('second.mp3', { exact: true })).toBeVisible();
  const unused = page
    .getByRole('article')
    .filter({ has: page.getByText('first.mp3', { exact: true }) });
  await unused
    .getByRole('button', { name: 'Delete audio', exact: true })
    .click();
  await unused.getByRole('button', { name: 'Confirm delete audio' }).click();
  await expect(page.getByText('first.mp3', { exact: true })).toHaveCount(0);
  await page.screenshot({
    path: testInfo.outputPath('media-library.png'),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  const ownerWorkspace = await page.evaluate(async () => {
    const response = await fetch('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem('carrion.session')}`,
      },
    });
    return (await response.json()).user.id as string;
  });
  const otherEmail = `other-${email}`;
  await page.request.post('/api/auth/register', {
    data: {
      email: otherEmail,
      password: 'media-test-password',
      display_name: 'Other Creator',
    },
  });
  await page.evaluate(() => sessionStorage.clear());
  await page.goto('/sign-in');
  await page.getByLabel('Email address').fill(otherEmail);
  await page
    .getByLabel('Password', { exact: true })
    .fill('media-test-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Welcome back, Other Creator.' }),
  ).toBeVisible();
  await page.goto('/media');
  await page.getByLabel('Media type').selectOption('audio');
  await expect(
    page.getByText('No media yet. Upload your first audio file.'),
  ).toBeVisible();
  expect(
    await page.evaluate(
      async (workspace) =>
        (
          await fetch(`/api/workspaces/${workspace}/media`, {
            headers: {
              Authorization: `Bearer ${sessionStorage.getItem('carrion.session')}`,
            },
          })
        ).status,
      ownerWorkspace,
    ),
  ).toBe(404);
});
