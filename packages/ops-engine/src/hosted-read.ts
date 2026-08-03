import { z } from 'zod';
import {
  OpsActionExecutionError,
  opsReadActionRequestSchema,
  type OpsReadActionDefinition,
  type OpsReadActionRequest,
} from './actions.js';

const stableIdSchema = z.string().regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/);
const nonEmptySchema = z.string().trim().min(1);
const isoTimestampSchema = z.string().datetime({ offset: true });

export const hostedReadAdmissionRequestSchema = z
  .object({
    schemaVersion: z.literal(1),
    audience: z.literal('unisane.ops'),
    evidenceRevision: stableIdSchema,
    action: opsReadActionRequestSchema,
  })
  .strict();
export type HostedReadAdmissionRequest = z.infer<typeof hostedReadAdmissionRequestSchema>;

export const hostedReadResultReferenceSchema = z
  .object({
    artifactId: stableIdSchema,
    byteLength: z.number().int().nonnegative(),
    digest: z.string().regex(/^[a-f0-9]{64}$/),
  })
  .strict();
export type HostedReadResultReference = z.infer<typeof hostedReadResultReferenceSchema>;

const hostedReadFailureSchema = z
  .object({
    code: stableIdSchema,
    message: nonEmptySchema.max(500),
    retryable: z.boolean(),
  })
  .strict();

const hostedReadLeaseSchema = z
  .object({
    owner: stableIdSchema,
    fencingToken: stableIdSchema,
    expiresAt: isoTimestampSchema,
  })
  .strict();

export const hostedReadJobSchema = z
  .object({
    schemaVersion: z.literal(1),
    kind: z.literal('ops.hosted-read-job'),
    jobId: stableIdSchema,
    revision: z.number().int().positive(),
    phase: z.enum(['queued', 'running', 'succeeded', 'failed']),
    request: hostedReadAdmissionRequestSchema,
    result: hostedReadResultReferenceSchema.nullable(),
    failure: hostedReadFailureSchema.nullable(),
    lease: hostedReadLeaseSchema.nullable(),
    createdAt: isoTimestampSchema,
    updatedAt: isoTimestampSchema,
  })
  .strict();
export type HostedReadJob = z.infer<typeof hostedReadJobSchema>;

export interface HostedReadAuditFact {
  id: string;
  kind: 'admitted' | 'started' | 'recovered' | 'succeeded' | 'failed';
  jobId: string;
  principalId: string;
  scopeId: string;
  actionId: string;
  occurredAt: string;
}

export interface HostedReadDispatchIntent {
  id: string;
  jobId: string;
  availableAt: string;
}

export interface HostedReadAdmissionBundle {
  job: HostedReadJob;
  dispatch: HostedReadDispatchIntent;
  audit: HostedReadAuditFact;
}

export interface HostedReadAuthorization {
  authenticated: true;
  audience: 'unisane.ops';
  principalId: string;
  allowedScopeIds: readonly string[];
}

export interface HostedReadClaim {
  job: HostedReadJob;
  fencingToken: string;
}

export interface HostedReadJobStore {
  readonly durability: 'durable';
  readonly atomic: true;
  admit(
    bundle: HostedReadAdmissionBundle,
  ): Promise<{ status: 'stored' | 'existing'; job: HostedReadJob } | { status: 'conflict' }>;
  get(jobId: string): Promise<HostedReadJob | null>;
  claim(input: {
    jobId: string;
    expectedRevision: number;
    owner: string;
    now: string;
    expiresAt: string;
    audit: HostedReadAuditFact;
  }): Promise<HostedReadClaim | 'conflict'>;
  complete(input: {
    job: HostedReadJob;
    expectedRevision: number;
    fencingToken: string;
    audit: HostedReadAuditFact;
  }): Promise<'stored' | 'conflict'>;
  recover(input: {
    jobId: string;
    expectedRevision: number;
    now: string;
    dispatch: HostedReadDispatchIntent;
    audit: HostedReadAuditFact;
  }): Promise<HostedReadJob | 'not-expired' | 'conflict'>;
}

export interface HostedReadResultStore {
  readonly durability: 'durable';
  put(input: {
    jobId: string;
    actionId: string;
    value: unknown;
    byteLength: number;
  }): Promise<HostedReadResultReference>;
}

