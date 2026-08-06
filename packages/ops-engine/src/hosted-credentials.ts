import { z } from 'zod';
import { OpsActionExecutionError } from './actions.js';

const stableIdSchema = z.string().regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/);
const isoTimestampSchema = z.string().datetime({ offset: true });
const base64UrlSchema = z
  .string()
  .min(1)
  .regex(/^[A-Za-z0-9_-]+$/);
const safeMetadataSchema = z.record(z.string().trim().min(1).max(200)).superRefine((value, ctx) => {
  for (const key of Object.keys(value)) {
    if (/(?:secret|token|password|credential|api.?key|private.?key)/i.test(key)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Credential metadata cannot contain secret-shaped fields.',
        path: [key],
      });
    }
  }
});

export const hostedCredentialRecordSchema = z
  .object({
    schemaVersion: z.literal(1),
    kind: z.literal('ops.hosted-credential'),
    credentialId: stableIdSchema,
    scopeId: stableIdSchema,
    projectId: stableIdSchema,
    connectionId: stableIdSchema,
    provider: stableIdSchema,
    secretKind: stableIdSchema,
    keyId: stableIdSchema,
    revision: z.number().int().positive(),
    activeVersion: z.number().int().positive().nullable(),
    state: z.enum(['active', 'revoked']),
    metadata: safeMetadataSchema,
    createdAt: isoTimestampSchema,
    updatedAt: isoTimestampSchema,
    revokedAt: isoTimestampSchema.nullable(),
  })
  .strict();
export type HostedCredentialRecord = z.infer<typeof hostedCredentialRecordSchema>;

export const hostedCredentialEnvelopeSchema = z
  .object({
    algorithm: stableIdSchema,
    keyId: stableIdSchema,
    wrappedDataKey: base64UrlSchema,
    nonce: base64UrlSchema,
    ciphertext: base64UrlSchema,
  })
  .strict();
export type HostedCredentialEnvelope = z.infer<typeof hostedCredentialEnvelopeSchema>;

export const hostedCredentialVersionSchema = z
  .object({
    schemaVersion: z.literal(1),
    kind: z.literal('ops.hosted-credential-version'),
    credentialId: stableIdSchema,
    version: z.number().int().positive(),
    envelope: hostedCredentialEnvelopeSchema,
    createdAt: isoTimestampSchema,
  })
  .strict();
export type HostedCredentialVersion = z.infer<typeof hostedCredentialVersionSchema>;

export interface HostedCredentialBundle {
  record: HostedCredentialRecord;
  version: HostedCredentialVersion;
}

export interface HostedCredentialEnvelopeCipher {
  encrypt(input: {
    keyId: string;
    plaintext: Uint8Array;
    additionalAuthenticatedData: Uint8Array;
  }): Promise<HostedCredentialEnvelope>;
  decrypt(input: {
    envelope: HostedCredentialEnvelope;
    additionalAuthenticatedData: Uint8Array;
  }): Promise<Uint8Array>;
}

export interface HostedCredentialStore {
  readonly durability: 'durable';
  readonly atomicLifecycle: true;
  create(bundle: HostedCredentialBundle): Promise<'stored' | 'conflict'>;
  rotate(input: {
    record: HostedCredentialRecord;
    version: HostedCredentialVersion;
    expectedRevision: number;
  }): Promise<'stored' | 'not-found' | 'conflict'>;
  revoke(input: {
    credentialId: string;
    scopeId: string;
    projectId: string;
    expectedRevision: number;
    revokedAt: string;
  }): Promise<HostedCredentialRecord | 'not-found' | 'conflict'>;
  getActiveVersion(input: {
    credentialId: string;
    scopeId: string;
    projectId: string;
    version: number;
  }): Promise<HostedCredentialBundle | null>;
}

export interface HostedCredentialReference {
  credentialId: string;
  version: number;
}

export interface HostedWorkerCredentialContext {
  scopeId: string;
  projectId: string;
  connectionId: string;
  provider: string;
  secretKind: string;
}

export interface HostedWorkerCredentialResolver {
  withCredential<T>(input: {
    reference: HostedCredentialReference;
    context: HostedWorkerCredentialContext;
    use(credential: Uint8Array): Promise<T>;
  }): Promise<T>;
}

function credentialAad(record: HostedCredentialRecord, version: number): Uint8Array {
  return new TextEncoder().encode(
    JSON.stringify({
      schemaVersion: 1,
      credentialId: record.credentialId,
      scopeId: record.scopeId,
      projectId: record.projectId,
      connectionId: record.connectionId,
      provider: record.provider,
      secretKind: record.secretKind,
      version,
    }),
  );
}

