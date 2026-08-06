import { readFileSync } from 'node:fs';
import { z } from 'zod';

const positiveInteger = z.coerce.number().int().positive();

const postgresSourceSchema = z
  .object({
    OPS_HOSTED_POSTGRES_URL: z.string().url().optional(),
    OPS_HOSTED_POSTGRES_URL_FILE: z.string().trim().min(1).optional(),
  })
  .superRefine((value, context) => {
    if (Boolean(value.OPS_HOSTED_POSTGRES_URL) === Boolean(value.OPS_HOSTED_POSTGRES_URL_FILE)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Configure exactly one hosted PostgreSQL connection source.',
      });
    }
  });

type SecretFileReader = (path: string) => string;

function resolvePostgresEnvironment(
  environment: Readonly<Record<string, string | undefined>>,
  readSecretFile: SecretFileReader,
): Readonly<Record<string, string | undefined>> {
  const source = postgresSourceSchema.parse(environment);
  const value =
    source.OPS_HOSTED_POSTGRES_URL ??
    readSecretFile(source.OPS_HOSTED_POSTGRES_URL_FILE as string).trim();
  return { ...environment, OPS_HOSTED_POSTGRES_URL: z.string().url().parse(value) };
}

const sharedSchema = z.object({
  OPS_HOSTED_POSTGRES_URL: z.string().url(),
  OPS_HOSTED_ROLE: z.enum(['gateway', 'worker', 'scheduler']),
});

const databaseRoleSchema = z.string().regex(/^[a-z_][a-z0-9_]{0,62}$/);
const migrationSchema = z
  .object({
    OPS_HOSTED_POSTGRES_URL: z.string().url(),
    OPS_HOSTED_GATEWAY_DB_ROLE: databaseRoleSchema.optional(),
    OPS_HOSTED_WORKER_DB_ROLE: databaseRoleSchema.optional(),
    OPS_HOSTED_SCHEDULER_DB_ROLE: databaseRoleSchema.optional(),
  })
  .superRefine((value, context) => {
    const configured = [
      value.OPS_HOSTED_GATEWAY_DB_ROLE,
      value.OPS_HOSTED_WORKER_DB_ROLE,
      value.OPS_HOSTED_SCHEDULER_DB_ROLE,
    ].filter(Boolean).length;
    if (configured !== 0 && configured !== 3) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Configure all hosted PostgreSQL runtime roles or none.',
      });
    }
    if (
      value.OPS_HOSTED_GATEWAY_DB_ROLE &&
      configured === 3 &&
      new Set([
        value.OPS_HOSTED_GATEWAY_DB_ROLE,
        value.OPS_HOSTED_WORKER_DB_ROLE,
        value.OPS_HOSTED_SCHEDULER_DB_ROLE,
      ]).size !== 3
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Hosted PostgreSQL runtime roles must be distinct.',
      });
    }
  });

const workerSchema = sharedSchema.extend({
  OPS_HOSTED_ROLE: z.literal('worker'),
  OPS_HOSTED_WORKER_ID: z.string().regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/),
  OPS_HOSTED_POLL_MS: positiveInteger.default(1_000),
  OPS_HOSTED_LEASE_MS: positiveInteger.default(30_000),
  OPS_HOSTED_RETRY_MS: positiveInteger.default(5_000),
  OPS_HOSTED_RECOVERY_LIMIT: positiveInteger.max(1_000).default(100),
  OPS_HOSTED_MAXIMUM_RESULT_BYTES: positiveInteger.default(1_000_000),
  OPS_HOSTED_ACTION_MODULE: z.string().trim().min(1),
  OPS_HOSTED_SHUTDOWN_MS: positiveInteger.default(30_000),
});

const gatewaySchema = sharedSchema.extend({
  OPS_HOSTED_ROLE: z.literal('gateway'),
  OPS_HOSTED_HTTP_HOST: z.string().trim().min(1).default('127.0.0.1'),
  OPS_HOSTED_HTTP_PORT: positiveInteger.max(65_535).default(8080),
  OPS_HOSTED_HTTP_BODY_BYTES: positiveInteger.default(1_000_000),
  OPS_HOSTED_OIDC_ISSUER: z.string().url(),
  OPS_HOSTED_OIDC_JWKS_URL: z.string().url(),
  OPS_HOSTED_SHUTDOWN_MS: positiveInteger.default(30_000),
});

const schedulerSchema = sharedSchema.extend({
  OPS_HOSTED_ROLE: z.literal('scheduler'),
  OPS_HOSTED_SCHEDULER_ID: z.string().regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/),
  OPS_HOSTED_POLL_MS: positiveInteger.default(1_000),
  OPS_HOSTED_LEASE_MS: positiveInteger.default(30_000),
  OPS_HOSTED_RECOVERY_LIMIT: positiveInteger.max(1_000).default(100),
  OPS_HOSTED_SHUTDOWN_MS: positiveInteger.default(30_000),
});

export type HostedWorkerProcessConfig = z.infer<typeof workerSchema>;
export type HostedGatewayProcessConfig = z.infer<typeof gatewaySchema>;
export type HostedMigrationProcessConfig = z.infer<typeof migrationSchema>;
export type HostedSchedulerProcessConfig = z.infer<typeof schedulerSchema>;

const defaultSecretFileReader: SecretFileReader = (path) => readFileSync(path, 'utf8');

export function readHostedWorkerProcessConfig(
  environment: Readonly<Record<string, string | undefined>>,
  readSecretFile: SecretFileReader = defaultSecretFileReader,
): HostedWorkerProcessConfig {
  return workerSchema.parse(resolvePostgresEnvironment(environment, readSecretFile));
}

export function readHostedGatewayProcessConfig(
  environment: Readonly<Record<string, string | undefined>>,
  readSecretFile: SecretFileReader = defaultSecretFileReader,
): HostedGatewayProcessConfig {
  return gatewaySchema.parse(resolvePostgresEnvironment(environment, readSecretFile));
}

export function readHostedMigrationProcessConfig(
  environment: Readonly<Record<string, string | undefined>>,
  readSecretFile: SecretFileReader = defaultSecretFileReader,
): HostedMigrationProcessConfig {
  return migrationSchema.parse(resolvePostgresEnvironment(environment, readSecretFile));
}

export function readHostedSchedulerProcessConfig(
  environment: Readonly<Record<string, string | undefined>>,
  readSecretFile: SecretFileReader = defaultSecretFileReader,
): HostedSchedulerProcessConfig {
  return schedulerSchema.parse(resolvePostgresEnvironment(environment, readSecretFile));
}
