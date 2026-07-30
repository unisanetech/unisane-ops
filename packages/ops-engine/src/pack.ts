import { z } from 'zod';
import { hashOpsValue } from './safety.js';

const stableIdSchema = z.string().regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/);
const packageNameSchema = z.string().regex(/^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/);
const semverSchema = z.string().regex(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/);
const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/);
const commandPathSchema = z.array(z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)).min(1);

export const packCommandDescriptorSchema = z
  .object({
    id: stableIdSchema,
    path: commandPathSchema,
    handler: z
      .object({
        exportPath: z.string().regex(/^\.\/[a-z0-9][a-z0-9./-]*$/),
        exportName: z.string().regex(/^[A-Za-z_$][A-Za-z0-9_$]*$/),
      })
      .strict(),
    maximumEffect: z.enum(['offline', 'read-network', 'write', 'spend-impact']),
    writeTargets: z.array(z.enum(['project', 'secret-store', 'remote'])),
    artifactClasses: z.array(stableIdSchema),
    riskGuards: z.array(
      z.enum(['production', 'security-sensitive', 'destructive', 'irreversible', 'publish']),
    ),
    json: z.boolean(),
  })
  .strict();
export type PackCommandDescriptor = z.infer<typeof packCommandDescriptorSchema>;

export const packCommandResultSchema = z
  .object({
    schemaVersion: z.literal(1),
    command: stableIdSchema,
    pack: stableIdSchema,
    maximumEffect: z.enum(['offline', 'read-network', 'write', 'spend-impact']),
    actualEffect: z.enum(['offline', 'read-network', 'write', 'spend-impact']),
    writeTargets: z.array(z.enum(['project', 'secret-store', 'remote'])),
    riskGuards: z.array(
      z.enum(['production', 'security-sensitive', 'destructive', 'irreversible', 'publish']),
    ),
    status: z.enum(['ok', 'failed', 'invalid', 'attention', 'blocked', 'approval-required']),
    result: z.unknown(),
    diagnostics: z.array(z.string()),
    artifacts: z.array(z.string()),
    nextActions: z.array(z.string()),
    presentation: z
      .object({
        stdout: z.string(),
        stderr: z.string(),
      })
      .strict()
      .optional(),
  })
  .strict();
export type PackCommandResult = z.infer<typeof packCommandResultSchema>;

const packManifestPayloadSchema = z
  .object({
    schemaVersion: z.literal(1),
    kind: z.literal('unisane.pack-manifest'),
    packId: stableIdSchema,
    packageName: packageNameSchema,
    version: semverSchema,
    packApiVersion: z.literal(1),
    trust: z.literal('first-party'),
    commands: z.array(packCommandDescriptorSchema),
    configNamespaces: z.array(stableIdSchema),
    addItemTypes: z.array(stableIdSchema),
    capabilities: z.array(stableIdSchema),
    providerBindings: z.array(stableIdSchema),
    reservedRootNames: z.array(stableIdSchema),
    reservedRootContributors: z
      .array(
        z
          .object({
            root: stableIdSchema,
            packId: stableIdSchema,
          })
          .strict(),
      )
      .optional(),
  })
  .strict();

export const packManifestSchema = packManifestPayloadSchema
  .extend({
    integrity: z
      .object({
        algorithm: z.literal('sha256'),
        manifestHash: sha256Schema,
      })
      .strict(),
  })
  .strict();
export type PackManifest = z.infer<typeof packManifestSchema>;
export type PackManifestPayload = z.infer<typeof packManifestPayloadSchema>;

export interface PackSelection {
  packageName: string;
  installedVersion: string;
  trustedPackageNames: readonly string[];
}

export interface PackCommandContext {
  argv: readonly string[];
  cwd: string;
  manifests: readonly PackManifest[];
  json?: boolean;
  selection?: {
    command: PackCommandDescriptor;
    packId: string;
  };
  runtime?: PackCommandRuntime;
}

export interface PackCommandRuntime {
  resolveBinding(bindingId: string, request: unknown): Promise<unknown>;
}

export type PackCommandHandler = (
  context: PackCommandContext,
) => PackCommandResult | Promise<PackCommandResult>;

function parseCapturedOutput(stdout: string): unknown {
  const trimmed = stdout.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return trimmed;
  }
}

function capturedExitCode(error: unknown): number | null {
  if (
    typeof error === 'object' &&
    error !== null &&
    'exitCode' in error &&
    typeof error.exitCode === 'number'
  ) {
    return error.exitCode;
  }
  return null;
}

