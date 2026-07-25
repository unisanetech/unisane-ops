import type { PackCommandRuntime } from '@unisane/ops-engine/pack';

const GROWTH_PROVIDER_COMMAND_BINDING = 'growth.provider.command';

interface GrowthProviderCommandRequest {
  operation: string;
  input: unknown;
}

function requestOf(input: unknown): GrowthProviderCommandRequest {
  if (
    typeof input !== 'object' ||
    input === null ||
    !('operation' in input) ||
    typeof input.operation !== 'string' ||
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

function marketingGoogleRuntime(input: unknown): Record<string, unknown> {
  const record = recordOf(input);
  return {
    ...recordOf(record.runtime),
    authNamespace: 'marketing',
  };
}

async function executeGoogleAuth(operation: string, input: unknown): Promise<unknown> {
  const provider = await import('@unisane/provider-google');
  const record = recordOf(input);
  switch (operation) {
    case 'google.auth.save':
      return provider.saveGoogleAuthProfile({
        ...(record as Parameters<typeof provider.saveGoogleAuthProfile>[0]),
        runtime: marketingGoogleRuntime(input),
      });
    case 'google.auth.refresh':
      return provider.refreshGoogleAccessToken({
        ...record,
        runtime: marketingGoogleRuntime(input),
      });
    case 'google.auth.status':
      return provider.getGoogleAuthStatus({
        ...record,
        runtime: marketingGoogleRuntime(input),
      });
    case 'google.auth.delete':
      return provider.deleteGoogleAuthProfile({
        ...record,
        runtime: marketingGoogleRuntime(input),
      });
    case 'google.auth.login':
      return provider.loginGoogleAuthCommand({ ...record, authNamespace: 'marketing' });
    case 'google.auth.status-command':
      return provider.statusGoogleAuthCommand({ ...record, authNamespace: 'marketing' });
    case 'google.auth.token-command':
      return provider.tokenGoogleAuthCommand({ ...record, authNamespace: 'marketing' });
    case 'google.auth.logout-command':
      return provider.logoutGoogleAuthCommand({ ...record, authNamespace: 'marketing' });
    case 'google.auth.resolve-token': {
      const requiredScope = record.requiredScope;
      if (typeof requiredScope !== 'string' || requiredScope.trim().length === 0) {
        throw new Error(
          '[GROWTH_GOOGLE_AUTH_SCOPE_REQUIRED] Google access-token resolution requires requiredScope.',
        );
      }
      const args: Parameters<typeof provider.resolveGoogleAccessToken>[0] = {
        ...record,
        requiredScope,
        runtime:
          record.namespace === 'google'
            ? { authNamespace: 'google' }
            : marketingGoogleRuntime(input),
      };
      return provider.resolveGoogleAccessToken(args);
    }
    default:
      throw new Error(
        `[GROWTH_GOOGLE_AUTH_OPERATION_UNKNOWN] Unsupported operation '${operation}'.`,
      );
  }
}

async function executeGoogleSeo(operation: string, input: unknown): Promise<unknown> {
  const provider = await import('@unisane/provider-google/seo');
  const record = recordOf(input);
  const env = recordOf(record.env) as Record<string, string | undefined>;
  if (operation === 'google.seo.fetch-ga4') {
    const args = {
      ...record,
      credentials: record.accessToken
        ? undefined
        : provider.readGoogleAnalyticsDataCredentials(env),
    };
    return provider.fetchGa4PerformanceFile(
      args as Parameters<typeof provider.fetchGa4PerformanceFile>[0],
    );
  }
  if (operation === 'google.seo.fetch-search-console') {
    const args = {
      ...record,
      credentials: record.accessToken
        ? undefined
        : provider.readGoogleSearchConsoleCredentials(env),
    };
    return provider.fetchSearchConsolePerformanceFile(
      args as Parameters<typeof provider.fetchSearchConsolePerformanceFile>[0],
    );
  }
  if (operation === 'google.seo.fetch-keyword-metrics') {
    const args = {
      ...record,
      credentials: provider.readGoogleAdsKeywordPlannerCredentials(env, {
        requireRefreshToken: !record.accessToken,
      }),
    };
    return provider.fetchGoogleAdsKeywordMetricsFile(
      args as Parameters<typeof provider.fetchGoogleAdsKeywordMetricsFile>[0],
    );
  }
  throw new Error(`[GROWTH_GOOGLE_SEO_OPERATION_UNKNOWN] Unsupported operation '${operation}'.`);
}

async function executeGoogleMarketing(operation: string, input: unknown): Promise<unknown> {
  const provider = await import('@unisane/provider-google/marketing');
  const record = recordOf(input);
  switch (operation) {
    case 'google.marketing.discover':
      return provider.discoverMarketingGoogleAccounts(
        record.config as never,
        record.options as never,
      );
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
  if (operation.startsWith('gtm.auth.')) {
    const provider = await import('@unisane/provider-google/gtm-auth');
    switch (operation) {
      case 'gtm.auth.save':
        return provider.saveGoogleTagManagerAuthProfile(input as never);
      case 'gtm.auth.refresh':
        return provider.refreshGoogleTagManagerAccessToken(input as never);
      case 'gtm.auth.status':
        return provider.getGoogleTagManagerAuthStatus(input as never);
      case 'gtm.auth.delete':
        return provider.deleteGoogleTagManagerAuthProfile(input as never);
      case 'gtm.auth.login-command':
        return provider.loginGoogleTagManagerAuthCommand(input as never);
      case 'gtm.auth.status-command':
        return provider.statusGoogleTagManagerAuthCommand(input as never);
      case 'gtm.auth.token-command':
        return provider.tokenGoogleTagManagerAuthCommand(input as never);
      case 'gtm.auth.logout-command':
        return provider.logoutGoogleTagManagerAuthCommand(input as never);
      case 'gtm.auth.resolve-token':
        return provider.resolveGoogleTagManagerAccessToken(input as never);
      default:
        break;
    }
  }

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
  if (operation.startsWith('meta.auth.')) {
    const provider = await import('@unisane/provider-meta');
    switch (operation) {
      case 'meta.auth.save':
        return provider.saveMarketingMetaAuthProfile(input as never);
      case 'meta.auth.status':
        return provider.getMarketingMetaAuthStatus(input as never);
      case 'meta.auth.resolve-token':
        return provider.resolveMarketingMetaAccessToken(input as never);
      case 'meta.auth.delete':
        return provider.deleteMarketingMetaAuthProfile(input as never);
      default:
        break;
    }
  }
  const provider = await import('@unisane/provider-meta/marketing');
  switch (operation) {
    case 'meta.marketing.pull-report':
      return provider.pullMetaAdsReport(input as never);
    case 'meta.marketing.execute-live':
      return provider.executeMetaAdsLiveOperation(input as never);
    case 'meta.marketing.upload-asset':
      return provider.uploadMetaAdsAsset(input as never);
    case 'meta.marketing.discover': {
      const record = recordOf(input);
      return provider.discoverMarketingMetaAccounts(
        record.config as never,
        record.options as never,
      );
    }
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
  if (request.operation.startsWith('google.auth.')) {
    return executeGoogleAuth(request.operation, request.input);
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
