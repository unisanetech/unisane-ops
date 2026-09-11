import { describe, expect, it, vi } from 'vitest';
import {
  createCloudflareConnectionProvider,
  createCloudflareDnsProvider,
  createCloudflareResourceProvider,
} from '../index.js';

function response(body: unknown, ok = true): Response {
  return new Response(JSON.stringify(body), {
    status: ok ? 200 : 400,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('@unisane/provider-cloudflare DNS', () => {
  it('verifies a token and discovers its accounts and zones without exposing the token', async () => {
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        response({ success: true, result: { id: 'token_1', status: 'active' } }),
      )
      .mockResolvedValueOnce(
        response({
          success: true,
          result: [{ id: 'account_1', name: 'Example' }],
          result_info: { page: 1, total_pages: 1 },
        }),
      )
      .mockResolvedValueOnce(
        response({
          success: true,
          result: [
            {
              id: 'zone_1',
              name: 'example.test',
              status: 'active',
              account: { id: 'account_1', name: 'Example' },
            },
          ],
          result_info: { page: 1, total_pages: 1 },
        }),
      );
    const provider = createCloudflareConnectionProvider({
      apiToken: 'super-secret-token',
      fetchFn,
    });

    const verification = await provider.verifyConnection();
    const accounts = await provider.listAccounts();
    const zones = await provider.listZones({ accountId: 'account_1' });
    expect(verification).toEqual({
      id: 'token_1',
      status: 'active',
    });
    expect(accounts).toEqual([{ id: 'account_1', name: 'Example' }]);
    expect(zones).toEqual([expect.objectContaining({ id: 'zone_1', accountId: 'account_1' })]);
    expect(fetchFn.mock.calls.map(([url]) => String(url))).toEqual([
      'https://api.cloudflare.com/client/v4/user/tokens/verify',
      'https://api.cloudflare.com/client/v4/accounts?page=1&per_page=100',
      'https://api.cloudflare.com/client/v4/zones?account_id=account_1&page=1&per_page=100',
    ]);
    expect(JSON.stringify({ verification, accounts, zones })).not.toContain('super-secret-token');
  });

  it('paginates and normalizes Cloudflare DNS wire records', async () => {
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        response({
          success: true,
          result: [
            {
              id: 'record_1',
              zone_id: 'zone_1',
              zone_name: 'example.test',
              type: 'cname',
              name: 'www.example.test',
              content: 'target.example.test',
              ttl: 1,
              proxied: false,
            },
          ],
          result_info: { page: 1, total_pages: 2 },
        }),
      )
      .mockResolvedValueOnce(
        response({
          success: true,
          result: [
            {
              id: 'record_2',
              type: 'a',
              name: 'api.example.test',
              content: '192.0.2.1',
              ttl: 300,
            },
          ],
          result_info: { page: 2, total_pages: 2 },
        }),
      );
    const provider = createCloudflareDnsProvider({ apiToken: 'secret', fetchFn });
    const records = await provider.listDnsRecords({
      zoneId: 'zone_1',
      zoneName: 'example.test',
    });
    expect(records).toHaveLength(2);
    expect(records[0]).toEqual(expect.objectContaining({ type: 'CNAME', proxied: false }));
    expect(records[1]).toEqual(
      expect.objectContaining({ zoneId: 'zone_1', zoneName: 'example.test', type: 'A' }),
    );
    expect(fetchFn).toHaveBeenCalledTimes(2);
    expect((fetchFn.mock.calls[0]?.[1]?.headers as Headers).get('Authorization')).toBe(
      'Bearer secret',
    );
  });

  it('creates, updates, validates, and normalizes provider errors', async () => {
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(response({ success: true, result: { id: 'created_1' } }))
      .mockResolvedValueOnce(response({ success: true, result: { id: 'updated_1' } }))
      .mockResolvedValueOnce(
        response({ success: false, result: null, errors: [{ message: 'denied' }] }, false),
      );
    const provider = createCloudflareDnsProvider({ apiToken: 'secret', fetchFn });
    const desired = {
      type: 'CNAME',
      name: 'www.example.test',
      content: 'target.example.test',
      ttl: 1,
    };
    await expect(provider.createDnsRecord('zone_1', desired)).resolves.toEqual({
      id: 'created_1',
    });
    await expect(provider.updateDnsRecord('zone_1', 'record_1', desired)).resolves.toEqual({
      id: 'updated_1',
    });
    await expect(
      provider.listDnsRecords({ zoneId: 'zone_1', zoneName: 'example.test' }),
    ).rejects.toThrow('[CLOUDFLARE_API_ERROR] denied');
    expect(fetchFn.mock.calls[0]?.[1]?.method).toBe('POST');
    expect(fetchFn.mock.calls[1]?.[1]?.method).toBe('PATCH');
  });

  it('normalizes Queue, Worker, route, and Cron inventory through provider transport', async () => {
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        response({
          success: true,
          result: [{ queue_id: 'queue_1', queue_name: 'sample-jobs' }],
          result_info: { total_pages: 1 },
        }),
      )
      .mockResolvedValueOnce(response({ success: true, result: [{ consumer_id: 'consumer_1', script_name: 'sample-worker', dead_letter_queue: 'sample-dlq', settings: { batch_size: 1, max_wait_time_ms: 2000, max_retries: 5, max_concurrency: 4 } }] }))
      .mockResolvedValueOnce(
        response({
          success: true,
          result: [{ id: 'sample-worker', modified_on: '2026-07-25T00:00:00Z' }],
        }),
      )
      .mockResolvedValueOnce(
        response({
          success: true,
          result: [{ id: 'route_1', pattern: 'example.test/*', script: 'sample-worker' }],
        }),
      )
      .mockResolvedValueOnce(
        response({
          success: true,
          result: { schedules: [{ cron: '*/10 * * * *' }] },
        }),
      );
    const provider = createCloudflareResourceProvider({
      apiToken: 'secret',
      fetchFn,
    });

    await expect(provider.listQueues('account_1')).resolves.toEqual([
      expect.objectContaining({ id: 'queue_1', name: 'sample-jobs', consumers: [expect.objectContaining({ workerName: 'sample-worker', deadLetterQueue: 'sample-dlq', maxBatchSize: 1, maxBatchTimeout: 2, maxRetries: 5, maxConcurrency: 4 })] }),
    ]);
    await expect(provider.listWorkers('account_1')).resolves.toEqual([
      expect.objectContaining({ name: 'sample-worker' }),
    ]);
    await expect(
      provider.listWorkerRoutes({ zoneId: 'zone_1', zoneName: 'example.test' }),
    ).resolves.toEqual([expect.objectContaining({ id: 'route_1', zoneId: 'zone_1' })]);
    await expect(provider.listWorkerCronTriggers('account_1', 'sample-worker')).resolves.toEqual([
      expect.objectContaining({ scriptName: 'sample-worker', cron: '*/10 * * * *' }),
    ]);
  });

  it('uses multipart Worker uploads without forcing a JSON content type', async () => {
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(response({ success: true, result: { id: 'sample-worker' } }));
    const provider = createCloudflareResourceProvider({
      apiToken: 'secret',
      fetchFn,
    });

    await provider.putWorkerScript('account_1', 'sample-worker', {
      mainModule: 'index.js',
      content: 'export default {}',
    });

    const request = fetchFn.mock.calls[0]?.[1];
    expect(request?.body).toBeInstanceOf(FormData);
    expect((request?.headers as Headers).has('Content-Type')).toBe(false);
  });
});


