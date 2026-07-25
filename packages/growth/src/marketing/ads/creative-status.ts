import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import {
  marketingAdsPlanArtifactSchema,
  type MarketingAdsPlanArtifact,
  type MarketingAdsPlanProvider,
} from '../schema/ads-plan.js';
import type { MarketingCreativeAsset } from '../schema/ads-creative.js';
import {
  marketingProviderReportArtifactSchema,
  type MarketingProviderReportArtifact,
} from '../schema/report.js';
import { ensurePathWithinCwd, providerLatestPullPath } from '../reports/paths.js';
import { creativeAssetsFromProviderArtifact } from './creative-assets.js';

export type MarketingAdsCreativeStatusCheckStatus = 'pass' | 'warn' | 'error' | 'skip';

export type MarketingAdsCreativeStatusCheck = {
  id: string;
  status: MarketingAdsCreativeStatusCheckStatus;
  message: string;
  provider?: MarketingAdsPlanProvider;
  assetId?: string;
  path?: string;
};

export type MarketingAdsCreativeStatusReport = {
  ok: boolean;
  cwd: string;
  planPath?: string;
  platformId?: string;
  appId?: string;
  providerFilter: MarketingAdsPlanProvider | 'all';
  maxAgeDays: number;
  plannedAssets: MarketingCreativeAsset[];
  providerAssets: MarketingCreativeAsset[];
  providerArtifacts: Array<{
    provider: MarketingAdsPlanProvider;
    reportType: 'creative';
    status: 'fresh' | 'stale' | 'partial' | 'missing' | 'error';
    path: string;
    recordCount: number;
    ageDays?: number;
    message: string;
  }>;
  checks: MarketingAdsCreativeStatusCheck[];
  nextWorkflowStep: string;
};

export type MarketingAdsCreativeStatusOptions = {
  cwd?: string;
  planPath?: string;
  provider?: MarketingAdsPlanProvider | 'all';
  maxAgeDays?: number;
  now?: Date;
};

const creativeProviderOrder: MarketingAdsPlanProvider[] = ['googleAds', 'metaAds'];

function readJsonFile(filePath: string): unknown {
  return JSON.parse(readFileSync(filePath, 'utf8')) as unknown;
}

function readPlan(
  cwd: string,
  planPath: string | undefined,
): { path?: string; artifact?: MarketingAdsPlanArtifact } {
  if (!planPath) return {};
  const resolved = path.resolve(cwd, planPath);
  ensurePathWithinCwd(cwd, resolved);
  return {
    path: resolved,
    artifact: marketingAdsPlanArtifactSchema.parse(readJsonFile(resolved)),
  };
}

function providersFor(provider: MarketingAdsPlanProvider | 'all'): MarketingAdsPlanProvider[] {
  return provider === 'all' ? creativeProviderOrder : [provider];
}

function providerCreativeArtifact(input: {
  cwd: string;
  provider: MarketingAdsPlanProvider;
  now: Date;
  maxAgeDays: number;
}): MarketingAdsCreativeStatusReport['providerArtifacts'][number] & {
  artifact?: MarketingProviderReportArtifact;
} {
  const latestPath = providerLatestPullPath(input.cwd, input.provider, 'creative');
  if (!existsSync(latestPath)) {
    return {
      provider: input.provider,
      reportType: 'creative',
      status: 'missing',
      path: latestPath,
      recordCount: 0,
      message: `${input.provider}/creative latest provider artifact is missing.`,
    };
  }

  try {
    const artifact = marketingProviderReportArtifactSchema.parse(readJsonFile(latestPath));
    const ageDays = Math.max(
      0,
      Math.round((input.now.getTime() - Date.parse(artifact.pulledAt)) / 86_400_000),
    );
    const status = artifact.partial ? 'partial' : ageDays > input.maxAgeDays ? 'stale' : 'fresh';
    return {
      provider: input.provider,
      reportType: 'creative',
      status,
      path: latestPath,
      recordCount: artifact.records.length,
      ageDays,
      message: artifact.partial
        ? `${input.provider}/creative latest provider artifact is partial.`
        : status === 'stale'
          ? `${input.provider}/creative latest provider artifact is ${ageDays} days old.`
          : `${input.provider}/creative latest provider artifact is fresh.`,
      artifact,
    };
  } catch (error) {
    return {
      provider: input.provider,
      reportType: 'creative',
      status: 'error',
      path: latestPath,
      recordCount: 0,
      message:
        error instanceof Error
          ? `${input.provider}/creative latest provider artifact is invalid: ${error.message}`
          : `${input.provider}/creative latest provider artifact is invalid.`,
    };
  }
}

