import { describe, expect, it, vi } from 'vitest';
import {
  createHostedCredential,
  createHostedWorkerCredentialResolver,
  revokeHostedCredential,
  rotateHostedCredential,
  type HostedCredentialBundle,
  type HostedCredentialEnvelopeCipher,
  type HostedCredentialRecord,
  type HostedCredentialStore,
} from './hosted-credentials.js';

class MemoryCredentialStore implements HostedCredentialStore {
  readonly durability = 'durable' as const;
  readonly atomicLifecycle = true as const;
  bundle: HostedCredentialBundle | null = null;

  async create(bundle: HostedCredentialBundle) {
    if (!this.bundle) {
      this.bundle = structuredClone(bundle);
      return 'stored' as const;
    }
    return 'conflict' as const;
  }

  async rotate(input: {
    record: HostedCredentialRecord;
    version: HostedCredentialBundle['version'];
    expectedRevision: number;
  }) {
    if (!this.bundle) return 'not-found' as const;
    if (this.bundle.record.revision !== input.expectedRevision) return 'conflict' as const;
    this.bundle = structuredClone({ record: input.record, version: input.version });
    return 'stored' as const;
  }

  async revoke(input: {
    credentialId: string;
    scopeId: string;
    projectId: string;
    expectedRevision: number;
    revokedAt: string;
  }) {
    if (
      !this.bundle ||
      this.bundle.record.credentialId !== input.credentialId ||
      this.bundle.record.scopeId !== input.scopeId ||
      this.bundle.record.projectId !== input.projectId
    ) {
      return 'not-found' as const;
    }
    if (this.bundle.record.revision !== input.expectedRevision) return 'conflict' as const;
    const record: HostedCredentialRecord = {
      ...this.bundle.record,
      revision: this.bundle.record.revision + 1,
      state: 'revoked',
      activeVersion: null,
      updatedAt: input.revokedAt,
      revokedAt: input.revokedAt,
    };
    this.bundle = { ...this.bundle, record };
    return structuredClone(record);
  }

  async getActiveVersion(input: {
    credentialId: string;
    scopeId: string;
    projectId: string;
    version: number;
  }) {
    if (
      !this.bundle ||
      this.bundle.record.state !== 'active' ||
      this.bundle.record.activeVersion !== input.version ||
      this.bundle.record.credentialId !== input.credentialId ||
      this.bundle.record.scopeId !== input.scopeId ||
      this.bundle.record.projectId !== input.projectId
    ) {
      return null;
    }
    return structuredClone(this.bundle);
  }
}

function fakeCipher(): HostedCredentialEnvelopeCipher {
  const material = new Map<string, { plaintext: Uint8Array; aad: Uint8Array }>();
  return {
    async encrypt({ keyId, plaintext, additionalAuthenticatedData }) {
      const ciphertext = Buffer.from(`cipher-${material.size + 1}`).toString('base64url');
      material.set(ciphertext, {
        plaintext: new Uint8Array(plaintext),
        aad: new Uint8Array(additionalAuthenticatedData),
      });
      return {
        algorithm: 'test-envelope-v1',
        keyId,
        wrappedDataKey: Buffer.from('wrapped-key').toString('base64url'),
        nonce: Buffer.from('unique-nonce').toString('base64url'),
        ciphertext,
      };
    },
    async decrypt({ envelope, additionalAuthenticatedData }) {
      const stored = material.get(envelope.ciphertext);
      if (
        !stored ||
        Buffer.compare(Buffer.from(stored.aad), Buffer.from(additionalAuthenticatedData)) !== 0
      ) {
        throw new Error('authenticated data mismatch');
      }
      return new Uint8Array(stored.plaintext);
    },
  };
}

function resolver(store: HostedCredentialStore, cipher: HostedCredentialEnvelopeCipher) {
  return createHostedWorkerCredentialResolver({
    workerId: 'worker.primary',
    allowedScopeIds: ['workspace.acme'],
    allowedProjectIds: ['project.acme'],
    store,
    cipher,
  });
}

const context = {
  scopeId: 'workspace.acme',
  projectId: 'project.acme',
  connectionId: 'connection.google',
  provider: 'google',
  secretKind: 'oauth-refresh',
};

