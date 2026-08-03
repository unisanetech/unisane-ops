import { z } from 'zod';
import {
  defineOpsReadAction,
  OpsActionExecutionError,
  type OpsActionContext,
} from '@unisane/ops-engine/actions';
import { aggregateOpsReadiness, opsReadinessFindingSchema } from '@unisane/ops-engine/readiness';
import { growthConfigSchema, type GrowthConfig } from '../config.js';
import { buildGrowthConfigReadiness, type GrowthDataObservation } from '../readiness.js';
import {
  createGrowthHealthReviewWorkflowProjection,
  growthHealthReviewSnapshotSchema,
  growthHealthReviewWorkflowProjectionSchema,
} from '../playbooks/health-review.js';

const growthDataObservationSchema = z
  .object({
    environmentId: z.string().regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/),
    state: z.enum(['warming', 'ready', 'stale', 'delayed', 'permission-blocked']),
    observedAt: z.string().datetime({ offset: true }),
    source: z.string().trim().min(1),
    summary: z.string().trim().min(1),
  })
  .strict();

export const growthHealthReviewInputSchema = z
  .object({
    findingLimit: z.number().int().min(1).max(100).default(50),
  })
  .strict();
export type GrowthHealthReviewInput = z.infer<typeof growthHealthReviewInputSchema>;

export const growthHealthReviewOutputSchema = z
  .object({
    schemaVersion: z.literal(2),
    projectId: z.string(),
    environmentId: z.string(),
    observedAt: z.string().datetime({ offset: true }),
    status: z.enum(['ready', 'attention', 'blocked']),
    blockingCount: z.number().int().nonnegative(),
    attentionCount: z.number().int().nonnegative(),
    totalFindingCount: z.number().int().nonnegative(),
    returnedFindingCount: z.number().int().nonnegative(),
    truncated: z.boolean(),
    findings: z.array(opsReadinessFindingSchema),
    workflow: growthHealthReviewWorkflowProjectionSchema,
  })
  .strict();
export type GrowthHealthReviewOutput = z.infer<typeof growthHealthReviewOutputSchema>;

export interface GrowthHealthReviewDependencies {
  loadConfig(context: OpsActionContext): GrowthConfig | Promise<GrowthConfig>;
  loadDataObservations?(
    context: OpsActionContext,
  ): readonly GrowthDataObservation[] | Promise<readonly GrowthDataObservation[]>;
  now?: () => Date;
}

export function createGrowthHealthReviewAction(dependencies: GrowthHealthReviewDependencies) {
  return defineOpsReadAction({
    id: 'growth.health.review',
    schemaVersion: 2,
    maximumEffect: 'offline',
    inputSchema: growthHealthReviewInputSchema,
    outputSchema: growthHealthReviewOutputSchema,
    async execute(input, context) {
      const config = growthConfigSchema.parse(await dependencies.loadConfig(context));
      if (!(context.environmentId in config.environments)) {
        throw new OpsActionExecutionError(
          'growth.health.environment-missing',
          'The requested Growth environment is not configured for this project.',
        );
      }
      const observedAt = (dependencies.now ?? (() => new Date()))().toISOString();
      const dataObservations = dependencies.loadDataObservations
        ? z
            .array(growthDataObservationSchema)
            .max(100)
            .parse(await dependencies.loadDataObservations(context))
        : undefined;
      const allFindings = buildGrowthConfigReadiness({
        projectId: context.projectId,
        config,
        observedAt,
        ...(dataObservations ? { dataObservations } : {}),
      });
      const findings = allFindings.filter(
        (finding) =>
          finding.environmentId === undefined || finding.environmentId === context.environmentId,
      );
      const summary = aggregateOpsReadiness(findings);
      const returned = findings.slice(0, input.findingLimit);
      const snapshot = growthHealthReviewSnapshotSchema.parse({
        schemaVersion: 1,
        projectId: context.projectId,
        environmentId: context.environmentId,
        observedAt,
        ...summary,
        totalFindingCount: findings.length,
        returnedFindingCount: returned.length,
        truncated: returned.length < findings.length,
        findings: returned,
      });
      return growthHealthReviewOutputSchema.parse({
        ...snapshot,
        schemaVersion: 2,
        workflow: createGrowthHealthReviewWorkflowProjection({
          runId: `workflow.${context.requestId}`,
          briefId: `brief.${context.requestId}`,
          handoffId: `handoff.${context.requestId}`,
          context,
          snapshot,
        }),
      });
    },
  });
}