function plannedAssetChecks(asset: MarketingCreativeAsset): MarketingAdsCreativeStatusCheck[] {
  const checks: MarketingAdsCreativeStatusCheck[] = [
    {
      id: `planned.${asset.provider}.${asset.id}.destination`,
      status: asset.destinationUrl ? 'pass' : 'error',
      message: asset.destinationUrl
        ? `${asset.id} has a destination URL.`
        : `${asset.id} is missing a destination URL.`,
      provider: asset.provider,
      assetId: asset.id,
    },
    {
      id: `planned.${asset.provider}.${asset.id}.approval`,
      status:
        asset.approvalStatus === 'approved' || asset.approvalStatus === 'reviewed'
          ? 'pass'
          : asset.approvalStatus === 'rejected'
            ? 'error'
            : 'warn',
      message:
        asset.approvalStatus === 'approved' || asset.approvalStatus === 'reviewed'
          ? `${asset.id} is ${asset.approvalStatus}.`
          : asset.approvalStatus === 'rejected'
            ? `${asset.id} was rejected and must not be applied.`
            : `${asset.id} is still draft and needs review before provider mutation.`,
      provider: asset.provider,
      assetId: asset.id,
    },
    {
      id: `planned.${asset.provider}.${asset.id}.policy`,
      status:
        asset.policyStatus === 'eligible'
          ? 'pass'
          : asset.policyStatus === 'disapproved'
            ? 'error'
            : 'warn',
      message:
        asset.policyStatus === 'eligible'
          ? `${asset.id} is policy eligible.`
          : asset.policyStatus === 'disapproved'
            ? `${asset.id} is policy disapproved and must not be applied.`
            : `${asset.id} requires provider policy review before launch.`,
      provider: asset.provider,
      assetId: asset.id,
    },
  ];

  if (asset.provider === 'metaAds' && asset.assetType === 'image') {
    checks.push({
      id: `planned.${asset.provider}.${asset.id}.image`,
      status: asset.imageUrl || asset.thumbnailUrl ? 'pass' : 'warn',
      message:
        asset.imageUrl || asset.thumbnailUrl
          ? `${asset.id} has image evidence.`
          : `${asset.id} is an image creative without image evidence yet.`,
      provider: asset.provider,
      assetId: asset.id,
    });
  }

  if (asset.provider === 'googleAds' && asset.assetType === 'text_ad') {
    checks.push({
      id: `planned.${asset.provider}.${asset.id}.copy`,
      status: asset.headline && asset.body ? 'pass' : 'warn',
      message:
        asset.headline && asset.body
          ? `${asset.id} has draft copy.`
          : `${asset.id} needs search ad copy before review.`,
      provider: asset.provider,
      assetId: asset.id,
    });
  }

  return checks;
}

function providerAssetChecks(asset: MarketingCreativeAsset): MarketingAdsCreativeStatusCheck[] {
  return [
    {
      id: `provider.${asset.provider}.${asset.id}.destination`,
      status: asset.destinationUrl ? 'pass' : 'warn',
      message: asset.destinationUrl
        ? `${asset.id} has provider destination URL evidence.`
        : `${asset.id} has no provider destination URL evidence.`,
      provider: asset.provider,
      assetId: asset.id,
    },
    {
      id: `provider.${asset.provider}.${asset.id}.policy`,
      status:
        asset.policyStatus === 'eligible'
          ? 'pass'
          : asset.policyStatus === 'disapproved'
            ? 'error'
            : 'warn',
      message:
        asset.policyStatus === 'eligible'
          ? `${asset.id} is provider policy eligible.`
          : asset.policyStatus === 'disapproved'
            ? `${asset.id} is provider policy disapproved.`
            : `${asset.id} provider policy status is ${asset.policyStatus}.`,
      provider: asset.provider,
      assetId: asset.id,
    },
  ];
}

