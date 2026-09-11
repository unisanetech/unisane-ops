import type {
  CloudDnsAccount,
  CloudDnsDesiredRecord,
  CloudDnsProvider,
  CloudDnsRecord,
  CloudDnsZone,
} from '@unisane/cloud/contracts';
import type {
  CloudflareMutationProvider,
  CloudflareQueueDesired,
  CloudflareQueueConsumerPolicy,
  CloudflareQueueInventory,
  CloudflareWorkerCronInventory,
  CloudflareWorkerInventory,
  CloudflareWorkerRouteDesired,
  CloudflareWorkerRouteInventory,
  CloudflareWorkerScriptDesired,
  CloudflareWorkerSecretDesired,
  CloudflareWorkerSettings,
} from '@unisane/cloud/cloudflare-resources';
import { z } from 'zod';

const cloudflareErrorSchema = z
  .object({
    code: z.union([z.string(), z.number()]).optional(),
    message: z.string().optional(),
  })
  .passthrough();

const cloudflareEnvelopeSchema = z
  .object({
    success: z.boolean(),
    result: z.unknown(),
    errors: z.array(cloudflareErrorSchema).nullish(),
    result_info: z
      .object({
        page: z.number().optional(),
        total_pages: z.number().optional(),
      })
      .passthrough()
      .nullish(),
  })
  .passthrough();

const cloudflareDnsRecordWireSchema = z
  .object({
    id: z.string().optional(),
    zone_id: z.string().optional(),
    zone_name: z.string().optional(),
    type: z.string().optional(),
    name: z.string().optional(),
    content: z.string().optional(),
    ttl: z.number().optional(),
    proxied: z.boolean().optional(),
    comment: z.string().nullable().optional(),
    priority: z.number().int().optional(),
  })
  .passthrough();

const cloudflareAccountWireSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().optional(),
  })
  .passthrough();

const cloudflareZoneWireSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().optional(),
    status: z.string().optional(),
    account: z
      .object({
        id: z.string().optional(),
        name: z.string().optional(),
      })
      .optional(),
  })
  .passthrough();

const cloudflareTokenWireSchema = z
  .object({
    id: z.string().optional(),
    status: z.string().optional(),
  })
  .passthrough();

// Cloudflare list responses use `script`; its documented request shape uses `script_name`.
const cloudflareQueueConsumerWireSchema = z.object({
  consumer_id: z.string(), type: z.string().optional(), script: z.string().nullish(), script_name: z.string().nullish(), dead_letter_queue: z.string().nullish(),
  settings: z.object({ batch_size: z.number().optional(), max_wait_time_ms: z.number().optional(), max_retries: z.number().optional(), max_concurrency: z.number().nullish() }).nullish(),
}).transform((consumer) => ({ ...consumer, workerName: consumer.script_name ?? consumer.script ?? null }));

const cloudflareQueueWireSchema = z
  .object({
    id: z.string().optional(),
    queue_id: z.string().optional(),
    queue_name: z.string().optional(),
    name: z.string().optional(),
    created_on: z.string().optional(),
    modified_on: z.string().optional(),
    producers_total_count: z.number().optional(),
    consumers_total_count: z.number().optional(),
  })
  .passthrough();

const cloudflareWorkerWireSchema = z
  .object({
    id: z.string().optional(),
    script: z.string().optional(),
    created_on: z.string().optional(),
    modified_on: z.string().optional(),
  })
  .passthrough();

const cloudflareWorkerRouteWireSchema = z
  .object({
    id: z.string().optional(),
    pattern: z.string().optional(),
    script: z.string().nullable().optional(),
  })
  .passthrough();

const cloudflareWorkerCronWireSchema = z
  .object({
    cron: z.string().optional(),
    created_on: z.string().optional(),
    modified_on: z.string().optional(),
  })
  .passthrough();

const cloudflareWorkerCronResultSchema = z.union([
  z.array(cloudflareWorkerCronWireSchema),
  z
    .object({
      schedules: z.array(cloudflareWorkerCronWireSchema).optional(),
    })
    .passthrough(),
]);

const cloudflareWorkerSettingsWireSchema = z
  .object({
    bindings: z.array(z.record(z.unknown())).optional(),
  })
  .passthrough();

function encodeQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const encoded = search.toString();
  return encoded ? `?${encoded}` : '';
}

