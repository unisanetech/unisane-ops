import { executeCampaignPauseWorkflow } from './campaign-pause.js';
import { executeGoogleAssetOperation } from './google-assets.js';
import { executeGoogleGoalOperation } from './google-goals.js';
import { executeGtmWorkspaceOperation } from './gtm-workspace.js';
import { executeMetaDiagnosticOperation } from './meta-diagnostics.js';
import { collectLocalMetaReport, readLocalMetaReportHistory } from './meta-report-history.js';
import { selectGrowthEnvironment } from './environment.js';
import {
  metaConnectionRoutingSchema,
  resolveMetaConnectionRecord,
  resolveSelectedMetaAdsAccount,
} from './meta-context.js';
import { readLocalMetaReport } from './meta-report-read.js';
import { findMetaOperationSupport, reviewLocalMetaCapabilities } from './meta-capabilities.js';
import type { PackCommandRuntime } from '@unisane/ops-engine/pack';
import type { MetaHostCredentialResolver, MetaLocalCredentialSource } from '@unisane/provider-meta';
import { z } from 'zod';
import { loadUnisaneOpsConfig } from '../config/loader.js';

const GROWTH_PROVIDER_COMMAND_BINDING = 'growth.provider.command';

interface GrowthProviderCommandRequest {
  operation: string;
  cwd: string;
  input: unknown;
}

export interface GrowthProviderOperationDependencies {
  metaCredentialResolver?: MetaHostCredentialResolver;
  fetch?: typeof fetch;
  now?: () => Date;
}

const metaDiscoveryCommandSchema = z
  .object({
    environment: z.string().trim().min(1).optional(),
    connection: z.string().trim().min(1).optional(),
    apiVersion: z
      .string()
      .regex(/^v\d{1,2}\.\d+$/)
      .optional(),
    pageSize: z.number().int().min(1).max(100).optional(),
    maxPages: z.number().int().min(1).max(20).optional(),
    maxBusinesses: z.number().int().min(1).max(25).optional(),
  })
  .strict();

const metaReportCommandSchema = metaConnectionRoutingSchema
  .extend({
    accountId: z
      .string()
      .trim()
      .regex(/^(?:act_)?\d+$/),
    startDate: z.string().date(),
    endDate: z.string().date(),
    timeZone: z.string().trim().min(1).max(100).optional(),
    apiVersion: z
      .string()
      .regex(/^v\d{1,2}\.\d+$/)
      .optional(),
    maxPages: z.number().int().min(1).max(20).optional(),
    pageSize: z.number().int().min(1).max(100).optional(),
    reportType: z.enum(['account', 'campaign', 'adSet', 'ad', 'creative', 'device']).optional(),
  })
  .strict()
  .refine((value) => value.startDate <= value.endDate, {
    path: ['endDate'],
    message: 'endDate must be on or after startDate',
  });

function requestOf(input: unknown): GrowthProviderCommandRequest {
  if (
    typeof input !== 'object' ||
    input === null ||
    !('operation' in input) ||
    typeof input.operation !== 'string' ||
    !('cwd' in input) ||
    typeof input.cwd !== 'string' ||
    !('input' in input)
  ) {
    throw new Error('[GROWTH_PROVIDER_COMMAND_REQUEST_INVALID] Invalid Growth provider request.');
  }
  return input as GrowthProviderCommandRequest;
}

function recordOf(input: unknown): Record<string, unknown> {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) return {};
  return input as Record<string, unknown>;
}

async function resolveGrowthProjectContext(cwd: string): Promise<unknown> {
  const loaded = await loadUnisaneOpsConfig(cwd);
  const growth = loaded.config.capabilities.growth;
  if (!growth) {
    throw new Error(
      '[GROWTH_CAPABILITY_NOT_SELECTED] Run `unisane-ops add growth` before Growth operations.',
    );
  }
  return {
    projectRoot: loaded.projectRoot,
    configPath: loaded.configPath,
    projectId: loaded.config.project.id,
    environments: loaded.config.environments,
    growth,
  };
}

