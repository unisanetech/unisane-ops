import { spawnSync } from 'node:child_process';
import { z } from 'zod';
import { metaCredentialBindingSchema } from './connection.js';
import type { MetaHostCredentialResolver } from './credential-execution.js';

export const META_KEYCHAIN_SERVICE = 'dev.unisane.meta-connection';
export const META_KEYCHAIN_CHUNK_MANIFEST_PREFIX = 'unisane-meta-keychain:v1';
export const META_KEYCHAIN_CHUNK_BYTES = 96;
const stableIdSchema = z.string().regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/);
const referenceSchema = z
  .object({
    credentialId: stableIdSchema,
    version: z.number().int().positive(),
  })
  .strict();
const contextSchema = z
  .object({
    scopeId: stableIdSchema,
    projectId: stableIdSchema,
    environmentId: stableIdSchema,
    connectionId: stableIdSchema,
    provider: z.literal('meta'),
    secretKind: z.literal('meta-graph-access'),
  })
  .strict();

export type MetaCredentialReference = z.infer<typeof referenceSchema>;
export type MetaCredentialContext = z.infer<typeof contextSchema>;

export interface MetaLocalCredentialSource {
  read(input: {
    reference: MetaCredentialReference;
    context: MetaCredentialContext;
  }): Uint8Array | null;
}

export interface MetaKeychainCommandRunner {
  run(args: readonly string[]): {
    status: number | null;
    stdout: Uint8Array | null;
  };
}

export function metaKeychainAccount(input: {
  reference: MetaCredentialReference;
  context: MetaCredentialContext;
}): string {
  return [
    input.context.scopeId,
    input.context.projectId,
    input.context.environmentId,
    input.context.connectionId,
    input.reference.credentialId,
    `v${input.reference.version}`,
  ].join(':');
}

export function metaKeychainChunkAccount(baseAccount: string, index: number): string {
  return `${baseAccount}:chunk:${String(index).padStart(3, '0')}`;
}

function trimmedCredential(bytes: Uint8Array): Uint8Array {
  let start = 0;
  let end = bytes.byteLength;
  while (start < end && (bytes[start] === 10 || bytes[start] === 13 || bytes[start] === 32)) {
    start += 1;
  }
  while (end > start && (bytes[end - 1] === 10 || bytes[end - 1] === 13 || bytes[end - 1] === 32)) {
    end -= 1;
  }
  return bytes.slice(start, end);
}

function chunkManifest(bytes: Uint8Array): { count: number; byteLength: number } | null {
  const text = new TextDecoder().decode(bytes);
  const match = text.match(
    new RegExp(`^${META_KEYCHAIN_CHUNK_MANIFEST_PREFIX.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}:(\\d+):(\\d+)$`),
  );
  if (!match) return null;
  const count = Number(match[1]);
  const byteLength = Number(match[2]);
  if (
    !Number.isInteger(count) ||
    count < 1 ||
    count > 512 ||
    !Number.isInteger(byteLength) ||
    byteLength < 1 ||
    byteLength > 16_384
  ) {
    return null;
  }
  return { count, byteLength };
}

function defaultKeychainRunner(): MetaKeychainCommandRunner {
  return {
    run(args) {
      const result = spawnSync('/usr/bin/security', [...args], {
        encoding: null,
        maxBuffer: 20_000,
      });
      return {
        status: result.status,
        stdout: result.stdout instanceof Uint8Array ? result.stdout : null,
      };
    },
  };
}

