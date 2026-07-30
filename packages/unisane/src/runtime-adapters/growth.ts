import type { PackCommandRuntime } from '@unisane/ops-engine/pack';
import { loadUnisaneOpsConfig } from '../config/loader.js';

const GROWTH_PROVIDER_COMMAND_BINDING = 'growth.provider.command';

interface GrowthProviderCommandRequest {
  operation: string;
  cwd: string;
  input: unknown;
}

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

function selectGrowthEnvironment(
  environments: Record<string, unknown>,
  requested: unknown,
): string {
  if (typeof requested === 'string' && requested.trim()) {
    if (!(requested in environments)) {
      throw new Error(
        `[GROWTH_ENVIRONMENT_UNKNOWN] Growth environment '${requested}' is not configured.`,
      );
    }
    return requested;
  }
  const ids = Object.keys(environments);
  if (ids.length === 1) return ids[0];
  if ('development' in environments) return 'development';
  throw new Error(`[GROWTH_ENVIRONMENT_REQUIRED] Select one Growth environment: ${ids.join(', ')}`);
}

async function resolveGrowthProjectContext(cwd: string): Promise<unknown> {
  const loaded = await loadUnisaneOpsConfig(cwd);
  const growth = loaded.config.capabilities.growth;
  if (!growth) {
    throw new Error(
      '[GROWTH_CAPABILITY_NOT_SELECTED] Run `unisane add growth` before Growth operations.',
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

async function resolveGoogleConnectionCredentials(cwd: string, input: unknown): Promise<unknown> {
  const provider = await import('@unisane/provider-google');
  const loaded = await loadUnisaneOpsConfig(cwd);
  const growth = loaded.config.capabilities.growth;
  if (!growth) {
    throw new Error(
      '[GROWTH_CAPABILITY_NOT_SELECTED] Run `unisane add growth` before using Google.',
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
      `[GOOGLE_CONNECTION_REQUIRED] No Google connection is selected for '${environmentId}'. Run \`unisane connect google --environment ${environmentId}\`.`,
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

async function executeGoogleMarketing(operation: string, input: unknown): Promise<unknown> {
  const provider = await import('@unisane/provider-google/marketing');
  switch (operation) {
    case 'google.marketing.pull-report':
      return provider.pullGoogleAdsReport(input as never);
    case 'google.marketing.pull-ga4':
      return provider.pullGa4Report(input as never);
    case 'google.marketing.pull-search-console':
      return provider.pullSearchConsoleReport(input as never);
    case 'google.marketing.execute-live':
      return provider.executeGoogleAdsLiveOperation(input as never);
    default:
      throw new Error(
        `[GROWTH_GOOGLE_MARKETING_OPERATION_UNKNOWN] Unsupported operation '${operation}'.`,
      );
  }
}

async function executeGoogleTagManager(operation: string, input: unknown): Promise<unknown> {
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
    case 'gtm.provider.apply':
      return provider.applyGoogleTagManagerPlan({
        client,
        options: record.options as never,
      });
    case 'gtm.provider.preview':
      return provider.previewGoogleTagManagerWorkspace({
        client,
        options: record.options as never,
      });
    case 'gtm.provider.create-version':
      return provider.createGoogleTagManagerContainerVersion({
        client,
        options: record.options as never,
      });
    case 'gtm.provider.publish':
      return provider.publishGoogleTagManagerContainerVersion({
        client,
        options: record.options as never,
      });
    case 'gtm.provider.rollback':
      return provider.rollbackGoogleTagManagerContainerVersion({
        client,
        options: record.options as never,
      });
    default:
      throw new Error(`[GROWTH_GTM_OPERATION_UNKNOWN] Unsupported operation '${operation}'.`);
  }
}

async function executeMeta(operation: string, input: unknown): Promise<unknown> {
  if (operation === 'meta.connection.resolve-token') {
    throw new Error(
      '[META_CONNECTION_REQUIRED] Meta operations require a canonical provider connection; the retired token-profile path is unavailable.',
    );
  }
  const provider = await import('@unisane/provider-meta/marketing');
  switch (operation) {
    case 'meta.marketing.pull-report':
      return provider.pullMetaAdsReport(input as never);
    case 'meta.marketing.execute-live':
      return provider.executeMetaAdsLiveOperation(input as never);
    case 'meta.marketing.upload-asset':
      return provider.uploadMetaAdsAsset(input as never);
    default:
      throw new Error(`[GROWTH_META_OPERATION_UNKNOWN] Unsupported operation '${operation}'.`);
  }
}

export function isGrowthProviderBinding(bindingId: string): boolean {
  return bindingId === GROWTH_PROVIDER_COMMAND_BINDING;
}

export async function resolveGrowthProviderBinding(
  runtime: PackCommandRuntime,
  input: unknown,
): Promise<unknown> {
  void runtime;
  const request = requestOf(input);
  if (request.operation === 'growth.project.context') {
    return resolveGrowthProjectContext(request.cwd);
  }
  if (request.operation === 'google.connection.resolve-credentials') {
    return resolveGoogleConnectionCredentials(request.cwd, request.input);
  }
  if (request.operation.startsWith('google.seo.')) {
    return executeGoogleSeo(request.operation, request.input);
  }
  if (request.operation.startsWith('google.marketing.')) {
    return executeGoogleMarketing(request.operation, request.input);
  }
  if (request.operation.startsWith('gtm.')) {
    return executeGoogleTagManager(request.operation, request.input);
  }
  if (request.operation.startsWith('meta.')) {
    return executeMeta(request.operation, request.input);
  }
  throw new Error(
    `[GROWTH_PROVIDER_COMMAND_OPERATION_UNKNOWN] Unsupported operation '${request.operation}'.`,
  );
}
