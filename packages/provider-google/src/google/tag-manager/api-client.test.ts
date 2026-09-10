import { expect, it, vi } from 'vitest';
import { GoogleTagManagerApiClient } from './api-client.js';
it('rejects pagination cycles and malformed inventory instead of silently omitting data', async () => {
  const fetcher = vi.fn(async () => Response.json({ tag: [], nextPageToken: 'again' }));
  const client = new GoogleTagManagerApiClient({
    accessToken: 'fixture',
    fetch: fetcher,
    rateLimitMs: 0,
  });
  await expect(client.listTags('accounts/1/containers/2/workspaces/3')).rejects.toThrow(
    'PAGINATION_CYCLE',
  );
  expect(fetcher).toHaveBeenCalledTimes(2);
  fetcher.mockResolvedValueOnce(Response.json({ tag: [null] }));
  await expect(client.listTags('x')).rejects.toThrow('RESPONSE_INVALID');
});
it('does not expose reflected credentials or transport messages', async () => {
  const fetcher = vi.fn(async () =>
    Response.json({ error: { message: 'secret-token' } }, { status: 403 }),
  );
  const client = new GoogleTagManagerApiClient({
    accessToken: 'secret-token',
    fetch: fetcher,
    rateLimitMs: 0,
  });
  try {
    await client.listAccounts();
    throw new Error('Expected failure');
  } catch (error) {
    expect(String(error)).not.toContain('secret-token');
    expect(JSON.stringify(error)).not.toContain('secret-token');
  }
  fetcher.mockRejectedValueOnce(new Error('secret-token'));
  await expect(client.listAccounts()).rejects.toThrow('OUTCOME_UNCERTAIN');
});
