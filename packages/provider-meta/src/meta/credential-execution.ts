import type { FetchLike } from '@unisane/growth/contracts';
import {
  discoverMetaConnection,
  metaConnectionDiscoveryResultSchema,
  type MetaConnectionDiscoveryOptions,
  type MetaConnectionDiscoveryResult,
} from './connection-discovery.js';
import { metaConnectionRecordSchema, type MetaConnectionRecord } from './connection.js';
import { pullMetaAdsReportRequest, type MetaAdsReportRequest } from './marketing/report-pull.js';

export interface MetaHostCredentialResolver {
  withCredential<T>(input: {
    reference: { credentialId: string; version: number };
    context: {
      scopeId: string;
      projectId: string;
      environmentId: string;
      connectionId: string;
      provider: 'meta';
      secretKind: 'meta-graph-access';
    };
    use(credential: Uint8Array): Promise<T>;
  }): Promise<T>;
}

function accessTokenFromBytes(credential: Uint8Array): string {
  let token: string;
  try {
    token = new TextDecoder('utf-8', { fatal: true }).decode(credential).trim();
  } catch {
    throw new Error('[META_CONNECTION_CREDENTIAL_INVALID] The host credential is not valid UTF-8.');
  }
  if (!token || token.length > 16_384) {
    throw new Error(
      '[META_CONNECTION_CREDENTIAL_INVALID] The host credential is empty or exceeds the supported bound.',
    );
  }
  return token;
}

async function withMetaConnectionCredential<T>(input: {
  connection: MetaConnectionRecord;
  resolver: MetaHostCredentialResolver;
  use(accessToken: string): Promise<T>;
}): Promise<T> {
  const connection = metaConnectionRecordSchema.parse(input.connection);
  if (connection.credential.state !== 'active') {
    throw new Error(
      '[META_CONNECTION_CREDENTIAL_INACTIVE] The canonical Meta credential is not active.',
    );
  }
  return input.resolver.withCredential({
    reference: {
      credentialId: connection.credential.secretReference,
      version: connection.credential.version,
    },
    context: {
      scopeId: connection.scopeId,
      projectId: connection.projectId,
      environmentId: connection.environmentId,
      connectionId: connection.connectionId,
      provider: 'meta',
      secretKind: 'meta-graph-access',
    },
    use: async (credential) => input.use(accessTokenFromBytes(credential)),
  });
}

export async function discoverMetaConnectionWithHostCredential(input: {
  connection: MetaConnectionRecord;
  resolver: MetaHostCredentialResolver;
  fetch: FetchLike;
  options?: MetaConnectionDiscoveryOptions;
  now?: Date;
}): Promise<MetaConnectionDiscoveryResult> {
  const connection = metaConnectionRecordSchema.parse(input.connection);
  return withMetaConnectionCredential({
    connection,
    resolver: input.resolver,
    use: async (accessToken) => {
      const result = await discoverMetaConnection({
        connection,
        accessToken,
        fetch: input.fetch,
        ...(input.options ? { options: input.options } : {}),
        ...(input.now ? { now: input.now } : {}),
      });
      return metaConnectionDiscoveryResultSchema.parse(result);
    },
  });
}

export async function pullMetaAdsReportWithHostCredential(input: {
  connection: MetaConnectionRecord;
  resolver: MetaHostCredentialResolver;
  accountId: string;
  options: MetaAdsReportRequest['options'];
  fetch: typeof fetch;
}) {
  const connection = metaConnectionRecordSchema.parse(input.connection);
  return withMetaConnectionCredential({
    connection,
    resolver: input.resolver,
    use: async (accessToken) =>
      pullMetaAdsReportRequest({
        accountId: input.accountId,
        accessToken,
        options: input.options,
        fetch: input.fetch,
      }),
  });
}

/** Invoked only by the host's shared campaign workflow, never a raw mutation route. */
export async function controlMetaCampaignWithHostCredential(input: {
  connection: MetaConnectionRecord;
  resolver: MetaHostCredentialResolver;
  accountId: string;
  campaignId: string;
  operation: 'read' | 'pause';
  fetch: FetchLike;
  beforeWrite?: () => Promise<void>;
}) {
  const { readBoundMetaCampaign } = await import('./marketing/campaign-access.js');
  const { pauseMetaAdsCampaign } = await import('./marketing/live-ads-executor.js');
  if (input.operation === 'pause') assertMetaCampaignMutationGrant(input.connection);
  return withMetaConnectionCredential({
    ...input,
    use: async (accessToken) => {
      const status = await readBoundMetaCampaign({ ...input, accessToken });
      if (input.operation === 'read') return status;
      if (status === 'unknown')
        throw new Error(
          '[META_CAMPAIGN_STATUS_UNKNOWN] Cannot pause with unavailable campaign state.',
        );
      await input.beforeWrite?.();
      return pauseMetaAdsCampaign({
        providerAccountId: input.accountId,
        campaignId: input.campaignId,
        accessToken,
        fetcher: (url, init) => input.fetch(url, { ...init, signal: AbortSignal.timeout(30_000) }),
      });
    },
  });
}

export function assertMetaCampaignMutationGrant(connection: MetaConnectionRecord): void {
  if (
    !connection.grants.some(
      (grant) => grant.state === 'granted' && grant.scopes.includes('ads_management'),
    )
  )
    throw new Error(
      '[META_CAMPAIGN_MANAGE_GRANT_REQUIRED] Campaign changes require a granted ads_management permission.',
    );
}