function credentialText(plaintext: Uint8Array): string | null {
  try {
    const value = new TextDecoder('utf-8', { fatal: true }).decode(plaintext);
    return value.length > 0 ? value : null;
  } catch {
    return null;
  }
}

function assertCredentialNotReturned(
  value: unknown,
  plaintext: Uint8Array,
  seen = new WeakSet<object>(),
): void {
  const text = credentialText(plaintext);
  if (typeof value === 'string' && text && value.includes(text)) {
    throw new OpsActionExecutionError(
      'credential-exposure-forbidden',
      'Credential material cannot leave the worker credential callback.',
    );
  }
  if (value instanceof Uint8Array) {
    if (
      value.byteLength === plaintext.byteLength &&
      value.every((byte, index) => byte === plaintext[index])
    ) {
      throw new OpsActionExecutionError(
        'credential-exposure-forbidden',
        'Credential material cannot leave the worker credential callback.',
      );
    }
    return;
  }
  if (!value || typeof value !== 'object' || seen.has(value)) return;
  seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((entry) => assertCredentialNotReturned(entry, plaintext, seen));
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    if (/(?:secret|token|password|credential|api.?key|private.?key)/i.test(key)) {
      throw new OpsActionExecutionError(
        'credential-exposure-forbidden',
        'Credential-shaped fields cannot leave the worker credential callback.',
      );
    }
    assertCredentialNotReturned(child, plaintext, seen);
  }
}

async function encryptVersion(input: {
  record: HostedCredentialRecord;
  version: number;
  plaintext: Uint8Array;
  cipher: HostedCredentialEnvelopeCipher;
  createdAt: string;
}): Promise<HostedCredentialVersion> {
  if (input.plaintext.byteLength < 16 || input.plaintext.byteLength > 65_536) {
    throw new OpsActionExecutionError(
      'credential-size-invalid',
      'Credential material must use the supported bounded size.',
    );
  }
  const copy = new Uint8Array(input.plaintext);
  try {
    const envelope = hostedCredentialEnvelopeSchema.parse(
      await input.cipher.encrypt({
        keyId: input.record.keyId,
        plaintext: copy,
        additionalAuthenticatedData: credentialAad(input.record, input.version),
      }),
    );
    if (envelope.keyId !== input.record.keyId) {
      throw new OpsActionExecutionError(
        'credential-key-mismatch',
        'The credential envelope key identity does not match the credential record.',
      );
    }
    return hostedCredentialVersionSchema.parse({
      schemaVersion: 1,
      kind: 'ops.hosted-credential-version',
      credentialId: input.record.credentialId,
      version: input.version,
      envelope,
      createdAt: input.createdAt,
    });
  } finally {
    copy.fill(0);
  }
}

export async function createHostedCredential(input: {
  credentialId: string;
  scopeId: string;
  projectId: string;
  connectionId: string;
  provider: string;
  secretKind: string;
  keyId: string;
  metadata?: Record<string, string>;
  plaintext: Uint8Array;
  cipher: HostedCredentialEnvelopeCipher;
  store: HostedCredentialStore;
  now?: Date;
}): Promise<HostedCredentialRecord> {
  const now = (input.now ?? new Date()).toISOString();
  const record = hostedCredentialRecordSchema.parse({
    schemaVersion: 1,
    kind: 'ops.hosted-credential',
    credentialId: input.credentialId,
    scopeId: input.scopeId,
    projectId: input.projectId,
    connectionId: input.connectionId,
    provider: input.provider,
    secretKind: input.secretKind,
    keyId: input.keyId,
    revision: 1,
    activeVersion: 1,
    state: 'active',
    metadata: input.metadata ?? {},
    createdAt: now,
    updatedAt: now,
    revokedAt: null,
  });
  const version = await encryptVersion({
    record,
    version: 1,
    plaintext: input.plaintext,
    cipher: input.cipher,
    createdAt: now,
  });
  const result = await input.store.create({ record, version });
  if (result === 'conflict') {
    throw new OpsActionExecutionError(
      'credential-identity-conflict',
      'The credential identity is already bound to different metadata.',
    );
  }
  return record;
}