function requireToken(token: string | null | undefined): string {
  if (!token?.trim()) {
    throw new Error(
      '[CLOUDFLARE_API_TOKEN_MISSING] Set CLOUDFLARE_API_TOKEN for Cloudflare operations.',
    );
  }
  return token.trim();
}

function normalizeDnsRecord(
  record: z.infer<typeof cloudflareDnsRecordWireSchema>,
  zone: { zoneId: string; zoneName: string },
): CloudDnsRecord {
  return {
    id: record.id ?? '',
    zoneId: record.zone_id ?? zone.zoneId,
    zoneName: record.zone_name ?? zone.zoneName,
    type: (record.type ?? '').toUpperCase(),
    name: record.name ?? '',
    content: record.content ?? '',
    ttl: typeof record.ttl === 'number' ? record.ttl : null,
    proxied: typeof record.proxied === 'boolean' ? record.proxied : null,
    comment: record.comment ?? null,
    priority: typeof record.priority === 'number' ? record.priority : null,
  };
}

export interface CloudflareDnsProviderOptions {
  apiToken: string | null | undefined;
  accountId?: string | null;
  baseUrl?: string;
  fetchFn?: typeof fetch;
}

export interface CloudflareConnectionVerification {
  id: string | null;
  status: string | null;
}

export interface CloudflareConnectionProvider {
  verifyConnection(): Promise<CloudflareConnectionVerification>;
  listAccounts(): Promise<CloudDnsAccount[]>;
  listZones(args: { accountId: string; name?: string }): Promise<CloudDnsZone[]>;
}

