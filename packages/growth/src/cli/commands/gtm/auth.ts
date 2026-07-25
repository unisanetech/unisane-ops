import {
  createControlPlaneAuthProfile,
  publicControlPlaneEnvEntry,
  type ControlPlaneAuthProfile,
  type ControlPlaneEnvEntry,
} from '@unisane/ops-engine';
import { executeGrowthProviderCommand } from '../../provider-runtime.js';

export const GOOGLE_TAG_MANAGER_PUBLISH_SCOPE =
  'https://www.googleapis.com/auth/tagmanager.publish';

export const GOOGLE_TAG_MANAGER_AUTH_SCOPES = [
  'https://www.googleapis.com/auth/tagmanager.readonly',
  'https://www.googleapis.com/auth/tagmanager.edit.containers',
  'https://www.googleapis.com/auth/tagmanager.edit.containerversions',
  GOOGLE_TAG_MANAGER_PUBLISH_SCOPE,
] as const;

export type GoogleTagManagerAuthRuntimeOptions = {
  authHome?: string;
  store?: 'keychain' | 'file';
  allowPlaintextStore?: boolean;
};

export type GoogleTagManagerAuthCliOptions = GoogleTagManagerAuthRuntimeOptions & {
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

export type GoogleTagManagerAccessTokenResult = {
  accessToken: string;
  expiresIn?: number;
  scope?: string;
  tokenType?: string;
};

export type GoogleTagManagerAuthStatus = {
  ok: boolean;
  profile: string;
  authHome: string;
  configured: boolean;
  clientId?: string;
  scopes: readonly string[];
  secretStore?: 'keychain' | 'file';
  refreshTokenStored: boolean;
  clientSecretStored: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export function googleTagManagerAuthStatusToControlPlaneProfile(args: {
  status: GoogleTagManagerAuthStatus;
  requiredScopes?: readonly string[];
}): ControlPlaneAuthProfile {
  return createControlPlaneAuthProfile({
    provider: 'gtm',
    profile: args.status.profile,
    configured: args.status.configured,
    credentialStored: args.status.refreshTokenStored,
    scopes: args.status.scopes,
    requiredScopes: args.requiredScopes ?? GOOGLE_TAG_MANAGER_AUTH_SCOPES,
    secretStore: args.status.secretStore,
    missingMessage: 'Google Tag Manager OAuth profile is not ready.',
  });
}

export function googleTagManagerAuthEnvEntries(
  args: { env?: Record<string, string | undefined> } = {},
): ControlPlaneEnvEntry[] {
  const env = args.env ?? process.env;
  return [
    publicControlPlaneEnvEntry({
      name: 'GOOGLE_TAG_MANAGER_ACCESS_TOKEN',
      kind: 'fallback-debug',
      required: false,
      secret: true,
      value: env.GOOGLE_TAG_MANAGER_ACCESS_TOKEN,
      description: 'One-time or troubleshooting GTM access-token fallback.',
      example: '<SECRET>',
    }),
    publicControlPlaneEnvEntry({
      name: 'UNISANE_GTM_AUTH_PROFILE',
      kind: 'local-devtool-config',
      required: false,
      secret: false,
      value: env.UNISANE_GTM_AUTH_PROFILE,
      description: 'Optional saved GTM OAuth profile override.',
      example: 'my-app',
    }),
  ];
}

export function saveGoogleTagManagerAuthProfile(input: unknown): Promise<void> {
  return executeGrowthProviderCommand('gtm.auth.save', input);
}

export function refreshGoogleTagManagerAccessToken(
  input: unknown,
): Promise<GoogleTagManagerAccessTokenResult> {
  return executeGrowthProviderCommand('gtm.auth.refresh', input);
}

export function getGoogleTagManagerAuthStatus(
  input: unknown = {},
): Promise<GoogleTagManagerAuthStatus> {
  return executeGrowthProviderCommand('gtm.auth.status', input);
}

export function deleteGoogleTagManagerAuthProfile(input: unknown = {}): Promise<void> {
  return executeGrowthProviderCommand('gtm.auth.delete', input);
}

export function loginGoogleTagManagerAuthCommand(
  input: GoogleTagManagerAuthCliOptions,
): Promise<number> {
  return executeGrowthProviderCommand('gtm.auth.login-command', input);
}

export function statusGoogleTagManagerAuthCommand(
  input: GoogleTagManagerAuthCliOptions,
): Promise<number> {
  return executeGrowthProviderCommand('gtm.auth.status-command', input);
}

export function tokenGoogleTagManagerAuthCommand(
  input: GoogleTagManagerAuthCliOptions,
): Promise<number> {
  return executeGrowthProviderCommand('gtm.auth.token-command', input);
}

export function logoutGoogleTagManagerAuthCommand(
  input: GoogleTagManagerAuthCliOptions,
): Promise<number> {
  return executeGrowthProviderCommand('gtm.auth.logout-command', input);
}

export function resolveGoogleTagManagerAccessToken(input: {
  accessTokenEnv?: string;
  authProfile?: string;
  requiredScope: string;
  runtime?: GoogleTagManagerAuthRuntimeOptions;
}): Promise<string> {
  return executeGrowthProviderCommand('gtm.auth.resolve-token', input);
}
