import {
  createControlPlaneAuthProfile,
  publicControlPlaneEnvEntry,
  type ControlPlaneAuthProfile,
  type ControlPlaneEnvEntry,
} from '@unisane/ops-engine';
import { authNamespace, type GoogleAuthRuntimeOptions, type GoogleAuthStatus } from './types.js';

export function googleAuthStatusToControlPlaneProfile(args: {
  provider: string;
  status: GoogleAuthStatus;
  requiredScopes?: readonly string[];
}): ControlPlaneAuthProfile {
  return createControlPlaneAuthProfile({
    provider: args.provider,
    profile: args.status.profile,
    configured: args.status.configured,
    credentialStored: args.status.refreshTokenStored,
    scopes: args.status.scopes,
    requiredScopes: args.requiredScopes,
    secretStore: args.status.secretStore,
    missingMessage: `${args.provider} auth profile is not ready. Run the matching auth login command or use the documented fallback access-token env only for debugging.`,
  });
}

export function googleAuthEnvEntries(
  args: {
    runtime?: GoogleAuthRuntimeOptions;
    env?: Record<string, string | undefined>;
  } = {},
): ControlPlaneEnvEntry[] {
  const namespace = authNamespace(args.runtime);
  const env = args.env ?? process.env;
  const entries: ControlPlaneEnvEntry[] = [
    publicControlPlaneEnvEntry({
      name: 'GOOGLE_OAUTH_CLIENT_ID',
      kind: 'bootstrap-local-secret',
      required: true,
      secret: false,
      value: env.GOOGLE_OAUTH_CLIENT_ID ?? env.GOOGLE_CLIENT_ID,
      description: 'Shared Google OAuth client id for local devtool login.',
      example: '<google-oauth-client-id>',
    }),
    publicControlPlaneEnvEntry({
      name: namespace.defaultClientSecretEnv,
      kind: 'bootstrap-local-secret',
      required: false,
      secret: true,
      value: env[namespace.defaultClientSecretEnv],
      description:
        'Shared Google OAuth client secret for confidential clients. Desktop OAuth clients may not need this.',
      example: '<SECRET>',
    }),
    publicControlPlaneEnvEntry({
      name: namespace.profileEnv,
      kind: 'local-devtool-config',
      required: false,
      secret: false,
      value: env[namespace.profileEnv],
      description:
        'Optional saved auth profile override. Defaults should normally come from app id.',
      example: 'true-resume',
    }),
    publicControlPlaneEnvEntry({
      name: namespace.defaultAccessTokenEnv,
      kind: 'fallback-debug',
      required: false,
      secret: true,
      value: env[namespace.defaultAccessTokenEnv],
      description:
        'Fallback raw access token for debugging only. Normal setup should use saved auth profiles.',
      example: '<SECRET>',
    }),
  ];
  for (const fallback of namespace.fallbackClientSecretEnvs ?? []) {
    if (fallback === namespace.defaultClientSecretEnv) continue;
    entries.push(
      publicControlPlaneEnvEntry({
        name: fallback,
        kind: 'fallback-debug',
        required: false,
        secret: true,
        value: env[fallback],
        description:
          'Compatibility fallback for older Google OAuth secret setup. Prefer GOOGLE_OAUTH_CLIENT_SECRET.',
        example: '<SECRET>',
      }),
    );
  }
  return entries;
}
