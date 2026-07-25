import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import {
  marketingAdsPlanArtifactSchema,
  type MarketingAdsPlanArtifact,
  type MarketingAdsPlanCandidate,
  type MarketingAdsPlanProvider,
} from '../schema/ads-plan.js';
import {
  marketingProviderReportArtifactSchema,
  type MarketingProviderReportArtifact,
  type MarketingProviderReportRecord,
  type MarketingProviderReportType,
} from '../schema/report.js';
import { ensurePathWithinCwd, providerLatestPullPath } from '../reports/paths.js';

export type MarketingAdsDiffCheckStatus = 'pass' | 'warn' | 'error';

export type MarketingAdsDiffCheck = {
  id: string;
  status: MarketingAdsDiffCheckStatus;
  message: string;
  provider?: MarketingAdsPlanProvider;
  strategyObjectId?: string;
  path?: string;
};

export type MarketingAdsDiffCandidate = {
  id: string;
  provider: MarketingAdsPlanProvider;
  strategyObjectId: string;
  status: 'matched' | 'planned_new' | 'drift' | 'blocked';
  checks: MarketingAdsDiffCheck[];
};

export type MarketingAdsDiffReport = {
  ok: boolean;
  cwd: string;
  planPath: string;
  platformId: string;
  appId: string;
  planStatus: MarketingAdsPlanArtifact['status'];
  generatedAt: string;
  providerFilter: MarketingAdsPlanProvider | 'all';
  maxAgeDays: number;
  candidates: MarketingAdsDiffCandidate[];
  checks: MarketingAdsDiffCheck[];
  nextWorkflowStep: string;
};

export type MarketingAdsDiffOptions = {
  cwd?: string;
  planPath: string;
  provider?: MarketingAdsPlanProvider | 'all';
  maxAgeDays?: number;
  now?: Date;
};

const providerReportTypes: Record<MarketingAdsPlanProvider, MarketingProviderReportType[]> = {
  googleAds: ['campaign', 'keyword', 'conversion'],
  metaAds: ['campaign', 'adSet', 'ad', 'creative'],
};

function readJsonFile(filePath: string): unknown {
  return JSON.parse(readFileSync(filePath, 'utf8')) as unknown;
}

function readPlan(
  cwd: string,
  planPath: string,
): { path: string; artifact: MarketingAdsPlanArtifact } {
  const resolved = path.resolve(cwd, planPath);
  ensurePathWithinCwd(cwd, resolved);
  return {
    path: resolved,
    artifact: marketingAdsPlanArtifactSchema.parse(readJsonFile(resolved)),
  };
}

function readLatestProviderArtifact(input: {
  cwd: string;
  provider: MarketingAdsPlanProvider;
  reportType: MarketingProviderReportType;
}): { path: string; artifact?: MarketingProviderReportArtifact; error?: string } {
  const latestPath = providerLatestPullPath(input.cwd, input.provider, input.reportType);
  if (!existsSync(latestPath)) return { path: latestPath };
  try {
    return {
      path: latestPath,
      artifact: marketingProviderReportArtifactSchema.parse(readJsonFile(latestPath)),
    };
  } catch (error) {
    return {
      path: latestPath,
      error: error instanceof Error ? error.message : 'Unknown provider artifact parse error',
    };
  }
}

function cacheChecks(input: {
  cwd: string;
  provider: MarketingAdsPlanProvider;
  now: Date;
  maxAgeDays: number;
}): {
  checks: MarketingAdsDiffCheck[];
  artifacts: Map<MarketingProviderReportType, MarketingProviderReportArtifact>;
} {
  const checks: MarketingAdsDiffCheck[] = [];
  const artifacts = new Map<MarketingProviderReportType, MarketingProviderReportArtifact>();
  for (const reportType of providerReportTypes[input.provider]) {
    const latest = readLatestProviderArtifact({
      cwd: input.cwd,
      provider: input.provider,
      reportType,
    });
    if (latest.error) {
      checks.push({
        id: `provider.${input.provider}.${reportType}.cache`,
        status: 'error',
        message: `${input.provider}/${reportType} latest provider artifact is invalid: ${latest.error}`,
        provider: input.provider,
        path: latest.path,
      });
      continue;
    }
    if (!latest.artifact) {
      checks.push({
        id: `provider.${input.provider}.${reportType}.cache`,
        status: 'warn',
        message: `${input.provider}/${reportType} latest provider artifact is missing.`,
        provider: input.provider,
        path: latest.path,
      });
      continue;
    }
    const ageDays = Math.max(
      0,
      Math.round((input.now.getTime() - Date.parse(latest.artifact.pulledAt)) / 86_400_000),
    );
    checks.push({
      id: `provider.${input.provider}.${reportType}.cache`,
      status: latest.artifact.partial || ageDays > input.maxAgeDays ? 'warn' : 'pass',
      message: latest.artifact.partial
        ? `${input.provider}/${reportType} latest provider artifact is partial.`
        : ageDays > input.maxAgeDays
          ? `${input.provider}/${reportType} latest provider artifact is ${ageDays} days old.`
          : `${input.provider}/${reportType} latest provider artifact is fresh.`,
      provider: input.provider,
      path: latest.path,
    });
    artifacts.set(reportType, latest.artifact);
  }
  return { checks, artifacts };
}

