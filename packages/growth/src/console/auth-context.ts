import {
  MARKETING_GOOGLE_ADS_SCOPE,
  MARKETING_GOOGLE_ANALYTICS_SCOPE,
  MARKETING_GOOGLE_SEARCH_CONSOLE_SCOPE,
  MARKETING_GOOGLE_TAG_MANAGER_SCOPE,
} from '@unisane/growth/marketing';
import { loadGrowthConnectionsContext } from '../cli/project-context.js';

export async function resolveGrowthConsoleAuthContext(environmentId?: string) {
  const context = await loadGrowthConnectionsContext(environmentId);
  const connection = context.providers.find(
    (provider) => provider.provider === 'google',
  )?.connection;
  const serviceScopes = new Map([
    ['ads', MARKETING_GOOGLE_ADS_SCOPE],
    ['analytics', MARKETING_GOOGLE_ANALYTICS_SCOPE],
    ['search-console', MARKETING_GOOGLE_SEARCH_CONSOLE_SCOPE],
    ['tag-manager', MARKETING_GOOGLE_TAG_MANAGER_SCOPE],
  ]);
  const googleAuth = {
    connectionId: connection?.id ?? 'google',
    connected: Boolean(connection),
    scopes: (connection?.grants ?? []).flatMap((grant) => {
      const scope = grant.state === 'granted' ? serviceScopes.get(grant.service) : undefined;
      return scope ? [scope] : [];
    }),
    credentialAvailable: connection?.credentialState === 'active',
  };
  const metaAuth = {
    ok: false,
    connectionId: 'meta',
    connected: false,
    scopes: [],
    credentialAvailable: false,
  };
  return { googleAuth, metaAuth, environmentId: context.environmentId };
}