function assertNoCredentialMaterial(value: unknown, path = 'request'): void {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertNoCredentialMaterial(entry, `${path}.${index}`));
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    if (/(?:secret|token|password|credential|api.?key)/i.test(key)) {
      throw new OpsActionExecutionError(
        'credential-material-forbidden',
        `Credential material is not accepted in hosted action requests (${path}.${key}).`,
      );
    }
    assertNoCredentialMaterial(child, `${path}.${key}`);
  }
}

function auditFact(
  kind: HostedReadAuditFact['kind'],
  job: HostedReadJob,
  occurredAt: string,
): HostedReadAuditFact {
  return {
    id: `${job.jobId}.${kind}.${job.revision}`,
    kind,
    jobId: job.jobId,
    principalId: job.request.action.context.principal.id,
    scopeId: job.request.action.context.scopeId,
    actionId: job.request.action.actionId,
    occurredAt,
  };
}

export async function admitHostedReadAction(input: {
  request: HostedReadAdmissionRequest;
  authorization: HostedReadAuthorization;
  store: HostedReadJobStore;
  now?: Date;
}): Promise<HostedReadJob> {
  const request = hostedReadAdmissionRequestSchema.parse(input.request);
  const authorization = input.authorization;
  if (!authorization.authenticated) {
    throw new OpsActionExecutionError('authentication-required', 'Authentication is required.');
  }
  stableIdSchema.parse(authorization.principalId);
  authorization.allowedScopeIds.forEach((scopeId) => stableIdSchema.parse(scopeId));
  if (authorization.audience !== request.audience) {
    throw new OpsActionExecutionError('audience-mismatch', 'The action audience is not allowed.');
  }
  if (authorization.principalId !== request.action.context.principal.id) {
    throw new OpsActionExecutionError(
      'principal-mismatch',
      'The authenticated principal does not match the action principal.',
    );
  }
  if (!authorization.allowedScopeIds.includes(request.action.context.scopeId)) {
    throw new OpsActionExecutionError('scope-forbidden', 'The requested scope is not allowed.');
  }
  assertNoCredentialMaterial(request.action.input);

  const now = (input.now ?? new Date()).toISOString();
  const jobId = `read.${request.action.idempotencyKey}`;
  const job = hostedReadJobSchema.parse({
    schemaVersion: 1,
    kind: 'ops.hosted-read-job',
    jobId,
    revision: 1,
    phase: 'queued',
    request,
    result: null,
    failure: null,
    lease: null,
    createdAt: now,
    updatedAt: now,
  });
  const admitted = await input.store.admit({
    job,
    dispatch: { id: `${jobId}.dispatch.1`, jobId, availableAt: now },
    audit: auditFact('admitted', job, now),
  });
  if (admitted.status === 'conflict') {
    throw new OpsActionExecutionError(
      'idempotency-conflict',
      'The request identity is already bound to a different action.',
    );
  }
  if (JSON.stringify(admitted.job.request) !== JSON.stringify(request)) {
    throw new OpsActionExecutionError(
      'idempotency-conflict',
      'The request identity is already bound to a different action.',
    );
  }
  return hostedReadJobSchema.parse(admitted.job);
}

function toFailure(error: unknown): z.infer<typeof hostedReadFailureSchema> {
  if (error instanceof OpsActionExecutionError) {
    return hostedReadFailureSchema.parse({
      code: error.code,
      message: error.safeMessage,
      retryable: error.retryable,
    });
  }
  return {
    code: 'action-failed',
    message: 'The action could not be completed.',
    retryable: false,
  };
}

function serializedByteLength(value: unknown): number {
  const serialized = JSON.stringify(value);
  if (serialized === undefined) {
    throw new OpsActionExecutionError(
      'invalid-action-result',
      'The action result is not serializable.',
    );
  }
  return new TextEncoder().encode(serialized).byteLength;
}

