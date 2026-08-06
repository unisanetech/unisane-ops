import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import {
  OpsActionExecutionError,
  opsReadActionRequestSchema,
  opsReadActionResultSchema,
  type OpsReadActionDefinition,
  type OpsReadActionRequest,
  type OpsReadActionResult,
} from './actions.js';
import type { OpsStateCapability } from './ports.js';
import { hashOpsValue } from './safety.js';

const stableIdSchema = z.string().regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/);
const isoTimestampSchema = z.string().datetime({ offset: true });

export const opsActionJobStatusSchema = z.enum([
  'queued',
  'running',
  'cancel-requested',
  'cancelled',
  'succeeded',
  'failed',
]);
export type OpsActionJobStatus = z.infer<typeof opsActionJobStatusSchema>;

export const opsActionJobErrorSchema = z
  .object({
    code: stableIdSchema,
    message: z.string().trim().min(1),
    retryable: z.boolean(),
  })
  .strict();
export type OpsActionJobError = z.infer<typeof opsActionJobErrorSchema>;

export const opsActionSnapshotSchema = z
  .object({
    id: stableIdSchema,
    schemaVersion: z.number().int().positive(),
    maximumEffect: z.enum(['offline', 'read-network']),
  })
  .strict();
export type OpsActionSnapshot = z.infer<typeof opsActionSnapshotSchema>;

export const opsActionJobSchema = z
  .object({
    schemaVersion: z.literal(1),
    kind: z.literal('ops.action-job'),
    jobId: stableIdSchema,
    requestHash: z.string().regex(/^[a-f0-9]{64}$/),
    action: opsActionSnapshotSchema,
    request: opsReadActionRequestSchema,
    status: opsActionJobStatusSchema,
    revision: z.number().int().nonnegative(),
    attemptCount: z.number().int().nonnegative(),
    createdAt: isoTimestampSchema,
    updatedAt: isoTimestampSchema,
    claimedBy: stableIdSchema.optional(),
    claimToken: stableIdSchema.optional(),
    leaseExpiresAt: isoTimestampSchema.optional(),
    cancellationRequestedAt: isoTimestampSchema.optional(),
    result: opsReadActionResultSchema.optional(),
    error: opsActionJobErrorSchema.optional(),
  })
  .strict();
export type OpsActionJob = z.infer<typeof opsActionJobSchema>;

export const opsActionAuditEventSchema = z
  .object({
    schemaVersion: z.literal(1),
    kind: z.literal('ops.action-audit-event'),
    eventId: stableIdSchema,
    jobId: stableIdSchema,
    type: z.enum([
      'admitted',
      'admission-reused',
      'claimed',
      'cancellation-requested',
      'cancelled',
      'requeued',
      'succeeded',
      'failed',
    ]),
    actorId: stableIdSchema,
    occurredAt: isoTimestampSchema,
    revision: z.number().int().nonnegative(),
  })
  .strict();
export type OpsActionAuditEvent = z.infer<typeof opsActionAuditEventSchema>;

export interface OpsActionAdmission {
  job: OpsActionJob;
  created: boolean;
}

export interface OpsActionJobStore extends OpsStateCapability {
  admit(input: {
    jobId: string;
    action: OpsActionSnapshot;
    request: OpsReadActionRequest;
    requestHash: string;
    now: string;
  }): Promise<OpsActionAdmission>;
  claimNext(input: {
    workerId: string;
    now: string;
    leaseMs: number;
  }): Promise<OpsActionJob | null>;
  complete(input: {
    jobId: string;
    claimToken: string;
    result: OpsReadActionResult;
    now: string;
  }): Promise<OpsActionJob>;
  fail(input: {
    jobId: string;
    claimToken: string;
    error: OpsActionJobError;
    now: string;
  }): Promise<OpsActionJob>;
  requestCancellation(input: {
    jobId: string;
    actorId: string;
    now: string;
  }): Promise<OpsActionJob>;
  recoverExpired(input: { now: string; actorId: string }): Promise<number>;
  get(jobId: string): Promise<OpsActionJob | null>;
  listAudit(jobId: string): Promise<readonly OpsActionAuditEvent[]>;
}

