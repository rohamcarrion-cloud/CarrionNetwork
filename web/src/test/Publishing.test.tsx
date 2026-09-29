import { beforeEach, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PublishingControls } from '../features/Episodes';
import type { Episode, PublicationState } from '../api/types';
const api = vi.hoisted(() => ({
  publication: vi.fn(),
  publish: vi.fn(),
  unpublish: vi.fn(),
}));
vi.mock('../auth/AuthProvider', () => ({ useAuth: () => ({ api }) }));
const episode = {
  id: 'episode',
  primary_audio_asset_id: 'audio',
  status: 'draft',
} as Episode;
const snapshot = {
  episode_id: 'episode',
  representation_id: 'representation',
  guid: 'stable',
  title: 'Published title',
  description: 'Published description',
  published_at: '2026-09-28',
  active: true,
  state: 'ready',
  media_url: '/public/media/stable',
} as const;
let state: PublicationState;
beforeEach(() => {
  vi.resetAllMocks();
  state = { publication: null, ready: true, issues: [] };
  api.publication.mockImplementation(async () => state);
  api.publish.mockImplementation(async () => {
    state = { ...state, publication: snapshot };
    return state;
  });
  api.unpublish.mockImplementation(async () => {
    state = { ...state, publication: { ...snapshot, active: false } };
    return state;
  });
});
it('shows audio association, readiness, publish and unpublish with stable snapshot on republish', async () => {
  const user = userEvent.setup();
  const changed = vi.fn();
  render(<PublishingControls episode={episode} onChange={changed} />);
  expect(await screen.findByText('Ready to publish')).toBeVisible();
  expect(screen.getByText('Audio attached')).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Publish' }));
  expect(await screen.findByText('Published', { exact: true })).toBeVisible();
  expect(screen.getByText(snapshot.media_url)).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Unpublish' }));
  expect(await screen.findByText('Unpublished — archived')).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Republish' }));
  expect(await screen.findByText('Published', { exact: true })).toBeVisible();
  expect(screen.getByText(snapshot.media_url)).toBeVisible();
  expect(changed).toHaveBeenCalledTimes(3);
});
it('lists actionable validation and prevents publishing a draft without audio', async () => {
  state = {
    publication: null,
    ready: false,
    issues: [
      {
        field: 'primary_audio_asset_id',
        message: 'Attach valid MP3 audio before publishing.',
      },
    ],
  };
  render(
    <PublishingControls
      episode={{ ...episode, primary_audio_asset_id: null }}
      onChange={vi.fn()}
    />,
  );
  expect(await screen.findByText('Not ready to publish')).toBeVisible();
  expect(screen.getByText('No audio attached')).toBeVisible();
  expect(
    screen.getByText('Attach valid MP3 audio before publishing.'),
  ).toBeVisible();
  expect(screen.getByRole('button', { name: 'Publish' })).toBeDisabled();
});
it('preserves retry after failed publishing and failed unpublish', async () => {
  const user = userEvent.setup();
  api.publish.mockRejectedValueOnce(new Error('Audio unavailable. Retry.'));
  api.unpublish.mockRejectedValueOnce(new Error('Connection failed.'));
  render(<PublishingControls episode={episode} onChange={vi.fn()} />);
  await user.click(await screen.findByRole('button', { name: 'Publish' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Audio unavailable',
  );
  await user.click(screen.getByRole('button', { name: 'Publish' }));
  await user.click(await screen.findByRole('button', { name: 'Unpublish' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Connection failed',
  );
  expect(screen.getByText('Published', { exact: true })).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Unpublish' }));
  expect(await screen.findByText('Unpublished — archived')).toBeVisible();
});
it('surfaces published media problems and permits withdrawing the publication', async () => {
  state = {
    publication: snapshot,
    ready: false,
    issues: [{ field: 'media', message: 'Published audio is unavailable.' }],
  };
  render(<PublishingControls episode={episode} onChange={vi.fn()} />);
  expect(await screen.findByText('Publication/media problem')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Unpublish' })).toBeEnabled();
});
it('retries readiness reads after a network failure', async () => {
  api.publication.mockRejectedValueOnce(new Error('Network unavailable'));
  const user = userEvent.setup();
  render(<PublishingControls episode={episode} onChange={vi.fn()} />);
  const alert = await screen.findByRole('alert');
  await user.click(within(alert).getByRole('button'));
  expect(await screen.findByText('Ready to publish')).toBeVisible();
});
