import { z } from 'zod';

const identifier = z.string().regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/);
const reference = z.string().regex(/^src\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_.-]+\.ts$/);
const description = z.string().trim().min(1).max(500);

export const metaCapabilitySchema = z
  .object({
    id: identifier,
    family: z.enum(['connection', 'advertising', 'measurement', 'catalog']),
    title: z.string().trim().min(1).max(100),
    effect: z.enum(['offline', 'read-network', 'write-network']),
    implementation: z.enum(['implemented', 'partial', 'not-implemented']),
    implementationReferences: z.array(reference).max(10),
    verification: z.enum(['fixture-proven', 'not-verified']),
    verificationReferences: z
      .array(
        reference.refine((value) => value.endsWith('.test.ts'), {
          message: 'Fixture evidence must reference a test file.',
        }),
      )
      .max(10),
    hostOperations: z.array(identifier).max(10),
    requirements: z
      .array(
        z.enum([
          'canonical-connection',
          'selected-resources',
          'host-credential-binding',
          'adopter-observations',
          'provider-api-verification',
          'live-verification',
          'durable-mutation-state',
          'human-approval',
        ]),
      )
      .max(8),
    summary: description,
    nextStep: description,
  })
  .strict()
  .superRefine((value, context) => {
    const issue = (path: string, message: string) =>
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: [path],
        message,
      });
    if (
      (value.implementation !== 'not-implemented') !==
      value.implementationReferences.length > 0
    ) {
      issue(
        'implementationReferences',
        'Implemented or partial capabilities require source references; missing capabilities cannot claim source implementation.',
      );
    }
    if ((value.verification === 'fixture-proven') !== value.verificationReferences.length > 0) {
      issue(
        'verificationReferences',
        'Fixture proof requires test references; unverified capabilities cannot claim proof references.',
      );
    }
    if (value.implementation === 'not-implemented' && value.verification !== 'not-verified') {
      issue('verification', 'Missing implementation cannot be fixture-proven.');
    }
    for (const key of [
      'implementationReferences',
      'verificationReferences',
      'hostOperations',
      'requirements',
    ] as const) {
      if (new Set(value[key]).size !== value[key].length)
        issue(key, 'Duplicate entries are not allowed.');
    }
  });
export type MetaCapability = z.infer<typeof metaCapabilitySchema>;

export const metaCapabilityInventorySchema = z
  .object({
    schemaVersion: z.literal(2),
    provider: z.literal('meta'),
    basis: z.literal('source-inventory'),
    accountReadiness: z.literal('not-evaluated'),
    capabilities: z.array(metaCapabilitySchema).min(1).max(50),
  })
  .strict()
  .superRefine((value, context) => {
    const ids = new Set<string>();
    value.capabilities.forEach((capability, index) => {
      if (ids.has(capability.id))
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['capabilities', index, 'id'],
          message: 'Capability IDs must be unique.',
        });
      ids.add(capability.id);
    });
  });
export type MetaCapabilityInventory = z.infer<typeof metaCapabilityInventorySchema>;
