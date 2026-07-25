import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import {
  createControlPlaneAuthProfile,
  publicControlPlaneEnvEntry,
  type ControlPlaneAuthProfile,
  type ControlPlaneEnvEntry,
} from '@unisane/ops-engine';
import type { MarketingMetaAuthProfileStatus } from '@unisane/growth/contracts';

export type MetaSecretStoreKind = 'keychain' | 'file';

const DEFAULT_PROFILE = 'default';
const DEFAULT_AUTH_HOME_DIR = 'marketing-meta-auth';
const KEYCHAIN_SERVICE = 'dev.unisane.marketing-meta-auth';
const SECRET_ACCOUNT_PREFIX = 'marketing-meta';
const PROFILE_ENV = 'UNISANE_MARKETING_META_AUTH_PROFILE';
const STORE_ENV = 'UNISANE_MARKETING_META_AUTH_STORE';
const AUTH_HOME_ENV = 'UNISANE_MARKETING_META_AUTH_HOME';
const ALLOW_PLAINTEXT_ENV = 'UNISANE_MARKETING_META_AUTH_ALLOW_PLAINTEXT_STORE';
const DEFAULT_ACCESS_TOKEN_ENV = 'META_ADS_ACCESS_TOKEN';

type MetaAuthProfile = {
  profile: string;
  scopes: readonly string[];
  secretStore: MetaSecretStoreKind;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
};

type MetaAuthProfilesDocument = {
  version: 1;
  profiles: Record<string, MetaAuthProfile>;
};

type MetaAuthFileSecretsDocument = {
  version: 1;
  profiles: Record<string, { accessToken?: string }>;
};

function metaAuthReady(
  status?: MarketingMetaAuthProfileStatus,
): status is MarketingMetaAuthProfileStatus & { configured: true } {
  if (!status?.configured || !status.accessTokenStored) return false;
  if (!status.expiresAt) return true;
  return Date.parse(status.expiresAt) > Date.now();
}

export type MarketingMetaAuthRuntimeOptions = {
  authHome?: string;
  store?: MetaSecretStoreKind;
  allowPlaintextStore?: boolean;
};

export function marketingMetaAuthStatusToControlPlaneProfile(args: {
  status: MarketingMetaAuthProfileStatus;
  requiredScopes?: readonly string[];
}): ControlPlaneAuthProfile {
  return createControlPlaneAuthProfile({
    provider: 'meta',
    profile: args.status.profile,
    configured: args.status.configured,
    credentialStored: args.status.accessTokenStored,
    scopes: args.status.scopes,
    requiredScopes: args.requiredScopes,
    expiresAt: args.status.expiresAt,
    secretStore: args.status.secretStore,
    expired: args.status.configured && !metaAuthReady(args.status),
    missingMessage:
      'Meta token profile is not ready. Save a token profile once, and keep raw token env as one-time input or fallback only.',
  });
}

export function marketingMetaAuthEnvEntries(
  args: {
    env?: Record<string, string | undefined>;
  } = {},
): ControlPlaneEnvEntry[] {
  const env = args.env ?? process.env;
  return [
    publicControlPlaneEnvEntry({
      name: DEFAULT_ACCESS_TOKEN_ENV,
      kind: 'fallback-debug',
      required: false,
      secret: true,
      value: env[DEFAULT_ACCESS_TOKEN_ENV],
      description:
        'One-time input or fallback Meta access token. Normal setup stores it in the local secret store.',
      example: '<SECRET>',
    }),
    publicControlPlaneEnvEntry({
      name: PROFILE_ENV,
      kind: 'local-devtool-config',
      required: false,
      secret: false,
      value: env[PROFILE_ENV],
      description:
        'Optional saved Meta token profile override. Defaults should normally come from app id.',
      example: 'true-resume',
    }),
  ];
}

function normalizeProfileName(profile?: string): string {
  const value = (profile ?? process.env[PROFILE_ENV] ?? DEFAULT_PROFILE).trim();
  if (!/^[a-zA-Z0-9._-]+$/.test(value)) {
    throw new Error(
      '[MARKETING_META_AUTH_PROFILE_INVALID] Profile names may contain only letters, numbers, ".", "_", and "-".',
    );
  }
  return value;
}

function authHome(options: MarketingMetaAuthRuntimeOptions = {}): string {
  return path.resolve(
    options.authHome ??
      process.env[AUTH_HOME_ENV] ??
      path.join(homedir(), '.unisane', DEFAULT_AUTH_HOME_DIR),
  );
}

function profilesPath(options: MarketingMetaAuthRuntimeOptions = {}): string {
  return path.join(authHome(options), 'profiles.json');
}

function fileSecretsPath(options: MarketingMetaAuthRuntimeOptions = {}): string {
  return path.join(authHome(options), 'secrets.json');
}

function parseStoreKind(value: string | undefined): MetaSecretStoreKind {
  const normalized = (value ?? process.env[STORE_ENV] ?? 'keychain').trim().toLowerCase();
  if (normalized === 'keychain' || normalized === 'file') return normalized;
  throw new Error('[MARKETING_META_AUTH_STORE_INVALID] Auth store must be keychain or file.');
}

