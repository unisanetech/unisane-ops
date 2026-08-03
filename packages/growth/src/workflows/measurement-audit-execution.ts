import type { OpsPrincipal } from '@unisane/ops-engine/actions';
import {
  createGrowthMeasurementAuditAction,
  growthMeasurementAuditInputSchema,
  growthMeasurementAuditOutputSchema,
  type GrowthMeasurementAuditOutput,
} from '../actions/measurement-audit.js';
import {
  auditMarketingTrackingSource,
  readLatestMarketingConfirmedConversionArtifact,
  readMarketingConfirmedConversionStatus,
  readMarketingProviderReportStatus,
  type MarketingConfirmedConversionArtifact,
  type MarketingConfirmedConversionStatus,
  type MarketingExecutionContext,
  type MarketingProviderReportStatus,
  type MarketingTrackingAuditReport,
} from '../marketing/index.js';
import type {
  CanonicalOutcome,
  ProviderAttributedConversion,
} from '../playbooks/measurement-audit.js';

export type ExecuteGrowthMeasurementAuditOptions = {
  cwd: string;
  config: MarketingExecutionContext;
  principal: OpsPrincipal;
  startDate?: string;
  endDate?: string;
  maxAgeDays?: number;
  comparisonLimit?: number;
  now?: Date;
  requestId?: string;
  trackingAudit?: MarketingTrackingAuditReport;
};

export type GrowthMeasurementAuditExecutionDependencies = {
  auditTracking(
    config: MarketingExecutionContext,
    options: { cwd: string; now: Date },
  ): MarketingTrackingAuditReport | Promise<MarketingTrackingAuditReport>;
  readConfirmedStatus(options: {
    cwd: string;
    maxAgeDays: number;
    now: Date;
  }): MarketingConfirmedConversionStatus;
  readConfirmedArtifact(options: { cwd: string }): MarketingConfirmedConversionArtifact | undefined;
  readProviderStatus(options: {
    cwd: string;
    provider: 'googleAds' | 'metaAds';
    reportType: 'conversion' | 'campaign';
    maxAgeDays: number;
    now: Date;
  }): MarketingProviderReportStatus | undefined;
};

const defaultDependencies: GrowthMeasurementAuditExecutionDependencies = {
  auditTracking: (config, options) => auditMarketingTrackingSource(config, options),
  readConfirmedStatus: (options) => readMarketingConfirmedConversionStatus(options),
  readConfirmedArtifact: (options) => readLatestMarketingConfirmedConversionArtifact(options),
  readProviderStatus: (options) => readMarketingProviderReportStatus(options).providers[0],
};

const canonicalOutcomeId = 'confirmed-conversions';
const missingTrackingRegistryCodes = [
  'MARKETING_EVENT_REGISTRY_NOT_FOUND',
  'MARKETING_CONVERSION_REGISTRY_NOT_FOUND',
] as const;

function stableId(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9.-]+/g, '-')
      .replace(/^[.-]+|[.-]+$/g, '') || 'growth'
  );
}

function evidenceFreshness(status: string): 'fresh' | 'stale' | 'unknown' {
  if (status === 'fresh') return 'fresh';
  if (status === 'stale') return 'stale';
  return 'unknown';
}

function isMissingTrackingRegistryError(error: unknown): boolean {
  return (
    error instanceof Error &&
    missingTrackingRegistryCodes.some((code) => error.message.includes(`[${code}]`))
  );
}