describe('hosted credential custody', () => {
  it('persists only an authenticated envelope and zeroes resolved material after use', async () => {
    const store = new MemoryCredentialStore();
    const cipher = fakeCipher();
    const plaintext = Buffer.from('provider-refresh-secret');
    const record = await createHostedCredential({
      credentialId: 'credential.google.primary',
      ...context,
      keyId: 'kms.primary',
      metadata: { accountLabel: 'Primary ads account' },
      plaintext,
      cipher,
      store,
      now: new Date('2026-08-04T00:00:00.000Z'),
    });

    expect(JSON.stringify(store.bundle)).not.toContain('provider-refresh-secret');
    expect(record).not.toHaveProperty('envelope');
    let borrowed: Uint8Array | undefined;
    const use = vi.fn(async (credential: Uint8Array) => {
      borrowed = credential;
      expect(Buffer.from(credential).toString()).toBe('provider-refresh-secret');
      return 'provider-call-complete';
    });
    await expect(
      resolver(store, cipher).withCredential({
        reference: { credentialId: record.credentialId, version: 1 },
        context,
        use,
      }),
    ).resolves.toBe('provider-call-complete');
    expect(use).toHaveBeenCalledOnce();
    expect(borrowed).toEqual(new Uint8Array(borrowed?.byteLength));
    expect(plaintext.toString()).toBe('provider-refresh-secret');
  });

  it('rejects stale versions after rotation and all versions after revocation', async () => {
    const store = new MemoryCredentialStore();
    const cipher = fakeCipher();
    const created = await createHostedCredential({
      credentialId: 'credential.google.primary',
      ...context,
      keyId: 'kms.primary',
      plaintext: Buffer.from('first-provider-secret'),
      cipher,
      store,
      now: new Date('2026-08-04T00:00:00.000Z'),
    });
    const rotated = await rotateHostedCredential({
      current: created,
      plaintext: Buffer.from('second-provider-secret'),
      keyId: 'kms.rotated',
      cipher,
      store,
      now: new Date('2026-08-04T01:00:00.000Z'),
    });
    const activeResolver = resolver(store, cipher);
    await expect(
      activeResolver.withCredential({
        reference: { credentialId: created.credentialId, version: 1 },
        context,
        use: async () => undefined,
      }),
    ).rejects.toMatchObject({ code: 'credential-unavailable' });
    await expect(
      activeResolver.withCredential({
        reference: { credentialId: rotated.credentialId, version: 2 },
        context,
        use: async (credential) => Buffer.from(credential).toString() === 'second-provider-secret',
      }),
    ).resolves.toBe(true);

    await expect(
      activeResolver.withCredential({
        reference: { credentialId: rotated.credentialId, version: 2 },
        context,
        use: async (credential) => Buffer.from(credential).toString(),
      }),
    ).rejects.toMatchObject({ code: 'credential-exposure-forbidden' });

    const revoked = await revokeHostedCredential({
      current: rotated,
      store,
      now: new Date('2026-08-04T02:00:00.000Z'),
    });
    expect(revoked).toMatchObject({ state: 'revoked', activeVersion: null, revision: 3 });
    await expect(
      activeResolver.withCredential({
        reference: { credentialId: rotated.credentialId, version: 2 },
        context,
        use: async () => undefined,
      }),
    ).rejects.toMatchObject({ code: 'credential-unavailable' });
  });

  it('rejects secret-shaped metadata and unauthorized project resolution', async () => {
    const store = new MemoryCredentialStore();
    const cipher = fakeCipher();
    await expect(
      createHostedCredential({
        credentialId: 'credential.google.primary',
        ...context,
        keyId: 'kms.primary',
        metadata: { accessToken: 'not-allowed' },
        plaintext: Buffer.from('provider-secret-value'),
        cipher,
        store,
      }),
    ).rejects.toThrow('Credential metadata');

    const record = await createHostedCredential({
      credentialId: 'credential.google.primary',
      ...context,
      keyId: 'kms.primary',
      plaintext: Buffer.from('provider-secret-value'),
      cipher,
      store,
    });
    await expect(
      resolver(store, cipher).withCredential({
        reference: { credentialId: record.credentialId, version: 1 },
        context: { ...context, projectId: 'project.other' },
        use: async () => undefined,
      }),
    ).rejects.toMatchObject({ code: 'credential-scope-forbidden' });
  });
});
