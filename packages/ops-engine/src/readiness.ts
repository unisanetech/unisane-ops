import { z } from 'zod';

const stableCodeSchema = z.string().regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/);
const nonEmptySchema = z.string().trim().min(1);
const isoTimestampSchema = z.string().datetime({ offset: true });

export const opsReadinessDimensionSchema = z.enum([
  'project',
  'connection',
  'resource',
  'instrumentation',
  'data',
  'business-truth',
  'decision',
  'mutation',
]);
export type OpsReadinessDimension = z.infer<typeof opsReadinessDimensionSchema>;

export const opsReadinessStateSchema = z.enum([
  'ready',
  'not-selected',
  'not-connected',
  'missing',
  'partial',
  'warming',
  'no-signal',
  'stale',
  'delayed',
  'permission-blocked',
  'expired-access',
  'conflicted',
  'approval-required',
  'drifted',
  'blocked',
  'failed',
]);
export type OpsReadinessState = z.infer<typeof opsReadinessStateSchema>;

export const opsReadinessSeveritySchema = z.enum(['info', 'warning', 'error']);
export type OpsReadinessSeverity = z.infer<typeof opsReadinessSeveritySchema>;

export const opsCommandDescriptorSchema = z
  .object({
    path: z.array(stableCodeSchema).min(1),
    args: z.array(z.string()),
    json: z.boolean(),
    maximumEffect: z.enum(['offline', 'read-network', 'write', 'spend-impact']),
  })
  .strict();
export type OpsCommandDescriptor = z.infer<typeof opsCommandDescriptorSchema>;

export const opsNextActionSchema = z
  .object({
    id: stableCodeSchema,
    label: nonEmptySchema,
    description: nonEmptySchema,
    command: opsCommandDescriptorSchema.optional(),
    file: nonEmptySchema.optional(),
    requiresConfirmation: z.boolean(),
    requiresApproval: z.boolean(),
  })
  .strict()
  .superRefine((action, context) => {
    if (!action.command && !action.file) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'An Ops next action must identify an exact command or file.',
      });
    }
  });
export type OpsNextAction = z.infer<typeof opsNextActionSchema>;

export const opsReadinessEvidenceSchema = z
  .object({
    kind: stableCodeSchema,
    source: nonEmptySchema,
    observedAt: isoTimestampSchema,
    freshness: z.enum(['fresh', 'warming', 'stale', 'unknown']),
    summary: nonEmptySchema,
  })
  .strict();
export type OpsReadinessEvidence = z.infer<typeof opsReadinessEvidenceSchema>;

export const opsReadinessFindingSchema = z
  .object({
    schemaVersion: z.literal(1),
    code: stableCodeSchema,
    dimension: opsReadinessDimensionSchema,
    state: opsReadinessStateSchema,
    severity: opsReadinessSeveritySchema,
    projectId: stableCodeSchema,
    environmentId: stableCodeSchema.optional(),
    connectionId: stableCodeSchema.optional(),
    resourceId: nonEmptySchema.optional(),
    summary: nonEmptySchema,
    blocking: z.boolean(),
    observedAt: isoTimestampSchema,
    evidence: z.array(opsReadinessEvidenceSchema),
    uncertainty: nonEmptySchema.optional(),
    nextAction: opsNextActionSchema.optional(),
  })
  .strict()
  .superRefine((finding, context) => {
    if (finding.blocking && !finding.nextAction) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A blocking Ops readiness finding must provide one next action.',
      });
    }
  });
export type OpsReadinessFinding = z.infer<typeof opsReadinessFindingSchema>;

export function defineOpsReadinessFinding(input: OpsReadinessFinding): OpsReadinessFinding {
  return opsReadinessFindingSchema.parse(input);
}

export function aggregateOpsReadiness(findings: readonly OpsReadinessFinding[]): {
  status: 'ready' | 'attention' | 'blocked';
  blockingCount: number;
  attentionCount: number;
} {
  const parsed = findings.map((finding) => opsReadinessFindingSchema.parse(finding));
  const blockingCount = parsed.filter((finding) => finding.blocking).length;
  const attentionCount = parsed.filter(
    (finding) => !finding.blocking && finding.state !== 'ready',
  ).length;
  return {
    status: blockingCount > 0 ? 'blocked' : attentionCount > 0 ? 'attention' : 'ready',
    blockingCount,
    attentionCount,
  };
}
