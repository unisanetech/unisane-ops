import { z } from 'zod';

const positiveInteger = z.coerce.number().int().positive();

const sharedSchema = z.object({
  OPS_HOSTED_POSTGRES_URL: z.string().url(),
  OPS_HOSTED_ROLE: z.enum(['gateway', 'worker']),
});

const workerSchema = sharedSchema.extend({
  OPS_HOSTED_ROLE: z.literal('worker'),
  OPS_HOSTED_WORKER_ID: z.string().regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/),
  OPS_HOSTED_POLL_MS: positiveInteger.default(1_000),
  OPS_HOSTED_LEASE_MS: positiveInteger.default(30_000),
  OPS_HOSTED_RETRY_MS: positiveInteger.default(5_000),
  OPS_HOSTED_RECOVERY_LIMIT: positiveInteger.max(1_000).default(100),
  OPS_HOSTED_MAXIMUM_RESULT_BYTES: positiveInteger.default(1_000_000),
});

const gatewaySchema = sharedSchema.extend({
  OPS_HOSTED_ROLE: z.literal('gateway'),
});

export type HostedWorkerProcessConfig = z.infer<typeof workerSchema>;
export type HostedGatewayProcessConfig = z.infer<typeof gatewaySchema>;

export function readHostedWorkerProcessConfig(
  environment: Readonly<Record<string, string | undefined>>,
): HostedWorkerProcessConfig {
  return workerSchema.parse(environment);
}

export function readHostedGatewayProcessConfig(
  environment: Readonly<Record<string, string | undefined>>,
): HostedGatewayProcessConfig {
  return gatewaySchema.parse(environment);
}
