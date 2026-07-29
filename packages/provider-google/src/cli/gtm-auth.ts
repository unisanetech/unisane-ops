import {
  deleteGoogleAuthProfile,
  googleAuthEnvEntries,
  googleAuthStatusToControlPlaneProfile,
  getGoogleAuthStatus,
  loginGoogleAuthCommand,
  logoutGoogleAuthCommand,
  refreshGoogleAccessToken,
  resolveGoogleAccessToken,
  saveGoogleAuthProfile,
  statusGoogleAuthCommand,
  tokenGoogleAuthCommand,
  type GoogleAccessTokenResult,
  type GoogleAuthCliOptions,
  type GoogleAuthNamespaceConfig,
  type GoogleAuthRuntimeOptions,
  type GoogleAuthStatus,
} from '../index.js';
import type { ControlPlaneAuthProfile, ControlPlaneEnvEntry } from '@unisane/ops-engine';

export const GOOGLE_TAG_MANAGER_PUBLISH_SCOPE =
  'https://www.googleapis.com/auth/tagmanager.publish';

export const GOOGLE_TAG_MANAGER_AUTH_SCOPES = [
  'https://www.googleapis.com/auth/tagmanager.readonly',
  'https://www.googleapis.com/auth/tagmanager.edit.containers',
  'https://www.googleapis.com/auth/tagmanager.edit.containerversions',
  GOOGLE_TAG_MANAGER_PUBLISH_SCOPE,
] as const;

const GOOGLE_TAG_MANAGER_AUTH_NAMESPACE: GoogleAuthNamespaceConfig = {
  displayName: 'Google Tag Manager',
  commandName: 'gtm auth',
  errorPrefix: 'GTM_AUTH',
  keychainService: 'dev.unisane.gtm-auth',
  secretAccountPrefix: 'gtm',
  profileEnv: 'UNISANE_GTM_AUTH_PROFILE',
  storeEnv: 'UNISANE_GTM_AUTH_STORE',
  authHomeEnv: 'UNISANE_GTM_AUTH_HOME',
  allowPlaintextStoreEnv: 'UNISANE_GTM_AUTH_ALLOW_PLAINTEXT_STORE',
  authHomeDir: 'gtm-auth',
  defaultAccessTokenEnv: 'GOOGLE_TAG_MANAGER_ACCESS_TOKEN',
  defaultClientSecretEnv: 'GOOGLE_OAUTH_CLIENT_SECRET',
  defaultScopes: GOOGLE_TAG_MANAGER_AUTH_SCOPES,
  authSectionTitle: 'Google Tag Manager OAuth',
  authorizationFailedMessage:
    'Google Tag Manager authorization failed. You can close this tab and return to the terminal.',
  authorizationMissingCodeMessage: 'No Google Tag Manager authorization code was found.',
  authorizationReceivedMessage:
    'Google Tag Manager authorization received. You can close this tab and return to the terminal.',
  tokenMissingErrorPrefix: 'GTM_ACCESS_TOKEN_MISSING',
};

export type GoogleTagManagerAuthRuntimeOptions = GoogleAuthRuntimeOptions;
export type GoogleTagManagerAuthCliOptions = GoogleAuthCliOptions;
export type GoogleTagManagerAccessTokenResult = GoogleAccessTokenResult;
export type GoogleTagManagerAuthStatus = GoogleAuthStatus;

export function googleTagManagerAuthStatusToControlPlaneProfile(args: {
  status: GoogleTagManagerAuthStatus;
  requiredScopes?: readonly string[];
}): ControlPlaneAuthProfile {
  return googleAuthStatusToControlPlaneProfile({
    provider: 'gtm',
    status: args.status,
    requiredScopes: args.requiredScopes ?? GOOGLE_TAG_MANAGER_AUTH_SCOPES,
  });
}

export function googleTagManagerAuthEnvEntries(
  args: {
    env?: Record<string, string | undefined>;
  } = {},
): ControlPlaneEnvEntry[] {
  return googleAuthEnvEntries({
    runtime: withGtmAuthNamespace({}),
    env: args.env,
  });
}

