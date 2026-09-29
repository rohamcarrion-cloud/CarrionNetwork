import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, createApi } from './client';

afterEach(() => vi.unstubAllGlobals());
describe('API transport', () => {
  it('uses the configured base, bearer authentication, and only draft fields', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ show: { id: 'show' } })),
      );
    vi.stubGlobal('fetch', fetcher);
    await createApi(
      'secret-token',
      vi.fn(),
      'https://api.example.test/',
    ).createShow({ title: 'My show', description: 'A story' });
    expect(fetcher).toHaveBeenCalledWith(
      'https://api.example.test/shows',
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: 'Bearer secret-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: 'My show', description: 'A story' }),
      }),
    );
  });
  it('handles no-content logout and expires authenticated 401 responses', async () => {
    const expired = vi.fn();
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(new Response(null, { status: 204 }))
        .mockResolvedValueOnce(
          new Response('{"error":"Session expired"}', { status: 401 }),
        ),
    );
    const api = createApi('token', expired);
    await expect(api.logout()).resolves.toBeUndefined();
    await expect(api.shows()).rejects.toMatchObject({ status: 401 });
    expect(expired).toHaveBeenCalledOnce();
  });
  it('does not expire a session for rejected public login credentials', async () => {
    const expired = vi.fn();
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response('{"error":"Invalid credentials"}', { status: 401 }),
        ),
    );
    await expect(
      createApi('token', expired).login({ email: 'a@b.test', password: 'bad' }),
    ).rejects.toBeInstanceOf(ApiError);
    expect(expired).not.toHaveBeenCalled();
  });
  it('reports network errors and malformed responses without leaking internals', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockRejectedValueOnce(new TypeError('internal'))
        .mockResolvedValueOnce(
          new Response('<html>gateway error</html>', { status: 502 }),
        ),
    );
    const api = createApi(null, vi.fn());
    await expect(api.health()).rejects.toMatchObject({
      status: 0,
      message: expect.stringContaining('Cannot reach'),
    });
    await expect(api.health()).rejects.toMatchObject({
      status: 502,
      message: expect.stringContaining('unexpected response'),
    });
  });
});
it('uses same-origin transport and reads all bounded collection pages', async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          items: [{ id: 'first' }],
          pagination: { has_more: true },
        }),
      ),
    )
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          items: [{ id: 'second' }],
          pagination: { has_more: false },
        }),
      ),
    );
  vi.stubGlobal('fetch', fetcher);
  const result = await createApi('token', vi.fn()).shows();
  expect(result.items.map((s) => s.id)).toEqual(['first', 'second']);
  expect(fetcher.mock.calls[0][0]).toBe('/api/shows?limit=100&offset=0');
  expect(fetcher.mock.calls[1][0]).toBe('/api/shows?limit=100&offset=1');
});