async function resolveGrowthConnectionsContext(cwd: string, input: unknown): Promise<unknown> {
  const loaded = await loadUnisaneOpsConfig(cwd);
  const growth = loaded.config.capabilities.growth;
  if (!growth) {
    throw new Error(
      '[GROWTH_CAPABILITY_NOT_SELECTED] Run `unisane-ops add growth` before Growth operations.',
    );
  }
  const requested = recordOf(input).environment;
  const environmentId = selectGrowthEnvironment(growth.environments, requested);
  const environment = growth.environments[environmentId];
  const providers: unknown[] = [];
  const googleConnectionId = environment.connections.google;
  if (!googleConnectionId) {
    providers.push({ provider: 'google', available: true });
  } else {
    const reference = loaded.config.connections[googleConnectionId];
    if (!reference || reference.provider !== 'google' || !('recordPath' in reference)) {
      providers.push({
        provider: 'google',
        available: true,
        connection: {
          id: googleConnectionId,
          displayName: 'Google',
          credentialState: 'missing',
          grants: [],
          resources: [],
        },
      });
    } else {
      const google = await import('@unisane/provider-google');
      const connection = google.readGoogleConnectionRecord({
        projectRoot: loaded.projectRoot,
        recordPath: reference.recordPath,
      });
      providers.push(
        connection
          ? {
              provider: 'google',
              available: true,
              connection: {
                id: connection.connectionId,
                displayName: connection.displayName,
                ...(connection.identity?.email ? { identity: connection.identity.email } : {}),
                credentialState: connection.credentialState,
                grants: connection.grants.map((grant) => ({
                  service: grant.service,
                  scopes: grant.scopes,
                  state: grant.state,
                  observedAt: grant.observedAt,
                  ...(grant.expiresAt ? { expiresAt: grant.expiresAt } : {}),
                })),
                resources: connection.resources.map((resource) => ({
                  service: resource.service,
                  resourceType: resource.resourceType,
                  resourceId: resource.resourceId,
                  displayName: resource.displayName,
                  state: resource.state,
                  observedAt: resource.observedAt,
                })),
                updatedAt: connection.updatedAt,
                ...(connection.lastVerifiedAt ? { lastVerifiedAt: connection.lastVerifiedAt } : {}),
              },
            }
          : {
              provider: 'google',
              available: true,
              connection: {
                id: googleConnectionId,
                displayName: 'Google',
                credentialState: 'missing',
                grants: [],
                resources: [],
              },
            },
      );
    }
  }

  const metaConnectionId = environment.connections.meta;
  if (!metaConnectionId) {
    providers.push({ provider: 'meta', available: true });
  } else {
    const reference = loaded.config.connections[metaConnectionId];
    if (!reference || reference.provider !== 'meta' || !('recordPath' in reference)) {
      providers.push({
        provider: 'meta',
        available: true,
        connection: {
          id: metaConnectionId,
          displayName: 'Meta',
          credentialState: 'missing',
          grants: [],
          resources: [],
        },
      });
    } else {
      const meta = await import('@unisane/provider-meta');
      const connection = meta.readMetaConnectionRecord({
        projectRoot: loaded.projectRoot,
        recordPath: reference.recordPath,
      });
      if (
        connection &&
        (connection.projectId !== loaded.config.project.id ||
          connection.environmentId !== environmentId ||
          connection.connectionId !== metaConnectionId)
      ) {
        throw new Error(
          '[META_CONNECTION_CONTEXT_MISMATCH] The canonical Meta record does not belong to the selected project and environment.',
        );
      }
      if (!connection) {
        providers.push({
          provider: 'meta',
          available: true,
          connection: {
            id: metaConnectionId,
            displayName: 'Meta',
            credentialState: 'missing',
            grants: [],
            resources: [],
          },
        });
      } else {
        const status = meta.projectMetaConnectionStatus(connection);
        providers.push({
          provider: 'meta',
          available: true,
          connection: {
            id: connection.connectionId,
            displayName: connection.displayName,
            ...(connection.identity
              ? { identity: connection.identity.displayName ?? connection.identity.subject }
              : {}),
            credentialState: status.credentialState ?? 'missing',
            grants: status.grants ?? [],
            resources: status.resources ?? [],
            updatedAt: status.updatedAt,
            ...(status.lastVerifiedAt ? { lastVerifiedAt: status.lastVerifiedAt } : {}),
          },
        });
      }
    }
  }
  return { environmentId, providers };
}

