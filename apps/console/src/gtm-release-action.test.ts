import { Readable } from 'node:stream';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { expect, it, vi } from 'vitest';
import { handleGtmReleaseRequest, type ConsoleGtmRelease } from './gtm-release-action.js';
async function invoke(
  body: unknown,
  callback: ConsoleGtmRelease,
  origin = 'http://127.0.0.1:4187',
) {
  const request = Object.assign(Readable.from([Buffer.from(JSON.stringify(body))]), {
    method: 'POST',
    url: '/api/console/gtm/release',
    headers: { host: '127.0.0.1:4187', origin, 'content-type': 'application/json' },
  }) as IncomingMessage;
  let text = '';
  const response = {
    statusCode: 0,
    setHeader: vi.fn(),
    end: (value: string) => {
      text = value;
    },
  };
  await handleGtmReleaseRequest(request, response as unknown as ServerResponse, callback, {
    projectId: 'shop',
    environmentId: 'test',
  });
  return { status: response.statusCode, text };
}
it('uses shared origin guards and rejects unbound or mismatched output', async () => {
  const callback = vi.fn(async () => ({
    projectId: 'foreign',
    environmentId: 'test',
    trackingVerified: false,
    evidence: {
      contentDigest: 'a'.repeat(64),
      fingerprint: null,
      liveRevision: null,
      versionId: null,
    },
  }));
  const input = { operation: 'preview', connectionId: 'google', workspaceId: '3' };
  expect((await invoke(input, callback, 'http://evil.example')).status).toBe(403);
  expect(callback).not.toHaveBeenCalled();
  expect((await invoke(input, callback)).status).toBe(400);
});
it('shows compiler revision without claiming tracking success and redacts provider errors', async () => {
  const callback = vi.fn(async () => ({
    projectId: 'shop',
    environmentId: 'test',
    trackingVerified: false,
    evidence: {
      contentDigest: 'a'.repeat(64),
      fingerprint: null,
      liveRevision: null,
      versionId: null,
    },
  }));
  const input = { operation: 'preview', connectionId: 'google', workspaceId: '3' };
  const result = await invoke(input, callback);
  expect(result.status).toBe(200);
  expect(JSON.parse(result.text).result.trackingVerified).toBe(false);
  const failed = await invoke(input, async () => {
    throw new Error('private-credential');
  });
  expect(failed.text).not.toContain('private-credential');
});
