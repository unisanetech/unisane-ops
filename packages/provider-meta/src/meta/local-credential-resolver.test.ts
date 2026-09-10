import { describe, expect, it, vi } from 'vitest';
import {
  createLocalMetaCredentialResolver,
  createMacOsMetaKeychainCredentialSource,
  type MetaKeychainCommandRunner,
  type MetaLocalCredentialSource,
} from './local-credential-resolver.js';

const reference = { credentialId: 'meta-primary-graph', version: 3 } as const;
const context = {
  scopeId: 'workspace',
  projectId: 'commerce-site',
  environmentId: 'production',
  connectionId: 'meta-primary',
  provider: 'meta',
  secretKind: 'meta-graph-access',
} as const;

describe('local Meta credential resolver', () => {
  it('binds macOS Keychain lookup to the complete credential context and clears command output', () => {
    // macOS spawnSync returns Buffer, whose slice() shares backing memory.
    const stdout = Buffer.from('local-meta-token\n');
    const run = vi.fn(() => ({ status: 0, stdout }));
    const source = createMacOsMetaKeychainCredentialSource({
      platform: 'darwin',
      runner: { run } satisfies MetaKeychainCommandRunner,
    });

    const credential = source.read({ reference, context });

    expect(run).toHaveBeenCalledWith([
      'find-generic-password',
      '-a',
      'workspace:commerce-site:production:meta-primary:meta-primary-graph:v3',
      '-s',
      'dev.unisane.meta-connection',
      '-w',
    ]);
    expect(new TextDecoder().decode(credential!)).toBe('local-meta-token');
    expect([...stdout]).toEqual(new Array(stdout.byteLength).fill(0));
    credential!.fill(0);
  });

  it('uses distinct Keychain accounts across project and connection contexts', () => {
    const accounts: string[] = [];
    const runner: MetaKeychainCommandRunner = {
      run(args) {
        accounts.push(args[2]!);
        return { status: 0, stdout: new TextEncoder().encode('local-meta-token') };
      },
    };
    const source = createMacOsMetaKeychainCredentialSource({ platform: 'darwin', runner });

    source.read({ reference, context })?.fill(0);
    source
      .read({
        reference,
        context: { ...context, projectId: 'another-project', connectionId: 'meta-secondary' },
      })
      ?.fill(0);

    expect(accounts).toEqual([
      'workspace:commerce-site:production:meta-primary:meta-primary-graph:v3',
      'workspace:another-project:production:meta-secondary:meta-primary-graph:v3',
    ]);
  });

  it('reassembles long credentials from bounded Keychain chunks', () => {
    const original = 'a'.repeat(237);
    const encoded = Buffer.from(original).toString('base64');
    const chunks = Array.from(
      { length: Math.ceil(encoded.length / 96) },
      (_, index) => encoded.slice(index * 96, (index + 1) * 96),
    );
    const base = 'workspace:commerce-site:production:meta-primary:meta-primary-graph:v3';
    const values = new Map([
      [base, `unisane-meta-keychain:v1:${chunks.length}:237`],
      ...chunks.map((chunk, index) => [
        `${base}:chunk:${String(index).padStart(3, '0')}`,
        chunk,
      ] as const),
    ]);
    const outputs: Uint8Array[] = [];
    const run = vi.fn((args: readonly string[]) => {
      const value = values.get(args[2]!);
      // Match the real spawnSync return type so clearing process output cannot
      // accidentally clear the reconstructed credential.
      const stdout = value ? Buffer.from(`${value}\n`) : null;
      if (stdout) outputs.push(stdout);
      return { status: value ? 0 : 44, stdout };
    });
    const source = createMacOsMetaKeychainCredentialSource({
      platform: 'darwin',
      runner: { run },
    });

    const credential = source.read({ reference, context });

    expect(new TextDecoder().decode(credential!)).toBe(original);
    expect(run).toHaveBeenCalledTimes(chunks.length + 1);
    for (const output of outputs) {
      expect([...output]).toEqual(new Array(output.byteLength).fill(0));
    }
    credential!.fill(0);
  });

  it('fails safely when Keychain is unsupported or denies access', () => {
    const unsupportedRun = vi.fn();
    const unsupported = createMacOsMetaKeychainCredentialSource({
      platform: 'linux',
      runner: { run: unsupportedRun },
    });
    expect(() => unsupported.read({ reference, context })).toThrow(
      '[META_CONNECTION_KEYCHAIN_UNAVAILABLE]',
    );
    expect(unsupportedRun).not.toHaveBeenCalled();

    const stdout = new TextEncoder().encode('must-not-leak');
    const denied = createMacOsMetaKeychainCredentialSource({
      platform: 'darwin',
      runner: { run: () => ({ status: 44, stdout }) },
    });
    const error = (() => {
      try {
        denied.read({ reference, context });
      } catch (value) {
        return value;
      }
      return undefined;
    })();
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe(
      '[META_CONNECTION_CREDENTIAL_UNAVAILABLE] The bound local Meta credential is unavailable.',
    );
    expect((error as Error).message).not.toContain('must-not-leak');
    expect([...stdout]).toEqual(new Array(stdout.byteLength).fill(0));
  });

  it('keeps credential bytes inside the callback and clears them after use', async () => {
    const credential = new TextEncoder().encode('local-meta-token');
    const read = vi.fn(() => credential);
    const source: MetaLocalCredentialSource = { read };
    const resolver = createLocalMetaCredentialResolver({ source });

    await expect(
      resolver.withCredential({
        reference,
        context,
        use: async (value) => ({ ok: new TextDecoder().decode(value) === 'local-meta-token' }),
      }),
    ).resolves.toEqual({ ok: true });
    expect(read).toHaveBeenCalledWith({ reference, context });
    expect([...credential]).toEqual(new Array(credential.byteLength).fill(0));
  });

  it('allows canonical credential-reference metadata without allowing credential material', async () => {
    const credential = new TextEncoder().encode('local-meta-token');
    const resolver = createLocalMetaCredentialResolver({ source: { read: () => credential } });

    await expect(
      resolver.withCredential({
        reference,
        context,
        use: async () => ({
          credential: {
            secretReference: 'meta-primary-graph',
            secretKind: 'meta-graph-access',
            version: 3,
            state: 'active',
            observedAt: '2026-09-03T00:00:00.000Z',
          },
        }),
      }),
    ).resolves.toEqual({
      credential: {
        secretReference: 'meta-primary-graph',
        secretKind: 'meta-graph-access',
        version: 3,
        state: 'active',
        observedAt: '2026-09-03T00:00:00.000Z',
      },
    });
    expect([...credential]).toEqual(new Array(credential.byteLength).fill(0));
  });

  it('rejects returned or thrown credential material without exposing it', async () => {
    const returned = new TextEncoder().encode('local-meta-token');
    const returnedResolver = createLocalMetaCredentialResolver({
      source: { read: () => returned },
    });
    await expect(
      returnedResolver.withCredential({
        reference,
        context,
        use: async (value) => ({ value: new TextDecoder().decode(value) }),
      }),
    ).rejects.toThrow('[META_CONNECTION_CREDENTIAL_EXPOSURE_FORBIDDEN]');
    expect([...returned]).toEqual(new Array(returned.byteLength).fill(0));

    const thrown = new TextEncoder().encode('local-meta-token');
    const thrownResolver = createLocalMetaCredentialResolver({ source: { read: () => thrown } });
    const error = await thrownResolver
      .withCredential({
        reference,
        context,
        use: async (value) => {
          throw new Error(`transport leaked ${new TextDecoder().decode(value)}`);
        },
      })
      .catch((value: unknown) => value);
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe(
      '[META_CONNECTION_CREDENTIAL_CALLBACK_FAILED] The local Meta credential callback failed safely.',
    );
    expect((error as Error).message).not.toContain('local-meta-token');
    expect([...thrown]).toEqual(new Array(thrown.byteLength).fill(0));

    const credentialShaped = new TextEncoder().encode('local-meta-token');
    const credentialShapedResolver = createLocalMetaCredentialResolver({
      source: { read: () => credentialShaped },
    });
    await expect(
      credentialShapedResolver.withCredential({
        reference,
        context,
        use: async () => ({ accessToken: 'redacted' }),
      }),
    ).rejects.toThrow('[META_CONNECTION_CREDENTIAL_EXPOSURE_FORBIDDEN]');
    expect([...credentialShaped]).toEqual(new Array(credentialShaped.byteLength).fill(0));

    const thrownValue = new TextEncoder().encode('local-meta-token');
    const thrownValueResolver = createLocalMetaCredentialResolver({
      source: { read: () => thrownValue },
    });
    const thrownValueError = await thrownValueResolver
      .withCredential({
        reference,
        context,
        use: async (value) => {
          throw `transport leaked ${new TextDecoder().decode(value)}`;
        },
      })
      .catch((value: unknown) => value);
    expect(thrownValueError).toBeInstanceOf(Error);
    expect((thrownValueError as Error).message).toBe(
      '[META_CONNECTION_CREDENTIAL_CALLBACK_FAILED] The local Meta credential callback failed safely.',
    );
    expect((thrownValueError as Error).message).not.toContain('local-meta-token');
    expect([...thrownValue]).toEqual(new Array(thrownValue.byteLength).fill(0));
  });
});
