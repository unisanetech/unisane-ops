import { createLocalOpsExecutionState, LocalOpsMutationRunStore } from '@unisane/ops-engine/local';
import { createCliCampaignPauseProviderAdapters } from '../../provider-adapters.js';
import {
  loadGrowthProjectContext,
  selectGrowthEnvironment,
  type GrowthProjectContext,
} from '../../project-context.js';
import { createGrowthCampaignPauseWorkflow } from '../../../workflows/campaign-pause-execution.js';
import {
  getGrowthCampaignPauseRunReview,
  resolveGrowthCampaignPauseExecutionStateDirectory,
  resolveGrowthCampaignPauseRunDirectory,
} from '../../../playbooks/campaign-pause-run.js';
import type { GrowthCampaignPauseWorkflowResult } from '../../../workflows/campaign-pause-execution.js';

export type CampaignPauseCliOptions = {
  cwd?: string;
  environment?: string;
  json?: boolean;
  provider?: 'googleAds' | 'metaAds';
  accountId?: string;
  campaignId?: string;
  evidenceRevision?: string;
  verificationDelayMs?: string;
  verificationTtlMs?: string;
  planTtlMs?: string;
  runId?: string;
  planHash?: string;
  approvedBy?: string;
  approvalTtlMs?: string;
  confirmTarget?: string;
};

function milliseconds(
  value: string | undefined,
  fallback: number,
  option: string,
  minimum: number,
): number {
  if (value === undefined) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < minimum) {
    throw new Error(
      `[GROWTH_CAMPAIGN_PAUSE_OPTION_INVALID] ${option} must be at least ${minimum} milliseconds.`,
    );
  }
  return parsed;
}

function required(value: string | undefined, option: string): string {
  if (!value?.trim()) {
    throw new Error(`[GROWTH_CAMPAIGN_PAUSE_OPTION_REQUIRED] ${option} is required.`);
  }
  return value.trim();
}

function localWorkflow(input: {
  cwd: string;
  context: GrowthProjectContext;
  environmentId: string;
}) {
  const environment = input.context.environments[input.environmentId];
  if (!environment) {
    throw new Error(`[GROWTH_ENVIRONMENT_UNKNOWN] '${input.environmentId}' is not configured.`);
  }
  return createGrowthCampaignPauseWorkflow({
    state: createLocalOpsExecutionState(
      resolveGrowthCampaignPauseExecutionStateDirectory({
        cwd: input.cwd,
        projectId: input.context.projectId,
        environmentId: input.environmentId,
      }),
    ),
    runStore: new LocalOpsMutationRunStore(
      resolveGrowthCampaignPauseRunDirectory({
        cwd: input.cwd,
        projectId: input.context.projectId,
        environmentId: input.environmentId,
      }),
    ),
    providerAdapters: createCliCampaignPauseProviderAdapters({
      environment: input.environmentId,
    }),
    actor: 'developer',
    mutationPolicy: input.context.growth.policy.mutation,
    production: environment.production,
    multiProcess: false,
    lockOwner: 'worker.growth-local-cli',
  });
}

function formatResult(result: GrowthCampaignPauseWorkflowResult): string {
  const review = result.review;
  return [
    review.headline,
    review.explanation,
    `Run: ${result.runId}`,
    `Target: ${review.target.providerLabel} / ${review.target.providerAccountId} / ${review.target.campaignId}`,
    `Plan: ${review.action.planHash}`,
    `Status: ${review.status}`,
    `Next: ${review.nextStep.label}`,
  ].join('\n');
}

function emit(result: GrowthCampaignPauseWorkflowResult, json: boolean | undefined): void {
  console.log(json ? JSON.stringify(result, null, 2) : formatResult(result));
}

async function contextFor(options: CampaignPauseCliOptions) {
  const context = await loadGrowthProjectContext();
  const environmentId = selectGrowthEnvironment(context, options.environment);
  const cwd = options.cwd ?? context.projectRoot;
  return { context, environmentId, cwd };
}

