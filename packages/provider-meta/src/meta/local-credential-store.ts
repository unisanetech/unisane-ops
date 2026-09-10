import { spawnSync } from 'node:child_process';
import {
  META_KEYCHAIN_CHUNK_BYTES,
  META_KEYCHAIN_CHUNK_MANIFEST_PREFIX,
  META_KEYCHAIN_SERVICE,
  metaKeychainAccount,
  metaKeychainChunkAccount,
  type MetaCredentialContext,
  type MetaCredentialReference,
} from './local-credential-resolver.js';

export interface MetaLocalCredentialStore {
  write(input: {
    reference: MetaCredentialReference;
    context: MetaCredentialContext;
    credential: Uint8Array;
  }): void;
  remove(input: { reference: MetaCredentialReference; context: MetaCredentialContext }): boolean;
}

export interface MetaKeychainMutationRunner {
  run(
    args: readonly string[],
    input?: Uint8Array,
  ): {
    status: number | null;
    stdout: Uint8Array | null;
    stderr: Uint8Array | null;
  };
}

function defaultRunner(): MetaKeychainMutationRunner {
  return {
    run(args, input) {
      const options = {
        encoding: null,
        ...(input ? { input } : {}),
        // Without a detached process, `security -w` opens /dev/tty when the
        // CLI itself is interactive and ignores the supplied stdin bytes.
        // That produces repeated password prompts and can store a manually
        // pasted, 128-byte-truncated value in every chunk. Detaching removes
        // the controlling terminal so Keychain consumes only this pipe.
        detached: true,
        maxBuffer: 20_000,
      } as const;
      const result = spawnSync('/usr/bin/security', [...args], options);
      return {
        status: result.status,
        stdout: result.stdout instanceof Uint8Array ? result.stdout : null,
        stderr: result.stderr instanceof Uint8Array ? result.stderr : null,
      };
    },
  };
}

function clearOutput(result: { stdout: Uint8Array | null; stderr: Uint8Array | null }): void {
  result.stdout?.fill(0);
  result.stderr?.fill(0);
}

function promptInput(value: Uint8Array): Uint8Array {
  const input = new Uint8Array(value.byteLength * 2 + 2);
  input.set(value);
  input[value.byteLength] = 10;
  input.set(value, value.byteLength + 1);
  input[input.byteLength - 1] = 10;
  return input;
}

function writeItem(
  runner: MetaKeychainMutationRunner,
  account: string,
  value: Uint8Array,
): void {
  const input = promptInput(value);
  try {
    const result = runner.run(
      ['add-generic-password', '-U', '-a', account, '-s', META_KEYCHAIN_SERVICE, '-w'],
      input,
    );
    try {
      if (result.status !== 0) {
        throw new Error(
          '[META_CONNECTION_KEYCHAIN_WRITE_FAILED] The context-bound Meta credential could not be stored.',
        );
      }
    } finally {
      clearOutput(result);
    }
  } finally {
    input.fill(0);
  }
}

function deleteItem(runner: MetaKeychainMutationRunner, account: string): boolean {
  const result = runner.run([
    'delete-generic-password',
    '-a',
    account,
    '-s',
    META_KEYCHAIN_SERVICE,
  ]);
  try {
    if (result.status === 0) return true;
    if (result.status === 44) return false;
    throw new Error(
      '[META_CONNECTION_KEYCHAIN_DELETE_FAILED] The context-bound Meta credential could not be removed.',
    );
  } finally {
    clearOutput(result);
  }
}

function storedChunkCount(
  runner: MetaKeychainMutationRunner,
  account: string,
): number | null {
  const result = runner.run([
    'find-generic-password',
    '-a',
    account,
    '-s',
    META_KEYCHAIN_SERVICE,
    '-w',
  ]);
  try {
    if (result.status === 44) return null;
    if (result.status !== 0 || !result.stdout) return 0;
    const text = new TextDecoder().decode(result.stdout).trim();
    const match = text.match(
      new RegExp(`^${META_KEYCHAIN_CHUNK_MANIFEST_PREFIX.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}:(\\d+):\\d+$`),
    );
    return match ? Number(match[1]) : 0;
  } finally {
    clearOutput(result);
  }
}

export function createMacOsMetaKeychainCredentialStore(
  input: {
    platform?: NodeJS.Platform;
    runner?: MetaKeychainMutationRunner;
  } = {},
): MetaLocalCredentialStore {
  const platform = input.platform ?? process.platform;
  const runner = input.runner ?? defaultRunner();
  const assertPlatform = () => {
    if (platform !== 'darwin') {
      throw new Error(
        '[META_CONNECTION_KEYCHAIN_UNAVAILABLE] Local Meta credential custody currently requires macOS Keychain.',
      );
    }
  };
  return {
    write({ reference, context, credential }) {
      assertPlatform();
      if (credential.byteLength === 0 || credential.byteLength > 16_384) {
        throw new Error(
          '[META_CONNECTION_CREDENTIAL_INVALID] The Meta credential is empty or exceeds the supported bound.',
        );
      }
      const account = metaKeychainAccount({ reference, context });
      // macOS `security ... -w` truncates hidden prompt input at 128 bytes.
      // Store a short non-secret manifest plus bounded base64 chunks so long
      // Meta tokens never enter argv and round-trip without truncation.
      const encoded = Buffer.from(credential).toString('base64');
      const chunks = Array.from(
        { length: Math.ceil(encoded.length / META_KEYCHAIN_CHUNK_BYTES) },
        (_, index) => encoded.slice(
          index * META_KEYCHAIN_CHUNK_BYTES,
          (index + 1) * META_KEYCHAIN_CHUNK_BYTES,
        ),
      );
      const writtenAccounts: string[] = [];
      try {
        for (let index = 0; index < chunks.length; index += 1) {
          const chunkAccount = metaKeychainChunkAccount(account, index);
          const chunk = new TextEncoder().encode(chunks[index]);
          try {
            writeItem(runner, chunkAccount, chunk);
            writtenAccounts.push(chunkAccount);
          } finally {
            chunk.fill(0);
          }
        }
        const manifest = new TextEncoder().encode(
          `${META_KEYCHAIN_CHUNK_MANIFEST_PREFIX}:${chunks.length}:${credential.byteLength}`,
        );
        try {
          writeItem(runner, account, manifest);
        } finally {
          manifest.fill(0);
        }
      } catch (error) {
        for (const writtenAccount of writtenAccounts) {
          try {
            deleteItem(runner, writtenAccount);
          } catch {
            // Preserve the original safe write failure.
          }
        }
        throw error;
      }
    },
    remove({ reference, context }) {
      assertPlatform();
      const account = metaKeychainAccount({ reference, context });
      const count = storedChunkCount(runner, account);
      if (count === null) return false;
      for (let index = 0; index < count; index += 1) {
        deleteItem(runner, metaKeychainChunkAccount(account, index));
      }
      return deleteItem(runner, account);
    },
  };
}