export function createMacOsMetaKeychainCredentialSource(
  input: {
    platform?: NodeJS.Platform;
    runner?: MetaKeychainCommandRunner;
  } = {},
): MetaLocalCredentialSource {
  const platform = input.platform ?? process.platform;
  const runner = input.runner ?? defaultKeychainRunner();
  return {
    read(untrusted) {
      if (platform !== 'darwin') {
        throw new Error(
          '[META_CONNECTION_KEYCHAIN_UNAVAILABLE] Local Meta credential resolution currently requires macOS Keychain.',
        );
      }
      const reference = referenceSchema.parse(untrusted.reference);
      const context = contextSchema.parse(untrusted.context);
      const baseAccount = metaKeychainAccount({ reference, context });
      const result = runner.run([
        'find-generic-password',
        '-a',
        baseAccount,
        '-s',
        META_KEYCHAIN_SERVICE,
        '-w',
      ]);
      if (result.status !== 0 || !result.stdout) {
        result.stdout?.fill(0);
        throw new Error(
          '[META_CONNECTION_CREDENTIAL_UNAVAILABLE] The bound local Meta credential is unavailable.',
        );
      }
      try {
        const baseValue = trimmedCredential(result.stdout);
        const manifest = chunkManifest(baseValue);
        if (!manifest) {
          // `spawnSync` returns a Buffer on Node. Buffer#slice() is a shared
          // view, so clearing stdout in the finally block would also clear the
          // returned credential. Uint8Array.from() guarantees an owned copy.
          const credential = Uint8Array.from(baseValue);
          if (credential.byteLength === 0 || credential.byteLength > 16_384) {
            credential.fill(0);
            throw new Error(
              '[META_CONNECTION_CREDENTIAL_INVALID] The bound local Meta credential has an invalid size.',
            );
          }
          return credential;
        }

        const encodedParts: Uint8Array[] = [];
        try {
          for (let index = 0; index < manifest.count; index += 1) {
            const partResult = runner.run([
              'find-generic-password',
              '-a',
              metaKeychainChunkAccount(baseAccount, index),
              '-s',
              META_KEYCHAIN_SERVICE,
              '-w',
            ]);
            if (partResult.status !== 0 || !partResult.stdout) {
              partResult.stdout?.fill(0);
              throw new Error(
                '[META_CONNECTION_CREDENTIAL_UNAVAILABLE] The bound local Meta credential is unavailable.',
              );
            }
            try {
              // Copy before clearing the Keychain process output. A Buffer
              // slice would otherwise share the same backing memory.
              encodedParts.push(Uint8Array.from(trimmedCredential(partResult.stdout)));
            } finally {
              partResult.stdout.fill(0);
            }
          }
          const encoded = Buffer.concat(encodedParts.map((part) => Buffer.from(part)));
          const credential = Buffer.from(encoded.toString('utf8'), 'base64');
          encoded.fill(0);
          if (credential.byteLength !== manifest.byteLength) {
            credential.fill(0);
            throw new Error(
              '[META_CONNECTION_CREDENTIAL_INVALID] The bound local Meta credential has an invalid size.',
            );
          }
          return credential;
        } finally {
          for (const part of encodedParts) part.fill(0);
        }
      } finally {
        result.stdout.fill(0);
      }
    },
  };
}

function credentialText(credential: Uint8Array): string | null {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(credential) || null;
  } catch {
    return null;
  }
}

function assertCredentialNotExposed(
  value: unknown,
  credential: Uint8Array,
  seen = new WeakSet<object>(),
  allowCredentialMetadataFields = false,
): void {
  const text = credentialText(credential);
  if (typeof value === 'string' && text && value.includes(text)) {
    throw new Error(
      '[META_CONNECTION_CREDENTIAL_EXPOSURE_FORBIDDEN] Credential material cannot leave the local callback.',
    );
  }
  if (value instanceof Uint8Array) {
    if (
      value.byteLength === credential.byteLength &&
      value.every((byte, index) => byte === credential[index])
    ) {
      throw new Error(
        '[META_CONNECTION_CREDENTIAL_EXPOSURE_FORBIDDEN] Credential material cannot leave the local callback.',
      );
    }
    return;
  }
  if (!value || typeof value !== 'object' || seen.has(value)) return;
  seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((entry) => assertCredentialNotExposed(entry, credential, seen));
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    const credentialMetadata =
      key === 'credential' && metaCredentialBindingSchema.safeParse(child).success;
    if (
      /(?:secret|token|password|credential|api.?key|private.?key)/i.test(key) &&
      !allowCredentialMetadataFields &&
      !credentialMetadata
    ) {
      throw new Error(
        '[META_CONNECTION_CREDENTIAL_EXPOSURE_FORBIDDEN] Credential-shaped fields cannot leave the local callback.',
      );
    }
    assertCredentialNotExposed(child, credential, seen, credentialMetadata);
  }
}

export function createLocalMetaCredentialResolver(input: {
  source: MetaLocalCredentialSource;
}): MetaHostCredentialResolver {
  return {
    async withCredential({ reference: rawReference, context: rawContext, use }) {
      const reference = referenceSchema.parse(rawReference);
      const context = contextSchema.parse(rawContext);
      const credential: unknown = input.source.read({ reference, context });
      if (!credential) {
        throw new Error(
          '[META_CONNECTION_CREDENTIAL_UNAVAILABLE] The bound local Meta credential is unavailable.',
        );
      }
      if (
        !(credential instanceof Uint8Array) ||
        credential.byteLength === 0 ||
        credential.byteLength > 16_384
      ) {
        if (credential instanceof Uint8Array) credential.fill(0);
        throw new Error(
          '[META_CONNECTION_CREDENTIAL_INVALID] The bound local Meta credential is invalid.',
        );
      }
      try {
        const result = await use(credential);
        assertCredentialNotExposed(result, credential);
        return result;
      } catch (error) {
        try {
          if (error instanceof Error) {
            assertCredentialNotExposed(error.message, credential);
          } else {
            assertCredentialNotExposed(error, credential);
          }
        } catch {
          throw new Error(
            '[META_CONNECTION_CREDENTIAL_CALLBACK_FAILED] The local Meta credential callback failed safely.',
          );
        }
        throw error;
      } finally {
        credential.fill(0);
      }
    },
  };
}

export function createMacOsMetaCredentialResolver(): MetaHostCredentialResolver {
  return createLocalMetaCredentialResolver({
    source: createMacOsMetaKeychainCredentialSource(),
  });
}
