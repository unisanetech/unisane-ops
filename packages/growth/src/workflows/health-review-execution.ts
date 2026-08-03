import type { OpsPrincipal } from '@unisane/ops-engine/actions';
import {
  createGrowthHealthReviewAction,
  growthHealthReviewInputSchema,
  growthHealthReviewOutputSchema,
  type GrowthHealthReviewOutput,
} from '../actions/health-review.js';
import type { GrowthCapability, GrowthConfig } from '../config.js';
import {
  type MarketingProviderReportStatus,
  type MarketingReportProvider,
} from '../marketing/index.js';
import { readMarketingStatusProviderFreshness } from '../marketing/reports/status.js';
import type { GrowthDataObservation } from '../readiness.js';

export type ExecuteGrowthHealthReviewOptions = {
  cwd: string;
  config: GrowthConfig;
  projectId: string;
  environmentId: string;
  principal: OpsPrincipal;
  maxAgeDays?: number;
  findingLimit?: number;
  now?: Date;
  requestId?: string;
  dataObservations?: readonly GrowthDataObservation[];
};

export type GrowthHealthReviewExecutionDependencies = {
  readProviderFreshness(options: {
    cwd: string;
    maxAgeDays: number;
    now: Date;
  }): MarketingProviderReportStatus[];
};

const defaultDependencies: GrowthHealthReviewExecutionDependencies = {
  readProviderFreshness: (options) => readMarketingStatusProviderFreshness(options),
};

const providersByCapability: Partial<Record<GrowthCapability, readonly MarketingReportProvider[]>> =
  {
    seo: ['searchConsole'],
    analytics: ['ga4'],
    advertising: ['googleAds'],
    experiments: ['ga4'],
    recommendations: ['ga4', 'searchConsole'],
  };

function stableId(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9.-]+/g, '-')
      .replace(/^[.-]+|[.-]+$/g, '') || 'growth'
  );
}

function relevantProviders(config: GrowthConfig): Set<MarketingReportProvider> {
  return new Set(
    config.capabilities.flatMap((capability) => providersByCapability[capability] ?? []),
  );
}

function latestObservedAt(statuses: readonly MarketingProviderReportStatus[], now: Date): string {
  const timestamps = statuses
    .flatMap((status) => (status.pulledAt ? [Date.parse(status.pulledAt)] : []))
    .filter(Number.isFinite);
  return timestamps.length ? new Date(Math.max(...timestamps)).toISOString() : now.toISOString();
}

export function projectGrowthDataObservation(input: {
  config: GrowthConfig;
  environmentId: string;
  statuses: readonly MarketingProviderReportStatus[];
  now: Date;
}): GrowthDataObservation {
  const providers = relevantProviders(input.config);
  const relevant = input.statuses.filter((status) => providers.has(status.provider));
  const statusValues = relevant.map((status) => status.status);
  let state: GrowthDataObservation['state'];
  let summary: string;
  if (relevant.length === 0 || statusValues.every((status) => status === 'missing')) {
    state = 'warming';
    summary = 'The first usable provider reports have not arrived yet.';
  } else if (statusValues.includes('error') || statusValues.includes('partial')) {
    state = 'delayed';
    summary = 'One or more required provider reports are incomplete or invalid.';
  } else if (statusValues.includes('stale')) {
    state = 'stale';
    summary = 'One or more required provider reports are stale.';
  } else if (statusValues.includes('missing')) {
    state = 'delayed';
    summary = 'Some required provider reports are available, but others are still missing.';
  } else {
    state = 'ready';
    summary = 'Current provider evidence is available for the selected Growth capabilities.';
  }
  return {
    environmentId: input.environmentId,
    state,
    observedAt: latestObservedAt(relevant, input.now),
    source: 'Growth provider report artifacts',
    summary,
  };
}

export function createGrowthHealthReviewExecutor(
  dependencies: GrowthHealthReviewExecutionDependencies = defaultDependencies,
) {
  return async function executeGrowthHealthReview(
    options: ExecuteGrowthHealthReviewOptions,
  ): Promise<GrowthHealthReviewOutput> {
    const now = options.now ?? new Date();
    const maxAgeDays = options.maxAgeDays ?? 3;
    const dataObservations = options.dataObservations ?? [
      projectGrowthDataObservation({
        config: options.config,
        environmentId: options.environmentId,
        statuses: dependencies.readProviderFreshness({ cwd: options.cwd, maxAgeDays, now }),
        now,
      }),
    ];
    const action = createGrowthHealthReviewAction({
      loadConfig: () => options.config,
      loadDataObservations: () => dataObservations,
      now: () => now,
    });
    const output = await action.execute(
      growthHealthReviewInputSchema.parse({ findingLimit: options.findingLimit ?? 50 }),
      {
        requestId: options.requestId ?? `request.health-review.${now.getTime()}`,
        scopeId: `scope.${stableId(options.projectId)}`,
        projectId: stableId(options.projectId),
        environmentId: stableId(options.environmentId),
        principal: options.principal,
        requestedAt: now.toISOString(),
      },
    );
    return growthHealthReviewOutputSchema.parse(output);
  };
}

export const executeGrowthHealthReview = createGrowthHealthReviewExecutor();

export function formatGrowthHealthReview(output: GrowthHealthReviewOutput): string {
  const presentation = output.workflow.presentation;
  const lines = [
    '# Growth health review',
    '',
    presentation.headline,
    presentation.whyItMatters,
    '',
    `Blocking checks: ${output.blockingCount}`,
    `Checks needing attention: ${output.attentionCount}`,
    `Findings returned: ${output.returnedFindingCount} of ${output.totalFindingCount}`,
    '',
    `Next: ${presentation.nextStep.label}`,
    presentation.nextStep.reason,
  ];
  if (presentation.nextStep.deepLink) lines.push(`Open: ${presentation.nextStep.deepLink}`);
  if (output.truncated)
    lines.push('More findings are available; increase --finding-limit to review them.');
  return `${lines.join('\n')}\n`;
}
