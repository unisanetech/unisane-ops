import { Readable } from 'node:stream';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { expect, it, vi } from 'vitest';
import { handleGtmDiagnosisRequest } from './gtm-action.js';
const input = {
  projectId: 'shop',
  manifest: {
    appId: 'shop',
    accountId: '1',
    containerId: '2',
    namespace: 'shop',
    environments: { test: { workspacePrefix: 'test' } },
  },
  environment: 'test',
};
async function invoke(body: unknown, origin = 'http://127.0.0.1:4174') {
  const request = Object.assign(Readable.from([Buffer.from(JSON.stringify(body))]), {
    url: '/api/console/gtm/diagnose',
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
  await handleGtmDiagnosisRequest(request, response as unknown as ServerResponse, {
    projectId: 'shop',
    environmentId: 'test',
  });
  return { status: response.statusCode, value: JSON.parse(text) };
}
it('diagnoses local evidence and rejects foreign targets and origins', async () => {
  expect((await invoke(input)).value.result).toMatchObject({
    trackingVerified: false,
    evidence: 'missing',
  });
  expect((await invoke({ ...input, environment: 'other' })).status).toBe(400);
  expect((await invoke(input, 'http://evil.example')).status).toBe(403);
  expect((await invoke({ padding: 'x'.repeat(1100000) })).status).toBe(413);
});