function resolveNextWorkflowStep(
  report: Omit<MarketingAdsCreativeStatusReport, 'nextWorkflowStep'>,
): string {
  if (report.checks.some((check) => check.status === 'error')) {
    return 'Fix blocking creative errors before ads diff or apply dry-run.';
  }
  if (!report.planPath) {
    return 'Run `unisane growth ads plan --out <plan.json>` or pass `--plan <plan.json>` to review planned creatives.';
  }
  if (report.plannedAssets.length === 0) {
    return 'Regenerate the ads plan so it includes reviewable creative assets.';
  }
  if (report.checks.some((check) => check.id.startsWith('planned.') && check.status === 'warn')) {
    return 'Review creative copy/assets, set approval and policy status, then rerun `unisane growth ads creative status`.';
  }
  if (report.providerArtifacts.some((artifact) => artifact.status === 'missing')) {
    return 'Pull provider creative inventory where available, then compare planned and live creative evidence.';
  }
  return 'Creative evidence is ready for `unisane growth ads diff` and guarded `ads apply --dry-run`.';
}

export function buildMarketingAdsCreativeStatusReport(
  options: MarketingAdsCreativeStatusOptions = {},
): MarketingAdsCreativeStatusReport {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const now = options.now ?? new Date();
  const providerFilter = options.provider ?? 'all';
  const maxAgeDays = options.maxAgeDays ?? 3;
  const providers = providersFor(providerFilter);
  const plan = readPlan(cwd, options.planPath);
  const plannedAssets = (plan.artifact?.creativeAssets ?? []).filter((asset) =>
    providers.includes(asset.provider),
  );
  const providerArtifacts = providers.map((provider) =>
    providerCreativeArtifact({ cwd, provider, now, maxAgeDays }),
  );
  const providerAssets = providerArtifacts.flatMap((entry) =>
    entry.artifact ? creativeAssetsFromProviderArtifact(entry.artifact) : [],
  );
  const checks: MarketingAdsCreativeStatusCheck[] = [];

  if (!plan.path) {
    checks.push({
      id: 'plan.path',
      status: 'warn',
      message: 'No ads plan was provided.',
    });
  } else {
    checks.push({
      id: 'plan.path',
      status: 'pass',
      message: `Ads plan loaded from ${plan.path}.`,
      path: plan.path,
    });
  }

  if (plan.path && plannedAssets.length === 0) {
    checks.push({
      id: 'planned.creativeAssets',
      status: 'warn',
      message: 'The selected plan/provider filter has no creative assets.',
      path: plan.path,
    });
  }

  for (const asset of plannedAssets) checks.push(...plannedAssetChecks(asset));

  for (const artifact of providerArtifacts) {
    checks.push({
      id: `provider.${artifact.provider}.creative.cache`,
      status:
        artifact.status === 'error'
          ? 'error'
          : artifact.status === 'fresh'
            ? 'pass'
            : artifact.provider === 'googleAds' && artifact.status === 'missing'
              ? 'skip'
              : 'warn',
      message:
        artifact.provider === 'googleAds' && artifact.status === 'missing'
          ? 'Google Ads creative inventory is not required for first-class creative review yet.'
          : artifact.message,
      provider: artifact.provider,
      path: artifact.path,
    });
  }

  for (const asset of providerAssets) checks.push(...providerAssetChecks(asset));

  const reportWithoutNext = {
    ok: checks.every((check) => check.status !== 'error'),
    cwd,
    planPath: plan.path,
    platformId: plan.artifact?.platformId,
    appId: plan.artifact?.appId,
    providerFilter,
    maxAgeDays,
    plannedAssets,
    providerAssets,
    providerArtifacts: providerArtifacts.map((entry) => ({
      provider: entry.provider,
      reportType: entry.reportType,
      status: entry.status,
      path: entry.path,
      recordCount: entry.recordCount,
      ageDays: entry.ageDays,
      message: entry.message,
    })),
    checks,
  };

  return {
    ...reportWithoutNext,
    nextWorkflowStep: resolveNextWorkflowStep(reportWithoutNext),
  };
}
