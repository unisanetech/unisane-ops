import {
  MARKETING_GOOGLE_ADS_SCOPE,
  MARKETING_GOOGLE_ANALYTICS_SCOPE,
  MARKETING_GOOGLE_SEARCH_CONSOLE_SCOPE,
  MARKETING_GOOGLE_TAG_MANAGER_SCOPE,
} from '@unisane/growth/marketing';
import { loadGrowthProjectContext, selectGrowthEnvironment } from '../cli/project-context.js';

export async function resolveGrowthConsoleAuthContext() {
  const context = await loadGrowthProjectContext();
  const environment = context.growth.environments[selectGrowthEnvironment(context)]!;
  const connectionId = environment.connections.google;
  const serviceScopes = new Map([
    ['ads', MARKETING_GOOGLE_ADS_SCOPE],
    ['analytics', MARKETING_GOOGLE_ANALYTICS_SCOPE],
    ['search-console', MARKETING_GOOGLE_SEARCH_CONSOLE_SCOPE],
    ['tag-manager', MARKETING_GOOGLE_TAG_MANAGER_SCOPE],
  ]);
  const googleAuth = {
    connectionId: connectionId ?? 'google',
    connected: Boolean(connectionId),
    scopes: environment.resources.flatMap((resource) => {
      const scope = serviceScopes.get(resource.service);
      return scope ? [scope] : [];
    }),
    credentialAvailable: Boolean(connectionId),
  };
  const metaConnectionId = environment.connections.meta;
  const metaAuth = {
    ok: false,
    connectionId: metaConnectionId ?? 'meta',
    connected: Boolean(metaConnectionId),
    scopes: [],
    credentialAvailable: false,
  };
  return { googleAuth, metaAuth };
}
