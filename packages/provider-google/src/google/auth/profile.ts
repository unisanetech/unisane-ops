import { authHome, getProfile, readSecret } from './store.js';
import { assertRequiredScope, refreshAccessToken } from './oauth.js';
import {
  authNamespace,
  errorCode,
  normalizeProfileName,
  type GoogleAccessTokenResult,
  type GoogleAuthRuntimeOptions,
  type GoogleAuthStatus,
  type SavedSecretProfile,
} from './types.js';
export { deleteGoogleAuthProfile, saveGoogleAuthProfile } from './store.js';

function resolveProfileSecrets(args: {
  profile: string;
  runtime?: GoogleAuthRuntimeOptions;
}): SavedSecretProfile {
  const metadata = getProfile(args.profile, args.runtime);
  if (!metadata) {
    const namespace = authNamespace(args.runtime);
    throw new Error(
      `[${errorCode(args.runtime, 'PROFILE_MISSING')}] ${namespace.displayName} auth profile '${args.profile}' is not configured. Run ${namespace.commandName} login first.`,
    );
  }
  const refreshToken = readSecret({
    profile: args.profile,
    field: 'refresh_token',
    store: metadata.secretStore,
    runtime: args.runtime,
  });
  if (!refreshToken) {
    throw new Error(
      `[${errorCode(args.runtime, 'REFRESH_TOKEN_MISSING')}] ${authNamespace(args.runtime).displayName} auth profile '${args.profile}' has no stored refresh token.`,
    );
  }
  return {
    clientId: metadata.clientId,
    clientSecret: readSecret({
      profile: args.profile,
      field: 'client_secret',
      store: metadata.secretStore,
      runtime: args.runtime,
    }),
    refreshToken,
    scopes: metadata.scopes,
    secretStore: metadata.secretStore,
    profile: metadata.profile,
  };
}

export async function refreshGoogleAccessToken(args: {
  profile?: string;
  requiredScope?: string;
  runtime?: GoogleAuthRuntimeOptions;
}): Promise<GoogleAccessTokenResult> {
  const profile = normalizeProfileName(args.profile, args.runtime);
  const secrets = resolveProfileSecrets({ profile, runtime: args.runtime });
  const token = await refreshAccessToken({
    clientId: secrets.clientId,
    clientSecret: secrets.clientSecret,
    refreshToken: secrets.refreshToken,
    runtime: args.runtime,
  });
  if (args.requiredScope) {
    assertRequiredScope({
      grantedScope: token.scope,
      profileScopes: secrets.scopes,
      requiredScope: args.requiredScope,
      runtime: args.runtime,
    });
  }
  return token;
}

export async function resolveGoogleAccessToken(args: {
  accessTokenEnv?: string;
  authProfile?: string;
  requiredScope: string;
  runtime?: GoogleAuthRuntimeOptions;
}): Promise<string> {
  const namespace = authNamespace(args.runtime);
  const envName = args.accessTokenEnv ?? namespace.defaultAccessTokenEnv;
  const token = process.env[envName]?.trim();
  if (token) return token;
  try {
    const result = await refreshGoogleAccessToken({
      profile: args.authProfile,
      requiredScope: args.requiredScope,
      runtime: args.runtime,
    });
    return result.accessToken;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown auth error';
    throw new Error(
      `[${namespace.tokenMissingErrorPrefix ?? `${namespace.errorPrefix}_ACCESS_TOKEN_MISSING`}] Set ${envName} or run ${namespace.commandName} login --profile <name> --scopes <scope>. Profile auth failed: ${message}`,
    );
  }
}

export async function getGoogleAuthStatus(
  args: {
    profile?: string;
    runtime?: GoogleAuthRuntimeOptions;
  } = {},
): Promise<GoogleAuthStatus> {
  const profile = normalizeProfileName(args.profile, args.runtime);
  const metadata = getProfile(profile, args.runtime);
  if (!metadata) {
    return {
      ok: false,
      profile,
      authHome: authHome(args.runtime),
      configured: false,
      scopes: [],
      refreshTokenStored: false,
      clientSecretStored: false,
    };
  }
  const refreshTokenStored = Boolean(
    readSecret({
      profile,
      field: 'refresh_token',
      store: metadata.secretStore,
      runtime: args.runtime,
    }),
  );
  return {
    ok: refreshTokenStored,
    profile,
    authHome: authHome(args.runtime),
    configured: true,
    clientId: metadata.clientId,
    scopes: metadata.scopes,
    secretStore: metadata.secretStore,
    refreshTokenStored,
    clientSecretStored: Boolean(
      readSecret({
        profile,
        field: 'client_secret',
        store: metadata.secretStore,
        runtime: args.runtime,
      }),
    ),
    createdAt: metadata.createdAt,
    updatedAt: metadata.updatedAt,
  };
}
