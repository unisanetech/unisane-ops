import { Readable } from 'node:stream';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { it, expect, vi } from 'vitest';
import {
  handleMetaDiagnosticRequest,
  type ConsoleMetaDiagnostics,
} from './meta-diagnostic-action.js';
const target = { projectId: 'store', environmentId: 'test' };
const observation = {
  schemaVersion: 1,
  provider: 'meta',
  ...target,
  connectionId: 'meta',
  datasetId: '123',
  capturedAt: '2026-09-06T00:00:00Z',
  window: { startDate: '2026-09-01', endDate: '2026-09-05' },
  source: { kind: 'manual-import', reference: 'Synthetic export', verifiedLive: false },
  completeness: 'partial',
  events: [],
};
async function invoke(
  callbacks: ConsoleMetaDiagnostics | undefined,
  body: unknown,
  origin = 'http://127.0.0.1:4174',
) {
  const request = Object.assign(Readable.from([Buffer.from(JSON.stringify(body))]), {
    url: '/api/console/meta/diagnostics/import',
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
  await handleMetaDiagnosticRequest(
    request,
    response as unknown as ServerResponse,
    callbacks,
    target,
  );
  return { status: response.statusCode, body: JSON.parse(text) };
}
it('checks origin, target, byte limits and schema before host access', async () => {
  const callbacks = { import: vi.fn(), review: vi.fn() };
  expect((await invoke(callbacks, observation, 'http://evil.example')).status).toBe(403);
  expect((await invoke(callbacks, { ...observation, projectId: 'other' })).status).toBe(400);
  expect((await invoke(callbacks, { padding: 'x'.repeat(300000) })).status).toBe(413);
  expect(callbacks.import).not.toHaveBeenCalled();
});
it('returns a typed import receipt and redacts unexpected errors', async () => {
  const output = {
    schemaVersion: 1,
    actionId: 'growth.meta.diagnostics.import',
    ...target,
    connectionId: 'meta',
    datasetId: '123',
    evidenceId: 'a'.repeat(64),
    importedAt: '2026-09-06T00:00:00Z',
    eventCount: 0,
    verifiedLive: false,
  };
  const callbacks = { import: vi.fn().mockResolvedValue(output), review: vi.fn() };
  expect((await invoke(callbacks, observation)).body.result).toEqual(output);
  callbacks.import.mockRejectedValue(new Error('private-token'));
  const failure = await invoke(callbacks, observation);
  expect(failure.status).toBe(502);
  expect(JSON.stringify(failure)).not.toContain('private-token');
});
