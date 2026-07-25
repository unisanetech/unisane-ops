import {
  createControlPlaneAuthProfile,
  publicControlPlaneEnvEntry,
  type ControlPlaneAuthProfile,
  type ControlPlaneEnvEntry,
} from '@unisane/ops-engine';
import {
  type MarketingGoogleAuthProfileStatus,
  MARKETING_GOOGLE_ADS_SCOPE,
  MARKETING_GOOGLE_ANALYTICS_SCOPE,
  MARKETING_GOOGLE_AUTH_SCOPES,
  MARKETING_GOOGLE_SEARCH_CONSOLE_SCOPE,
  MARKETING_GOOGLE_TAG_MANAGER_SCOPE,
} from '@unisane/growth/marketing';
import { executeGrowthProviderCommand } from '../../../provider-runtime.js';

export {
  MARKETING_GOOGLE_ADS_SCOPE,
  MARKETING_GOOGLE_ANALYTICS_SCOPE,
  MARKETING_GOOGLE_AUTH_SCOPES,
  MARKETING_GOOGLE_SEARCH_CONSOLE_SCOPE,
  MARKETING_GOOGLE_TAG_MANAGER_SCOPE,
};

export type MarketingGoogleAuthRuntimeOptions = {
  authHome?: string;
  store?: 'keychain' | 'file';
  allowPlaintextStore?: boolean;
  fetch?: typeof fetch;
  openUrl?: (url: string) => Promise<boolean> | boolean;
};

export type MarketingGoogleAuthCliOptions = MarketingGoogleAuthRuntimeOptions & {
  profile?: string;
  cwd?: string;
  clientId?: string;
  clientSecretEnv?: string;
  scopes?: string;
  port?: string;
  timeoutMs?: string;
  requiredScope?: string;
  print?: boolean;
  json?: boolean;
};

export type MarketingGoogleAccessTokenResult = {
  accessToken: string;
  expiresIn?: number;
  scope?: string;
  tokenType?: string;
};

export type MarketingGoogleAuthStatus = MarketingGoogleAuthProfileStatus & {
  ok: boolean;
  authHome: string;
  clientId?: string;
  secretStore?: 'keychain' | 'file';
  createdAt?: string;
  updatedAt?: string;
};

export function marketingGoogleAuthStatusToControlPlaneProfile(args: {
  status: MarketingGoogleAuthStatus;
  requiredScopes?: readonly string[];
}): ControlPlaneAuthProfile {
  return createControlPlaneAuthProfile({
    provider: 'google',
    profile: args.status.profile,
    configured: args.status.configured,
    credentialStored: args.status.refreshTokenStored,
    scopes: args.status.scopes,
    requiredScopes: args.requiredScopes,
    secretStore: args.status.secretStore,
    missingMessage:
      'Google auth is not ready. Login once and keep raw access-token env values as fallback only.',
  });
}

export function marketingGoogleAuthEnvEntries(
  args: { env?: Record<string, string | undefined> } = {},
): ControlPlaneEnvEntry[] {
  const env = args.env ?? process.env;
  return [
    publicControlPlaneEnvEntry({
      name: 'GOOGLE_MARKETING_ACCESS_TOKEN',
      kind: 'fallback-debug',
      required: false,
      secret: true,
      value: env.GOOGLE_MARKETING_ACCESS_TOKEN,
      description: 'Optional short-lived access-token fallback for local troubleshooting.',
      example: '<SECRET>',
    }),
    publicControlPlaneEnvEntry({
      name: 'UNISANE_MARKETING_AUTH_PROFILE',
      kind: 'local-devtool-config',
      required: false,
      secret: false,
      value: env.UNISANE_MARKETING_AUTH_PROFILE,
      description: 'Optional saved Marketing Google auth profile override.',
      example: 'default',
    }),
  ];
}

export async function saveMarketingGoogleAuthProfile(args: {
  profile: string;
  clientId: string;
  clientSecret?: string;
  refreshToken: string;
  scopes: readonly string[];
  secretStore?: 'keychain' | 'file';
  runtime?: MarketingGoogleAuthRuntimeOptions;
}): Promise<void> {
  await executeGrowthProviderCommand('google.auth.save', args);
}

export function refreshMarketingGoogleAccessToken(args: {
  profile?: string;
  requiredScope?: string;
  runtime?: MarketingGoogleAuthRuntimeOptions;
}): Promise<MarketingGoogleAccessTokenResult> {
  return executeGrowthProviderCommand('google.auth.refresh', args);
}

export function getMarketingGoogleAuthStatus(
  args: { profile?: string; runtime?: MarketingGoogleAuthRuntimeOptions } = {},
): Promise<MarketingGoogleAuthStatus> {
  return executeGrowthProviderCommand('google.auth.status', args);
}

export async function deleteMarketingGoogleAuthProfile(
  args: { profile?: string; runtime?: MarketingGoogleAuthRuntimeOptions } = {},
): Promise<void> {
  await executeGrowthProviderCommand('google.auth.delete', args);
}

export function loginMarketingGoogleAuthCommand(
  options: MarketingGoogleAuthCliOptions,
): Promise<number> {
  return executeGrowthProviderCommand('google.auth.login', options);
}

export function statusMarketingGoogleAuthCommand(
  options: MarketingGoogleAuthCliOptions,
): Promise<number> {
  return executeGrowthProviderCommand('google.auth.status-command', options);
}

export function tokenMarketingGoogleAuthCommand(
  options: MarketingGoogleAuthCliOptions,
): Promise<number> {
  return executeGrowthProviderCommand('google.auth.token-command', options);
}

export function logoutMarketingGoogleAuthCommand(
  options: MarketingGoogleAuthCliOptions,
): Promise<number> {
  return executeGrowthProviderCommand('google.auth.logout-command', options);
}

export function resolveMarketingGoogleAccessToken(args: {
  accessTokenEnv?: string;
  authProfile?: string;
  requiredScope: string;
  runtime?: MarketingGoogleAuthRuntimeOptions;
}): Promise<string> {
  return executeGrowthProviderCommand('google.auth.resolve-token', args);
}
