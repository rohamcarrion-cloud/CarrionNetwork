import { test, expect } from '@playwright/test';
import sharp from 'sharp';

test('image library, show and episode covers survive reload, replacement and detach', async ({
  page,
}, testInfo) => {
  const email = `media-${testInfo.project.name}-${Date.now()}@example.test`;
  const image = await sharp({
    create: { width: 48, height: 32, channels: 3, background: 'red' },
  })
    .png()
    .toBuffer();
  await page.goto('/sign-up');
  await page.getByLabel('Display name').fill('Image Creator');
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
    page.getByRole('heading', { name: 'Welcome back, Image Creator.' }),
  ).toBeVisible();
  await page.goto('/media');
  await page
    .getByLabel('Upload image')
    .setInputFiles({ name: 'first.png', mimeType: 'image/png', buffer: image });
  await expect(page.getByText('first.png', { exact: true })).toBeVisible();
  await page.getByLabel('Alt text for first.png').fill('Red artwork');
  await page.getByRole('button', { name: 'Save alt text' }).click();
  await expect(page.getByText('Alt text saved')).toBeVisible();
  await page.goto('/shows/new');
  await page.getByLabel('Title', { exact: true }).fill('Illustrated show');
  await page.getByRole('button', { name: 'Choose or upload cover' }).click();
  await page.getByRole('button', { name: 'Select first.png' }).click();
  await expect(page.getByRole('img', { name: 'Selected cover' })).toBeVisible();
  await page.getByRole('button', { name: 'Create show', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Illustrated show', exact: true }),
  ).toBeVisible();
  const showUrl = page.url();
  await page.reload();
  await expect(page.getByRole('img', { name: 'Selected cover' })).toBeVisible();
  await page.getByRole('link', { name: 'New episode' }).click();
  await expect(
    page.getByText(/Show artwork will be the future publishing fallback/),
  ).toBeVisible();
  await page.getByLabel('Title', { exact: true }).fill('Illustrated episode');
  await page.getByRole('button', { name: 'Choose or upload cover' }).click();
  await page.getByLabel('Upload image').setInputFiles({
    name: 'second.png',
    mimeType: 'image/png',
    buffer: image,
  });
  await expect(page.getByRole('img', { name: 'Selected cover' })).toBeVisible();
  await page
    .getByRole('button', { name: 'Create episode', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Illustrated episode', exact: true }),
  ).toBeVisible();
  const episodeUrl = page.url();
  await page.reload();
  await expect(page.getByRole('img', { name: 'Selected cover' })).toBeVisible();
  await page.goto('/media');
  const first = page
    .getByRole('article')
    .filter({ has: page.getByText('first.png', { exact: true }) });
  await first
    .getByRole('button', { name: 'Delete image', exact: true })
    .click();
  await first.getByRole('button', { name: 'Confirm delete image' }).click();
  await expect(first.getByRole('alert')).toContainText('Image is used');
  await page.goto(showUrl);
  await page.getByRole('button', { name: 'Choose or upload cover' }).click();
  await page.getByRole('button', { name: 'Select second.png' }).click();
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Show saved' }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByRole('img', { name: 'Selected cover' })).toBeVisible();
  await page.goto(episodeUrl);
  await page.getByRole('button', { name: 'Remove cover' }).click();
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Episode saved' }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText(/Show artwork will be the future publishing fallback/),
  ).toBeVisible();
  await page.goto('/media');
  await expect(page.getByText('second.png', { exact: true })).toBeVisible();
  const unused = page
    .getByRole('article')
    .filter({ has: page.getByText('first.png', { exact: true }) });
  await unused
    .getByRole('button', { name: 'Delete image', exact: true })
    .click();
  await unused.getByRole('button', { name: 'Confirm delete image' }).click();
  await expect(page.getByText('first.png', { exact: true })).toHaveCount(0);
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
  await expect(
    page.getByText('No images yet. Upload your first image.'),
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
