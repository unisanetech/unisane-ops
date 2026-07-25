import type { GrowthProviderCommandOperation } from '../provider-runtime.js';

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

export async function executeGrowthTestProviderCommand(
  operation: GrowthProviderCommandOperation,
  input: unknown,
): Promise<unknown> {
  const record = recordOf(input);
  if (operation.startsWith('google.auth.')) {
    const provider = await import('@unisane/provider-google');
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
      case 'google.auth.resolve-token':
        return provider.resolveGoogleAccessToken({
          ...record,
          runtime: marketingGoogleRuntime(input),
        } as Parameters<typeof provider.resolveGoogleAccessToken>[0]);
    }
  }
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
    }
  }
  throw new Error(`[GROWTH_TEST_PROVIDER_OPERATION_UNKNOWN] Unsupported operation '${operation}'.`);
}