export async function runCapturedPackCommand(
  context: PackCommandContext,
  run: () => Promise<void>,
): Promise<PackCommandResult> {
  const selection = context.selection;
  if (!selection) {
    throw new Error(
      '[OPS_PACK_COMMAND_SELECTION_MISSING] Captured commands require exact pack selection context.',
    );
  }

  const stdoutWrite = process.stdout.write.bind(process.stdout);
  const stderrWrite = process.stderr.write.bind(process.stderr);
  const previousExitCode = process.exitCode;
  let stdout = '';
  let stderr = '';
  let exitCode = 0;
  process.exitCode = undefined;
  process.stdout.write = ((chunk: unknown) => {
    stdout += String(chunk);
    return true;
  }) as typeof process.stdout.write;
  process.stderr.write = ((chunk: unknown) => {
    stderr += String(chunk);
    return true;
  }) as typeof process.stderr.write;
  try {
    await run();
    exitCode = typeof process.exitCode === 'number' ? process.exitCode : 0;
  } catch (error) {
    exitCode = capturedExitCode(error) ?? 1;
    if (capturedExitCode(error) === null) {
      stderr += `${error instanceof Error ? error.message : String(error)}\n`;
    }
  } finally {
    process.stdout.write = stdoutWrite;
    process.stderr.write = stderrWrite;
    process.exitCode = previousExitCode;
  }

  return {
    schemaVersion: 1,
    command: selection.command.id,
    pack: selection.packId,
    maximumEffect: selection.command.maximumEffect,
    actualEffect: selection.command.maximumEffect,
    writeTargets: selection.command.writeTargets,
    riskGuards: selection.command.riskGuards,
    status: exitCode === 0 ? 'ok' : 'failed',
    result: {
      exitCode,
      output: parseCapturedOutput(stdout),
    },
    diagnostics: context.json && stderr.trim().length > 0 ? [stderr.trim()] : [],
    artifacts: [],
    nextActions: [],
    ...(context.json
      ? {}
      : {
          presentation: {
            stdout,
            stderr,
          },
        }),
  };
}

function payloadOf(manifest: PackManifest): PackManifestPayload {
  return packManifestPayloadSchema.parse(
    Object.fromEntries(Object.entries(manifest).filter(([key]) => key !== 'integrity')),
  );
}

export function sealPackManifest(input: PackManifestPayload): PackManifest {
  const payload = packManifestPayloadSchema.parse(input);
  return packManifestSchema.parse({
    ...payload,
    integrity: {
      algorithm: 'sha256',
      manifestHash: hashOpsValue(payload),
    },
  });
}

export function verifyPackManifestIntegrity(
  input: unknown,
  selection: PackSelection,
): PackManifest {
  const manifest = packManifestSchema.parse(input);
  if (!selection.trustedPackageNames.includes(manifest.packageName)) {
    throw new Error(`[OPS_PACK_UNTRUSTED] Package '${manifest.packageName}' is not trusted.`);
  }
  if (manifest.packageName !== selection.packageName) {
    throw new Error('[OPS_PACK_PACKAGE_MISMATCH] Manifest package does not match selection.');
  }
  if (manifest.version !== selection.installedVersion) {
    throw new Error('[OPS_PACK_VERSION_MISMATCH] Manifest version does not match installation.');
  }
  if (hashOpsValue(payloadOf(manifest)) !== manifest.integrity.manifestHash) {
    throw new Error('[OPS_PACK_INTEGRITY_MISMATCH] Manifest hash verification failed.');
  }
  return manifest;
}

function duplicate(values: readonly string[]): string | null {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) return value;
    seen.add(value);
  }
  return null;
}

export function validatePackGraph(manifests: readonly PackManifest[]): readonly PackManifest[] {
  const collisionFamilies: ReadonlyArray<[string, readonly string[]]> = [
    ['pack id', manifests.map((manifest) => manifest.packId)],
    ['command id', manifests.flatMap((manifest) => manifest.commands.map((command) => command.id))],
    [
      'command path',
      manifests.flatMap((manifest) => manifest.commands.map((command) => command.path.join(' '))),
    ],
    ['config namespace', manifests.flatMap((manifest) => manifest.configNamespaces)],
    ['add item type', manifests.flatMap((manifest) => manifest.addItemTypes)],
    ['capability', manifests.flatMap((manifest) => manifest.capabilities)],
    ['provider binding', manifests.flatMap((manifest) => manifest.providerBindings)],
    ['reserved root name', manifests.flatMap((manifest) => manifest.reservedRootNames)],
  ];
  for (const [family, values] of collisionFamilies) {
    const value = duplicate(values);
    if (value) throw new Error(`[OPS_PACK_COLLISION] Duplicate ${family}: ${value}`);
  }
  for (const manifest of manifests) {
    const contributorBindings = manifest.reservedRootContributors ?? [];
    const duplicateContributor = duplicate(
      contributorBindings.map((binding) => `${binding.root}:${binding.packId}`),
    );
    if (duplicateContributor) {
      throw new Error(
        `[OPS_PACK_COLLISION] Duplicate reserved root contributor: ${duplicateContributor}`,
      );
    }
    for (const binding of contributorBindings) {
      if (!manifest.reservedRootNames.includes(binding.root)) {
        throw new Error(
          `[OPS_PACK_RESERVATION_INVALID] Contributor binding '${binding.root}' is not a reserved root of pack '${manifest.packId}'.`,
        );
      }
      if (binding.packId === manifest.packId) {
        throw new Error(
          `[OPS_PACK_RESERVATION_INVALID] Pack '${manifest.packId}' cannot contribute to its own reserved root '${binding.root}'.`,
        );
      }
    }
    for (const command of manifest.commands) {
      const root = command.path[0]!;
      for (const owner of manifests) {
        const contributorAllowed = owner.reservedRootContributors?.some(
          (binding) => binding.root === root && binding.packId === manifest.packId,
        );
        if (
          owner.packId !== manifest.packId &&
          owner.reservedRootNames.includes(root) &&
          !contributorAllowed
        ) {
          throw new Error(
            `[OPS_PACK_COLLISION] Command root '${root}' is reserved by pack '${owner.packId}'.`,
          );
        }
      }
    }
  }
  return manifests;
}

