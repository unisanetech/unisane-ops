import { cloudDnsDesiredStateSchema } from '@unisane/cloud/contracts';
import {
  cloudflareQueueConfigSchema,
  cloudflareWorkerConfigSchema,
} from '@unisane/cloud/cloudflare-resources';
import { growthConfigContribution, type GrowthConfig } from '@unisane/growth/contracts';
import { z } from 'zod';

const stableIdSchema = z.string().regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/);
const nonEmptySchema = z.string().trim().min(1);
const environmentVariableSchema = z.string().regex(/^[A-Z_][A-Z0-9_]*$/);
const projectRelativePathSchema = z
  .string()
  .trim()
  .min(1)
  .refine((value) => !value.startsWith('/') && !value.split('/').includes('..'), {
    message: 'Connection record paths must stay inside the project.',
  });

export const unisaneOpsEnvironmentSchema = z
  .object({
    production: z.boolean().default(false),
  })
  .strict();

export const unisaneOpsCloudflareConnectionSchema = z
  .object({
    provider: z.literal('cloudflare'),
    accountId: nonEmptySchema.optional(),
    credential: z
      .object({
        source: z.literal('env'),
        name: environmentVariableSchema,
      })
      .strict(),
  })
  .strict();

export const unisaneOpsManagedConnectionSchema = z
  .object({
    provider: stableIdSchema.refine((provider) => provider !== 'cloudflare', {
      message: 'Cloudflare connections use the Cloudflare connection contract.',
    }),
    recordPath: projectRelativePathSchema,
  })
  .strict();

export const unisaneOpsCloudflareTargetSchema = z
  .object({
    provider: z.literal('cloudflare'),
    connection: stableIdSchema,
    environments: z.record(
      stableIdSchema,
      z
        .object({
          dns: cloudDnsDesiredStateSchema.optional(),
          queues: z.record(stableIdSchema, cloudflareQueueConfigSchema).default({}),
          workers: z.record(stableIdSchema, cloudflareWorkerConfigSchema).default({}),
        })
        .strict()
        .superRefine((environment, context) => {
          if (
            !environment.dns &&
            Object.keys(environment.queues).length === 0 &&
            Object.keys(environment.workers).length === 0
          ) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'A Cloudflare target environment must configure DNS, queues, or workers.',
            });
          }
          for (const [workerKey, worker] of Object.entries(environment.workers)) {
            for (const [kind, queueKeys] of Object.entries(worker.queues)) {
              for (const [queueIndex, queueKey] of queueKeys.entries()) {
                if (!environment.queues[queueKey]) {
                  context.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['workers', workerKey, 'queues', kind, queueIndex],
                    message: `Worker '${workerKey}' references unknown queue '${queueKey}'.`,
                  });
                }
              }
            }
            for (const [routeIndex, route] of worker.routes.entries()) {
              if (route.zone && !environment.dns?.zones[route.zone]) {
                context.addIssue({
                  code: z.ZodIssueCode.custom,
                  path: ['workers', workerKey, 'routes', routeIndex, 'zone'],
                  message: `Worker '${workerKey}' references unknown zone '${route.zone}'.`,
                });
              }
            }
          }
        }),
    ),
  })
  .strict();

const projectSchema = z
  .object({
    id: stableIdSchema,
  })
  .strict();
const environmentsSchema = z.record(stableIdSchema, unisaneOpsEnvironmentSchema);
const connectionsSchema = z.record(
  stableIdSchema,
  z.union([unisaneOpsCloudflareConnectionSchema, unisaneOpsManagedConnectionSchema]),
);
const targetsSchema = z.record(stableIdSchema, unisaneOpsCloudflareTargetSchema);
const capabilitiesSchema = z
  .object({
    [growthConfigContribution.namespace]: growthConfigContribution.schema.optional(),
  })
  .strict()
  .default({});

function validateConfigRelations(
  config: {
    environments: Record<string, unknown>;
    connections: Record<
      string,
      z.infer<
        typeof unisaneOpsCloudflareConnectionSchema | typeof unisaneOpsManagedConnectionSchema
      >
    >;
    targets: Record<string, z.infer<typeof unisaneOpsCloudflareTargetSchema>>;
    capabilities: {
      growth?: GrowthConfig;
    };
  },
  context: z.RefinementCtx,
): void {
  for (const [targetId, target] of Object.entries(config.targets)) {
    const connection = config.connections[target.connection];
    if (!connection) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['targets', targetId, 'connection'],
        message: `Target '${targetId}' references unknown connection '${target.connection}'.`,
      });
    }
    for (const environment of Object.keys(target.environments)) {
      if (!config.environments[environment]) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['targets', targetId, 'environments', environment],
          message: `Target '${targetId}' references undeclared environment '${environment}'.`,
        });
      }
    }
  }

  const growth = config.capabilities.growth;
  if (!growth) return;
  for (const [environmentId, environment] of Object.entries(growth.environments)) {
    if (!config.environments[environmentId]) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['capabilities', 'growth', 'environments', environmentId],
        message: `Growth references undeclared environment '${environmentId}'.`,
      });
    }
    for (const [provider, connectionId] of Object.entries(environment.connections)) {
      const connection = config.connections[connectionId];
      if (!connection) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['capabilities', 'growth', 'environments', environmentId, 'connections', provider],
          message: `Growth references unknown connection '${connectionId}'.`,
        });
      } else if (connection.provider !== provider) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['capabilities', 'growth', 'environments', environmentId, 'connections', provider],
          message: `Growth connection '${connectionId}' is not a ${provider} connection.`,
        });
      }
    }
  }
}

export const unisaneOpsConfigSchema = z
  .object({
    schemaVersion: z.literal(1),
    project: projectSchema,
    environments: environmentsSchema,
    connections: connectionsSchema,
    targets: targetsSchema,
    capabilities: capabilitiesSchema,
  })
  .strict()
  .superRefine(validateConfigRelations);
export type UnisaneOpsConfig = z.infer<typeof unisaneOpsConfigSchema>;

export const unisaneProjectConfigSchema = z
  .object({
    schemaVersion: z.literal(1),
    project: projectSchema,
    environments: environmentsSchema,
    ops: z
      .object({
        connections: connectionsSchema,
        targets: targetsSchema,
        capabilities: capabilitiesSchema,
      })
      .strict(),
  })
  .strict()
  .superRefine((config, context) => {
    validateConfigRelations(
      {
        environments: config.environments,
        connections: config.ops.connections,
        targets: config.ops.targets,
        capabilities: config.ops.capabilities,
      },
      context,
    );
  });
export type UnisaneProjectConfig = z.infer<typeof unisaneProjectConfigSchema>;

export function defineUnisaneOps(config: UnisaneOpsConfig): UnisaneOpsConfig {
  return unisaneOpsConfigSchema.parse(config);
}

export function defineUnisaneProject(config: UnisaneProjectConfig): UnisaneProjectConfig {
  return unisaneProjectConfigSchema.parse(config);
}