export function createHostedReadWorker(input: {
  owner: string;
  leaseMs: number;
  maximumResultBytes: number;
  store: HostedReadJobStore;
  results: HostedReadResultStore;
  actions: readonly OpsReadActionDefinition[];
  now?: () => Date;
}) {
  stableIdSchema.parse(input.owner);
  z.number().int().positive().parse(input.leaseMs);
  z.number().int().positive().parse(input.maximumResultBytes);
  const actions = new Map(
    input.actions.map((action) => [`${action.id}@${action.schemaVersion}`, action]),
  );
  const now = input.now ?? (() => new Date());

  return {
    async execute(jobId: string): Promise<HostedReadJob> {
      const queued = await input.store.get(jobId);
      if (!queued)
        throw new OpsActionExecutionError('job-not-found', 'The read job was not found.');
      if (queued.phase === 'succeeded' || queued.phase === 'failed') return queued;
      if (queued.phase !== 'queued') {
        throw new OpsActionExecutionError(
          'job-not-available',
          'The read job is already running.',
          true,
        );
      }

      const startedAt = now();
      const claimed = await input.store.claim({
        jobId,
        expectedRevision: queued.revision,
        owner: input.owner,
        now: startedAt.toISOString(),
        expiresAt: new Date(startedAt.getTime() + input.leaseMs).toISOString(),
        audit: auditFact('started', queued, startedAt.toISOString()),
      });
      if (claimed === 'conflict') {
        throw new OpsActionExecutionError(
          'job-claim-conflict',
          'The read job changed before claim.',
          true,
        );
      }

      const actionRequest: OpsReadActionRequest = claimed.job.request.action;
      const action = actions.get(`${actionRequest.actionId}@${actionRequest.actionSchemaVersion}`);
      let completed: HostedReadJob;
      try {
        if (!action) {
          throw new OpsActionExecutionError(
            'action-not-registered',
            'The requested action version is not registered.',
          );
        }
        const actionInput = z.unknown().parse(action.inputSchema.parse(actionRequest.input));
        const output = z
          .unknown()
          .parse(
            action.outputSchema.parse(await action.execute(actionInput, actionRequest.context)),
          );
        const byteLength = serializedByteLength(output);
        if (byteLength > input.maximumResultBytes) {
          throw new OpsActionExecutionError(
            'result-too-large',
            'The action result exceeds the hosted result limit.',
          );
        }
        const result = hostedReadResultReferenceSchema.parse(
          await input.results.put({ jobId, actionId: action.id, value: output, byteLength }),
        );
        completed = hostedReadJobSchema.parse({
          ...claimed.job,
          revision: claimed.job.revision + 1,
          phase: 'succeeded',
          result,
          failure: null,
          lease: null,
          updatedAt: now().toISOString(),
        });
      } catch (error) {
        completed = hostedReadJobSchema.parse({
          ...claimed.job,
          revision: claimed.job.revision + 1,
          phase: 'failed',
          result: null,
          failure: toFailure(error),
          lease: null,
          updatedAt: now().toISOString(),
        });
      }

      const stored = await input.store.complete({
        job: completed,
        expectedRevision: claimed.job.revision,
        fencingToken: claimed.fencingToken,
        audit: auditFact(
          completed.phase === 'succeeded' ? 'succeeded' : 'failed',
          completed,
          completed.updatedAt,
        ),
      });
      if (stored === 'conflict') {
        throw new OpsActionExecutionError(
          'job-completion-conflict',
          'The read job lease or revision changed before completion.',
          true,
        );
      }
      return completed;
    },

    async recover(jobId: string): Promise<HostedReadJob> {
      const job = await input.store.get(jobId);
      if (!job) throw new OpsActionExecutionError('job-not-found', 'The read job was not found.');
      if (job.phase !== 'running') return job;
      const recoveredAt = now().toISOString();
      const recovered = await input.store.recover({
        jobId,
        expectedRevision: job.revision,
        now: recoveredAt,
        dispatch: {
          id: `${jobId}.dispatch.${job.revision + 1}`,
          jobId,
          availableAt: recoveredAt,
        },
        audit: auditFact('recovered', job, recoveredAt),
      });
      if (recovered === 'not-expired') {
        throw new OpsActionExecutionError(
          'job-lease-active',
          'The read job lease is still active.',
          true,
        );
      }
      if (recovered === 'conflict') {
        throw new OpsActionExecutionError('job-recovery-conflict', 'The read job changed.', true);
      }
      return hostedReadJobSchema.parse(recovered);
    },
  };
}
