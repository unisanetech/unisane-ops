import { META_GRAPH_API_VERSION } from './api-version.js';
import {
  marketingMetaConnectionGrantSchema,
  marketingMetaConnectionServiceSchema,
  marketingMetaResourceTypeSchema,
  type MarketingMetaConnectionGrant,
  type MarketingMetaConnectionService,
} from '@unisane/growth/marketing';
import type { FetchLike } from '@unisane/growth/contracts';
import { z } from 'zod';
import {
  metaConnectionIdentitySchema,
  metaConnectionRecordSchema,
  type MetaConnectionIdentity,
  type MetaConnectionRecord,
} from './connection.js';
import {
  MetaGraphReadError,
  metaReadPolicySchema,
  readMetaGraphJson,
  type MetaReadSleep,
} from './read-transport.js';

const apiVersionSchema = z.string().regex(/^v\d{1,2}\.\d+$/);
const isoTimestampSchema = z.string().datetime({ offset: true });
const safeTextSchema = z.string().trim().min(1).max(300);

export const metaConnectionDiscoveryOptionsSchema = z
  .object({
    apiVersion: apiVersionSchema.default(META_GRAPH_API_VERSION),
    pageSize: z.number().int().min(1).max(100).default(100),
    maxPages: z.number().int().min(1).max(20).default(5),
    maxBusinesses: z.number().int().min(1).max(25).default(10),
    timeoutMs: metaReadPolicySchema.shape.timeoutMs,
    maxRetries: metaReadPolicySchema.shape.maxRetries,
    maxRetryAfterSeconds: metaReadPolicySchema.shape.maxRetryAfterSeconds,
  })
  .strict();
export type MetaConnectionDiscoveryOptions = z.input<typeof metaConnectionDiscoveryOptionsSchema>;
type MarketingMetaResourceType = z.infer<typeof marketingMetaResourceTypeSchema>;

export const metaDiscoveryAreaSchema = z.enum([
  'identity',
  'permissions',
  'businesses',
  'ad-accounts',
  'event-sources',
  'pages',
]);
export type MetaDiscoveryArea = z.infer<typeof metaDiscoveryAreaSchema>;

export const metaDiscoveryFailureSchema = z
  .object({
    kind: z.enum([
      'transport',
      'timeout',
      'http',
      'rate-limited',
      'credential-revoked',
      'invalid-response',
      'pagination-rejected',
    ]),
    httpStatus: z.number().int().min(100).max(599).optional(),
    providerCode: z.number().int().optional(),
    providerSubcode: z.number().int().optional(),
    retryAfterSeconds: z.number().int().nonnegative().max(86_400).optional(),
    attempts: z.number().int().min(1).max(4).optional(),
  })
  .strict();
export type MetaDiscoveryFailure = z.infer<typeof metaDiscoveryFailureSchema>;

export const metaDiscoveryAreaResultSchema = z
  .object({
    area: metaDiscoveryAreaSchema,
    state: z.enum(['ready', 'partial', 'unavailable']),
    pageCount: z.number().int().nonnegative(),
    itemCount: z.number().int().nonnegative(),
    truncated: z.boolean(),
    failure: metaDiscoveryFailureSchema.optional(),
  })
  .strict();
export type MetaDiscoveryAreaResult = z.infer<typeof metaDiscoveryAreaResultSchema>;

export const metaDiscoveredResourceSchema = z
  .object({
    resourceType: marketingMetaResourceTypeSchema,
    resourceId: safeTextSchema,
    displayName: safeTextSchema,
    services: z.array(marketingMetaConnectionServiceSchema).min(1).max(2),
    state: z.literal('accessible'),
    parentResourceId: safeTextSchema.optional(),
  })
  .strict();
export type MetaDiscoveredResource = z.infer<typeof metaDiscoveredResourceSchema>;

export const metaConnectionDiscoveryResultSchema = z
  .object({
    schemaVersion: z.literal(1),
    provider: z.literal('meta'),
    connectionId: safeTextSchema,
    apiVersion: apiVersionSchema,
    observedAt: isoTimestampSchema,
    identity: metaConnectionIdentitySchema,
    grants: z.array(marketingMetaConnectionGrantSchema).max(20),
    resources: z.array(metaDiscoveredResourceSchema).max(500),
    resourceLimitReached: z.boolean(),
    areas: z.array(metaDiscoveryAreaResultSchema).min(1).max(100),
  })
  .strict();