export async function rotateHostedCredential(input: {
  current: HostedCredentialRecord;
  plaintext: Uint8Array;
  keyId?: string;
  cipher: HostedCredentialEnvelopeCipher;
  store: HostedCredentialStore;
  now?: Date;
}): Promise<HostedCredentialRecord> {
  const current = hostedCredentialRecordSchema.parse(input.current);
  if (current.state !== 'active' || current.activeVersion === null) {
    throw new OpsActionExecutionError(
      'credential-revoked',
      'The credential is revoked and cannot be rotated.',
    );
  }
  const now = (input.now ?? new Date()).toISOString();
  const versionNumber = current.activeVersion + 1;
  const rotated = hostedCredentialRecordSchema.parse({
    ...current,
    keyId: input.keyId ?? current.keyId,
    revision: current.revision + 1,
    activeVersion: versionNumber,
    updatedAt: now,
  });
  const version = await encryptVersion({
    record: rotated,
    version: versionNumber,
    plaintext: input.plaintext,
    cipher: input.cipher,
    createdAt: now,
  });
  const result = await input.store.rotate({
    record: rotated,
    version,
    expectedRevision: current.revision,
  });
  if (result === 'not-found') {
    throw new OpsActionExecutionError('credential-not-found', 'The credential was not found.');
  }
  if (result === 'conflict') {
    throw new OpsActionExecutionError(
      'credential-rotation-conflict',
      'The credential changed before rotation.',
      true,
    );
  }
  return rotated;
}

export async function revokeHostedCredential(input: {
  current: HostedCredentialRecord;
  store: HostedCredentialStore;
  now?: Date;
}): Promise<HostedCredentialRecord> {
  const current = hostedCredentialRecordSchema.parse(input.current);
  if (current.state === 'revoked') return current;
  const revokedAt = (input.now ?? new Date()).toISOString();
  const result = await input.store.revoke({
    credentialId: current.credentialId,
    scopeId: current.scopeId,
    projectId: current.projectId,
    expectedRevision: current.revision,
    revokedAt,
  });
  if (result === 'not-found') {
    throw new OpsActionExecutionError('credential-not-found', 'The credential was not found.');
  }
  if (result === 'conflict') {
    throw new OpsActionExecutionError(
      'credential-revocation-conflict',
      'The credential changed before revocation.',
      true,
    );
  }
  return hostedCredentialRecordSchema.parse(result);
}

export function createHostedWorkerCredentialResolver(input: {
  workerId: string;
  allowedScopeIds: readonly string[];
  allowedProjectIds: readonly string[];
  store: HostedCredentialStore;
  cipher: HostedCredentialEnvelopeCipher;
}): HostedWorkerCredentialResolver {
  stableIdSchema.parse(input.workerId);
  input.allowedScopeIds.forEach((value) => stableIdSchema.parse(value));
  input.allowedProjectIds.forEach((value) => stableIdSchema.parse(value));
  return {
    async withCredential<T>({
      reference,
      context,
      use,
    }: {
      reference: HostedCredentialReference;
      context: HostedWorkerCredentialContext;
      use(credential: Uint8Array): Promise<T>;
    }): Promise<T> {
      const parsedReference = z
        .object({ credentialId: stableIdSchema, version: z.number().int().positive() })
        .strict()
        .parse(reference);
      const parsedContext = z
        .object({
          scopeId: stableIdSchema,
          projectId: stableIdSchema,
          connectionId: stableIdSchema,
          provider: stableIdSchema,
          secretKind: stableIdSchema,
        })
        .strict()
        .parse(context);
      if (
        !input.allowedScopeIds.includes(parsedContext.scopeId) ||
        !input.allowedProjectIds.includes(parsedContext.projectId)
      ) {
        throw new OpsActionExecutionError(
          'credential-scope-forbidden',
          'The worker is not allowed to resolve this credential scope.',
        );
      }
      const bundle = await input.store.getActiveVersion({
        credentialId: parsedReference.credentialId,
        scopeId: parsedContext.scopeId,
        projectId: parsedContext.projectId,
        version: parsedReference.version,
      });
      if (!bundle) {
        throw new OpsActionExecutionError(
          'credential-unavailable',
          'The requested credential version is not available.',
        );
      }
      const record = hostedCredentialRecordSchema.parse(bundle.record);
      const version = hostedCredentialVersionSchema.parse(bundle.version);
      if (
        record.connectionId !== parsedContext.connectionId ||
        record.provider !== parsedContext.provider ||
        record.secretKind !== parsedContext.secretKind ||
        record.state !== 'active' ||
        record.activeVersion !== parsedReference.version ||
        version.credentialId !== record.credentialId ||
        version.envelope.keyId !== record.keyId
      ) {
        throw new OpsActionExecutionError(
          'credential-context-mismatch',
          'The credential does not match the authorized provider connection.',
        );
      }
      const plaintext = await input.cipher.decrypt({
        envelope: version.envelope,
        additionalAuthenticatedData: credentialAad(record, version.version),
      });
      if (!(plaintext instanceof Uint8Array) || plaintext.byteLength === 0) {
        throw new OpsActionExecutionError(
          'credential-decryption-failed',
          'The credential could not be resolved.',
        );
      }
      try {
        const result = await use(plaintext);
        assertCredentialNotReturned(result, plaintext);
        return result;
      } finally {
        plaintext.fill(0);
      }
    },
  };
}