function withGtmAuthNamespace(
  runtime: GoogleTagManagerAuthCliOptions,
): GoogleTagManagerAuthCliOptions & { namespace: GoogleAuthNamespaceConfig };
function withGtmAuthNamespace(
  runtime?: GoogleAuthRuntimeOptions,
): GoogleAuthRuntimeOptions & { namespace: GoogleAuthNamespaceConfig };
function withGtmAuthNamespace(
  runtime?: GoogleAuthRuntimeOptions,
): GoogleAuthRuntimeOptions & { namespace: GoogleAuthNamespaceConfig } {
  const namespaced: GoogleAuthRuntimeOptions & { namespace: GoogleAuthNamespaceConfig } = {
    ...(runtime ?? {}),
    namespace: GOOGLE_TAG_MANAGER_AUTH_NAMESPACE,
  };
  return namespaced;
}

export async function saveGoogleTagManagerAuthProfile(
  args: Parameters<typeof saveGoogleAuthProfile>[0],
): Promise<void> {
  await saveGoogleAuthProfile({
    ...args,
    runtime: withGtmAuthNamespace(args.runtime),
  });
}

export async function refreshGoogleTagManagerAccessToken(args: {
  profile?: string;
  requiredScope?: string;
  runtime?: GoogleTagManagerAuthRuntimeOptions;
}): Promise<GoogleTagManagerAccessTokenResult> {
  return refreshGoogleAccessToken({
    ...args,
    runtime: withGtmAuthNamespace(args.runtime),
  });
}

export async function getGoogleTagManagerAuthStatus(
  args: {
    profile?: string;
    runtime?: GoogleTagManagerAuthRuntimeOptions;
  } = {},
): Promise<GoogleTagManagerAuthStatus> {
  return getGoogleAuthStatus({
    ...args,
    runtime: withGtmAuthNamespace(args.runtime),
  });
}

export async function deleteGoogleTagManagerAuthProfile(
  args: {
    profile?: string;
    runtime?: GoogleTagManagerAuthRuntimeOptions;
  } = {},
): Promise<void> {
  await deleteGoogleAuthProfile({
    ...args,
    runtime: withGtmAuthNamespace(args.runtime),
  });
}

export async function loginGoogleTagManagerAuthCommand(
  options: GoogleTagManagerAuthCliOptions,
): Promise<number> {
  return loginGoogleAuthCommand(withGtmAuthNamespace(options));
}

export async function statusGoogleTagManagerAuthCommand(
  options: GoogleTagManagerAuthCliOptions,
): Promise<number> {
  const namespaced = withGtmAuthNamespace(options);
  if (!options.json) {
    return statusGoogleAuthCommand(namespaced);
  }
  const status = await getGoogleAuthStatus({ profile: options.profile, runtime: namespaced });
  console.log(
    JSON.stringify(
      {
        ...status,
        controlPlane: {
          authProfile: googleTagManagerAuthStatusToControlPlaneProfile({ status }),
          envEntries: googleTagManagerAuthEnvEntries({ env: process.env }),
        },
      },
      null,
      2,
    ),
  );
  return status.configured && status.refreshTokenStored ? 0 : 1;
}

export async function tokenGoogleTagManagerAuthCommand(
  options: GoogleTagManagerAuthCliOptions,
): Promise<number> {
  return tokenGoogleAuthCommand(withGtmAuthNamespace(options));
}

export async function logoutGoogleTagManagerAuthCommand(
  options: GoogleTagManagerAuthCliOptions,
): Promise<number> {
  return logoutGoogleAuthCommand(withGtmAuthNamespace(options));
}

export async function resolveGoogleTagManagerAccessToken(args: {
  accessTokenEnv?: string;
  authProfile?: string;
  requiredScope: string;
  runtime?: GoogleTagManagerAuthRuntimeOptions;
}): Promise<string> {
  return resolveGoogleAccessToken({
    ...args,
    runtime: withGtmAuthNamespace(args.runtime),
  });
}
