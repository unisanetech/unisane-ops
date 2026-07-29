export const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
export const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
export const DEFAULT_PROFILE = 'default';
export const DEFAULT_AUTH_TIMEOUT_MS = 5 * 60 * 1000;

export type SecretStoreKind = 'keychain' | 'file';
export type GoogleAuthNamespaceName = 'google' | 'marketing';

export type FetchResponseLike = {
  ok: boolean;
  status: number;
  text(): Promise<string>;
};

export type FetchLike = (
  input: string | URL,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string | URLSearchParams;
  },
) => Promise<FetchResponseLike>;

export type GoogleAuthProfile = {
  profile: string;
  clientId: string;
  scopes: readonly string[];
  secretStore: SecretStoreKind;
  createdAt: string;
  updatedAt: string;
};

export type GoogleAuthProfilesDocument = {
  version: 1;
  profiles: Record<string, GoogleAuthProfile>;
};

export type GoogleAuthFileSecretsDocument = {
  version: 1;
  profiles: Record<
    string,
    {
      refreshToken?: string;
      clientSecret?: string;
    }
  >;
};

export type GoogleAuthNamespaceConfig = {
  displayName: string;
  commandName: string;
  errorPrefix: string;
  keychainService: string;
  secretAccountPrefix: string;
  profileEnv: string;
  storeEnv: string;
  authHomeEnv: string;
  allowPlaintextStoreEnv: string;
  authHomeDir: string;
  defaultAccessTokenEnv: string;
  defaultClientSecretEnv: string;
  defaultScopes?: readonly string[];
  authSectionTitle?: string;
  authorizationReceivedMessage?: string;
  authorizationFailedMessage?: string;
  authorizationMissingCodeMessage?: string;
  tokenMissingErrorPrefix?: string;
};

export const GOOGLE_AUTH_NAMESPACE: GoogleAuthNamespaceConfig = {
  displayName: 'Google',
  commandName: 'google auth',
  errorPrefix: 'GOOGLE_AUTH',
  keychainService: 'dev.unisane.google-auth',
  secretAccountPrefix: 'google',
  profileEnv: 'UNISANE_GOOGLE_AUTH_PROFILE',
  storeEnv: 'UNISANE_GOOGLE_AUTH_STORE',
  authHomeEnv: 'UNISANE_GOOGLE_AUTH_HOME',
  allowPlaintextStoreEnv: 'UNISANE_GOOGLE_AUTH_ALLOW_PLAINTEXT_STORE',
  authHomeDir: 'google-auth',
  defaultAccessTokenEnv: 'GOOGLE_ACCESS_TOKEN',
  defaultClientSecretEnv: 'GOOGLE_OAUTH_CLIENT_SECRET',
  authSectionTitle: 'Google OAuth',
  tokenMissingErrorPrefix: 'GOOGLE_ACCESS_TOKEN_MISSING',
};

export const MARKETING_GOOGLE_AUTH_NAMESPACE: GoogleAuthNamespaceConfig = {
  displayName: 'Marketing Google',
  commandName: 'marketing auth',
  errorPrefix: 'MARKETING_AUTH',
  keychainService: 'dev.unisane.marketing-auth',
  secretAccountPrefix: 'marketing-google',
  profileEnv: 'UNISANE_MARKETING_AUTH_PROFILE',
  storeEnv: 'UNISANE_MARKETING_AUTH_STORE',
  authHomeEnv: 'UNISANE_MARKETING_AUTH_HOME',
  allowPlaintextStoreEnv: 'UNISANE_MARKETING_AUTH_ALLOW_PLAINTEXT_STORE',
  authHomeDir: 'marketing-auth',
  defaultAccessTokenEnv: 'GOOGLE_MARKETING_ACCESS_TOKEN',
  defaultClientSecretEnv: 'GOOGLE_OAUTH_CLIENT_SECRET',
  defaultScopes: [
    'https://www.googleapis.com/auth/tagmanager.readonly',
    'https://www.googleapis.com/auth/adwords',
    'https://www.googleapis.com/auth/analytics.readonly',
    'https://www.googleapis.com/auth/webmasters.readonly',
  ],
  authSectionTitle: 'Marketing Google OAuth',
  authorizationFailedMessage:
    'Marketing Google authorization failed. You can close this tab and return to the terminal.',
  authorizationMissingCodeMessage: 'No Marketing Google authorization code was found.',
  authorizationReceivedMessage:
    'Marketing Google authorization received. You can close this tab and return to the terminal.',
  tokenMissingErrorPrefix: 'MARKETING_GOOGLE_ACCESS_TOKEN_MISSING',
};

