import { describe, expect, it, vi } from 'vitest';
import {
  createMacOsMetaKeychainCredentialStore,
  type MetaKeychainMutationRunner,
} from './local-credential-store.js';

const binding = {
  reference: { credentialId: 'meta-primary-graph', version: 2 },
  context: {
    scopeId: 'workspace',
    projectId: 'commerce-site',
    environmentId: 'production',
    connectionId: 'meta-primary',
    provider: 'meta' as const,
    secretKind: 'meta-graph-access' as const,
  },
};

describe('local Meta credential store', () => {
  it('writes through Keychain prompt input without putting the credential in arguments', () => {
    const credential = new TextEncoder().encode('in-memory-only-token');
    const capturedInputs: Uint8Array[] = [];
    const capturedInputLengths: number[] = [];
    const stdout = new TextEncoder().encode('unexpected-output');
    const stderr = new TextEncoder().encode('unexpected-error');
    const run = vi.fn((args: readonly string[], input?: Uint8Array) => {
      expect(args.join(' ')).not.toContain('in-memory-only-token');
      if (input) {
        capturedInputs.push(input);
        capturedInputLengths.push(input.byteLength);
      }
      return { status: 0, stdout, stderr };
    });
    const store = createMacOsMetaKeychainCredentialStore({
      platform: 'darwin',
      runner: { run } satisfies MetaKeychainMutationRunner,
    });

    store.write({ ...binding, credential });

    expect(run.mock.calls[0]?.[0]).toEqual([
      'add-generic-password',
      '-U',
      '-a',
      'workspace:commerce-site:production:meta-primary:meta-primary-graph:v2:chunk:000',
      '-s',
      'dev.unisane.meta-connection',
      '-w',
    ]);
    expect(run.mock.calls[1]?.[0]).toEqual([
      'add-generic-password',
      '-U',
      '-a',
      'workspace:commerce-site:production:meta-primary:meta-primary-graph:v2',
      '-s',
      'dev.unisane.meta-connection',
      '-w',
    ]);
    expect(capturedInputs).toHaveLength(2);
    expect(capturedInputLengths.every((length) => length <= 194)).toBe(true);
    for (const input of capturedInputs) {
      expect([...input]).toEqual(new Array(input.byteLength).fill(0));
    }
    expect([...stdout]).toEqual(new Array(stdout.byteLength).fill(0));
    expect([...stderr]).toEqual(new Array(stderr.byteLength).fill(0));
    expect(new TextDecoder().decode(credential)).toBe('in-memory-only-token');
    credential.fill(0);
  });

  it('splits long Meta tokens into prompt-safe Keychain chunks', () => {
    const credential = new TextEncoder().encode('a'.repeat(237));
    const accounts: string[] = [];
    const inputLengths: number[] = [];
    const runner: MetaKeychainMutationRunner = {
      run(args, input) {
        accounts.push(args[3]!);
        if (input) inputLengths.push(input.byteLength);
        return { status: 0, stdout: null, stderr: null };
      },
    };
    const store = createMacOsMetaKeychainCredentialStore({ platform: 'darwin', runner });

    store.write({ ...binding, credential });

    expect(accounts).toEqual([
      'workspace:commerce-site:production:meta-primary:meta-primary-graph:v2:chunk:000',
      'workspace:commerce-site:production:meta-primary:meta-primary-graph:v2:chunk:001',
      'workspace:commerce-site:production:meta-primary:meta-primary-graph:v2:chunk:002',
      'workspace:commerce-site:production:meta-primary:meta-primary-graph:v2:chunk:003',
      'workspace:commerce-site:production:meta-primary:meta-primary-graph:v2',
    ]);
    expect(inputLengths.every((length) => length <= 194)).toBe(true);
    credential.fill(0);
  });

  it('removes only the exact context-bound version and redacts failures', () => {
    const stdout = new TextEncoder().encode('must-not-leak');
    const runner: MetaKeychainMutationRunner = {
      run: vi.fn(() => ({ status: 1, stdout, stderr: null })),
    };
    const store = createMacOsMetaKeychainCredentialStore({ platform: 'darwin', runner });

    expect(() => store.remove(binding)).toThrow('[META_CONNECTION_KEYCHAIN_DELETE_FAILED]');
    expect(runner.run).toHaveBeenNthCalledWith(1, [
      'find-generic-password',
      '-a',
      'workspace:commerce-site:production:meta-primary:meta-primary-graph:v2',
      '-s',
      'dev.unisane.meta-connection',
      '-w',
    ]);
    expect(runner.run).toHaveBeenNthCalledWith(2, [
      'delete-generic-password',
      '-a',
      'workspace:commerce-site:production:meta-primary:meta-primary-graph:v2',
      '-s',
      'dev.unisane.meta-connection',
    ]);
    expect([...stdout]).toEqual(new Array(stdout.byteLength).fill(0));
  });
});