export class FetchCloudflareProvider
  implements CloudDnsProvider, CloudflareConnectionProvider, CloudflareMutationProvider
{
  private readonly apiToken: string;
  private readonly accountId: string | null;
  private readonly baseUrl: string;
  private readonly fetchFn: typeof fetch;

  constructor(options: CloudflareDnsProviderOptions) {
    this.apiToken = requireToken(options.apiToken);
    this.accountId = options.accountId?.trim() || null;
    this.baseUrl = options.baseUrl ?? 'https://api.cloudflare.com/client/v4';
    this.fetchFn = options.fetchFn ?? fetch;
  }

  async verifyConnection(): Promise<CloudflareConnectionVerification> {
    return this.verifyToken();
  }

  async verifyToken(): Promise<CloudflareConnectionVerification> {
    let response: { result: unknown; totalPages: number | null };
    try {
      response = await this.request('/user/tokens/verify', cloudflareTokenWireSchema);
    } catch (error) {
      if (!this.accountId) throw error;
      response = await this.request(
        `/accounts/${this.accountId}/tokens/verify`,
        cloudflareTokenWireSchema,
      );
    }
    const result = response.result as z.infer<typeof cloudflareTokenWireSchema>;
    return {
      id: result.id ?? null,
      status: result.status ?? null,
    };
  }

  async listAccounts(): Promise<CloudDnsAccount[]> {
    const accounts: CloudDnsAccount[] = [];
    let page = 1;
    while (true) {
      const response = await this.request(
        `/accounts${encodeQuery({ page, per_page: 100 })}`,
        z.array(cloudflareAccountWireSchema),
      );
      const result = response.result as z.infer<typeof cloudflareAccountWireSchema>[];
      accounts.push(
        ...result
          .filter((account) => account.id)
          .map((account) => ({ id: account.id!, name: account.name ?? null })),
      );
      if (page >= (response.totalPages ?? page)) break;
      page += 1;
    }
    return accounts;
  }

  async listZones(args: { accountId: string; name?: string }): Promise<CloudDnsZone[]> {
    const zones: CloudDnsZone[] = [];
    let page = 1;
    while (true) {
      const response = await this.request(
        `/zones${encodeQuery({
          account_id: args.accountId,
          name: args.name,
          page,
          per_page: 100,
        })}`,
        z.array(cloudflareZoneWireSchema),
      );
      const result = response.result as z.infer<typeof cloudflareZoneWireSchema>[];
      zones.push(
        ...result
          .filter((zone) => zone.id && zone.name)
          .map((zone) => ({
            key: null,
            id: zone.id!,
            name: zone.name!,
            status: zone.status ?? null,
            accountId: zone.account?.id ?? null,
            accountName: zone.account?.name ?? null,
            configured: false,
          })),
      );
      if (page >= (response.totalPages ?? page)) break;
      page += 1;
    }
    return zones;
  }

  private async request(
    requestPath: string,
    resultSchema: z.ZodType,
    init?: RequestInit,
  ): Promise<{ result: unknown; totalPages: number | null }> {
    const headers = new Headers(init?.headers);
    headers.set('Authorization', `Bearer ${this.apiToken}`);
    if (!headers.has('Content-Type') && !(init?.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }
    const response = await this.fetchFn(`${this.baseUrl}${requestPath}`, {
      ...init,
      headers,
    });
    const envelope = cloudflareEnvelopeSchema.parse(await response.json());
    if (!response.ok || !envelope.success) {
      const message = envelope.errors?.[0]?.message ?? 'Cloudflare API request failed.';
      throw new Error(`[CLOUDFLARE_API_ERROR] ${message}`);
    }
    return {
      result: resultSchema.parse(envelope.result),
      totalPages: envelope.result_info?.total_pages ?? null,
    };
  }

  async listDnsRecords(zone: { zoneId: string; zoneName: string }): Promise<CloudDnsRecord[]> {
    const records: CloudDnsRecord[] = [];
    let page = 1;
    while (true) {
      const response = await this.request(
        `/zones/${zone.zoneId}/dns_records${encodeQuery({ page, per_page: 100 })}`,
        z.array(cloudflareDnsRecordWireSchema),
      );
      const result = response.result as z.infer<typeof cloudflareDnsRecordWireSchema>[];
      records.push(
        ...result.map((record) => normalizeDnsRecord(record, zone)).filter((record) => record.id),
      );
      if (page >= (response.totalPages ?? page)) break;
      page += 1;
    }
    return records;
  }

  async listQueues(accountId: string): Promise<CloudflareQueueInventory[]> {
    const queues: CloudflareQueueInventory[] = [];
    let page = 1;
    while (true) {
      const response = await this.request(
        `/accounts/${accountId}/queues${encodeQuery({ page, per_page: 100 })}`,
        z.array(cloudflareQueueWireSchema),
      );
      const result = response.result as z.infer<typeof cloudflareQueueWireSchema>[];
      queues.push(
        ...result
          .map((queue) => ({
            id: queue.id ?? queue.queue_id ?? '',
            name: queue.queue_name ?? queue.name ?? '',
            createdOn: queue.created_on ?? null,
            modifiedOn: queue.modified_on ?? null,
            producersTotalCount: queue.producers_total_count ?? null,
            consumersTotalCount: queue.consumers_total_count ?? null,
          }))
          .filter((queue) => queue.name),
      );
      if (page >= (response.totalPages ?? page)) break;
      page += 1;
    }
    for (const queue of queues) {
      const response = await this.request(`/accounts/${accountId}/queues/${queue.id}/consumers`, z.array(cloudflareQueueConsumerWireSchema));
      const consumers = response.result as z.infer<typeof cloudflareQueueConsumerWireSchema>[];
      queue.consumers = consumers.map((consumer) => ({
        id: consumer.consumer_id, workerName: consumer.workerName, deadLetterQueue: consumer.dead_letter_queue ?? null,
        maxBatchSize: consumer.settings?.batch_size ?? null,
        maxBatchTimeout: typeof consumer.settings?.max_wait_time_ms === 'number' ? consumer.settings.max_wait_time_ms / 1000 : null,
        maxRetries: consumer.settings?.max_retries ?? null, maxConcurrency: consumer.settings?.max_concurrency ?? null,
      }));
    }
    return queues;
  }

  async createQueue(
    accountId: string,
    queue: CloudflareQueueDesired,
  ): Promise<{ id: string | null }> {
    const response = await this.request(
      `/accounts/${accountId}/queues`,
      cloudflareQueueWireSchema,
      {
        method: 'POST',
        body: JSON.stringify({ queue_name: queue.name }),
      },
    );
    const result = response.result as z.infer<typeof cloudflareQueueWireSchema>;
    return { id: result.id ?? result.queue_id ?? null };
  }

  async listWorkers(accountId: string): Promise<CloudflareWorkerInventory[]> {
    const response = await this.request(
      `/accounts/${accountId}/workers/scripts`,
      z.array(cloudflareWorkerWireSchema),
    );
    const result = response.result as z.infer<typeof cloudflareWorkerWireSchema>[];
    return result
      .map((worker) => {
        const name = worker.id ?? worker.script ?? '';
        return {
          id: name,
          name,
          createdOn: worker.created_on ?? null,
          modifiedOn: worker.modified_on ?? null,
        };
      })
      .filter((worker) => worker.name);
  }

  async listWorkerRoutes(zone: {
    zoneId: string;
    zoneName: string;
  }): Promise<CloudflareWorkerRouteInventory[]> {
    const response = await this.request(
      `/zones/${zone.zoneId}/workers/routes`,
      z.array(cloudflareWorkerRouteWireSchema),
    );
    const result = response.result as z.infer<typeof cloudflareWorkerRouteWireSchema>[];
    return result
      .map((route) => ({
        id: route.id ?? '',
        zoneId: zone.zoneId,
        zoneName: zone.zoneName,
        pattern: route.pattern ?? '',
        script: route.script ?? null,
      }))
      .filter((route) => route.pattern);
  }

  async listWorkerCronTriggers(
    accountId: string,
    scriptName: string,
  ): Promise<CloudflareWorkerCronInventory[]> {
    const response = await this.request(
      `/accounts/${accountId}/workers/scripts/${scriptName}/schedules`,
      cloudflareWorkerCronResultSchema,
    );
    const result = response.result as z.infer<typeof cloudflareWorkerCronResultSchema>;
    const schedules = Array.isArray(result) ? result : (result.schedules ?? []);
    return schedules
      .map((trigger) => ({
        scriptName,
        cron: trigger.cron ?? '',
        createdOn: trigger.created_on ?? null,
        modifiedOn: trigger.modified_on ?? null,
      }))
      .filter((trigger) => trigger.cron);
  }

  async createWorkerRoute(
    zoneId: string,
    route: CloudflareWorkerRouteDesired,
  ): Promise<{ id: string | null }> {
    const response = await this.request(
      `/zones/${zoneId}/workers/routes`,
      cloudflareWorkerRouteWireSchema,
      {
        method: 'POST',
        body: JSON.stringify(route),
      },
    );
    const result = response.result as z.infer<typeof cloudflareWorkerRouteWireSchema>;
    return { id: result.id ?? null };
  }

  async updateWorkerRoute(
    zoneId: string,
    routeId: string,
    route: CloudflareWorkerRouteDesired,
  ): Promise<{ id: string | null }> {
    const response = await this.request(
      `/zones/${zoneId}/workers/routes/${routeId}`,
      cloudflareWorkerRouteWireSchema,
      {
        method: 'PUT',
        body: JSON.stringify(route),
      },
    );
    const result = response.result as z.infer<typeof cloudflareWorkerRouteWireSchema>;
    return { id: result.id ?? null };
  }

  async listWorkerSettings(
    accountId: string,
    scriptName: string,
  ): Promise<CloudflareWorkerSettings> {
    const response = await this.request(
      `/accounts/${accountId}/workers/scripts/${scriptName}/settings`,
      cloudflareWorkerSettingsWireSchema,
    );
    const result = response.result as z.infer<typeof cloudflareWorkerSettingsWireSchema>;
    return { bindings: result.bindings ?? [] };
  }

  async updateWorkerSettings(
    accountId: string,
    scriptName: string,
    settings: CloudflareWorkerSettings,
  ): Promise<{ id: string | null }> {
    const form = new FormData();
    form.append(
      'settings',
      new Blob([JSON.stringify({ bindings: settings.bindings })], {
        type: 'application/json',
      }),
    );
    await this.request(
      `/accounts/${accountId}/workers/scripts/${scriptName}/settings`,
      cloudflareWorkerSettingsWireSchema,
      { method: 'PATCH', body: form },
    );
    return { id: scriptName };
  }

  async putWorkerScript(
    accountId: string,
    scriptName: string,
    script: CloudflareWorkerScriptDesired,
  ): Promise<{ id: string | null }> {
    const form = new FormData();
    form.append(
      'metadata',
      new Blob(
        [
          JSON.stringify({
            main_module: script.mainModule,
            ...(script.compatibilityDate ? { compatibility_date: script.compatibilityDate } : {}),
            ...(script.compatibilityFlags
              ? { compatibility_flags: script.compatibilityFlags }
              : {}),
            ...(script.bindings ? { bindings: script.bindings } : {}),
          }),
        ],
        { type: 'application/json' },
      ),
    );
    form.append(
      script.mainModule,
      new Blob([script.content], { type: 'application/javascript+module' }),
      script.mainModule,
    );
    const response = await this.request(
      `/accounts/${accountId}/workers/scripts/${scriptName}`,
      cloudflareWorkerWireSchema,
      { method: 'PUT', body: form },
    );
    const result = response.result as z.infer<typeof cloudflareWorkerWireSchema>;
    return { id: result.id ?? scriptName };
  }

  async putWorkerSecret(
    accountId: string,
    scriptName: string,
    secret: CloudflareWorkerSecretDesired,
  ): Promise<{ id: string | null }> {
    await this.request(
      `/accounts/${accountId}/workers/scripts/${scriptName}/secrets`,
      z.record(z.unknown()),
      {
        method: 'PUT',
        body: JSON.stringify({ name: secret.name, text: secret.text, type: 'secret_text' }),
      },
    );
    return { id: secret.name };
  }

  async putWorkerCronTriggers(
    accountId: string,
    scriptName: string,
    crons: string[],
  ): Promise<{ id: string | null }> {
    await this.request(
      `/accounts/${accountId}/workers/scripts/${scriptName}/schedules`,
      cloudflareWorkerCronResultSchema,
      {
        method: 'PUT',
        body: JSON.stringify(crons.map((cron) => ({ cron }))),
      },
    );
    return { id: scriptName };
  }

  async createQueueConsumer(
    accountId: string,
    queueId: string,
    scriptName: string,
    policy?: CloudflareQueueConsumerPolicy & { deadLetterQueue?: string },
  ): Promise<{ id: string | null; action: 'create' | 'update' }> {
    const path = `/accounts/${accountId}/queues/${queueId}/consumers`;
    const existing = await this.request(path, z.array(cloudflareQueueConsumerWireSchema));
    const consumers = existing.result as z.infer<typeof cloudflareQueueConsumerWireSchema>[];
    const current = consumers.find((consumer) => consumer.type === 'worker' && consumer.workerName === scriptName);
    if (consumers.length && !current) throw new Error('[CLOUDFLARE_QUEUE_CONSUMER_CONFLICT] Queue belongs to another consumer.');
    const settings = {
      ...(policy?.maxBatchSize !== undefined ? { batch_size: policy.maxBatchSize } : {}),
      ...(policy?.maxBatchTimeout !== undefined ? { max_wait_time_ms: policy.maxBatchTimeout * 1000 } : {}),
      ...(policy?.maxRetries !== undefined ? { max_retries: policy.maxRetries } : {}),
      ...(policy?.maxConcurrency !== undefined ? { max_concurrency: policy.maxConcurrency } : {}),
    };
    const response = await this.request(current ? `${path}/${current.consumer_id}` : path, z.record(z.unknown()), {
      method: current ? 'PUT' : 'POST',
      body: JSON.stringify({
        type: 'worker', script_name: scriptName,
        ...(policy?.deadLetterQueue ? { dead_letter_queue: policy.deadLetterQueue } : {}),
        ...(Object.keys(settings).length ? { settings } : {}),
      }),
    });
    const created = response.result as { consumer_id?: string };
    return { id: created.consumer_id ?? current?.consumer_id ?? `${queueId}:${scriptName}`, action: current ? 'update' : 'create' };
  }

  async createDnsRecord(
    zoneId: string,
    record: CloudDnsDesiredRecord,
  ): Promise<{ id: string | null }> {
    const response = await this.request(
      `/zones/${zoneId}/dns_records`,
      cloudflareDnsRecordWireSchema,
      {
        method: 'POST',
        body: JSON.stringify(record),
      },
    );
    const result = response.result as z.infer<typeof cloudflareDnsRecordWireSchema>;
    return { id: result.id ?? null };
  }

  async updateDnsRecord(
    zoneId: string,
    recordId: string,
    record: CloudDnsDesiredRecord,
  ): Promise<{ id: string | null }> {
    const response = await this.request(
      `/zones/${zoneId}/dns_records/${recordId}`,
      cloudflareDnsRecordWireSchema,
      {
        method: 'PATCH',
        body: JSON.stringify(record),
      },
    );
    const result = response.result as z.infer<typeof cloudflareDnsRecordWireSchema>;
    return { id: result.id ?? null };
  }
}

export function createCloudflareDnsProvider(
  options: CloudflareDnsProviderOptions,
): CloudDnsProvider {
  return new FetchCloudflareProvider(options);
}

export function createCloudflareConnectionProvider(
  options: CloudflareDnsProviderOptions,
): CloudflareConnectionProvider {
  return new FetchCloudflareProvider(options);
}

export function createCloudflareResourceProvider(
  options: CloudflareDnsProviderOptions,
): CloudflareMutationProvider {
  return new FetchCloudflareProvider(options);
}