describe('Cloudflare queue consumer policy', () => {
  it.each([false, true])('applies the reviewed limits and DLQ when an owned consumer exists: %s', async (exists) => {
    const fetchFn = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(response({ success: true, errors: null, result_info: null, result: exists ? [{ consumer_id: 'consumer_1', type: 'worker', script: 'async-worker' }] : [] }))
      .mockResolvedValueOnce(response({ success: true, result: { consumer_id: 'consumer_1' } }));
    const provider = createCloudflareResourceProvider({ apiToken: 'test-token', fetchFn });
    const result = await provider.createQueueConsumer('account_1', 'queue_1', 'async-worker', {
      maxBatchSize: 1, maxBatchTimeout: 2, maxRetries: 5, maxConcurrency: 4, deadLetterQueue: 'failed-jobs',
    });
    const [url, options] = fetchFn.mock.calls[1]!;
    expect(String(url)).toContain(exists ? '/consumers/consumer_1' : '/consumers');
    expect(options?.method).toBe(exists ? 'PUT' : 'POST');
    expect(JSON.parse(String(options?.body))).toEqual({
      type: 'worker', script_name: 'async-worker', dead_letter_queue: 'failed-jobs',
      settings: { batch_size: 1, max_wait_time_ms: 2000, max_retries: 5, max_concurrency: 4 },
    });
    expect(result).toEqual({ id: 'consumer_1', action: exists ? 'update' : 'create' });
  });
  it('does not replace a different queue consumer', async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(response({ success: true, result: [{ consumer_id: 'consumer_1', type: 'worker', script_name: 'other-worker' }] }));
    const provider = createCloudflareResourceProvider({ apiToken: 'test-token', fetchFn });
    await expect(provider.createQueueConsumer('account_1', 'queue_1', 'async-worker')).rejects.toThrow('Queue belongs to another consumer');
    expect(fetchFn).toHaveBeenCalledOnce();
  });
});