function assertPlaintextStoreAllowed(options: MarketingMetaAuthRuntimeOptions = {}): void {
  if (options.allowPlaintextStore || process.env[ALLOW_PLAINTEXT_ENV] === '1') return;
  throw new Error(
    `[MARKETING_META_AUTH_PLAINTEXT_STORE_BLOCKED] Refusing to store Meta access tokens in files. Use keychain store, or explicitly set ${ALLOW_PLAINTEXT_ENV}=1 for controlled CI/test environments.`,
  );
}

function ensureAuthHome(options: MarketingMetaAuthRuntimeOptions = {}): void {
  mkdirSync(authHome(options), { recursive: true, mode: 0o700 });
}

function writePrivateJson(filePath: string, value: unknown): void {
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  try {
    chmodSync(filePath, 0o600);
  } catch {
    // Best effort on non-POSIX filesystems.
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readProfiles(options: MarketingMetaAuthRuntimeOptions = {}): MetaAuthProfilesDocument {
  const filePath = profilesPath(options);
  if (!existsSync(filePath)) return { version: 1, profiles: {} };
  const parsed = JSON.parse(readFileSync(filePath, 'utf8')) as unknown;
  if (!isRecord(parsed) || parsed.version !== 1 || !isRecord(parsed.profiles)) {
    throw new Error(
      `[MARKETING_META_AUTH_PROFILES_INVALID] Invalid Meta auth profile file at ${filePath}.`,
    );
  }
  return parsed as MetaAuthProfilesDocument;
}

function writeProfiles(
  document: MetaAuthProfilesDocument,
  options: MarketingMetaAuthRuntimeOptions = {},
): void {
  ensureAuthHome(options);
  writePrivateJson(profilesPath(options), document);
}

function readFileSecrets(
  options: MarketingMetaAuthRuntimeOptions = {},
): MetaAuthFileSecretsDocument {
  const filePath = fileSecretsPath(options);
  if (!existsSync(filePath)) return { version: 1, profiles: {} };
  const parsed = JSON.parse(readFileSync(filePath, 'utf8')) as unknown;
  if (!isRecord(parsed) || parsed.version !== 1 || !isRecord(parsed.profiles)) {
    throw new Error(
      `[MARKETING_META_AUTH_FILE_SECRETS_INVALID] Invalid Meta auth secrets file at ${filePath}.`,
    );
  }
  return parsed as MetaAuthFileSecretsDocument;
}

function writeFileSecrets(
  document: MetaAuthFileSecretsDocument,
  options: MarketingMetaAuthRuntimeOptions = {},
): void {
  assertPlaintextStoreAllowed(options);
  ensureAuthHome(options);
  writePrivateJson(fileSecretsPath(options), document);
}

function secretAccount(profile: string): string {
  return `${SECRET_ACCOUNT_PREFIX}:${profile}:access_token`;
}

function runSecurity(args: readonly string[]): string | null {
  if (process.platform !== 'darwin') {
    throw new Error(
      '[MARKETING_META_AUTH_KEYCHAIN_UNAVAILABLE] macOS Keychain auth store is only available on macOS. Use file auth store only for controlled CI/test environments.',
    );
  }
  const result = spawnSync('/usr/bin/security', [...args], { encoding: 'utf8' });
  if (result.status === 0) return result.stdout.trim();
  const stderr = `${result.stderr ?? ''}${result.stdout ?? ''}`;
  if (
    stderr.includes('could not be found') ||
    stderr.includes('The specified item could not be found')
  ) {
    return null;
  }
  throw new Error(
    `[MARKETING_META_AUTH_KEYCHAIN_ERROR] ${stderr.trim() || 'Meta keychain command failed'}`,
  );
}

function keychainGet(profile: string): string | undefined {
  const value = runSecurity([
    'find-generic-password',
    '-a',
    secretAccount(profile),
    '-s',
    KEYCHAIN_SERVICE,
    '-w',
  ]);
  return value?.trim() || undefined;
}

function keychainSet(profile: string, value: string): void {
  runSecurity([
    'add-generic-password',
    '-U',
    '-a',
    secretAccount(profile),
    '-s',
    KEYCHAIN_SERVICE,
    '-w',
    value,
  ]);
}

function keychainDelete(profile: string): void {
  void runSecurity([
    'delete-generic-password',
    '-a',
    secretAccount(profile),
    '-s',
    KEYCHAIN_SERVICE,
  ]);
}

function readToken(args: {
  profile: string;
  store: MetaSecretStoreKind;
  runtime?: MarketingMetaAuthRuntimeOptions;
}): string | undefined {
  if (args.store === 'keychain') return keychainGet(args.profile);
  return readFileSecrets(args.runtime).profiles[args.profile]?.accessToken;
}

function writeToken(args: {
  profile: string;
  value: string;
  store: MetaSecretStoreKind;
  runtime?: MarketingMetaAuthRuntimeOptions;
}): void {
  if (args.store === 'keychain') {
    keychainSet(args.profile, args.value);
    return;
  }
  const secrets = readFileSecrets(args.runtime);
  secrets.profiles[args.profile] = { accessToken: args.value };
  writeFileSecrets(secrets, args.runtime);
}

function deleteToken(args: {
  profile: string;
  store: MetaSecretStoreKind;
  runtime?: MarketingMetaAuthRuntimeOptions;
}): void {
  if (args.store === 'keychain') {
    try {
      keychainDelete(args.profile);
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (!message.includes('could not be found')) throw error;
    }
    return;
  }
  const secrets = readFileSecrets(args.runtime);
  delete secrets.profiles[args.profile];
  if (Object.keys(secrets.profiles).length === 0)
    rmSync(fileSecretsPath(args.runtime), { force: true });
  else writeFileSecrets(secrets, args.runtime);
}

function validateExpiresAt(value: string | undefined): string | undefined {
  if (!value) return undefined;
  if (!Number.isFinite(Date.parse(value))) {
    throw new Error(
      '[MARKETING_META_AUTH_EXPIRES_AT_INVALID] --expires-at must be an ISO date string.',
    );
  }
  return new Date(value).toISOString();
}

export async function saveMarketingMetaAuthProfile(args: {
  profile?: string;
  accessToken: string;
  scopes?: readonly string[];
  expiresAt?: string;
  secretStore?: MetaSecretStoreKind;
  runtime?: MarketingMetaAuthRuntimeOptions;
}): Promise<void> {
  const profile = normalizeProfileName(args.profile);
  const store = args.secretStore ?? parseStoreKind(args.runtime?.store);
  if (store === 'file') assertPlaintextStoreAllowed(args.runtime);
  const now = new Date().toISOString();
  const document = readProfiles(args.runtime);
  const existing = document.profiles[profile];
  if (existing && existing.secretStore !== store) {
    deleteToken({ profile, store: existing.secretStore, runtime: args.runtime });
  }
  document.profiles[profile] = {
    profile,
    scopes: args.scopes ?? [],
    secretStore: store,
    expiresAt: validateExpiresAt(args.expiresAt),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  writeProfiles(document, args.runtime);
  writeToken({ profile, value: args.accessToken, store, runtime: args.runtime });
}

export async function getMarketingMetaAuthStatus(
  args: { profile?: string; runtime?: MarketingMetaAuthRuntimeOptions } = {},
): Promise<MarketingMetaAuthProfileStatus> {
  const profile = normalizeProfileName(args.profile);
  const metadata = readProfiles(args.runtime).profiles[profile];
  if (!metadata) {
    return {
      ok: false,
      profile,
      authHome: authHome(args.runtime),
      configured: false,
      scopes: [],
      accessTokenStored: false,
    };
  }
  const accessTokenStored = Boolean(
    readToken({ profile, store: metadata.secretStore, runtime: args.runtime }),
  );
  return {
    ok: metaAuthReady({
      ok: true,
      profile,
      authHome: authHome(args.runtime),
      configured: true,
      scopes: metadata.scopes,
      secretStore: metadata.secretStore,
      accessTokenStored,
      expiresAt: metadata.expiresAt,
      createdAt: metadata.createdAt,
      updatedAt: metadata.updatedAt,
    }),
    profile,
    authHome: authHome(args.runtime),
    configured: true,
    scopes: metadata.scopes,
    secretStore: metadata.secretStore,
    accessTokenStored,
    expiresAt: metadata.expiresAt,
    createdAt: metadata.createdAt,
    updatedAt: metadata.updatedAt,
  };
}

export async function resolveMarketingMetaAccessToken(args: {
  accessTokenEnv?: string;
  authProfile?: string;
  runtime?: MarketingMetaAuthRuntimeOptions;
}): Promise<string> {
  const envName = args.accessTokenEnv ?? DEFAULT_ACCESS_TOKEN_ENV;
  const token = process.env[envName]?.trim();
  if (token) return token;
  const profile = normalizeProfileName(args.authProfile);
  const metadata = readProfiles(args.runtime).profiles[profile];
  if (!metadata) {
    throw new Error(
      `[MARKETING_META_ACCESS_TOKEN_MISSING] Set ${envName} or run marketing auth meta save --profile <name>.`,
    );
  }
  const saved = readToken({ profile, store: metadata.secretStore, runtime: args.runtime });
  if (
    !saved ||
    !metaAuthReady(await getMarketingMetaAuthStatus({ profile, runtime: args.runtime }))
  ) {
    throw new Error(
      `[MARKETING_META_ACCESS_TOKEN_MISSING] Meta auth profile ${profile} is missing or expired. Set ${envName} or run marketing auth meta save --profile ${profile}.`,
    );
  }
  return saved;
}

export async function deleteMarketingMetaAuthProfile(
  args: { profile?: string; runtime?: MarketingMetaAuthRuntimeOptions } = {},
): Promise<void> {
  const profile = normalizeProfileName(args.profile);
  const document = readProfiles(args.runtime);
  const metadata = document.profiles[profile];
  if (!metadata) return;
  deleteToken({ profile, store: metadata.secretStore, runtime: args.runtime });
  delete document.profiles[profile];
  writeProfiles(document, args.runtime);
}
