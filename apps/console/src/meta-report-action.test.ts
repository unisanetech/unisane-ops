import { Readable } from 'node:stream';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { describe, expect, it, vi } from 'vitest';
import { handleMetaReportRequest, type ConsoleMetaReportReader } from './meta-report-action.js';
const target = { projectId: 'store', environmentId: 'production' };
const input = { startDate: '2026-09-01', endDate: '2026-09-05' };
const output = {
  ...target,
  ...input,
  schemaVersion: 1,
  actionId: 'growth.reports.read',
  connectionId: 'meta',
  accountId: 'act_123',
  reportType: 'campaign',
  capturedAt: '2026-09-06T00:00:00Z',
  timeZoneBasis: 'unavailable',
  attributionBasis: 'provider-default-not-verified',
  persisted: false,
  partial: false,
  observedRowCount: 0,
  rowsTruncated: false,
  rows: [],
  presentation: { headline: 'Empty report', whyItMatters: 'No canonical conversions.' },
};
async function invoke(
  read: ConsoleMetaReportReader | undefined,
  options: {
    origin?: string;
    body?: unknown;
    method?: string;
    path?: string;
    evidence?: Parameters<typeof handleMetaReportRequest>[4];
  } = {},
) {
  const req = Object.assign(Readable.from([Buffer.from(JSON.stringify(options.body ?? input))]), {
    url: options.path ?? '/api/console/meta/report',
    method: options.method ?? 'POST',
    headers: {
      host: '127.0.0.1:4174',
      origin: options.origin ?? 'http://127.0.0.1:4174',
      'content-type': 'application/json',
    },
  }) as IncomingMessage;
  let body = '';
  const headers: Record<string, string> = {};
  const res = {
    statusCode: 0,
    setHeader: (k: string, v: string) => {
      headers[k] = v;
    },
    end: (v: string) => {
      body = v;
    },
  };
  await handleMetaReportRequest(
    req,
    res as unknown as ServerResponse,
    read,
    target,
    options.evidence,
  );
  return { status: res.statusCode, body: JSON.parse(body), headers };
}
describe('local report action', () => {
  it('binds the host target and returns no-store typed evidence', async () => {
    const read = vi.fn().mockResolvedValue(output);
    const result = await invoke(read);
    expect(result.status).toBe(200);
    expect(result.body.result).toEqual(output);
    expect(result.headers['Cache-Control']).toBe('no-store');
    expect(read).toHaveBeenCalledWith(expect.objectContaining(input), target);
  });
  it.each([
    { origin: 'https://evil.example' },
    { origin: 'http://evil.example:4174' },
    { body: { ...input, projectId: 'other' } },
    { body: { ...input, rowLimit: 1000 } },
    { method: 'GET' },
    { body: { padding: 'x'.repeat(5000) } },
  ])('rejects unsafe input before host access %#', async (options) => {
    const read = vi.fn();
    expect((await invoke(read, options)).status).toBeGreaterThanOrEqual(400);
    expect(read).not.toHaveBeenCalled();
  });
  it('does not expose provider errors or mismatched account context', async () => {
    for (const read of [
      vi.fn().mockRejectedValue(new Error('secret-token')),
      vi.fn().mockResolvedValue({ ...output, projectId: 'other' }),
    ]) {
      const result = await invoke(read);
      expect(result.status).toBe(502);
      expect(JSON.stringify(result)).not.toContain('secret-token');
    }
  });
  it('reports an unavailable host callback', async () =>
    expect((await invoke(undefined)).status).toBe(503));
});

it('collects explicitly and reads history through same-origin callbacks', async () => {
  const saved = {
    schemaVersion: 1,
    kind: 'growth.report-evidence',
    evidenceId: 'a'.repeat(64),
    savedAt: '2026-09-06T00:00:00Z',
    report: output,
  };
  const collect = vi.fn().mockResolvedValue(saved);
  expect(
    (await invoke(undefined, { path: '/api/console/meta/report/collect', evidence: { collect } }))
      .body.result,
  ).toEqual(saved);
  const history = vi
    .fn()
    .mockResolvedValue({
      ...target,
      schemaVersion: 1,
      actionId: 'growth.reports.history',
      connectionId: 'meta',
      accountId: 'act_123',
      entries: [],
      truncated: false,
      selected: saved,
    });
  expect(
    (
      await invoke(undefined, {
        path: '/api/console/meta/report/history',
        body: {},
        evidence: { history },
      })
    ).status,
  ).toBe(200);
  expect(history).toHaveBeenCalledWith({ limit: 20 }, target);
  expect(
    (
      await invoke(undefined, {
        path: '/api/console/meta/report/collect',
        origin: 'http://evil.example',
        evidence: { collect },
      })
    ).status,
  ).toBe(403);
  expect(collect).toHaveBeenCalledTimes(1);
});