async function resolveGoogleConnectionCredentials(cwd: string, input: unknown): Promise<unknown> {
  const provider = await import('@unisane/provider-google');
  const loaded = await loadUnisaneOpsConfig(cwd);
  const growth = loaded.config.capabilities.growth;
  if (!growth) {
    throw new Error(
      '[GROWTH_CAPABILITY_NOT_SELECTED] Run `unisane-ops add growth` before using Google.',
    );
  }
  const record = recordOf(input);
  const environmentId = selectGrowthEnvironment(growth.environments, record.environment);
  const environment = growth.environments[environmentId];
  const connectionId =
    typeof record.connection === 'string' && record.connection.trim()
      ? record.connection
      : environment.connections.google;
  if (!connectionId) {
    throw new Error(
      `[GOOGLE_CONNECTION_REQUIRED] No Google connection is selected for '${environmentId}'. Run \`unisane-ops connect google --environment ${environmentId}\`.`,
    );
  }
  const reference = loaded.config.connections[connectionId];
  if (!reference || reference.provider !== 'google' || !('recordPath' in reference)) {
    throw new Error(
      `[GOOGLE_CONNECTION_UNKNOWN] '${connectionId}' is not a canonical Google connection.`,
    );
  }
  const connection = provider.readGoogleConnectionRecord({
    projectRoot: loaded.projectRoot,
    recordPath: reference.recordPath,
  });
  if (!connection) {
    throw new Error(
      `[GOOGLE_CONNECTION_RECORD_MISSING] Connection record '${reference.recordPath}' does not exist.`,
    );
  }
  if (connection.environmentId !== environmentId) {
    throw new Error(
      `[GOOGLE_CONNECTION_ENVIRONMENT_MISMATCH] Connection '${connectionId}' belongs to '${connection.environmentId}', not '${environmentId}'.`,
    );
  }
  return provider.resolveGoogleConnectionCredentials({
    connection,
    service: provider.googleConnectionServiceSchema.parse(record.service),
    ...(typeof record.requiredScope === 'string' ? { requiredScope: record.requiredScope } : {}),
  });
}

async function executeGoogleSeo(operation: string, input: unknown): Promise<unknown> {
  const provider = await import('@unisane/provider-google/seo');
  const record = recordOf(input);
  if (operation === 'google.seo.fetch-ga4') {
    return provider.fetchGa4PerformanceFile(
      record as Parameters<typeof provider.fetchGa4PerformanceFile>[0],
    );
  }
  if (operation === 'google.seo.fetch-search-console') {
    return provider.fetchSearchConsolePerformanceFile(
      record as Parameters<typeof provider.fetchSearchConsolePerformanceFile>[0],
    );
  }
  if (operation === 'google.seo.fetch-keyword-metrics') {
    if (typeof record.customerId !== 'string' || typeof record.developerToken !== 'string') {
      throw new Error(
        '[GOOGLE_ADS_DEVELOPER_ACCESS_REQUIRED] Keyword Planner requires a selected customer and approved developer access from the connection adapter.',
      );
    }
    const args = {
      ...record,
      credentials: {
        customerId: provider.normalizeCustomerId(record.customerId)!,
        developerToken: record.developerToken,
        apiVersion: typeof record.apiVersion === 'string' ? record.apiVersion : 'v24',
      },
    };
    return provider.fetchGoogleAdsKeywordMetricsFile(
      args as Parameters<typeof provider.fetchGoogleAdsKeywordMetricsFile>[0],
    );
  }
  throw new Error(`[GROWTH_GOOGLE_SEO_OPERATION_UNKNOWN] Unsupported operation '${operation}'.`);
}

