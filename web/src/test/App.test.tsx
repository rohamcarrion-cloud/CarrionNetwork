import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { App } from '../App';

const user = {
  id: 'owner',
  email: 'creator@example.test',
  display_name: 'Creator',
};
const token = 'a'.repeat(64);
const show = {
  id: 'show-1',
  owner_id: user.id,
  title: 'BusinessMind',
  description: 'Conversations',
  status: 'draft',
  updated_at: '2026-09-27',
  created_at: '2026-09-27',
};
const episode = {
  id: 'episode-1',
  show_id: show.id,
  title: 'First conversation',
  description: 'A story',
  status: 'draft',
  guid: 'stable-guid',
  updated_at: '2026-09-27',
};
type Handler = (path: string, init: RequestInit) => Response | undefined;
let custom: Handler | undefined;
let requests: Array<{ path: string; init: RequestInit }>;
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
beforeEach(() => {
  custom = undefined;
  requests = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init: RequestInit = {}) => {
      const path = new URL(url, 'http://localhost').pathname.replace(
        /^\/api/,
        '',
      );
      requests.push({ path, init });
      const response = custom?.(path, init);
      if (response) return response;
      if (path === '/auth/me') return json({ user });
      if (path === '/auth/login') return json({ token, user });
      if (path === '/auth/register') return json({ user }, 201);
      if (path === '/auth/logout') return new Response(null, { status: 204 });
      if (path === '/shows') return json({ items: [show] });
      if (path === `/shows/${show.id}`) return json({ show });
      if (path === `/shows/${show.id}/episodes`)
        return json({ items: [episode] });
      if (path === `/episodes/${episode.id}`) return json({ episode });
      if (path.endsWith('/seasons')) return json({ items: [] });
      if (path === '/health') return json({ status: 'ok' });
      throw new Error(`Unexpected request: ${init.method} ${path}`);
    }),
  );
});
afterEach(() => vi.unstubAllGlobals());
function open(path = '/', signedIn = false) {
  if (signedIn) sessionStorage.setItem('carrion.session', token);
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}
it('protects deep links, signs in, restores the destination, and signs out', async () => {
  const interaction = userEvent.setup();
  open('/settings');
  await screen.findByRole('heading', { name: 'Welcome back' });
  await interaction.type(screen.getByLabelText('Email address'), user.email);
  await interaction.type(
    screen.getByLabelText('Password'),
    'long-password-123',
  );
  await interaction.click(screen.getByRole('button', { name: 'Sign in' }));
  await screen.findByRole('heading', { name: 'Creator profile' });
  expect(screen.getByText(user.email)).toBeInTheDocument();
  expect(sessionStorage.getItem('carrion.session')).toBe(token);
  await interaction.click(screen.getByRole('button', { name: 'Sign out' }));
  await screen.findByRole('heading', { name: 'Welcome back' });
  expect(sessionStorage.getItem('carrion.session')).toBeNull();
});
it('registers an account and explicitly prompts for sign-in', async () => {
  const interaction = userEvent.setup();
  open('/sign-up');
  await interaction.type(screen.getByLabelText('Display name'), 'Creator');
  await interaction.type(screen.getByLabelText('Email address'), user.email);
  await interaction.type(
    screen.getByLabelText('Password'),
    'long-password-123',
  );
  await interaction.click(
    screen.getByRole('button', { name: 'Create account' }),
  );
  expect(await screen.findByRole('status')).toHaveTextContent(
    'Account created',
  );
  expect(
    requests.find((request) => request.path === '/auth/register')?.init.body,
  ).toBe(
    JSON.stringify({
      email: user.email,
      password: 'long-password-123',
      display_name: 'Creator',
    }),
  );
});
it('restores sessions on reload and redirects expired sessions without exposing studio content', async () => {
  custom = (path) =>
    path === '/auth/me' ? json({ error: 'Session expired' }, 401) : undefined;
  open('/shows', true);
  await screen.findByRole('heading', { name: 'Welcome back' });
  expect(
    screen.queryByRole('heading', { name: 'Your shows' }),
  ).not.toBeInTheDocument();
  expect(sessionStorage.getItem('carrion.session')).toBeNull();
});
it('keeps the saved session on network failure and supports restoration retry', async () => {
  custom = (path) => {
    if (path === '/auth/me') throw new TypeError('offline');
    return undefined;
  };
  const interaction = userEvent.setup();
  open('/settings', true);
  await screen.findByRole('alert');
  expect(sessionStorage.getItem('carrion.session')).toBe(token);
  custom = undefined;
  await interaction.click(screen.getByRole('button', { name: 'Try again' }));
  await screen.findByRole('heading', { name: 'Creator profile' });
});
it('shows validation errors and lets creators retry without losing draft input', async () => {
  custom = (path, init) =>
    path === '/shows' && init.method === 'POST'
      ? json({ error: 'Record already exists' }, 409)
      : undefined;
  const interaction = userEvent.setup();
  open('/shows/new', true);
  await interaction.type(
    await screen.findByLabelText('Title'),
    'New conversation',
  );
  await interaction.click(screen.getByRole('button', { name: 'Create show' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Record already exists',
  );
  expect(screen.getByLabelText('Title')).toHaveValue('New conversation');
});
it('creates a show using only supported draft fields', async () => {
  custom = (path, init) =>
    path === '/shows' && init.method === 'POST'
      ? json({ show }, 201)
      : undefined;
  const interaction = userEvent.setup();
  open('/shows/new', true);
  await interaction.type(await screen.findByLabelText('Title'), show.title);
  await interaction.type(
    screen.getByLabelText('Description'),
    show.description,
  );
  await interaction.click(screen.getByRole('button', { name: 'Create show' }));
  await screen.findByRole('heading', { name: show.title });
  const body = JSON.parse(
    String(
      requests.find(
        (request) =>
          request.path === '/shows' && request.init.method === 'POST',
      )?.init.body,
    ),
  );
  expect(body).toEqual({ title: show.title, description: show.description });
});
it('edits an episode, preserves its GUID, and requires confirmation before deleting', async () => {
  let current = { ...episode };
  custom = (path, init) => {
    if (path !== `/episodes/${episode.id}`) return undefined;
    if (init.method === 'PATCH') {
      current = {
        ...current,
        ...JSON.parse(String(init.body)),
        updated_at: '2026-09-28',
      };
      return json({ episode: current });
    }
    if (init.method === 'DELETE') return new Response(null, { status: 204 });
    return json({ episode: current });
  };
  const interaction = userEvent.setup();
  open(`/shows/${show.id}/episodes/${episode.id}`, true);
  await interaction.clear(await screen.findByLabelText('Title'));
  await interaction.type(
    screen.getByLabelText('Title'),
    'Updated conversation',
  );
  await interaction.click(screen.getByRole('button', { name: 'Save changes' }));
  await screen.findByRole('heading', { name: 'Updated conversation' });
  expect(screen.getByText('stable-guid')).toBeInTheDocument();
  await interaction.click(
    screen.getByRole('button', { name: 'Delete episode' }),
  );
  expect(requests.some((request) => request.init.method === 'DELETE')).toBe(
    false,
  );
  await interaction.click(
    within(
      screen.getByRole('group', { name: 'Confirm delete episode' }),
    ).getByRole('button', { name: 'Confirm delete episode' }),
  );
  await screen.findByRole('heading', { name: show.title });
  expect(
    requests.some(
      (request) =>
        request.path === `/episodes/${episode.id}` &&
        request.init.method === 'DELETE',
    ),
  ).toBe(true);
});
it('does not offer owner-only deletion to a team member', async () => {
  custom = (path) =>
    path === `/shows/${show.id}`
      ? json({ show: { ...show, owner_id: 'someone-else', my_role: 'editor' } })
      : undefined;
  open(`/shows/${show.id}`, true);
  await screen.findByRole('heading', { name: 'Edit show' });
  expect(
    screen.queryByRole('button', { name: 'Delete show' }),
  ).not.toBeInTheDocument();
});
it('shows an actionable empty state and marks future modules as unavailable', async () => {
  custom = (path) => (path === '/shows' ? json({ items: [] }) : undefined);
  const interaction = userEvent.setup();
  open('/episodes', true);
  await screen.findByRole('heading', { name: 'Every episode needs a home' });
  await interaction.click(screen.getByRole('link', { name: 'Distribution' }));
  expect(
    await screen.findByText('PLANNED · NOT AVAILABLE YET'),
  ).toBeInTheDocument();
  expect(requests.some((request) => request.path.startsWith('/media'))).toBe(
    false,
  );
});
it('reports logout failure and retains the session until revocation succeeds', async () => {
  custom = (path) =>
    path === '/auth/logout'
      ? json({ error: 'Temporarily unavailable' }, 503)
      : undefined;
  const interaction = userEvent.setup();
  open('/settings', true);
  await interaction.click(
    await screen.findByRole('button', { name: 'Sign out' }),
  );
  await waitFor(() =>
    expect(screen.getByRole('alert')).toHaveTextContent('Sign out failed'),
  );
  expect(sessionStorage.getItem('carrion.session')).toBe(token);
});
it('saves podcast season and lifecycle metadata without changing ownership or GUID', async () => {
  const interaction = userEvent.setup();
  custom = (path, init) => {
    if (path.endsWith('/seasons'))
      return json({
        items: [{ id: 'season-1', title: 'First season', season_number: 1 }],
      });
    if (path === `/episodes/${episode.id}` && init.method === 'PATCH')
      return json({ error: 'Try later' }, 503);
    return undefined;
  };
  open(`/shows/${show.id}/episodes/${episode.id}`, true);
  await interaction.selectOptions(
    await screen.findByRole('combobox', { name: /^Season$/ }),
    'season-1',
  );
  await interaction.selectOptions(
    screen.getByRole('combobox', { name: /^Status$/ }),
    'archived',
  );
  await interaction.selectOptions(
    screen.getByRole('combobox', { name: 'Explicit content' }),
    'true',
  );
  await interaction.click(screen.getByRole('button', { name: 'Save changes' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Try later');
  const body = JSON.parse(
    String(
      requests.find(
        (r) =>
          r.path === `/episodes/${episode.id}` && r.init.method === 'PATCH',
      )?.init.body,
    ),
  );
  expect(body).toEqual({
    title: episode.title,
    description: episode.description,
    season_id: 'season-1',
    status: 'archived',
    explicit: true,
  });
  expect(screen.getByRole('combobox', { name: /^Season$/ })).toHaveValue(
    'season-1',
  );
});

it('uploads images, edits alt text and reports referenced deletion', async () => {
  const asset = {
    id: 'image-1',
    original_filename: 'cover.png',
    alt_text: '',
    width: 32,
    height: 24,
    size_bytes: '123',
    created_at: '2026-09-28',
  };
  let uploaded = false;
  vi.stubGlobal(
    'URL',
    Object.assign(URL, {
      createObjectURL: vi.fn(() => 'blob:preview'),
      revokeObjectURL: vi.fn(),
    }),
  );
  custom = (path, init) => {
    if (path.endsWith('/content')) return new Response(new Blob(['image']));
    if (path === '/workspaces/owner/media') {
      if (init.method === 'POST') {
        uploaded = true;
        return json({ asset }, 201);
      }
      return json({
        items: uploaded ? [asset] : [],
        pagination: { has_more: false },
      });
    }
    if (path.endsWith('/media/image-1'))
      return init.method === 'DELETE'
        ? json({ error: 'Image is used by a show or episode' }, 409)
        : json({ asset });
  };
  const interaction = userEvent.setup();
  open('/media', true);
  await screen.findByText('No images yet. Upload your first image.');
  await interaction.upload(
    screen.getByLabelText('Upload image'),
    new File(['image'], 'cover.png', { type: 'image/png' }),
  );
  await screen.findByText('cover.png');
  await interaction.type(
    screen.getByLabelText('Alt text for cover.png'),
    'Cover description',
  );
  await interaction.click(
    screen.getByRole('button', { name: 'Save alt text' }),
  );
  await screen.findByText('Alt text saved');
  expect(
    requests.some(
      (r) => r.init.body === JSON.stringify({ alt_text: 'Cover description' }),
    ),
  ).toBe(true);
  await interaction.click(screen.getByRole('button', { name: 'Delete image' }));
  await interaction.click(
    screen.getByRole('button', { name: 'Confirm delete image' }),
  );
  await screen.findByText('Image is used by a show or episode');
});
it('selects and detaches a cover without deleting the image', async () => {
  const asset = {
    id: 'image-1',
    original_filename: 'cover.png',
    alt_text: '',
    width: 32,
    height: 24,
    size_bytes: '123',
    created_at: '2026-09-28',
  };
  vi.stubGlobal(
    'URL',
    Object.assign(URL, {
      createObjectURL: vi.fn(() => 'blob:preview'),
      revokeObjectURL: vi.fn(),
    }),
  );
  custom = (path, init) => {
    if (path.endsWith('/content')) return new Response(new Blob(['image']));
    if (path.endsWith('/media'))
      return json({ items: [asset], pagination: { has_more: false } });
    if (path === `/shows/${show.id}` && init.method === 'PATCH')
      return json({ show: { ...show, ...JSON.parse(init.body as string) } });
  };
  const interaction = userEvent.setup();
  open(`/shows/${show.id}`, true);
  await interaction.click(
    await screen.findByRole('button', { name: 'Choose or upload cover' }),
  );
  await interaction.click(
    await screen.findByRole('button', { name: 'Select cover.png' }),
  );
  await interaction.click(screen.getByRole('button', { name: 'Save changes' }));
  await screen.findByText('Show saved.');
  expect(
    requests.some(
      (r) =>
        typeof r.init.body === 'string' &&
        r.init.body.includes('"cover_asset_id":"image-1"'),
    ),
  ).toBe(true);
  await interaction.click(screen.getByRole('button', { name: 'Remove cover' }));
  await interaction.click(screen.getByRole('button', { name: 'Save changes' }));
  await waitFor(() =>
    expect(
      requests.some(
        (r) =>
          typeof r.init.body === 'string' &&
          r.init.body.includes('"cover_asset_id":null'),
      ),
    ).toBe(true),
  );
  expect(requests.some((r) => r.init.method === 'DELETE')).toBe(false);
});
