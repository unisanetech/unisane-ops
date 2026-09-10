import { Readable } from 'node:stream';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { expect, it, vi } from 'vitest';
import { handleGtmSetupRequest } from './gtm-setup-action.js';
const input = {
  projectId: 'shop',
  appId: 'store',
  environment: 'test',
  accountId: '1',
  containerId: '2',
  namespace: 'shop',
  workspacePrefix: 'test',
  metaPixelId: '123',
  consentDefaults: {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  },
  events: [
    {
      slug: 'view',
      sourceEvent: 'product_view',
      eventIdPath: 'tracking.event_id',
      metaEventName: 'ViewContent',
    },
  ],
};
async function invoke(body: unknown, origin = 'http://127.0.0.1:4187') {
  const request = Object.assign(Readable.from([Buffer.from(JSON.stringify(body))]), {
    method: 'POST',
    url: '/api/console/gtm/setup',
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
  await handleGtmSetupRequest(request, response as unknown as ServerResponse, {
    projectId: 'shop',
    environmentId: 'test',
  });
  return { status: response.statusCode, text };
}
it('generates an offline proposal with explicit observation requirements', async () => {
  const response = await invoke(input);
  expect(response.status).toBe(200);
  const result = JSON.parse(response.text).result;
  expect(result.trackingVerified).toBe(false);
  expect(result.requiredObservations[0].event).toBe('product_view');
  expect(result.manifest.tags.some((tag: { slug: string }) => tag.slug === 'meta_view')).toBe(true);
});
it('rejects cross-origin, foreign-target and malformed setup requests', async () => {
  expect((await invoke(input, 'http://evil.example')).status).toBe(403);
  expect((await invoke({ ...input, projectId: 'other' })).status).toBe(400);
  expect((await invoke({ ...input, consentDefaults: {} })).status).toBe(400);
});