async function run(
  options: CampaignPauseCliOptions,
  operation: () => Promise<GrowthCampaignPauseWorkflowResult | null>,
): Promise<number> {
  try {
    const result = await operation();
    if (!result) {
      throw new Error(
        '[GROWTH_CAMPAIGN_PAUSE_RUN_NOT_FOUND] The campaign pause run was not found.',
      );
    }
    emit(result, options.json);
    return result.review.status === 'needs-attention' ||
      result.review.execution.status === 'outcome-unknown'
      ? 1
      : 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown campaign pause error';
    if (options.json) console.log(JSON.stringify({ ok: false, error: message }, null, 2));
    else console.error(message);
    return 1;
  }
}

export function campaignPausePlan(options: CampaignPauseCliOptions): Promise<number> {
  return run(options, async () => {
    const loaded = await contextFor(options);
    const provider = required(options.provider, '--provider') as 'googleAds' | 'metaAds';
    if (provider !== 'googleAds' && provider !== 'metaAds') {
      throw new Error(
        '[GROWTH_CAMPAIGN_PAUSE_PROVIDER_INVALID] --provider must be googleAds or metaAds.',
      );
    }
    const campaignId = required(options.campaignId, '--campaign-id');
    const evidenceRevision = required(options.evidenceRevision, '--evidence-revision');
    return localWorkflow(loaded).plan({
      context: {
        requestId: `request.campaign-pause.${Date.now()}`,
        scopeId: `scope.${loaded.context.projectId}`,
        projectId: loaded.context.projectId,
        environmentId: loaded.environmentId,
        targetId: campaignId,
        principal: { kind: 'user', id: 'user.local-operator' },
        requestedAt: new Date().toISOString(),
      },
      parameters: {
        provider,
        providerAccountId: required(options.accountId, '--account-id'),
        campaignId,
        evidenceRevision,
        verificationDelayMs: milliseconds(
          options.verificationDelayMs,
          30_000,
          '--verification-delay-ms',
          0,
        ),
        verificationTtlMs: milliseconds(
          options.verificationTtlMs,
          300_000,
          '--verification-ttl-ms',
          1_000,
        ),
      },
      currentEvidenceRevision: evidenceRevision,
      planTtlMs: milliseconds(options.planTtlMs, 600_000, '--plan-ttl-ms', 1_000),
    });
  });
}

export function campaignPauseShow(options: CampaignPauseCliOptions): Promise<number> {
  return run(options, async () => {
    const loaded = await contextFor(options);
    const runId = required(options.runId, '--run-id');
    const review = await getGrowthCampaignPauseRunReview({
      store: new LocalOpsMutationRunStore(
        resolveGrowthCampaignPauseRunDirectory({
          cwd: loaded.cwd,
          projectId: loaded.context.projectId,
          environmentId: loaded.environmentId,
        }),
      ),
      runId,
      now: new Date().toISOString(),
    });
    return review
      ? { schemaVersion: 1, kind: 'growth.campaign-pause-workflow-result', runId, review }
      : null;
  });
}

export function campaignPauseApprove(options: CampaignPauseCliOptions): Promise<number> {
  return run(options, async () => {
    const loaded = await contextFor(options);
    return localWorkflow(loaded).approve({
      runId: required(options.runId, '--run-id'),
      approvedBy: required(options.approvedBy, '--approved-by'),
      confirmPlanHash: required(options.planHash, '--plan-hash'),
      approvalTtlMs: milliseconds(options.approvalTtlMs, 600_000, '--approval-ttl-ms', 1_000),
    });
  });
}

export function campaignPauseApply(options: CampaignPauseCliOptions): Promise<number> {
  return run(options, async () => {
    const loaded = await contextFor(options);
    return localWorkflow(loaded).apply({
      runId: required(options.runId, '--run-id'),
      currentEvidenceRevision: required(options.evidenceRevision, '--evidence-revision'),
      confirmTarget: required(options.confirmTarget, '--confirm-target'),
      principal: { kind: 'user', id: 'user.local-operator' },
    });
  });
}

export function campaignPauseVerify(options: CampaignPauseCliOptions): Promise<number> {
  return run(options, async () => {
    const loaded = await contextFor(options);
    return localWorkflow(loaded).verify({
      runId: required(options.runId, '--run-id'),
      principal: { kind: 'user', id: 'user.local-operator' },
    });
  });
}