async function executeGoogleMarketing(
  cwd: string,
  operation: string,
  input: unknown,
  campaignFetch: typeof fetch = fetch,
): Promise<unknown> {
  const provider = await import('@unisane/provider-google/marketing');
  const record = recordOf(input);
  switch (operation) {
    case 'google.marketing.assets':
      return executeGoogleAssetOperation(cwd, input, request => resolveGoogleConnectionCredentials(cwd, request));
    case 'google.marketing.apply-goals':
      return executeGoogleGoalOperation(cwd, input, request => resolveGoogleConnectionCredentials(cwd, request));
    case 'google.marketing.pull-report':
      return provider.pullGoogleAdsReport(input as never);
    case 'google.marketing.pull-ga4':
      return provider.pullGa4Report(input as never);
    case 'google.marketing.pull-search-console':
      return provider.pullSearchConsoleReport(input as never);
    case 'google.marketing.execute-live':
      return provider.executeGoogleAdsLiveOperation(input as never);
    case 'google.marketing.pause-campaign':
    case 'google.marketing.read-campaign-status': {
      const credentials = recordOf(
        await resolveGoogleConnectionCredentials(cwd, {
          environment: record.environment,
          connection: record.connection,
          service: 'ads',
          requiredScope: 'https://www.googleapis.com/auth/adwords',
        }),
      );
      if (
        typeof record.providerAccountId !== 'string' ||
        typeof record.campaignId !== 'string' ||
        typeof credentials.accessToken !== 'string' ||
        typeof credentials.developerToken !== 'string'
      ) {
        throw new Error(
          '[GOOGLE_ADS_CAMPAIGN_CONTROL_CONNECTION_INCOMPLETE] Exact campaign control requires a canonical Ads connection and developer token.',
        );
      }
      const request = {
        customerId: record.providerAccountId,
        campaignId: record.campaignId,
        accessToken: credentials.accessToken,
        developerToken: credentials.developerToken,
        fetcher: campaignFetch,
        ...(typeof credentials.loginCustomerId === 'string' ? { loginCustomerId: credentials.loginCustomerId } : {}),
        ...(typeof record.apiVersion === 'string' ? { apiVersion: record.apiVersion } : {}),
      };
      return operation === 'google.marketing.pause-campaign'
        ? provider.pauseGoogleAdsCampaign(request)
        : provider.readGoogleAdsCampaignStatus(request);
    }
    default:
      throw new Error(
        `[GROWTH_GOOGLE_MARKETING_OPERATION_UNKNOWN] Unsupported operation '${operation}'.`,
      );
  }
}

async function executeGoogleTagManager(operation: string, input: unknown): Promise<unknown> {
  if (operation !== 'gtm.provider.read-snapshot' && operation !== 'gtm.provider.normalize-snapshot')
    throw new Error('[GROWTH_GTM_OPERATION_UNKNOWN] Use shared GTM workspace or release actions.');
  const record = recordOf(input);
  const provider = await import('@unisane/provider-google/gtm');
  if (operation === 'gtm.provider.normalize-snapshot') {
    return provider.normalizeGoogleTagManagerApiSnapshot(input as never);
  }
  const client = provider.createGoogleTagManagerApiClient({
    accessToken: record.accessToken as string,
    rateLimitMs: record.rateLimitMs as number | undefined,
  });
  switch (operation) {
    case 'gtm.provider.read-snapshot':
      return provider.readGoogleTagManagerRemoteSnapshot({
        client,
        options: record.options as never,
      });
    default:
      throw new Error(`[GROWTH_GTM_OPERATION_UNKNOWN] Unsupported operation '${operation}'.`);
  }
}