function missingTrackingRegistryAudit(input: {
  cwd: string;
  config: MarketingExecutionContext;
  now: Date;
}): MarketingTrackingAuditReport {
  const generatedAt = input.now.toISOString();
  const summary = 'Required tracking registry evidence has not been recorded yet.';
  return {
    kind: 'unisane.growth.tracking-audit',
    version: 1,
    mode: 'audit-only',
    generatedAt,
    ok: false,
    cwd: input.cwd,
    environment: input.config.defaultEnvironment,
    scannedFileCount: 0,
    summary: {
      status: 'blocked',
      emitterCount: 0,
      findingCount: 0,
      errorCount: 1,
      warningCount: 0,
    },
    coverage: {
      expectedEventCount: 0,
      observedEventCount: 0,
      expectedConversionCount: 0,
      observedConversionCount: 0,
      observationCount: 0,
    },
    emitters: [],
    findings: [],
    readiness: {
      schemaVersion: 1,
      code: 'growth.instrumentation.audit.missing',
      dimension: 'instrumentation',
      state: 'missing',
      severity: 'error',
      projectId: stableId(input.config.platformId),
      environmentId: stableId(input.config.defaultEnvironment),
      summary,
      blocking: true,
      observedAt: generatedAt,
      evidence: [
        {
          kind: 'tracking-audit',
          source: 'Growth tracking registries',
          observedAt: generatedAt,
          freshness: 'unknown',
          summary,
        },
      ],
    },
    checks: [{ id: 'registries', status: 'error', message: summary }],
  };
}

async function loadTrackingAudit(input: {
  options: ExecuteGrowthMeasurementAuditOptions;
  dependencies: GrowthMeasurementAuditExecutionDependencies;
  now: Date;
}): Promise<MarketingTrackingAuditReport> {
  if (input.options.trackingAudit) return input.options.trackingAudit;
  try {
    return await input.dependencies.auditTracking(input.options.config, {
      cwd: input.options.cwd,
      now: input.now,
    });
  } catch (error) {
    if (!isMissingTrackingRegistryError(error)) throw error;
    return missingTrackingRegistryAudit({
      cwd: input.options.cwd,
      config: input.options.config,
      now: input.now,
    });
  }
}

function canonicalOutcomes(input: {
  cwd: string;
  maxAgeDays: number;
  now: Date;
  dependencies: GrowthMeasurementAuditExecutionDependencies;
}): CanonicalOutcome[] {
  const status = input.dependencies.readConfirmedStatus(input);
  if (!status.exists || status.status === 'error') return [];
  const artifact = input.dependencies.readConfirmedArtifact({ cwd: input.cwd });
  if (!artifact) return [];
  return [
    {
      outcomeId: canonicalOutcomeId,
      label: 'Server-confirmed conversions',
      count: artifact.records.length,
      source: `Unisane-confirmed conversion artifact (${artifact.source})`,
      observedAt: artifact.pulledAt,
      freshness: evidenceFreshness(status.status),
    },
  ];
}

function providerAttribution(
  providerId: 'google-ads' | 'meta-ads',
  status: MarketingProviderReportStatus | undefined,
): ProviderAttributedConversion | undefined {
  if (!status?.exists || !status.pulledAt || status.metrics?.conversions === undefined) {
    return undefined;
  }
  return {
    providerId,
    outcomeId: canonicalOutcomeId,
    attributedCount: Math.round(status.metrics.conversions),
    source: `${providerId === 'google-ads' ? 'Google Ads' : 'Meta Ads'} ${status.reportType ?? 'provider'} report (${status.source ?? 'recorded artifact'})`,
    observedAt: status.pulledAt,
    freshness: evidenceFreshness(status.status),
  };
}

function providerAttributions(input: {
  cwd: string;
  maxAgeDays: number;
  now: Date;
  dependencies: GrowthMeasurementAuditExecutionDependencies;
}): ProviderAttributedConversion[] {
  const google = providerAttribution(
    'google-ads',
    input.dependencies.readProviderStatus({
      cwd: input.cwd,
      maxAgeDays: input.maxAgeDays,
      now: input.now,
      provider: 'googleAds',
      reportType: 'conversion',
    }),
  );
  const meta = providerAttribution(
    'meta-ads',
    input.dependencies.readProviderStatus({
      cwd: input.cwd,
      maxAgeDays: input.maxAgeDays,
      now: input.now,
      provider: 'metaAds',
      reportType: 'campaign',
    }),
  );
  return [google, meta].filter(
    (attribution): attribution is ProviderAttributedConversion => attribution !== undefined,
  );
}

