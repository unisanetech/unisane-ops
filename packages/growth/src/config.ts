import { z } from 'zod';

const stableIdSchema = z.string().regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/);
const projectRelativePathSchema = z
  .string()
  .trim()
  .min(1)
  .refine((value) => !value.startsWith('/') && !value.split('/').includes('..'), {
    message: 'Manifest paths must stay inside the project.',
  });

export const growthCapabilitySchema = z.enum([
  'seo',
  'analytics',
  'tag-manager',
  'advertising',
  'experiments',
  'recommendations',
]);
export type GrowthCapability = z.infer<typeof growthCapabilitySchema>;

export const growthAdoptionModeSchema = z.enum(['new', 'adopt-existing', 'audit-only', 'migrate']);
export type GrowthAdoptionMode = z.infer<typeof growthAdoptionModeSchema>;

export const growthResourceReferenceSchema = z
  .object({
    provider: stableIdSchema,
    connection: stableIdSchema,
    service: stableIdSchema,
    resourceType: stableIdSchema,
    resourceId: z.string().trim().min(1),
  })
  .strict();
export type GrowthResourceReference = z.infer<typeof growthResourceReferenceSchema>;

const growthEnvironmentSchema = z
  .object({
    connections: z.record(stableIdSchema, stableIdSchema).default({}),
    resources: z.array(growthResourceReferenceSchema).default([]),
  })
  .strict()
  .superRefine((environment, context) => {
    const resourceKeys = environment.resources.map(
      (resource) =>
        `${resource.provider}:${resource.service}:${resource.resourceType}:${resource.resourceId}`,
    );
    if (new Set(resourceKeys).size !== resourceKeys.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['resources'],
        message: 'Growth environment resource selections must be unique.',
      });
    }
    for (const [provider, connection] of Object.entries(environment.connections)) {
      const mismatched = environment.resources.find(
        (resource) => resource.provider === provider && resource.connection !== connection,
      );
      if (mismatched) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['resources'],
          message: `Growth resource '${mismatched.resourceId}' does not use the selected ${provider} connection.`,
        });
      }
    }
  });

const growthManifestLocationsSchema = z
  .object({
    events: projectRelativePathSchema.optional(),
    conversions: projectRelativePathSchema.optional(),
    experiments: projectRelativePathSchema.optional(),
    research: projectRelativePathSchema.optional(),
    policy: projectRelativePathSchema.optional(),
  })
  .strict()
  .default({});

const growthRuntimeSchema = z
  .object({
    integration: z.enum(['none', 'web-runtime', 'tag-manager', 'existing']),
    manifest: projectRelativePathSchema.optional(),
  })
  .strict();

const growthPolicySchema = z
  .object({
    mutation: z.enum(['disabled', 'plan-only', 'approval-required']),
    spend: z.enum(['disabled', 'approval-required']),
  })
  .strict();

export const growthConfigSchema = z
  .object({
    schemaVersion: z.literal(1),
    adoptionMode: growthAdoptionModeSchema,
    capabilities: z.array(growthCapabilitySchema).min(1),
    environments: z.record(stableIdSchema, growthEnvironmentSchema),
    manifests: growthManifestLocationsSchema,
    runtime: growthRuntimeSchema,
    policy: growthPolicySchema,
  })
  .strict()
  .superRefine((config, context) => {
    if (new Set(config.capabilities).size !== config.capabilities.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['capabilities'],
        message: 'Growth capabilities must be unique.',
      });
    }
    if (
      config.adoptionMode === 'audit-only' &&
      config.runtime.integration !== 'none' &&
      config.runtime.integration !== 'existing'
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['runtime', 'integration'],
        message: 'Audit-only adoption cannot select an installing runtime integration.',
      });
    }
  });
export type GrowthConfig = z.infer<typeof growthConfigSchema>;

export const growthConfigContribution = Object.freeze({
  namespace: 'growth' as const,
  schema: growthConfigSchema,
});

export function defineGrowthConfig(input: GrowthConfig): GrowthConfig {
  return growthConfigSchema.parse(input);
}

export function createGrowthConfigIntent(input: {
  adoptionMode: GrowthAdoptionMode;
  capabilities: readonly GrowthCapability[];
  environments: readonly string[];
  runtimeIntegration?: GrowthConfig['runtime']['integration'];
}): GrowthConfig {
  const runtimeIntegration =
    input.runtimeIntegration ?? (input.adoptionMode === 'audit-only' ? 'none' : 'existing');
  return defineGrowthConfig({
    schemaVersion: 1,
    adoptionMode: input.adoptionMode,
    capabilities: [...input.capabilities],
    environments: Object.fromEntries(
      input.environments.map((environment) => [
        environment,
        {
          connections: {},
          resources: [],
        },
      ]),
    ),
    manifests: {},
    runtime: {
      integration: runtimeIntegration,
    },
    policy: {
      mutation: 'disabled',
      spend: 'disabled',
    },
  });
}
