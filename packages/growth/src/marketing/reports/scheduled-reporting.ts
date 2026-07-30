import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { MarketingExecutionContext } from '../schema/execution-context.js';
import type { MarketingProviderReportType, MarketingReportProvider } from '../schema/report.js';
import {
  buildMarketingEvidenceStatus,
  type MarketingEvidenceReportFamilyStatus,
  type MarketingEvidenceStatusOptions,
} from './evidence-status.js';
import { ensurePathWithinCwd } from './paths.js';

export type MarketingScheduledReportingCadence = 'daily' | 'weekly';

export type MarketingScheduledReportingJob = {
  id: string;
  provider: MarketingReportProvider;
  reportType: MarketingProviderReportType;
  cadence: MarketingScheduledReportingCadence;
  windowDays: number;
  command: string;
  status: 'ready' | 'blocked';
  blocker?: string;
};

export type MarketingScheduledReportingPlan = {
  kind: 'unisane.marketing.scheduled-reporting-plan';
  version: 1;
  nonMutating: true;
  generatedAt: string;
  ok: boolean;
  platformId: string;
  appId: string;
  environment: string;
  proofReady: boolean;
  proofStatusPath?: string;
  cadence: MarketingScheduledReportingCadence;
  windowDays: number;
  maxAgeDays: number;
  jobs: MarketingScheduledReportingJob[];
  nextWorkflowStep: string;
};

export type MarketingScheduledReportingOptions = MarketingEvidenceStatusOptions & {
  cadence?: MarketingScheduledReportingCadence;
  windowDays?: number;
  proofStatusPath?: string;
  connection?: string;
  metaConnection?: string;
  out?: string;
};

export type MarketingScheduledReportingResult = {
  ok: boolean;
  path?: string;
  plan: MarketingScheduledReportingPlan;
};

function datePlaceholders(windowDays: number): { startDate: string; endDate: string } {
  return {
    startDate: `<YYYY-MM-DD-${windowDays}d>`,
    endDate: '<YYYY-MM-DD>',
  };
}

function authSuffix(
  provider: MarketingReportProvider,
  options: MarketingScheduledReportingOptions,
): string {
  if (
    (provider === 'googleAds' || provider === 'ga4' || provider === 'searchConsole') &&
    options.connection
  ) {
    return `--connection ${options.connection}`;
  }
  if (provider === 'metaAds' && options.metaConnection) {
    return `--connection ${options.metaConnection}`;
  }
  return '';
}

function extraReportFamilies(input: {
  provider: MarketingReportProvider;
  config: MarketingExecutionContext;
  existing: MarketingEvidenceReportFamilyStatus[];
}): MarketingEvidenceReportFamilyStatus[] {
  if (input.provider !== 'googleAds') return [];
  if (input.config.providers.googleAds.state === 'disabled') return [];
  if (input.existing.some((family) => family.reportType === 'auctionInsight')) return [];
  return [
    {
      provider: 'googleAds',
      reportType: 'auctionInsight',
      status: 'pending',
      message: 'Auction Insights should be refreshed weekly for competitor pressure monitoring.',
    },
  ];
}

function scheduledCadence(
  reportType: MarketingProviderReportType,
  fallback: MarketingScheduledReportingCadence,
): MarketingScheduledReportingCadence {
  if (reportType === 'auctionInsight') return 'weekly';
  return fallback;
}

function scheduledWindowDays(reportType: MarketingProviderReportType, fallback: number): number {
  if (reportType === 'auctionInsight') return 7;
  return fallback;
}

function nextWorkflowStep(plan: Omit<MarketingScheduledReportingPlan, 'nextWorkflowStep'>): string {
  if (!plan.proofReady) {
    return 'Scheduled reporting remains blocked until real-account proof status is ready.';
  }
  if (plan.jobs.length === 0) {
    return 'No scheduled reporting jobs were generated; check configured providers.';
  }
  return 'Install these commands in the chosen scheduler only after confirming provider limits and alerting ownership.';
}

function defaultScheduledReportingPath(cwd: string, environment: string): string {
  return path.resolve(
    cwd,
    '.unisane',
    'marketing',
    environment,
    'schedules',
    'reporting-plan.json',
  );
}

export function buildMarketingScheduledReportingPlan(
  config: MarketingExecutionContext,
  options: MarketingScheduledReportingOptions = {},
): MarketingScheduledReportingPlan {
  const generatedAt = (options.now ?? new Date()).toISOString();
  const cadence = options.cadence ?? 'daily';
  const windowDays = options.windowDays ?? 3;
  const maxAgeDays = options.maxAgeDays ?? 3;
  const proof = buildMarketingEvidenceStatus(config, {
    ...options,
    maxAgeDays,
  });
  const jobs = proof.providers.flatMap((provider) => {
    if (
      provider.state === 'disabled' ||
      provider.provider === 'gtm' ||
      provider.provider === 'confirmedConversions' ||
      provider.provider === 'strategyMap'
    ) {
      return [];
    }
    const families = [
      ...provider.reportFamilies,
      ...extraReportFamilies({
        provider: provider.provider,
        config,
        existing: provider.reportFamilies,
      }),
    ];
    return families.map((family) => {
      const jobCadence = scheduledCadence(family.reportType, cadence);
      const jobWindowDays = scheduledWindowDays(family.reportType, windowDays);
      const jobDates = datePlaceholders(jobWindowDays);
      const command = [
        'unisane growth marketing pull-api',
        `--provider ${family.provider}`,
        `--report ${family.reportType}`,
        `--start-date ${jobDates.startDate}`,
        `--end-date ${jobDates.endDate}`,
        authSuffix(family.provider, options),
      ]
        .filter(Boolean)
        .join(' ');
      const status = proof.readyForScheduledPulls ? 'ready' : 'blocked';
      return {
        id: `${family.provider}.${family.reportType}.${jobCadence}`,
        provider: family.provider,
        reportType: family.reportType,
        cadence: jobCadence,
        windowDays: jobWindowDays,
        command,
        status,
        ...(status === 'blocked' ? { blocker: proof.nextWorkflowStep } : {}),
      } satisfies MarketingScheduledReportingJob;
    });
  });
  const planWithoutNext = {
    kind: 'unisane.marketing.scheduled-reporting-plan' as const,
    version: 1 as const,
    nonMutating: true as const,
    generatedAt,
    ok: proof.readyForScheduledPulls && jobs.length > 0,
    platformId: config.platformId,
    appId: config.appId,
    environment: config.defaultEnvironment,
    proofReady: proof.readyForScheduledPulls,
    proofStatusPath: options.proofStatusPath,
    cadence,
    windowDays,
    maxAgeDays,
    jobs,
  };
  return {
    ...planWithoutNext,
    nextWorkflowStep: nextWorkflowStep(planWithoutNext),
  };
}

export function writeMarketingScheduledReportingPlan(
  config: MarketingExecutionContext,
  options: MarketingScheduledReportingOptions = {},
): MarketingScheduledReportingResult {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const plan = buildMarketingScheduledReportingPlan(config, options);
  const destination = path.resolve(
    cwd,
    options.out ?? defaultScheduledReportingPath(cwd, config.defaultEnvironment),
  );
  ensurePathWithinCwd(cwd, destination);
  mkdirSync(path.dirname(destination), { recursive: true });
  writeFileSync(destination, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
  return {
    ok: plan.ok,
    path: destination,
    plan,
  };
}
