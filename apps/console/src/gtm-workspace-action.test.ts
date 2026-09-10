import { Readable } from 'node:stream';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { expect, it, vi } from 'vitest';
import { handleGtmWorkspaceRequest } from './gtm-workspace-action.js';
const target = { projectId: 'shop', environmentId: 'test' };
async function invoke(
  body: unknown,
  callback = vi.fn(async () => {
    throw new Error('secret-token');
  }),
  origin = 'http://127.0.0.1:4174',
) {
  const request = Object.assign(Readable.from([Buffer.from(JSON.stringify(body))]), {
    url: '/api/console/gtm/workspace',
    method: 'POST',
    headers: { host: '127.0.0.1:4174', origin, 'content-type': 'application/json' },
  }) as IncomingMessage;
  let text = '';
  const response = {
    statusCode: 0,
    setHeader: vi.fn(),
    end: (value: string) => {
      text = value;
    },
  };
  await handleGtmWorkspaceRequest(request, response as unknown as ServerResponse, callback, target);
  return { status: response.statusCode, text };
}
it('rejects foreign origins, oversized requests and malformed approval before invoking the host', async () => {
  const callback = vi.fn(async () => {
    throw new Error('must not execute');
  });
  expect(
    (
      await invoke(
        { operation: 'review', planHash: 'a'.repeat(64) },
        callback,
        'http://evil.example',
      )
    ).status,
  ).toBe(403);
  expect((await invoke({ padding: 'x'.repeat(17000) }, callback)).status).toBe(413);
  expect((await invoke({ operation: 'approve', planHash: 'a'.repeat(64) }, callback)).status).toBe(
    400,
  );
  expect(callback).not.toHaveBeenCalled();
});
it('binds valid requests to the host target and redacts unexpected errors', async () => {
  const callback = vi.fn(async () => {
    throw new Error('secret-token');
  });
  const command = { operation: 'review', planHash: 'a'.repeat(64) };
  const result = await invoke(command, callback);
  expect(callback).toHaveBeenCalledWith(command, target);
  expect(result.status).toBe(400);
  expect(result.text).not.toContain('secret-token');
});