export function resolvePackCommand(
  manifests: readonly PackManifest[],
  argv: readonly string[],
): { manifest: PackManifest; command: PackCommandDescriptor; args: readonly string[] } | null {
  const matches = manifests.flatMap((manifest) =>
    manifest.commands
      .filter((command) => command.path.every((segment, index) => argv[index] === segment))
      .map((command) => ({ manifest, command, args: argv.slice(command.path.length) })),
  );
  matches.sort((left, right) => right.command.path.length - left.command.path.length);
  if (!matches[0]) return null;
  if (matches[1] && matches[1].command.path.length === matches[0].command.path.length) {
    throw new Error('[OPS_PACK_COMMAND_AMBIGUOUS] Multiple commands match argv.');
  }
  return matches[0];
}

export function resolveAddItemContributor(
  manifests: readonly PackManifest[],
  itemType: string,
): PackManifest | null {
  const matches = manifests.filter((manifest) => manifest.addItemTypes.includes(itemType));
  if (matches.length > 1) {
    throw new Error(`[OPS_PACK_ADD_ITEM_AMBIGUOUS] Multiple packs contribute '${itemType}'.`);
  }
  return matches[0] ?? null;
}

export function resolveProviderBindingContributor(
  manifests: readonly PackManifest[],
  provider: string,
): PackManifest | null {
  const matches = manifests.filter((manifest) => manifest.providerBindings.includes(provider));
  if (matches.length > 1) {
    throw new Error(
      `[OPS_PACK_PROVIDER_BINDING_AMBIGUOUS] Multiple packs bind provider '${provider}'.`,
    );
  }
  return matches[0] ?? null;
}

const EFFECT_ORDER = ['offline', 'read-network', 'write', 'spend-impact'] as const;

export function assertPackCommandResult(
  descriptor: PackCommandDescriptor,
  input: unknown,
): PackCommandResult {
  const result = packCommandResultSchema.parse(input);
  if (result.command !== descriptor.id || result.maximumEffect !== descriptor.maximumEffect) {
    throw new Error(
      '[OPS_PACK_HANDLER_RESULT_MISMATCH] Handler result identity/effect is invalid.',
    );
  }
  if (EFFECT_ORDER.indexOf(result.actualEffect) > EFFECT_ORDER.indexOf(descriptor.maximumEffect)) {
    throw new Error('[OPS_PACK_HANDLER_EFFECT_EXCEEDED] Handler exceeded its declared effect.');
  }
  if (result.writeTargets.some((target) => !descriptor.writeTargets.includes(target))) {
    throw new Error(
      '[OPS_PACK_HANDLER_WRITE_TARGET_EXCEEDED] Handler reported an undeclared write target.',
    );
  }
  if (result.riskGuards.some((guard) => !descriptor.riskGuards.includes(guard))) {
    throw new Error(
      '[OPS_PACK_HANDLER_RISK_GUARD_MISMATCH] Handler reported an undeclared risk guard.',
    );
  }
  return result;
}

export function mergeCommandEffects(
  descriptors: readonly PackCommandDescriptor[],
): Pick<PackCommandDescriptor, 'maximumEffect' | 'writeTargets' | 'riskGuards'> {
  if (descriptors.length === 0) {
    throw new Error('[OPS_PACK_EFFECT_EMPTY] At least one command descriptor is required.');
  }
  return {
    maximumEffect: descriptors.reduce(
      (current, descriptor) =>
        EFFECT_ORDER.indexOf(descriptor.maximumEffect) > EFFECT_ORDER.indexOf(current)
          ? descriptor.maximumEffect
          : current,
      'offline' as PackCommandDescriptor['maximumEffect'],
    ),
    writeTargets: [...new Set(descriptors.flatMap((descriptor) => descriptor.writeTargets))],
    riskGuards: [...new Set(descriptors.flatMap((descriptor) => descriptor.riskGuards))],
  };
}