export type GoogleAuthRuntimeOptions = {
  authHome?: string;
  store?: SecretStoreKind;
  allowPlaintextStore?: boolean;
  fetch?: FetchLike;
  openUrl?: (url: string) => Promise<boolean> | boolean;
  namespace?: GoogleAuthNamespaceConfig;
  authNamespace?: GoogleAuthNamespaceName;
};

export type GoogleAuthCliOptions = GoogleAuthRuntimeOptions & {
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

export type GoogleAccessTokenResult = {
  accessToken: string;
  expiresIn?: number;
  scope?: string;
  tokenType?: string;
};

export type GoogleAuthStatus = {
  ok: boolean;
  profile: string;
  authHome: string;
  configured: boolean;
  clientId?: string;
  scopes: readonly string[];
  secretStore?: SecretStoreKind;
  refreshTokenStored: boolean;
  clientSecretStored: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type TokenResponse = {
  access_token?: unknown;
  expires_in?: unknown;
  refresh_token?: unknown;
  scope?: unknown;
  token_type?: unknown;
  error?: unknown;
  error_description?: unknown;
};

export type SavedSecretProfile = {
  clientId: string;
  clientSecret?: string;
  refreshToken: string;
  scopes: readonly string[];
  secretStore?: SecretStoreKind;
  profile: string;
};

export function authNamespace(options: GoogleAuthRuntimeOptions = {}): GoogleAuthNamespaceConfig {
  return options.namespace ?? resolveGoogleAuthNamespace(options.authNamespace);
}

export function errorCode(options: GoogleAuthRuntimeOptions | undefined, code: string): string {
  return `${authNamespace(options).errorPrefix}_${code}`;
}

export function resolveGoogleAuthNamespace(
  name: GoogleAuthNamespaceName | undefined,
): GoogleAuthNamespaceConfig {
  if (!name || name === 'google') return GOOGLE_AUTH_NAMESPACE;
  if (name === 'marketing') return MARKETING_GOOGLE_AUTH_NAMESPACE;
  throw new Error(
    `[GOOGLE_AUTH_NAMESPACE_INVALID] Google auth namespace must be "google" or "marketing".`,
  );
}

export function normalizeProfileName(
  profile?: string,
  options: GoogleAuthRuntimeOptions = {},
): string {
  const namespace = authNamespace(options);
  const value = (profile ?? process.env[namespace.profileEnv] ?? DEFAULT_PROFILE).trim();
  if (!/^[a-zA-Z0-9._-]+$/.test(value)) {
    throw new Error(
      `[${errorCode(options, 'PROFILE_INVALID')}] Profile names may contain only letters, numbers, ".", "_", and "-".`,
    );
  }
  return value;
}

export function parseStoreKind(
  value: string | undefined,
  options: GoogleAuthRuntimeOptions = {},
): SecretStoreKind {
  const normalized = (value ?? process.env[authNamespace(options).storeEnv] ?? 'keychain')
    .trim()
    .toLowerCase();
  if (normalized === 'keychain' || normalized === 'file') return normalized;
  throw new Error(`[${errorCode(options, 'STORE_INVALID')}] Auth store must be keychain or file.`);
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