function periodTimestamp(date: string, boundary: 'start' | 'end'): string {
  return `${date}T${boundary === 'start' ? '00:00:00.000' : '23:59:59.999'}Z`;
}

function resolvePeriod(input: {
  startDate?: string;
  endDate?: string;
  canonicalWindow?: { startDate: string; endDate: string };
  providerWindows: Array<{ startDate: string; endDate: string } | undefined>;
  now: Date;
}) {
  const fallback = input.canonicalWindow ?? input.providerWindows.find(Boolean);
  const today = input.now.toISOString().slice(0, 10);
  const startDate = input.startDate ?? fallback?.startDate ?? today;
  const endDate = input.endDate ?? fallback?.endDate ?? today;
  return {
    start: periodTimestamp(startDate, 'start'),
    end: periodTimestamp(endDate, 'end'),
  };
}

export function createGrowthMeasurementAuditExecutor(
  dependencies: GrowthMeasurementAuditExecutionDependencies = defaultDependencies,
) {
  return async function executeGrowthMeasurementAudit(
    options: ExecuteGrowthMeasurementAuditOptions,
  ): Promise<GrowthMeasurementAuditOutput> {
    const now = options.now ?? new Date();
    const maxAgeDays = options.maxAgeDays ?? 3;
    const confirmedStatus = dependencies.readConfirmedStatus({
      cwd: options.cwd,
      maxAgeDays,
      now,
    });
    const googleStatus = dependencies.readProviderStatus({
      cwd: options.cwd,
      provider: 'googleAds',
      reportType: 'conversion',
      maxAgeDays,
      now,
    });
    const metaStatus = dependencies.readProviderStatus({
      cwd: options.cwd,
      provider: 'metaAds',
      reportType: 'campaign',
      maxAgeDays,
      now,
    });
    const input = growthMeasurementAuditInputSchema.parse({
      period: resolvePeriod({
        ...(options.startDate ? { startDate: options.startDate } : {}),
        ...(options.endDate ? { endDate: options.endDate } : {}),
        ...(confirmedStatus.window ? { canonicalWindow: confirmedStatus.window } : {}),
        providerWindows: [googleStatus?.window, metaStatus?.window],
        now,
      }),
      comparisonLimit: options.comparisonLimit ?? 20,
    });
    const action = createGrowthMeasurementAuditAction({
      loadTrackingAudit: () => loadTrackingAudit({ options, dependencies, now }),
      loadCanonicalOutcomes: () =>
        canonicalOutcomes({ cwd: options.cwd, maxAgeDays, now, dependencies }),
      loadProviderAttributions: () =>
        providerAttributions({ cwd: options.cwd, maxAgeDays, now, dependencies }),
      now: () => now,
    });
    const output = await action.execute(input, {
      requestId:
        options.requestId ??
        `request.measurement-audit.${now.getTime().toString().replace('-', '')}`,
      scopeId: `scope.${stableId(options.config.platformId)}`,
      projectId: stableId(options.config.platformId),
      environmentId: stableId(options.config.defaultEnvironment),
      principal: options.principal,
      requestedAt: now.toISOString(),
    });
    return growthMeasurementAuditOutputSchema.parse(output);
  };
}

export const executeGrowthMeasurementAudit = createGrowthMeasurementAuditExecutor();

export function formatGrowthMeasurementAudit(output: GrowthMeasurementAuditOutput): string {
  const presentation = output.workflow.presentation;
  const lines = [
    '# Measurement audit',
    '',
    presentation.headline,
    presentation.whyItMatters,
    '',
    `Canonical outcomes: ${output.canonicalOutcomes.length}`,
    `Provider-attributed comparisons: ${output.attributionComparisons.length}`,
    `Safe to scale: ${output.safeToScale ? 'Yes' : 'No'}`,
    '',
    `Next: ${presentation.nextStep.label}`,
    presentation.nextStep.reason,
  ];
  if (presentation.nextStep.deepLink) lines.push(`Open: ${presentation.nextStep.deepLink}`);
  return `${lines.join('\n')}\n`;
}
