import { spawnSync } from 'node:child_process';
import { authNamespace, errorCode, type GoogleAuthRuntimeOptions } from './types.js';

function secretAccount(
  profile: string,
  field: 'client_secret' | 'refresh_token',
  options: GoogleAuthRuntimeOptions = {},
): string {
  return `${authNamespace(options).secretAccountPrefix}:${profile}:${field}`;
}

function runSecurity(
  args: readonly string[],
  options: GoogleAuthRuntimeOptions = {},
): string | null {
  const namespace = authNamespace(options);
  if (process.platform !== 'darwin') {
    throw new Error(
      `[${errorCode(options, 'KEYCHAIN_UNAVAILABLE')}] macOS Keychain auth store is only available on macOS. Use file auth store only for controlled CI/test environments.`,
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
    `[${errorCode(options, 'KEYCHAIN_ERROR')}] ${stderr.trim() || `${namespace.displayName} keychain command failed`}`,
  );
}

export function keychainGet(
  profile: string,
  field: 'client_secret' | 'refresh_token',
  runtime?: GoogleAuthRuntimeOptions,
): string | undefined {
  const value = runSecurity(
    [
      'find-generic-password',
      '-a',
      secretAccount(profile, field, runtime),
      '-s',
      authNamespace(runtime).keychainService,
      '-w',
    ],
    runtime,
  );
  return value?.trim() || undefined;
}

export function keychainSet(
  profile: string,
  field: 'client_secret' | 'refresh_token',
  value: string,
  runtime?: GoogleAuthRuntimeOptions,
): void {
  runSecurity(
    [
      'add-generic-password',
      '-U',
      '-a',
      secretAccount(profile, field, runtime),
      '-s',
      authNamespace(runtime).keychainService,
      '-w',
      value,
    ],
    runtime,
  );
}

export function keychainDelete(
  profile: string,
  field: 'client_secret' | 'refresh_token',
  runtime?: GoogleAuthRuntimeOptions,
): void {
  void runSecurity(
    [
      'delete-generic-password',
      '-a',
      secretAccount(profile, field, runtime),
      '-s',
      authNamespace(runtime).keychainService,
    ],
    runtime,
  );
}