function normalized(value: string | undefined): string | undefined {
  const trimmed = value?.trim().toLowerCase();
  return trimmed || undefined;
}

function recordMatchesCandidate(
  record: MarketingProviderReportRecord,
  candidate: MarketingAdsPlanCandidate,
): boolean {
  const campaignIds = new Set(candidate.campaignIds.map((id) => normalized(id)).filter(Boolean));
  const campaignNames = new Set(
    candidate.campaignNames.map((name) => normalized(name)).filter(Boolean),
  );
  return Boolean(
    campaignIds.has(normalized(record.campaignId) ?? '') ||
    campaignIds.has(normalized(record.id) ?? '') ||
    campaignNames.has(normalized(record.campaignName) ?? '') ||
    campaignNames.has(normalized(record.name) ?? '') ||
    normalized(record.campaignName) === normalized(candidate.name) ||
    normalized(record.name) === normalized(candidate.name),
  );
}

function recordsFor(
  artifact: MarketingProviderReportArtifact | undefined,
): MarketingProviderReportRecord[] {
  return artifact?.records ?? [];
}

function candidateCampaignCheck(
  candidate: MarketingAdsPlanCandidate,
  campaignArtifact: MarketingProviderReportArtifact | undefined,
): MarketingAdsDiffCheck {
  const matched = recordsFor(campaignArtifact).some((record) =>
    recordMatchesCandidate(record, candidate),
  );
  const createsCampaign = candidate.actions.some((action) => action.type === 'create_campaign');
  if (matched) {
    return {
      id: `candidates.${candidate.id}.campaign`,
      status: 'pass',
      message: `Provider campaign evidence matches ${candidate.name}.`,
      provider: candidate.provider,
      strategyObjectId: candidate.strategyObjectId,
    };
  }
  return {
    id: `candidates.${candidate.id}.campaign`,
    status: createsCampaign ? 'warn' : 'error',
    message: createsCampaign
      ? `No provider campaign evidence found for ${candidate.name}; plan appears to create a new campaign.`
      : `No provider campaign evidence found for ${candidate.name}.`,
    provider: candidate.provider,
    strategyObjectId: candidate.strategyObjectId,
  };
}

function keywordChecks(
  candidate: MarketingAdsPlanCandidate,
  keywordArtifact: MarketingProviderReportArtifact | undefined,
): MarketingAdsDiffCheck[] {
  if (candidate.provider !== 'googleAds' || candidate.keywords.length === 0) return [];
  const providerKeywords = new Set(
    recordsFor(keywordArtifact)
      .map((record) => normalized(record.keyword))
      .filter(Boolean),
  );
  const missing = candidate.keywords.filter(
    (keyword) => !providerKeywords.has(normalized(keyword.text)),
  );
  return [
    {
      id: `candidates.${candidate.id}.keywords`,
      status: missing.length === 0 ? 'pass' : 'warn',
      message:
        missing.length === 0
          ? `All ${candidate.keywords.length} planned keyword(s) have provider evidence.`
          : `${missing.length} planned keyword(s) do not have provider evidence yet.`,
      provider: candidate.provider,
      strategyObjectId: candidate.strategyObjectId,
    },
  ];
}

function conversionChecks(
  candidate: MarketingAdsPlanCandidate,
  conversionArtifact: MarketingProviderReportArtifact | undefined,
): MarketingAdsDiffCheck[] {
  if (candidate.provider !== 'googleAds' || candidate.conversionIds.length === 0) return [];
  const providerConversions = new Set(
    recordsFor(conversionArtifact)
      .flatMap((record) => [record.conversionId, record.conversionName, record.name])
      .map(normalized)
      .filter(Boolean),
  );
  const missing = candidate.conversionIds.filter((id) => !providerConversions.has(normalized(id)));
  return [
    {
      id: `candidates.${candidate.id}.conversions`,
      status: missing.length === 0 ? 'pass' : 'warn',
      message:
        missing.length === 0
          ? `All ${candidate.conversionIds.length} planned conversion(s) have provider evidence.`
          : `${missing.length} planned conversion(s) do not have provider evidence yet.`,
      provider: candidate.provider,
      strategyObjectId: candidate.strategyObjectId,
    },
  ];
}

