import { z } from 'zod';
import { opsActionContextSchema, opsReadActionRequestSchema } from './actions.js';
import {
  hostedReadAdmissionRequestSchema,
  type HostedReadAdmissionRequest,
} from './hosted-read.js';

const stableIdSchema = z.string().regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/);
const isoTimestampSchema = z.string().datetime({ offset: true });

const scheduleLeaseSchema = z
  .object({
    owner: stableIdSchema,
    fencingToken: stableIdSchema,
    expiresAt: isoTimestampSchema,
  })
  .strict();

const scheduledActionSchema = opsReadActionRequestSchema
  .omit({ idempotencyKey: true })
  .extend({
    context: opsActionContextSchema.omit({ requestId: true, requestedAt: true }),
  })
  .strict();

export const hostedReadScheduleSchema = z
  .object({
    schemaVersion: z.literal(1),
    kind: z.literal('ops.hosted-read-schedule'),
    scheduleId: stableIdSchema,
    revision: z.number().int().positive(),
    enabled: z.boolean(),
    evidenceRevision: stableIdSchema,
    action: scheduledActionSchema,
    cadence: z
      .object({
        kind: z.literal('interval'),
        milliseconds: z
          .number()
          .int()
          .min(60_000)
          .max(31 * 24 * 60 * 60 * 1_000),
      })
      .strict(),
    nextDueAt: isoTimestampSchema,
    lease: scheduleLeaseSchema.nullable(),
    createdAt: isoTimestampSchema,
    updatedAt: isoTimestampSchema,
  })
  .strict();
export type HostedReadSchedule = z.infer<typeof hostedReadScheduleSchema>;

export interface HostedReadScheduleClaim {
  schedule: HostedReadSchedule;
  occurrenceId: string;
  dueAt: string;
  fencingToken: string;
}

export interface HostedReadScheduleMaterialization {
  occurrenceId: string;
  scheduleId: string;
  dueAt: string;
  nextDueAt: string;
  request: HostedReadAdmissionRequest;
}

export interface HostedReadScheduleStore {
  readonly durability: 'durable';
  readonly atomicMaterialization: true;
  save(schedule: HostedReadSchedule): Promise<'stored' | 'existing' | 'conflict'>;
  claimDue(input: {
    owner: string;
    now: string;
    expiresAt: string;
  }): Promise<HostedReadScheduleClaim | null>;
  materialize(input: {
    claim: HostedReadScheduleClaim;
    materializedAt: string;
  }): Promise<HostedReadScheduleMaterialization | 'conflict'>;
  recoverExpired(input: { now: string; limit: number }): Promise<number>;
}

function assertNoCredentialMaterial(value: unknown, path = 'schedule.action.input'): void {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertNoCredentialMaterial(entry, `${path}.${index}`));
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    if (/(?:secret|token|password|credential|api.?key)/i.test(key)) {
      throw new Error(`Credential material is not accepted in hosted schedules (${path}.${key}).`);
    }
    assertNoCredentialMaterial(child, `${path}.${key}`);
  }
}

export function createHostedReadSchedule(input: HostedReadSchedule): HostedReadSchedule {
  const schedule = hostedReadScheduleSchema.parse(input);
  assertNoCredentialMaterial(schedule.action.input);
  return schedule;
}

export function createHostedReadScheduleMaterialization(
  schedule: HostedReadSchedule,
  dueAt: string,
): HostedReadScheduleMaterialization {
  const parsed = createHostedReadSchedule(schedule);
  const due = isoTimestampSchema.parse(dueAt);
  const occurrenceId = `${parsed.scheduleId}.${Date.parse(due)}`;
  const request = hostedReadAdmissionRequestSchema.parse({
    schemaVersion: 1,
    audience: 'unisane.ops',
    evidenceRevision: parsed.evidenceRevision,
    action: {
      ...parsed.action,
      idempotencyKey: occurrenceId,
      context: {
        ...parsed.action.context,
        requestId: occurrenceId,
        requestedAt: due,
      },
    },
  });
  return {
    occurrenceId,
    scheduleId: parsed.scheduleId,
    dueAt: due,
    nextDueAt: new Date(Date.parse(due) + parsed.cadence.milliseconds).toISOString(),
    request,
  };
}