export type MetaConnectionDiscoveryResult = z.infer<typeof metaConnectionDiscoveryResultSchema>;

type GraphPage = {
  rows: unknown[];
  pageCount: number;
  truncated: boolean;
};

class MetaDiscoveryReadError extends Error {
  constructor(readonly safeFailure: MetaDiscoveryFailure) {
    super('Meta discovery read failed.');
  }
}

function discoveryFailureOf(error: unknown): MetaDiscoveryFailure {
  if (error instanceof MetaDiscoveryReadError) return error.safeFailure;
  const parsed = metaDiscoveryFailureSchema.safeParse(recordOf(error).safeFailure);
  return parsed.success ? parsed.data : { kind: 'transport' };
}

function recordOf(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function stringOf(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

async function readGraphJson(input: {
  url: URL;
  accessToken: string;
  fetch: FetchLike;
  policy: z.infer<typeof metaReadPolicySchema>;
  sleep?: MetaReadSleep;
}): Promise<unknown> {
  try {
    return await readMetaGraphJson({
      url: input.url,
      accessToken: input.accessToken,
      fetch: input.fetch,
      policy: input.policy,
      ...(input.sleep ? { sleep: input.sleep } : {}),
    });
  } catch (error) {
    if (error instanceof MetaGraphReadError) {
      throw new MetaDiscoveryReadError(metaDiscoveryFailureSchema.parse(error.safeFailure));
    }
    throw new MetaDiscoveryReadError({ kind: 'transport' });
  }
}

function graphUrl(apiVersion: string, path: string, fields: string, pageSize?: number): URL {
  const url = new URL(`https://graph.facebook.com/${apiVersion}/${path}`);
  url.searchParams.set('fields', fields);
  if (pageSize !== undefined) url.searchParams.set('limit', String(pageSize));
  return url;
}

function checkedNextUrl(value: unknown, apiVersion: string): URL | undefined {
  const next = stringOf(recordOf(recordOf(value).paging).next);
  if (!next) return undefined;
  const url = new URL(next);
  if (
    url.protocol !== 'https:' ||
    url.hostname !== 'graph.facebook.com' ||
    !url.pathname.startsWith(`/${apiVersion}/`)
  ) {
    throw new MetaDiscoveryReadError({ kind: 'pagination-rejected' });
  }
  url.searchParams.delete('access_token');
  url.searchParams.delete('appsecret_proof');
  return url;
}

async function readGraphPages(input: {
  path: string;
  fields: string;
  accessToken: string;
  fetch: FetchLike;
  apiVersion: string;
  pageSize: number;
  maxPages: number;
  policy: z.infer<typeof metaReadPolicySchema>;
  sleep?: MetaReadSleep;
}): Promise<GraphPage> {
  const rows: unknown[] = [];
  let pageCount = 0;
  let next: URL | undefined = graphUrl(input.apiVersion, input.path, input.fields, input.pageSize);
  while (next && pageCount < input.maxPages) {
    const value = await readGraphJson({
      url: next,
      accessToken: input.accessToken,
      fetch: input.fetch,
      policy: input.policy,
      ...(input.sleep ? { sleep: input.sleep } : {}),
    });
    const data = recordOf(value).data;
    if (!Array.isArray(data)) {
      throw new MetaDiscoveryReadError({ kind: 'invalid-response' });
    }
    rows.push(...data);
    pageCount += 1;
    next = checkedNextUrl(value, input.apiVersion);
  }
  return { rows, pageCount, truncated: Boolean(next) };
}

function areaResult(
  area: MetaDiscoveryArea,
  page: GraphPage | undefined,
  failure?: MetaDiscoveryFailure,
): MetaDiscoveryAreaResult {
  return metaDiscoveryAreaResultSchema.parse({
    area,
    state: failure ? 'unavailable' : page?.truncated ? 'partial' : 'ready',
    pageCount: page?.pageCount ?? 0,
    itemCount: page?.rows.length ?? 0,
    truncated: page?.truncated ?? false,
    ...(failure ? { failure } : {}),
  });
}

async function optionalPages(
  area: MetaDiscoveryArea,
  input: Parameters<typeof readGraphPages>[0],
): Promise<{ page?: GraphPage; area: MetaDiscoveryAreaResult }> {
  try {
    const page = await readGraphPages(input);
    return { page, area: areaResult(area, page) };
  } catch (error) {
    const failure = discoveryFailureOf(error);
    return { area: areaResult(area, undefined, failure) };
  }
}

function resource(input: {
  value: unknown;
  resourceType: MarketingMetaResourceType;
  services: MarketingMetaConnectionService[];
  parentResourceId?: string;
}): MetaDiscoveredResource | undefined {
  const value = recordOf(input.value);
  const resourceId = stringOf(value.id);
  if (!resourceId) return undefined;
  const displayName = stringOf(value.name) ?? stringOf(value.username) ?? resourceId;
  return metaDiscoveredResourceSchema.parse({
    resourceType: input.resourceType,
    resourceId,
    displayName,
    services: [...new Set(input.services)],
    state: 'accessible',
    ...(input.parentResourceId ? { parentResourceId: input.parentResourceId } : {}),
  });
}

function pageResources(value: unknown): MetaDiscoveredResource[] {
  const page = recordOf(value);
  const pageResource = resource({
    value,
    resourceType: 'page',
    services: ['event-measurement'],
  });
  if (!pageResource) return [];
  const instagram = resource({
    value: page.instagram_business_account,
    resourceType: 'instagram-account',
    services: ['event-measurement'],
    parentResourceId: pageResource.resourceId,
  });
  return [pageResource, ...(instagram ? [instagram] : [])];
}

function dedupeResources(resources: MetaDiscoveredResource[]): {
  resources: MetaDiscoveredResource[];
  limitReached: boolean;
} {
  const byKey = new Map<string, MetaDiscoveredResource>();
  for (const candidate of resources) {
    const key = `${candidate.resourceType}:${candidate.resourceId}`;
    const existing = byKey.get(key);
    byKey.set(
      key,
      existing
        ? {
            ...existing,
            services: [...new Set([...existing.services, ...candidate.services])],
          }
        : candidate,
    );
  }
  const values = [...byKey.values()];
  return { resources: values.slice(0, 500), limitReached: values.length > 500 };
}

function grantsFromPermissions(
  rows: unknown[],
  observedAt: string,
): MarketingMetaConnectionGrant[] {
  const scopes = [
    ...new Set(
      rows
        .map(recordOf)
        .filter((permission) => permission.status === 'granted')
        .map((permission) => stringOf(permission.permission))
        .filter((scope): scope is string => Boolean(scope)),
    ),
  ].sort();
  const state = scopes.includes('ads_read') ? 'granted' : scopes.length > 0 ? 'partial' : 'missing';
  return (['ads-insights', 'event-measurement'] as const).map((service) =>
    marketingMetaConnectionGrantSchema.parse({ service, scopes, state, observedAt }),
  );
}

async function readRequiredIdentity(input: {
  connection: MetaConnectionRecord;
  accessToken: string;
  fetch: FetchLike;
  apiVersion: string;
  policy: z.infer<typeof metaReadPolicySchema>;
  sleep?: MetaReadSleep;
}): Promise<{ identity: MetaConnectionIdentity; area: MetaDiscoveryAreaResult }> {
  const identity = await probeMetaConnectionIdentity({
    connectionId: input.connection.connectionId,
    identityKind: input.connection.identity?.kind ?? 'system-user',
    accessToken: input.accessToken,
    fetch: input.fetch,
    options: {
      apiVersion: input.apiVersion,
      timeoutMs: input.policy.timeoutMs,
      maxRetries: input.policy.maxRetries,
      maxRetryAfterSeconds: input.policy.maxRetryAfterSeconds,
    },
    ...(input.sleep ? { sleep: input.sleep } : {}),
  });
  if (identity.subject !== input.connection.identity?.subject) {
    throw new Error(
      '[META_CONNECTION_IDENTITY_MISMATCH] The resolved credential does not belong to the canonical Meta identity.',
    );
  }
  return {
    identity,
    area: areaResult('identity', { rows: [identity], pageCount: 1, truncated: false }),
  };
}

export async function probeMetaConnectionIdentity(input: {
  connectionId: string;
  identityKind: MetaConnectionIdentity['kind'];
  accessToken: string;
  fetch: FetchLike;
  options?: MetaConnectionDiscoveryOptions;
  sleep?: MetaReadSleep;
}): Promise<MetaConnectionIdentity> {
  if (!input.accessToken.trim()) {
    throw new Error(
      '[META_CONNECTION_CREDENTIAL_EMPTY] The host supplied an empty Meta credential.',
    );
  }
  const options = metaConnectionDiscoveryOptionsSchema.parse(input.options ?? {});
  const policy = metaReadPolicySchema.parse({
    timeoutMs: options.timeoutMs,
    maxRetries: options.maxRetries,
    maxRetryAfterSeconds: options.maxRetryAfterSeconds,
  });
  let value: unknown;
  try {
    value = await readGraphJson({
      url: graphUrl(options.apiVersion, 'me', 'id,name'),
      accessToken: input.accessToken,
      fetch: input.fetch,
      policy,
      ...(input.sleep ? { sleep: input.sleep } : {}),
    });
  } catch (error) {
    const failure = discoveryFailureOf(error);
    throw new Error(`[META_IDENTITY_DISCOVERY_UNAVAILABLE] ${JSON.stringify(failure)}`);
  }
  const identity = recordOf(value);
  const subject = stringOf(identity.id);
  if (!subject) {
    throw new Error(
      `[META_IDENTITY_DISCOVERY_INVALID] Meta identity for '${input.connectionId}' is unavailable.`,
    );
  }
  return metaConnectionIdentitySchema.parse({
    kind: input.identityKind,
    subject,
    ...(stringOf(identity.name) ? { displayName: stringOf(identity.name) } : {}),
  });
}

export async function discoverMetaConnection(input: {
  connection: MetaConnectionRecord;
  accessToken: string;
  fetch: FetchLike;
  options?: MetaConnectionDiscoveryOptions;
  now?: Date;
  sleep?: MetaReadSleep;
}): Promise<MetaConnectionDiscoveryResult> {
  const connection = metaConnectionRecordSchema.parse(input.connection);
  if (connection.credential.state !== 'active' || !connection.identity) {
    throw new Error(
      '[META_CONNECTION_CREDENTIAL_INACTIVE] Read-only discovery requires one active, verified Meta connection.',
    );
  }
  if (!input.accessToken.trim()) {
    throw new Error(
      '[META_CONNECTION_CREDENTIAL_EMPTY] The host supplied an empty Meta credential.',
    );
  }
  const options = metaConnectionDiscoveryOptionsSchema.parse(input.options ?? {});
  const policy = metaReadPolicySchema.parse({
    timeoutMs: options.timeoutMs,
    maxRetries: options.maxRetries,
    maxRetryAfterSeconds: options.maxRetryAfterSeconds,
  });
  const observedAt = (input.now ?? new Date()).toISOString();
  const identity = await readRequiredIdentity({
    connection,
    accessToken: input.accessToken,
    fetch: input.fetch,
    apiVersion: options.apiVersion,
    policy,
    ...(input.sleep ? { sleep: input.sleep } : {}),
  });
  const common = {
    accessToken: input.accessToken,
    fetch: input.fetch,
    apiVersion: options.apiVersion,
    pageSize: options.pageSize,
    maxPages: options.maxPages,
    policy,
    ...(input.sleep ? { sleep: input.sleep } : {}),
  };
  const permissions = await optionalPages('permissions', {
    ...common,
    path: 'me/permissions',
    fields: 'permission,status',
  });
  const businesses = await optionalPages('businesses', {
    ...common,
    path: 'me/businesses',
    fields: 'id,name',
  });
  const adAccounts = await optionalPages('ad-accounts', {
    ...common,
    path: 'me/adaccounts',
    fields: 'id,name,account_id,account_status,business{id,name}',
  });
  const pages = await optionalPages('pages', {
    ...common,
    path: 'me/accounts',
    fields: 'id,name,category,instagram_business_account{id,username,name}',
  });

  const businessRows = businesses.page?.rows.slice(0, options.maxBusinesses) ?? [];
  const businessLimitReached = (businesses.page?.rows.length ?? 0) > options.maxBusinesses;
  // System-user tokens can list ad accounts while `me/businesses` is empty or
  // unavailable. Pixels are also exposed through each ad account's
  // `adspixels` edge, so use that as an independent discovery path.
  const adAccountRows = adAccounts.page?.rows.slice(0, options.maxBusinesses) ?? [];
  const adAccountLimitReached = (adAccounts.page?.rows.length ?? 0) > options.maxBusinesses;
  const eventSourcePages: GraphPage[] = [];
  const eventSourceFailures: MetaDiscoveryFailure[] = [];
  const eventResources: MetaDiscoveredResource[] = [];
  for (const businessValue of businessRows) {
    const businessId = stringOf(recordOf(businessValue).id);
    if (!businessId) continue;
    for (const [edge, resourceType] of [
      ['adspixels', 'pixel'],
      ['ads_dataset', 'dataset'],
    ] as const) {
      const result = await optionalPages('event-sources', {
        ...common,
        path: `${encodeURIComponent(businessId)}/${edge}`,
        fields: 'id,name',
      });
      if (result.page) {
        eventSourcePages.push(result.page);
        eventResources.push(
          ...result.page.rows
            .map((value) =>
              resource({
                value,
                resourceType,
                services: ['event-measurement'],
                parentResourceId: businessId,
              }),
            )
            .filter((candidate): candidate is MetaDiscoveredResource => Boolean(candidate)),
        );
      }
      if (result.area.failure) eventSourceFailures.push(result.area.failure);
    }
  }
  for (const adAccountValue of adAccountRows) {
    const adAccountId = stringOf(recordOf(adAccountValue).id);
    if (!adAccountId) continue;
    const result = await optionalPages('event-sources', {
      ...common,
      path: `${encodeURIComponent(adAccountId)}/adspixels`,
      fields: 'id,name',
    });
    if (result.page) {
      eventSourcePages.push(result.page);
      eventResources.push(
        ...result.page.rows
          .map((value) =>
            resource({
              value,
              resourceType: 'pixel',
              services: ['event-measurement'],
              parentResourceId: adAccountId,
            }),
          )
          .filter((candidate): candidate is MetaDiscoveredResource => Boolean(candidate)),
      );
    }
    if (result.area.failure) eventSourceFailures.push(result.area.failure);
  }
  const eventSourcePage: GraphPage = {
    rows: eventSourcePages.flatMap((page) => page.rows),
    pageCount: eventSourcePages.reduce((total, page) => total + page.pageCount, 0),
    truncated:
      businessLimitReached ||
      adAccountLimitReached ||
      eventSourcePages.some((page) => page.truncated),
  };
  const allEventSourceRootsUnavailable =
    businesses.area.state === 'unavailable' && adAccounts.area.state === 'unavailable';
  const eventSourceArea = metaDiscoveryAreaResultSchema.parse({
    area: 'event-sources',
    state: allEventSourceRootsUnavailable
      ? 'unavailable'
      : eventSourceFailures.length === 0
        ? eventSourcePage.truncated
          ? 'partial'
          : businesses.area.state !== 'ready' || adAccounts.area.state !== 'ready'
            ? 'partial'
            : 'ready'
        : eventSourcePage.pageCount > 0
          ? 'partial'
          : 'unavailable',
    pageCount: eventSourcePage.pageCount,
    itemCount: eventSourcePage.rows.length,
    truncated: eventSourcePage.truncated,
    ...(eventSourcePage.pageCount === 0 &&
    (eventSourceFailures[0] ?? businesses.area.failure ?? adAccounts.area.failure)
      ? { failure: eventSourceFailures[0] ?? businesses.area.failure ?? adAccounts.area.failure }
      : {}),
  });

  const inventory = dedupeResources([
    ...(businesses.page?.rows ?? [])
      .map((value) =>
        resource({
          value,
          resourceType: 'business',
          services: ['ads-insights', 'event-measurement'],
        }),
      )
      .filter((candidate): candidate is MetaDiscoveredResource => Boolean(candidate)),
    ...(adAccounts.page?.rows ?? [])
      .map((value) => resource({ value, resourceType: 'ad-account', services: ['ads-insights'] }))
      .filter((candidate): candidate is MetaDiscoveredResource => Boolean(candidate)),
    ...(pages.page?.rows ?? []).flatMap(pageResources),
    ...eventResources,
  ]);

  return metaConnectionDiscoveryResultSchema.parse({
    schemaVersion: 1,
    provider: 'meta',
    connectionId: connection.connectionId,
    apiVersion: options.apiVersion,
    observedAt,
    identity: identity.identity,
    grants: grantsFromPermissions(permissions.page?.rows ?? [], observedAt),
    resources: inventory.resources,
    resourceLimitReached: inventory.limitReached,
    areas: [
      identity.area,
      permissions.area,
      businesses.area,
      adAccounts.area,
      eventSourceArea,
      pages.area,
    ],
  });
}
