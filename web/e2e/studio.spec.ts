import { test, expect } from '@playwright/test';

test('creator account, podcast CRUD, optional season, lifecycle, session and navigation', async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const email = `studio-${testInfo.project.name}-${Date.now()}@example.test`;
  const password = 'browser-test-password';
  await page.goto('/shows');
  await expect(
    page.getByRole('heading', { name: 'Welcome back' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Create an account' }).click();
  await page.getByLabel('Display name').fill('Studio Creator');
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
    page.getByRole('heading', { name: 'Your shows', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('link', { name: 'Create a show', exact: true })
    .first()
    .click();
  await page.getByLabel('Title', { exact: true }).fill('BusinessMind');
  await page
    .getByLabel('Description')
    .fill('Conversations about building a creative business.');
  await page.getByRole('button', { name: 'Create show' }).click();
  await expect(
    page.getByRole('heading', { name: 'BusinessMind', exact: true }),
  ).toBeVisible();
  await page.getByLabel('Title', { exact: true }).fill('BusinessMind Studio');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Show saved' }),
  ).toBeVisible();
  await page.getByLabel('Season title').fill('First season');
  await page.getByRole('button', { name: 'Add season' }).click();
  await expect(
    page.getByRole('button', { name: 'Remove empty season 1' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'New episode' }).click();
  await page
    .getByRole('combobox', { name: 'Season', exact: true })
    .selectOption({ label: '1. First season' });
  await page.getByLabel('Episode type').selectOption('trailer');
  await page.getByLabel('Episode number').fill('1');
  await page
    .getByLabel('Title', { exact: true })
    .fill('The first conversation');
  await page.getByLabel('Description').fill('Why we started.');
  await page.getByRole('button', { name: 'Create episode' }).click();
  await expect(
    page.getByRole('heading', { name: 'The first conversation', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('combobox', { name: 'Season', exact: true }),
  ).not.toHaveValue('');
  await expect(page.getByLabel('Episode type')).toHaveValue('trailer');
  const guid = await page.locator('.episode-meta code').textContent();
  await page
    .getByLabel('Title', { exact: true })
    .fill('A better first conversation');
  await page
    .getByRole('combobox', { name: 'Status', exact: true })
    .selectOption('scheduled');
  await page
    .getByLabel('Publish date and time (your local time)')
    .fill('2099-01-01T12:00');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Episode saved' }),
  ).toBeVisible();
  await expect(page.locator('.episode-meta code')).toHaveText(guid!);
  await page.reload();
  await expect(
    page.getByRole('heading', {
      name: 'A better first conversation',
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole('combobox', { name: 'Status', exact: true }),
  ).toHaveValue('scheduled');
  await page
    .getByRole('combobox', { name: 'Status', exact: true })
    .selectOption('draft');
  await page
    .getByRole('combobox', { name: 'Season', exact: true })
    .selectOption('');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(
    page.getByRole('combobox', { name: 'Status', exact: true }),
  ).toHaveValue('draft');
  await page
    .getByRole('button', { name: 'Delete episode', exact: true })
    .click();
  await page.getByRole('button', { name: 'Confirm delete episode' }).click();
  await expect(
    page.getByRole('heading', { name: 'The next conversation is yours' }),
  ).toBeVisible();
  const navigate = async (name: string) => {
    const toggle = page.getByRole('button', { name: 'Open navigation' });
    if (await toggle.isVisible()) await toggle.click();
    await page
      .getByRole('navigation', { name: 'Creator navigation' })
      .getByRole('link', { name, exact: true })
      .click();
  };
  await navigate('Dashboard');
  await expect(
    page.getByRole('heading', { name: 'Welcome back, Studio Creator.' }),
  ).toBeVisible();
  await expect(page.locator('.stat').first()).toContainText('1');
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await page.screenshot({
    path: testInfo.outputPath('dashboard.png'),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await navigate('Media Library');
  await expect(page.getByLabel('Upload image')).toBeVisible();
  await navigate('Distribution');
  await expect(page.getByText('PLANNED · NOT AVAILABLE YET')).toBeVisible();
  await navigate('Settings');
  await expect(page.getByText(email)).toBeVisible();
  await expect(
    page.getByText('Connected to Carrion Network', { exact: true }),
  ).toBeVisible();
  await navigate('Shows');
  await page
    .getByRole('heading', { name: 'BusinessMind Studio', exact: true })
    .click();
  await page.getByRole('button', { name: 'Delete show', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm delete show' }).click();
  await expect(
    page.getByRole('heading', { name: 'Make room for your first show' }),
  ).toBeVisible();
  const toggle = page.getByRole('button', { name: 'Open navigation' });
  if (await toggle.isVisible()) await toggle.click();
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(
    page.getByRole('heading', { name: 'Welcome back' }),
  ).toBeVisible();
  await page.goBack();
  await expect(
    page.getByRole('heading', { name: 'Welcome back' }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test('both loopback hostnames reach the API through the same-origin proxy', async ({
  page,
}) => {
  for (const hostname of ['localhost', '127.0.0.1']) {
    await page.goto(`http://${hostname}:5174/sign-in`);
    const result = await page.evaluate(async () => {
      const response = await fetch('/api/health');
      return { status: response.status, body: await response.json() };
    });
    expect(result).toEqual({ status: 200, body: { status: 'ok' } });
  }
});