function metaCreativeChecks(
  candidate: MarketingAdsPlanCandidate,
  creativeArtifact: MarketingProviderReportArtifact | undefined,
): MarketingAdsDiffCheck[] {
  if (candidate.provider !== 'metaAds') return [];
  const landingPage = normalized(candidate.landingPageUrl);
  const hasCreativeForLandingPage = recordsFor(creativeArtifact).some(
    (record) => normalized(record.creativeDestinationUrl) === landingPage,
  );
  return [
    {
      id: `candidates.${candidate.id}.creative`,
      status: hasCreativeForLandingPage ? 'pass' : 'warn',
      message: hasCreativeForLandingPage
        ? 'Meta creative inventory includes a creative for the planned landing page.'
        : 'Meta creative inventory does not include a creative for the planned landing page yet.',
      provider: candidate.provider,
      strategyObjectId: candidate.strategyObjectId,
    },
  ];
}

function candidateDiff(input: {
  candidate: MarketingAdsPlanCandidate;
  artifacts: Map<MarketingProviderReportType, MarketingProviderReportArtifact>;
}): MarketingAdsDiffCandidate {
  const checks = [
    candidateCampaignCheck(input.candidate, input.artifacts.get('campaign')),
    ...keywordChecks(input.candidate, input.artifacts.get('keyword')),
    ...conversionChecks(input.candidate, input.artifacts.get('conversion')),
    ...metaCreativeChecks(input.candidate, input.artifacts.get('creative')),
  ];
  const hasError = checks.some((check) => check.status === 'error');
  const hasWarn = checks.some((check) => check.status === 'warn');
  return {
    id: input.candidate.id,
    provider: input.candidate.provider,
    strategyObjectId: input.candidate.strategyObjectId,
    status: hasError ? 'blocked' : hasWarn ? 'planned_new' : 'matched',
    checks,
  };
}

function nextWorkflowStep(report: Omit<MarketingAdsDiffReport, 'nextWorkflowStep'>): string {
  if (report.checks.some((check) => check.status === 'error')) {
    return 'Fix invalid provider artifacts or blocking drift, then rerun `unisane growth ads diff`.';
  }
  if (report.checks.some((check) => check.id.includes('.cache') && check.status === 'warn')) {
    return 'Refresh missing, stale, or partial ads provider pulls before apply dry-run review.';
  }
  if (report.candidates.some((candidate) => candidate.status === 'planned_new')) {
    return 'Review planned-new provider objects and approvals, then run `unisane growth ads apply --dry-run`.';
  }
  return 'Provider cache matches the ads plan; proceed to guarded `ads apply --dry-run` when approvals are ready.';
}

export function buildMarketingAdsDiffReport(
  options: MarketingAdsDiffOptions,
): MarketingAdsDiffReport {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const now = options.now ?? new Date();
  const maxAgeDays = options.maxAgeDays ?? 3;
  const { path: planPath, artifact: plan } = readPlan(cwd, options.planPath);
  const providerFilter = options.provider ?? 'all';
  const providers =
    providerFilter === 'all'
      ? providerReportTypes
      : { [providerFilter]: providerReportTypes[providerFilter] };
  const checks: MarketingAdsDiffCheck[] = [
    {
      id: 'plan.status',
      status: plan.status === 'draft' ? 'warn' : 'pass',
      message:
        plan.status === 'draft'
          ? 'Ads plan is still draft; diff is informational until the plan is reviewed.'
          : `Ads plan is ${plan.status}.`,
    },
  ];
  const artifactByProvider = new Map<
    MarketingAdsPlanProvider,
    Map<MarketingProviderReportType, MarketingProviderReportArtifact>
  >();
  for (const provider of Object.keys(providers) as MarketingAdsPlanProvider[]) {
    const cache = cacheChecks({ cwd, provider, now, maxAgeDays });
    checks.push(...cache.checks);
    artifactByProvider.set(provider, cache.artifacts);
  }
  const candidates = plan.candidates
    .filter((candidate) => providerFilter === 'all' || candidate.provider === providerFilter)
    .map((candidate) =>
      candidateDiff({
        candidate,
        artifacts:
          artifactByProvider.get(candidate.provider) ??
          new Map<MarketingProviderReportType, MarketingProviderReportArtifact>(),
      }),
    );
  checks.push(...candidates.flatMap((candidate) => candidate.checks));
  const reportWithoutNext = {
    ok: checks.every((check) => check.status !== 'error'),
    cwd,
    planPath,
    platformId: plan.platformId,
    appId: plan.appId,
    planStatus: plan.status,
    generatedAt: plan.generatedAt,
    providerFilter,
    maxAgeDays,
    candidates,
    checks,
  };
  return {
    ...reportWithoutNext,
    nextWorkflowStep: nextWorkflowStep(reportWithoutNext),
  };
}