async function executeMeta(
  cwd: string,
  operation: string,
  input: unknown,
  dependencies: GrowthProviderOperationDependencies,
): Promise<unknown> {
  const support = findMetaOperationSupport(operation);
  if (support?.state === 'blocked') throw new Error(support.reason);
  if (operation === 'meta.connection.capabilities') {
    const provider = await import('@unisane/provider-meta');
    return provider.metaCapabilityInventory();
  }
  if (operation === 'meta.connection.discover') {
    const command = metaDiscoveryCommandSchema.parse(input);
    const { connection, provider } = await resolveMetaConnectionRecord(cwd, {
      environment: command.environment,
      connection: command.connection,
    });
    if (!dependencies.metaCredentialResolver) {
      throw new Error(
        '[META_CREDENTIAL_RESOLVER_UNAVAILABLE] The host has not supplied its credential callback.',
      );
    }
    return provider.discoverMetaConnectionWithHostCredential({
      connection,
      resolver: dependencies.metaCredentialResolver,
      fetch: dependencies.fetch ?? fetch,
      options: {
        ...(command.apiVersion ? { apiVersion: command.apiVersion } : {}),
        ...(command.pageSize !== undefined ? { pageSize: command.pageSize } : {}),
        ...(command.maxPages !== undefined ? { maxPages: command.maxPages } : {}),
        ...(command.maxBusinesses !== undefined ? { maxBusinesses: command.maxBusinesses } : {}),
      },
      ...(dependencies.now ? { now: dependencies.now() } : {}),
    });
  }
  if (operation === 'meta.marketing.pull-report') {
    const command = metaReportCommandSchema.parse(input);
    const { connection, environment, provider } = await resolveMetaConnectionRecord(cwd, {
      environment: command.environment,
      connection: command.connection,
    });
    if (!dependencies.metaCredentialResolver) {
      throw new Error(
        '[META_CREDENTIAL_RESOLVER_UNAVAILABLE] The host has not supplied its credential callback.',
      );
    }
    const accountId = resolveSelectedMetaAdsAccount({
      connection,
      environment,
      requestedAccountId: command.accountId,
    });
    return provider.pullMetaAdsReportWithHostCredential({
      connection,
      resolver: dependencies.metaCredentialResolver,
      accountId,
      options: {
        startDate: command.startDate,
        endDate: command.endDate,
        ...(command.timeZone ? { timeZone: command.timeZone } : {}),
        ...(command.apiVersion ? { apiVersion: command.apiVersion } : {}),
        ...(command.maxPages !== undefined ? { maxPages: command.maxPages } : {}),
        ...(command.pageSize !== undefined ? { pageSize: command.pageSize } : {}),
        ...(command.reportType ? { reportType: command.reportType } : {}),
      },
      fetch: dependencies.fetch ?? fetch,
    });
  }
  throw new Error(`[GROWTH_META_OPERATION_UNKNOWN] Unsupported operation '${operation}'.`);
}

export function isGrowthProviderBinding(bindingId: string): boolean {
  return bindingId === GROWTH_PROVIDER_COMMAND_BINDING;
}

