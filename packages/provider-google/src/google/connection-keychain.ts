import { spawnSync } from 'node:child_process';

const SERVICE = 'dev.unisane.google-connection';

export type GoogleConnectionSecretField = 'client-secret' | 'refresh-token' | 'ads-developer-token';

function account(connectionId: string, field: GoogleConnectionSecretField): string {
  return `${connectionId}:${field}`;
}

export function writeGoogleConnectionKeychainSecret(args: {
  connectionId: string;
  field: GoogleConnectionSecretField;
  value: string;
}): void {
  if (process.platform !== 'darwin') {
    throw new Error(
      '[GOOGLE_CONNECTION_KEYCHAIN_UNAVAILABLE] Local Google connection storage currently requires macOS Keychain. Use an explicit external secret reference for CI or another host.',
    );
  }
  const result = spawnSync(
    '/usr/bin/security',
    [
      'add-generic-password',
      '-U',
      '-a',
      account(args.connectionId, args.field),
      '-s',
      SERVICE,
      '-w',
      args.value,
    ],
    { encoding: 'utf8' },
  );
  if (result.status !== 0) {
    throw new Error(
      `[GOOGLE_CONNECTION_KEYCHAIN_WRITE_FAILED] ${`${result.stderr ?? ''}${result.stdout ?? ''}`.trim() || 'macOS Keychain write failed.'}`,
    );
  }
}

export function readGoogleConnectionKeychainSecret(args: {
  connectionId: string;
  field: GoogleConnectionSecretField;
}): string | null {
  if (process.platform !== 'darwin') {
    throw new Error(
      '[GOOGLE_CONNECTION_KEYCHAIN_UNAVAILABLE] Local Google connection storage currently requires macOS Keychain.',
    );
  }
  const result = spawnSync(
    '/usr/bin/security',
    ['find-generic-password', '-a', account(args.connectionId, args.field), '-s', SERVICE, '-w'],
    { encoding: 'utf8' },
  );
  if (result.status === 0) return result.stdout.trim() || null;
  const output = `${result.stderr ?? ''}${result.stdout ?? ''}`;
  if (
    output.includes('could not be found') ||
    output.includes('The specified item could not be found')
  ) {
    return null;
  }
  throw new Error(
    `[GOOGLE_CONNECTION_KEYCHAIN_READ_FAILED] ${output.trim() || 'macOS Keychain read failed.'}`,
  );
}