export interface OpsReadActionRuntime {
  admit(request: OpsReadActionRequest): Promise<OpsActionAdmission>;
  runNext(workerId: string): Promise<OpsActionJob | null>;
  cancel(jobId: string, actorId: string): Promise<OpsActionJob>;
  recoverExpired(actorId: string): Promise<number>;
  get(jobId: string): Promise<OpsActionJob | null>;
  listAudit(jobId: string): Promise<readonly OpsActionAuditEvent[]>;
}

export function createOpsReadActionRuntime(input: {
  store: OpsActionJobStore;
  actions: readonly OpsReadActionDefinition[];
  now?: () => Date;
  createJobId?: () => string;
  leaseMs?: number;
}): OpsReadActionRuntime {
  if (input.store.durability !== 'durable') {
    throw new Error(
      '[OPS_ACTION_DURABLE_STORE_REQUIRED] Hosted action execution requires durable state.',
    );
  }
  const actions = new Map(input.actions.map((action) => [action.id, action]));
  if (actions.size !== input.actions.length) {
    throw new Error('[OPS_ACTION_DUPLICATE] Action ids must be unique.');
  }
  const now = input.now ?? (() => new Date());
  const createJobId = input.createJobId ?? (() => `job.${randomUUID()}`);
  const leaseMs = input.leaseMs ?? 30_000;

  return {
    async admit(request) {
      const parsed = opsReadActionRequestSchema.parse(request);
      const action = actions.get(parsed.actionId);
      if (!action || action.schemaVersion !== parsed.actionSchemaVersion) {
        throw new Error(
          '[OPS_ACTION_UNAVAILABLE] The requested action id or schema version is unavailable.',
        );
      }
      const normalizedRequest: OpsReadActionRequest = {
        ...parsed,
        input: action.inputSchema.parse(parsed.input),
      };
      return input.store.admit({
        jobId: stableIdSchema.parse(createJobId()),
        action: {
          id: action.id,
          schemaVersion: action.schemaVersion,
          maximumEffect: action.maximumEffect,
        },
        request: normalizedRequest,
        requestHash: hashOpsValue(normalizedRequest),
        now: now().toISOString(),
      });
    },

    async runNext(workerId) {
      const claimed = await input.store.claimNext({
        workerId: stableIdSchema.parse(workerId),
        now: now().toISOString(),
        leaseMs,
      });
      if (!claimed) return null;
      const action = actions.get(claimed.request.actionId);
      if (!action || action.schemaVersion !== claimed.request.actionSchemaVersion) {
        return input.store.fail({
          jobId: claimed.jobId,
          claimToken: claimed.claimToken!,
          error: {
            code: 'ops.action.unavailable',
            message: 'The action implementation is unavailable for this job snapshot.',
            retryable: false,
          },
          now: now().toISOString(),
        });
      }
      try {
        const parsedInput = action.inputSchema.parse(claimed.request.input) as unknown;
        const executionOutput = (await action.execute(
          parsedInput,
          claimed.request.context,
        )) as unknown;
        const output = action.outputSchema.parse(executionOutput) as unknown;
        return input.store.complete({
          jobId: claimed.jobId,
          claimToken: claimed.claimToken!,
          result: {
            schemaVersion: 1,
            actionId: action.id,
            actionSchemaVersion: action.schemaVersion,
            completedAt: now().toISOString(),
            output,
          },
          now: now().toISOString(),
        });
      } catch (error) {
        const safeError =
          error instanceof OpsActionExecutionError
            ? {
                code: error.code,
                message: error.safeMessage,
                retryable: error.retryable,
              }
            : {
                code: 'ops.action.execution-failed',
                message: 'The action failed without a safe diagnostic. Review protected logs.',
                retryable: false,
              };
        return input.store.fail({
          jobId: claimed.jobId,
          claimToken: claimed.claimToken!,
          error: safeError,
          now: now().toISOString(),
        });
      }
    },

    cancel(jobId, actorId) {
      return input.store.requestCancellation({
        jobId: stableIdSchema.parse(jobId),
        actorId: stableIdSchema.parse(actorId),
        now: now().toISOString(),
      });
    },

    recoverExpired(actorId) {
      return input.store.recoverExpired({
        actorId: stableIdSchema.parse(actorId),
        now: now().toISOString(),
      });
    },

    get(jobId) {
      return input.store.get(stableIdSchema.parse(jobId));
    },

    listAudit(jobId) {
      return input.store.listAudit(stableIdSchema.parse(jobId));
    },
  };
}
