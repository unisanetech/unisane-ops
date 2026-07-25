import {
  assertPlaintextStoreAllowed,
  readFileSecrets,
  readProfiles,
  removeFileSecretsIfEmpty,
  writeFileSecrets,
  writeProfiles,
  writeRawFileSecrets,
} from './files.js';
import { keychainDelete, keychainGet, keychainSet } from './keychain.js';
import {
  authNamespace,
  normalizeProfileName,
  parseStoreKind,
  type GoogleAuthCliOptions,
  type GoogleAuthProfile,
  type GoogleAuthRuntimeOptions,
  type SavedSecretProfile,
  type SecretStoreKind,
} from './types.js';

export { assertPlaintextStoreAllowed, authHome } from './files.js';

export function readSecret(args: {
  profile: string;
  field: 'client_secret' | 'refresh_token';
  store: SecretStoreKind;
  runtime?: GoogleAuthRuntimeOptions;
}): string | undefined {
  if (args.store === 'keychain') {
    return keychainGet(args.profile, args.field, args.runtime);
  }
  const secrets = readFileSecrets(args.runtime);
  return secrets.profiles[args.profile]?.[
    args.field === 'client_secret' ? 'clientSecret' : 'refreshToken'
  ];
}

function writeSecret(args: {
  profile: string;
  field: 'client_secret' | 'refresh_token';
  value: string;
  store: SecretStoreKind;
  runtime?: GoogleAuthRuntimeOptions;
}): void {
  if (args.store === 'keychain') {
    keychainSet(args.profile, args.field, args.value, args.runtime);
    return;
  }
  const secrets = readFileSecrets(args.runtime);
  const current = secrets.profiles[args.profile] ?? {};
  secrets.profiles[args.profile] = {
    ...current,
    [args.field === 'client_secret' ? 'clientSecret' : 'refreshToken']: args.value,
  };
  writeFileSecrets(secrets, args.runtime);
}

export function deleteSecret(args: {
  profile: string;
  field: 'client_secret' | 'refresh_token';
  store: SecretStoreKind;
  runtime?: GoogleAuthRuntimeOptions;
}): void {
  if (args.store === 'keychain') {
    try {
      keychainDelete(args.profile, args.field, args.runtime);
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (!message.includes('could not be found')) throw error;
    }
    return;
  }
  const secrets = readFileSecrets(args.runtime);
  const current = secrets.profiles[args.profile];
  if (!current) return;
  delete current[args.field === 'client_secret' ? 'clientSecret' : 'refreshToken'];
  if (!current.refreshToken && !current.clientSecret) delete secrets.profiles[args.profile];
  writeRawFileSecrets(secrets, args.runtime);
}

export function getProfile(
  profile: string,
  runtime: GoogleAuthRuntimeOptions = {},
): GoogleAuthProfile | undefined {
  return readProfiles(runtime).profiles[profile];
}

export function resolveLoginStore(
  options: GoogleAuthCliOptions,
  existing?: GoogleAuthProfile,
): SecretStoreKind {
  const requested = options.store ?? process.env[authNamespace(options).storeEnv];
  if (requested) return parseStoreKind(requested, options);
  return existing?.secretStore ?? 'keychain';
}

export async function saveGoogleAuthProfile(
  args: SavedSecretProfile & { runtime?: GoogleAuthRuntimeOptions },
): Promise<void> {
  const profile = normalizeProfileName(args.profile, args.runtime);
  const store = args.secretStore ?? parseStoreKind(args.runtime?.store, args.runtime);
  if (store === 'file') assertPlaintextStoreAllowed(args.runtime);
  const now = new Date().toISOString();
  const document = readProfiles(args.runtime);
  const existing = document.profiles[profile];
  if (existing && existing.secretStore !== store) {
    deleteSecret({
      profile,
      field: 'refresh_token',
      store: existing.secretStore,
      runtime: args.runtime,
    });
    deleteSecret({
      profile,
      field: 'client_secret',
      store: existing.secretStore,
      runtime: args.runtime,
    });
  }
  document.profiles[profile] = {
    profile,
    clientId: args.clientId,
    scopes: args.scopes,
    secretStore: store,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  writeProfiles(document, args.runtime);
  writeSecret({
    profile,
    field: 'refresh_token',
    value: args.refreshToken,
    store,
    runtime: args.runtime,
  });
  if (args.clientSecret) {
    writeSecret({
      profile,
      field: 'client_secret',
      value: args.clientSecret,
      store,
      runtime: args.runtime,
    });
  }
}

export async function deleteGoogleAuthProfile(
  args: {
    profile?: string;
    runtime?: GoogleAuthRuntimeOptions;
  } = {},
): Promise<void> {
  const profile = normalizeProfileName(args.profile, args.runtime);
  const document = readProfiles(args.runtime);
  const metadata = document.profiles[profile];
  if (metadata) {
    deleteSecret({
      profile,
      field: 'refresh_token',
      store: metadata.secretStore,
      runtime: args.runtime,
    });
    deleteSecret({
      profile,
      field: 'client_secret',
      store: metadata.secretStore,
      runtime: args.runtime,
    });
    delete document.profiles[profile];
    writeProfiles(document, args.runtime);
  }
  if (metadata?.secretStore === 'file') removeFileSecretsIfEmpty(args.runtime);
}
