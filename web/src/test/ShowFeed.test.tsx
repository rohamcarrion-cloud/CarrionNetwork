import { beforeEach, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShowFeed } from '../features/ShowFeed';
import type { FeedState } from '../api/types';
const api = vi.hoisted(() => ({ feed: vi.fn(), enableFeed: vi.fn() }));
vi.mock('../auth/AuthProvider', () => ({ useAuth: () => ({ api }) }));
let state: FeedState;
beforeEach(() => {
  vi.resetAllMocks();
  state = {
    feed_url: 'https://public.test/feeds/stable.xml',
    enabled: false,
    ready: true,
    issues: [],
    published_episodes: 0,
  };
  api.feed.mockImplementation(async () => state);
  api.enableFeed.mockImplementation(async () => {
    state = { ...state, enabled: true };
    return state;
  });
});
it('presents a stable URL, copies it and enables an empty feed with View action', async () => {
  const user = userEvent.setup();
  const copy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
  render(<ShowFeed showId="show" onChange={vi.fn()} />);
  expect(await screen.findByText('Ready to enable RSS')).toBeVisible();
  expect(screen.getByLabelText('RSS Feed URL')).toHaveValue(state.feed_url);
  expect(
    screen.queryByRole('link', { name: 'View Feed' }),
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Copy Feed URL' }));
  expect(copy).toHaveBeenCalledWith(state.feed_url);
  expect(screen.getByText('Feed URL copied.')).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Enable RSS' }));
  expect(await screen.findByText('No published Episodes yet')).toBeVisible();
  expect(screen.getByRole('link', { name: 'View Feed' })).toHaveAttribute(
    'href',
    state.feed_url,
  );
});
it('shows feed-ready state and published episode count', async () => {
  state = { ...state, enabled: true, published_episodes: 2 };
  render(<ShowFeed showId="show" onChange={vi.fn()} />);
  expect(await screen.findByText('Feed ready')).toBeVisible();
  expect(
    screen.getByText('2 published Episodes eligible for RSS.'),
  ).toBeVisible();
});
it('explains missing artwork and metadata and prevents enabling', async () => {
  state = {
    ...state,
    ready: false,
    issues: [
      {
        field: 'cover_asset_id',
        message: 'Add Show artwork before enabling RSS.',
      },
      { field: 'website_url', message: 'Add the Show website url.' },
    ],
  };
  render(<ShowFeed showId="show" onChange={vi.fn()} />);
  expect(await screen.findByText('Feed needs attention')).toBeVisible();
  expect(
    screen.getByText('Add Show artwork before enabling RSS.'),
  ).toBeVisible();
  expect(screen.getByText('Add the Show website url.')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Enable RSS' })).toBeDisabled();
});
it('retains a retry after an enable error', async () => {
  api.enableFeed.mockRejectedValueOnce(new Error('Artwork unavailable'));
  const user = userEvent.setup();
  render(<ShowFeed showId="show" onChange={vi.fn()} />);
  await user.click(await screen.findByRole('button', { name: 'Enable RSS' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Artwork unavailable',
  );
  await user.click(screen.getByRole('button', { name: 'Enable RSS' }));
  expect(await screen.findByText('No published Episodes yet')).toBeVisible();
});
it('reports clipboard failure and allows URL selection', async () => {
  const user = userEvent.setup();
  vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(
    new Error('Unavailable'),
  );
  render(<ShowFeed showId="show" onChange={vi.fn()} />);
  await user.click(
    await screen.findByRole('button', { name: 'Copy Feed URL' }),
  );
  expect(await screen.findByRole('alert')).toHaveTextContent('Select and copy');
  expect(screen.getByLabelText('RSS Feed URL')).toHaveValue(state.feed_url);
});
it('retries failed readiness requests', async () => {
  api.feed.mockRejectedValueOnce(new Error('Network unavailable'));
  const user = userEvent.setup();
  render(<ShowFeed showId="show" onChange={vi.fn()} />);
  await user.click(
    within(await screen.findByRole('alert')).getByRole('button'),
  );
  expect(await screen.findByText('Ready to enable RSS')).toBeVisible();
});

it('warns about omitted optional Episode artwork without blocking a ready feed', async () => {
  state = {
    ...state,
    enabled: true,
    published_episodes: 1,
    warnings: [
      { field: 'episode.artwork', message: 'Use square JPEG or PNG.' },
    ],
  };
  render(<ShowFeed showId="show" onChange={vi.fn()} />);
  expect(await screen.findByText('Feed ready')).toBeVisible();
  expect(
    screen.getByText(
      'Optional Episode artwork omitted: Use square JPEG or PNG.',
    ),
  ).toBeVisible();
});
