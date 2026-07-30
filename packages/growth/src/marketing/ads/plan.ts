import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { MarketingExecutionContext } from '../schema/execution-context.js';
import {
  marketingAdsPlanArtifactSchema,
  marketingAdsPlanProviderSchema,
  type MarketingAdsPlanArtifact,
  type MarketingAdsPlanProvider,
} from '../schema/ads-plan.js';
import { buildMarketingStrategyObjectReport } from '../reports/strategy-object-report.js';
import { ensurePathWithinCwd } from '../reports/paths.js';
import { planMarketingCreativeAssets } from './creative-assets.js';
import { planMarketingAdsCandidate } from './plan-candidates.js';
import { planMarketingAdsCandidatesFromSeoAdsPlan } from './seo-plan-input.js';

export type MarketingAdsPlanOptions = {
  cwd?: string;
  provider?: MarketingAdsPlanProvider | 'all';
  out?: string;
  dryRun?: boolean;
  dailyBudgetAmount?: number;
  currency?: string;
  seoAdsPlanPath?: string;
  now?: Date;
};

export type MarketingAdsPlanResult = {
  ok: boolean;
  dryRun: boolean;
  path?: string;
  artifact: MarketingAdsPlanArtifact;
};

function defaultAdsPlanPath(cwd: string, generatedAt: string): string {
  const safeTimestamp = generatedAt.replaceAll(':', '-').replaceAll('.', '-');
  return path.resolve(cwd, 'docs', 'marketing', 'ads', 'plans', `draft-${safeTimestamp}.json`);
}

function resolveOutputPath(
  cwd: string,
  maybePath: string | undefined,
  generatedAt: string,
): string {
  const resolved = maybePath ? path.resolve(cwd, maybePath) : defaultAdsPlanPath(cwd, generatedAt);
  ensurePathWithinCwd(cwd, resolved);
  return resolved;
}

function enabledProviders(
  config: MarketingExecutionContext,
  providerFilter: MarketingAdsPlanProvider | 'all',
): MarketingAdsPlanProvider[] {
  const providers: MarketingAdsPlanProvider[] = ['googleAds', 'metaAds'];
  return providers.filter((provider) => {
    if (providerFilter !== 'all' && provider !== providerFilter) return false;
    return config.providers[provider].state !== 'disabled';
  });
}

function nextWorkflowStep(artifact: MarketingAdsPlanArtifact): string {
  if (artifact.blockers.includes('missing_strategy_map')) {
    return 'Run `unisane growth marketing strategy-pull --input <strategy-map.json>` before ads planning.';
  }
  if (artifact.blockers.length > 0) {
    return 'Resolve ads plan blockers, then regenerate the draft before any provider mutation planning.';
  }
  return 'Review the draft ads plan, add explicit approvals, then build a dry-run apply plan.';
}

export function buildMarketingAdsPlan(
  config: MarketingExecutionContext,
  options: MarketingAdsPlanOptions = {},
): MarketingAdsPlanArtifact {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const generatedAt = (options.now ?? new Date()).toISOString();
  const providerFilter = options.provider ?? 'all';
  const providers =
    providerFilter === 'all'
      ? enabledProviders(config, 'all')
      : enabledProviders(config, marketingAdsPlanProviderSchema.parse(providerFilter));
  const strategyReport = buildMarketingStrategyObjectReport({ cwd, now: options.now });
  const strategyCandidates =
    strategyReport.status === 'available'
      ? strategyReport.objects.flatMap((objectJoin) =>
          providers.map((provider) =>
            planMarketingAdsCandidate({
              provider,
              config,
              objectJoin,
              dailyBudgetAmount: options.dailyBudgetAmount,
              currency: options.currency,
            }),
          ),
        )
      : [];
  const seoCandidates = options.seoAdsPlanPath
    ? planMarketingAdsCandidatesFromSeoAdsPlan({
        cwd,
        path: options.seoAdsPlanPath,
        providers,
        config,
        dailyBudgetAmount: options.dailyBudgetAmount,
        currency: options.currency,
      })
    : [];
  const candidates = [...strategyCandidates, ...seoCandidates];
  const creativeAssets = planMarketingCreativeAssets(candidates);
  const blockers = [
    ...(strategyReport.status === 'missing' && !options.seoAdsPlanPath
      ? ['missing_strategy_map']
      : []),
    ...(strategyReport.status === 'error' ? ['invalid_strategy_map'] : []),
    ...new Set(candidates.flatMap((candidate) => candidate.blockers)),
  ];
  const artifact = marketingAdsPlanArtifactSchema.parse({
    version: 1,
    platformId: config.platformId,
    appId: config.appId,
    generatedAt,
    status: 'draft',
    providerFilter,
    nonMutating: true,
    mutationPolicy: {
      liveMutationAllowed: false,
      applyRequiresReviewedPlan: true,
      applyRequiresReceipt: true,
      budgetIncreaseRequiresExplicitApproval: true,
      campaignEnableRequiresExplicitApproval: true,
      budgetDecreaseAllowsStandardApproval: true,
      pauseOrArchiveAllowsStandardApproval: true,
      destructiveDeletesAllowed: false,
      emergencyExceptionRequiresDocumentedReason: true,
    },
    candidates,
    creativeAssets,
    blockers: [...new Set(blockers)].sort(),
    nextWorkflowStep: 'placeholder',
  });
  return {
    ...artifact,
    nextWorkflowStep: nextWorkflowStep(artifact),
  };
}

export function writeMarketingAdsPlan(
  config: MarketingExecutionContext,
  options: MarketingAdsPlanOptions = {},
): MarketingAdsPlanResult {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const artifact = buildMarketingAdsPlan(config, options);
  const outputPath = resolveOutputPath(cwd, options.out, artifact.generatedAt);
  if (!options.dryRun) {
    mkdirSync(path.dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, `${JSON.stringify(artifact, null, 2)}\n`, 'utf8');
  }
  return {
    ok: artifact.blockers.length === 0,
    dryRun: options.dryRun === true,
    path: options.dryRun ? undefined : outputPath,
    artifact,
  };
}