export async function executeGrowthProviderOperation(
  cwd: string,
  operation: string,
  input: unknown,
  dependencies: GrowthProviderOperationDependencies = {},
): Promise<unknown> {
  const request: GrowthProviderCommandRequest = { cwd, operation, input };
  if (operation === 'growth.campaign.pause') return executeCampaignPauseWorkflow(cwd, input, { ...dependencies, google: (kind, parameters, beforeWrite) => executeGoogleMarketing(cwd, kind === 'pause' ? 'google.marketing.pause-campaign' : 'google.marketing.read-campaign-status', parameters, async (url, init) => { await beforeWrite?.(); return (dependencies.fetch ?? fetch)(url, { ...init, signal: AbortSignal.timeout(30_000) }); }) });
  if (operation === 'google.marketing.pause-campaign') throw new Error('[CAMPAIGN_SHARED_WORKFLOW_REQUIRED] Use the approved shared campaign workflow.');
  if (
    operation === 'growth.meta.diagnostics.import' ||
    operation === 'growth.meta.diagnostics.review'
  )
    return executeMetaDiagnosticOperation(
      cwd,
      operation.endsWith('import') ? 'import' : 'review',
      input,
      (dependencies.now ?? (() => new Date()))(),
    );
  if (operation === 'growth.reports.collect')
    return collectLocalMetaReport(cwd, input, dependencies);
  if (operation === 'growth.reports.history') return readLocalMetaReportHistory(cwd, input);
  if (operation === 'growth.reports.read') return readLocalMetaReport(cwd, input, dependencies);
  if (operation === 'growth.capabilities.review') {
    return reviewLocalMetaCapabilities(cwd, input, {
      credentialResolverAvailable: Boolean(dependencies.metaCredentialResolver),
      now: dependencies.now,
    });
  }
  if (request.operation === 'growth.connections.context') {
    return resolveGrowthConnectionsContext(request.cwd, request.input);
  }
  if (request.operation === 'growth.project.context') {
    return resolveGrowthProjectContext(request.cwd);
  }
  if (request.operation === 'growth.gtm.release')
    return executeGtmWorkspaceOperation(request.cwd, request.input, true);
  if (request.operation === 'growth.gtm.workspace')
    return executeGtmWorkspaceOperation(request.cwd, request.input);
  if (request.operation === 'google.connection.resolve-credentials') {
    return resolveGoogleConnectionCredentials(request.cwd, request.input);
  }
  if (request.operation.startsWith('google.seo.')) {
    return executeGoogleSeo(request.operation, request.input);
  }
  if (request.operation.startsWith('google.marketing.')) {
    return executeGoogleMarketing(request.cwd, request.operation, request.input);
  }
  if (request.operation.startsWith('gtm.')) {
    return executeGoogleTagManager(request.operation, request.input);
  }
  if (
    request.operation.startsWith('meta.') ||
    request.operation === 'growth.capabilities.review' ||
    request.operation === 'growth.reports.read' ||
    request.operation === 'growth.reports.collect' ||
    request.operation === 'growth.reports.history' ||
    request.operation.startsWith('growth.meta.diagnostics.')
  ) {
    return executeMeta(request.cwd, request.operation, request.input, dependencies);
  }
  throw new Error(
    `[GROWTH_PROVIDER_COMMAND_OPERATION_UNKNOWN] Unsupported operation '${request.operation}'.`,
  );
}

export async function resolveGrowthProviderBinding(
  runtime: PackCommandRuntime,
  input: unknown,
  dependencies?: GrowthProviderOperationDependencies,
): Promise<unknown> {
  void runtime;
  const request = requestOf(input);
  const resolvedDependencies =
    dependencies ??
    (request.operation.startsWith('meta.') ||
    request.operation === 'growth.capabilities.review' ||
    request.operation === 'growth.reports.read' ||
    request.operation === 'growth.reports.collect' ||
    request.operation === 'growth.reports.history' ||
    request.operation.startsWith('growth.meta.diagnostics.')
      ? await createLocalGrowthProviderOperationDependencies()
      : {});
  return executeGrowthProviderOperation(
    request.cwd,
    request.operation,
    request.input,
    resolvedDependencies,
  );
}

export async function createLocalGrowthProviderOperationDependencies(
  input: {
    metaCredentialSource?: MetaLocalCredentialSource;
  } = {},
): Promise<GrowthProviderOperationDependencies> {
  const provider = await import('@unisane/provider-meta');
  return {
    metaCredentialResolver: input.metaCredentialSource
      ? provider.createLocalMetaCredentialResolver({ source: input.metaCredentialSource })
      : provider.createMacOsMetaCredentialResolver(),
  };
}
