import { chmodSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import {
  authNamespace,
  errorCode,
  isRecord,
  type GoogleAuthFileSecretsDocument,
  type GoogleAuthProfilesDocument,
  type GoogleAuthRuntimeOptions,
} from './types.js';

export function authHome(options: GoogleAuthRuntimeOptions = {}): string {
  const namespace = authNamespace(options);
  return path.resolve(
    options.authHome ??
      process.env[namespace.authHomeEnv] ??
      path.join(homedir(), '.unisane', namespace.authHomeDir),
  );
}

function profilesPath(options: GoogleAuthRuntimeOptions = {}): string {
  return path.join(authHome(options), 'profiles.json');
}

function fileSecretsPath(options: GoogleAuthRuntimeOptions = {}): string {
  return path.join(authHome(options), 'secrets.json');
}

function ensureAuthHome(options: GoogleAuthRuntimeOptions = {}): void {
  mkdirSync(authHome(options), { recursive: true, mode: 0o700 });
}

function writePrivateJson(filePath: string, value: unknown): void {
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  try {
    chmodSync(filePath, 0o600);
  } catch {
    // chmod is best-effort on non-POSIX filesystems.
  }
}

export function readProfiles(options: GoogleAuthRuntimeOptions = {}): GoogleAuthProfilesDocument {
  const filePath = profilesPath(options);
  if (!existsSync(filePath)) {
    return { version: 1, profiles: {} };
  }
  const parsed = JSON.parse(readFileSync(filePath, 'utf8')) as unknown;
  if (!isRecord(parsed) || parsed.version !== 1 || !isRecord(parsed.profiles)) {
    throw new Error(
      `[${errorCode(options, 'PROFILES_INVALID')}] Invalid ${authNamespace(options).displayName} auth profile file at ${filePath}.`,
    );
  }
  return parsed as GoogleAuthProfilesDocument;
}

export function writeProfiles(
  document: GoogleAuthProfilesDocument,
  options: GoogleAuthRuntimeOptions = {},
): void {
  ensureAuthHome(options);
  writePrivateJson(profilesPath(options), document);
}

export function readFileSecrets(
  options: GoogleAuthRuntimeOptions = {},
): GoogleAuthFileSecretsDocument {
  const filePath = fileSecretsPath(options);
  if (!existsSync(filePath)) {
    return { version: 1, profiles: {} };
  }
  const parsed = JSON.parse(readFileSync(filePath, 'utf8')) as unknown;
  if (!isRecord(parsed) || parsed.version !== 1 || !isRecord(parsed.profiles)) {
    throw new Error(
      `[${errorCode(options, 'FILE_SECRETS_INVALID')}] Invalid ${authNamespace(options).displayName} auth secrets file at ${filePath}.`,
    );
  }
  return parsed as GoogleAuthFileSecretsDocument;
}

export function writeFileSecrets(
  document: GoogleAuthFileSecretsDocument,
  options: GoogleAuthRuntimeOptions = {},
): void {
  assertPlaintextStoreAllowed(options);
  ensureAuthHome(options);
  writePrivateJson(fileSecretsPath(options), document);
}

export function writeRawFileSecrets(
  document: GoogleAuthFileSecretsDocument,
  options: GoogleAuthRuntimeOptions = {},
): void {
  ensureAuthHome(options);
  writePrivateJson(fileSecretsPath(options), document);
}

export function removeFileSecretsIfEmpty(options: GoogleAuthRuntimeOptions = {}): void {
  const secretsFile = fileSecretsPath(options);
  if (!existsSync(secretsFile)) return;
  const secrets = readFileSecrets(options);
  if (Object.keys(secrets.profiles).length === 0) {
    rmSync(secretsFile, { force: true });
  }
}

export function assertPlaintextStoreAllowed(options: GoogleAuthRuntimeOptions = {}): void {
  const namespace = authNamespace(options);
  if (options.allowPlaintextStore || process.env[namespace.allowPlaintextStoreEnv] === '1') {
    return;
  }
  throw new Error(
    `[${errorCode(options, 'PLAINTEXT_STORE_BLOCKED')}] Refusing to store ${namespace.displayName} OAuth secrets in files. Use keychain store, or explicitly set ${namespace.allowPlaintextStoreEnv}=1 for controlled CI/test environments.`,
  );
}
