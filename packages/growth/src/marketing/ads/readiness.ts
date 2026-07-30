import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { loadMarketingRegistries } from '../registry/load-registries.js';
import type { MarketingExecutionContext } from '../schema/execution-context.js';
import {
  marketingProviderReportArtifactSchema,
  type MarketingProviderReportRecord,
  type MarketingProviderReportType,
  type MarketingReportProvider,
} from '../schema/report.js';
import {
  readMarketingConfirmedConversionStatus,
  type MarketingConfirmedConversionStatus,
} from '../reports/confirmed-conversions.js';
import {
  readMarketingProviderReportStatus,
  type MarketingProviderReportStatus,
} from '../reports/provider-pulls.js';
import { ensurePathWithinCwd, providerLatestPullPath } from '../reports/paths.js';

export type MarketingAdsReadinessArea =
  | 'account'
  | 'conversionGoals'
  | 'campaignSettings'
  | 'keywords'
  | 'creativeAssets'
  | 'tracking'
  | 'optimization';

export type MarketingAdsReadinessStatus = 'pass' | 'warn' | 'error';

export type MarketingAdsReadinessCheck = {
  id: string;
  area: MarketingAdsReadinessArea;
  status: MarketingAdsReadinessStatus;
  message: string;
  evidencePath?: string;
  recommendation?: string;
};

export type MarketingAdsOptimizationAction = {
  id: string;
  area: MarketingAdsReadinessArea;
  priority: 'must' | 'should' | 'could';
  title: string;
  rationale: string;
  command?: string;
  blocksLaunch: boolean;
};

export type MarketingAdsReadinessPlan = {
  kind: 'unisane.marketing.ads.readiness-plan';
  version: 1;
  nonMutating: true;
  generatedAt: string;
  cwd: string;
  platformId: string;
  appId: string;
  targetProduct: 'true-resume';
  ok: boolean;
  readinessScore: number;
  providerReports: MarketingProviderReportStatus[];
  confirmedConversions: MarketingConfirmedConversionStatus;
  accountSettings: {
    autoTaggingEnabled?: boolean;
    finalUrlSuffix?: string;
    conversionTrackingStatus?: string;
    accountTimeZone?: string;
    currency?: string;
  };
  campaignSettings: {
    targetGoogleSearch?: boolean;
    targetSearchNetwork?: boolean;
    targetContentNetwork?: boolean;
    locationCriterionIds: string[];
    languageCriterionIds: string[];
    finalUrlSuffix?: string;
  };
  productStrategy: {
    primaryCampaignType: 'Search';
    recommendedAdGroups: string[];
    recommendedConversionSequence: string[];
    recommendedNegativeKeywords: string[];
  };
  checks: MarketingAdsReadinessCheck[];
  actions: MarketingAdsOptimizationAction[];
  nextWorkflowStep: string;
};

export type MarketingAdsReadinessOptions = {
  cwd?: string;
  configPath?: string;
  maxAgeDays?: number;
  now?: Date;
  out?: string;
  dryRun?: boolean;
};

export type MarketingAdsReadinessResult = {
  ok: boolean;
  dryRun: boolean;
  path?: string;
  plan: MarketingAdsReadinessPlan;
};

const googleReportTypes: MarketingProviderReportType[] = [
  'account',
  'campaign',
  'keyword',
  'conversion',
];

const recommendedAdGroups = [
  'ATS resume checker',
  'Resume score and audit',
  'Resume keyword optimizer',
  'Tailor resume to job',
] as const;

const recommendedConversionSequence = [
  'resume_import_completed_lead',
  'account_signup_completed_activation',
  'subscription_started_purchase',
] as const;

const recommendedNegativeKeywords = [
  'free download',
  'definition',
  'meaning',
  'resume writer jobs',
  'resume reviewer job',
  'ats jobs',
  'sample',
  'examples',
  'biodata',
  'government resume format',
] as const;

function readJsonFile(filePath: string): unknown {
  return JSON.parse(readFileSync(filePath, 'utf8')) as unknown;
}

function latestRecords(
  cwd: string,
  provider: MarketingReportProvider,
  reportType: MarketingProviderReportType,
): MarketingProviderReportRecord[] {
  const latestPath = providerLatestPullPath(cwd, provider, reportType);
  if (!existsSync(latestPath)) return [];
  return marketingProviderReportArtifactSchema.parse(readJsonFile(latestPath)).records;
}

function statusCheck(args: MarketingAdsReadinessCheck): MarketingAdsReadinessCheck {
  return args;
}

function freshStatus(status: MarketingProviderReportStatus | undefined): boolean {
  return status?.status === 'fresh';
}

function conversionTrackingReady(status: string | undefined): boolean {
  if (!status) return false;
  const normalized = status.toUpperCase();
  return !normalized.includes('NOT') && !normalized.includes('DISABLED');
}

function statusByReportType(
  statuses: MarketingProviderReportStatus[],
  reportType: MarketingProviderReportType,
): MarketingProviderReportStatus | undefined {
  return statuses.find(
    (status) => status.provider === 'googleAds' && status.reportType === reportType,
  );
}

function hasGoogleAdsConversion(
  conversions: Awaited<
    ReturnType<typeof loadMarketingRegistries>
  >['conversions']['value']['conversions'],
  id: string,
): boolean {
  return conversions.some(
    (conversion) => conversion.id === id && Boolean(conversion.mappings.googleAds),
  );
}

function scoreChecks(checks: MarketingAdsReadinessCheck[]): number {
  if (checks.length === 0) return 0;
  const points = checks.reduce((sum, check) => {
    if (check.status === 'pass') return sum + 1;
    if (check.status === 'warn') return sum + 0.5;
    return sum;
  }, 0);
  return Math.round((points / checks.length) * 100);
}

function defaultOutputPath(cwd: string): string {
  return path.join(cwd, '.unisane', 'marketing', 'ads', 'readiness', 'latest.json');
}

function resolveOutputPath(cwd: string, out: string | undefined): string {
  const resolved = out ? path.resolve(cwd, out) : defaultOutputPath(cwd);
  ensurePathWithinCwd(cwd, resolved);
  return resolved;
}

export async function buildMarketingAdsReadinessPlan(
  config: MarketingExecutionContext,
  options: MarketingAdsReadinessOptions = {},
): Promise<MarketingAdsReadinessPlan> {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const now = options.now ?? new Date();
  const maxAgeDays = options.maxAgeDays ?? 3;
  const registries = await loadMarketingRegistries(config, { cwd });
  const providerReports = googleReportTypes.flatMap(
    (reportType) =>
      readMarketingProviderReportStatus({
        cwd,
        provider: 'googleAds',
        reportType,
        maxAgeDays,
        now,
      }).providers,
  );
  const confirmedConversions = readMarketingConfirmedConversionStatus({ cwd, maxAgeDays, now });
  const accountRecord = latestRecords(cwd, 'googleAds', 'account')[0];
  const campaignRecords = latestRecords(cwd, 'googleAds', 'campaign');
  const keywordRecords = latestRecords(cwd, 'googleAds', 'keyword');
  const conversionRecords = latestRecords(cwd, 'googleAds', 'conversion');
  const accountStatus = statusByReportType(providerReports, 'account');
  const campaignStatus = statusByReportType(providerReports, 'campaign');
  const keywordStatus = statusByReportType(providerReports, 'keyword');
  const conversionStatus = statusByReportType(providerReports, 'conversion');
  const searchDefaults = config.providers.googleAds.googleSearchDefaults;
  const conversionIds = registries.conversions.value.conversions.map((conversion) => conversion.id);

  const checks: MarketingAdsReadinessCheck[] = [
    statusCheck({
      id: 'account.report.fresh',
      area: 'account',
      status: freshStatus(accountStatus) ? 'pass' : accountStatus?.exists ? 'warn' : 'error',
      message: accountStatus?.message ?? 'No Google Ads account report status is available.',
      evidencePath: accountStatus?.path,
      recommendation:
        'Run an account pull before launch so auto-tagging, conversion tracking, timezone, and currency are reviewed from the API.',
    }),
    statusCheck({
      id: 'account.autoTagging',
      area: 'account',
      status: accountRecord?.autoTaggingEnabled === true ? 'pass' : 'warn',
      message:
        accountRecord?.autoTaggingEnabled === true
          ? 'Google Ads auto-tagging is enabled.'
          : 'Google Ads auto-tagging is not confirmed from the latest account pull.',
      evidencePath: accountStatus?.path,
      recommendation:
        'Enable auto-tagging for GCLID based GA4, GTM, Search Console, and Google Ads joins.',
    }),
    statusCheck({
      id: 'account.finalUrlSuffix',
      area: 'tracking',
      status:
        (accountRecord?.finalUrlSuffix ?? searchDefaults?.finalUrlSuffix ?? '').includes(
          'utm_source=google',
        ) &&
        (accountRecord?.finalUrlSuffix ?? searchDefaults?.finalUrlSuffix ?? '').includes(
          'utm_medium=cpc',
        )
          ? 'pass'
          : 'warn',
      message: `Final URL suffix/default is ${accountRecord?.finalUrlSuffix ?? searchDefaults?.finalUrlSuffix ?? 'not set'}.`,
      evidencePath: accountStatus?.path,
      recommendation:
        'Keep UTMs standardized as utm_source=google and utm_medium=cpc; let auto-tagging carry click-level attribution.',
    }),
    statusCheck({
      id: 'account.conversionTracking',
      area: 'conversionGoals',
      status: conversionTrackingReady(accountRecord?.conversionTrackingStatus) ? 'pass' : 'warn',
      message: accountRecord?.conversionTrackingStatus
        ? `Conversion tracking status is ${accountRecord.conversionTrackingStatus}.`
        : 'Conversion tracking status is not confirmed from the latest account pull.',
      evidencePath: accountStatus?.path,
      recommendation:
        'Confirm conversion tracking is enabled before moving from test proof to production customer launch.',
    }),
    statusCheck({
      id: 'campaign.searchOnly',
      area: 'campaignSettings',
      status:
        searchDefaults?.targetGoogleSearch === true &&
        searchDefaults.targetSearchNetwork === false &&
        searchDefaults.targetContentNetwork === false
          ? 'pass'
          : 'warn',
      message:
        'Google Search defaults should target Google Search only for the first high-intent TrueResume campaign.',
      recommendation:
        'Keep Search Partners and Display/content network off until query quality and conversion tracking are proven.',
    }),
    statusCheck({
      id: 'campaign.report.fresh',
      area: 'campaignSettings',
      status:
        freshStatus(campaignStatus) && campaignRecords.length > 0
          ? 'pass'
          : campaignStatus?.exists
            ? 'warn'
            : 'error',
      message:
        campaignRecords.length > 0
          ? `${campaignRecords.length} Google Ads campaign records are cached.`
          : 'No Google Ads campaign records are cached.',
      evidencePath: campaignStatus?.path,
      recommendation:
        'Pull campaign/ad group/ad status after each apply so dashboard and readiness reflect live Google Ads state.',
    }),
    statusCheck({
      id: 'keywords.report.fresh',
      area: 'keywords',
      status:
        freshStatus(keywordStatus) && keywordRecords.length > 0
          ? 'pass'
          : keywordStatus?.exists
            ? 'warn'
            : 'error',
      message:
        keywordRecords.length > 0
          ? `${keywordRecords.length} keyword records are cached for query and match-type review.`
          : 'No keyword records are cached for query and match-type review.',
      evidencePath: keywordStatus?.path,
      recommendation:
        'Use exact/phrase high-intent keywords first; add broad only after search-term and conversion evidence exists.',
    }),
    statusCheck({
      id: 'conversion.registry.sequence',
      area: 'conversionGoals',
      status: recommendedConversionSequence.every((id) => conversionIds.includes(id))
        ? 'pass'
        : 'warn',
      message:
        'TrueResume conversion sequence should cover resume import, account signup, and paid subscription.',
      recommendation:
        'Use lead and signup as early learning signals; use subscription as the purchase/value goal when real volume exists.',
    }),
    statusCheck({
      id: 'conversion.googleAdsMappings',
      area: 'conversionGoals',
      status: recommendedConversionSequence.every((id) =>
        hasGoogleAdsConversion(registries.conversions.value.conversions, id),
      )
        ? 'pass'
        : 'warn',
      message: 'Google Ads conversion mappings should exist for all primary TrueResume goals.',
      recommendation:
        'Run `unisane growth ads goals google --dry-run` and then guarded apply when the customer id is confirmed.',
    }),
    statusCheck({
      id: 'conversion.report.fresh',
      area: 'conversionGoals',
      status:
        freshStatus(conversionStatus) && conversionRecords.length > 0
          ? 'pass'
          : conversionStatus?.exists
            ? 'warn'
            : 'error',
      message:
        conversionRecords.length > 0
          ? `${conversionRecords.length} Google Ads conversion records are cached.`
          : 'No Google Ads conversion records are cached.',
      evidencePath: conversionStatus?.path,
      recommendation:
        'Pull conversion actions after goal setup so the tool can detect missing or duplicate Google Ads goals.',
    }),
    statusCheck({
      id: 'tracking.confirmedConversions',
      area: 'tracking',
      status:
        confirmedConversions.status === 'fresh'
          ? 'pass'
          : confirmedConversions.exists
            ? 'warn'
            : 'error',
      message: confirmedConversions.message,
      evidencePath: confirmedConversions.path,
      recommendation:
        'Keep server-confirmed conversions fresh so ad optimization can compare provider-reported and business-confirmed outcomes.',
    }),
  ];

  const actions: MarketingAdsOptimizationAction[] = [
    {
      id: 'account-enable-autotagging',
      area: 'account',
      priority: accountRecord?.autoTaggingEnabled === true ? 'could' : 'must',
      title: 'Confirm Google Ads auto-tagging and standardized UTMs',
      rationale:
        'TrueResume needs clean joins across Google Ads, GA4, GTM, Search Console, and internal revenue events.',
      blocksLaunch: accountRecord?.autoTaggingEnabled !== true,
    },
    {
      id: 'campaign-search-intent-structure',
      area: 'campaignSettings',
      priority: 'should',
      title: 'Split the primary Search campaign into intent-specific ad groups',
      rationale: `Use ${recommendedAdGroups.join(', ')} so ad copy and landing pages match intent.`,
      command: 'unisane growth ads plan --provider googleAds',
      blocksLaunch: false,
    },
    {
      id: 'keywords-negative-keyword-set',
      area: 'keywords',
      priority: 'should',
      title: 'Add a TrueResume negative keyword seed set',
      rationale: `Exclude low-intent traffic such as ${recommendedNegativeKeywords.slice(0, 6).join(', ')} before expanding match types.`,
      blocksLaunch: false,
    },
    {
      id: 'conversion-goal-phase-model',
      area: 'conversionGoals',
      priority: 'must',
      title: 'Use phased conversion goals',
      rationale:
        'Start with resume import and signup for learning, then optimize toward subscription once production purchase volume exists.',
      command: 'unisane growth ads goals google --dry-run',
      blocksLaunch: !freshStatus(conversionStatus),
    },
    {
      id: 'tracking-closed-loop-proof',
      area: 'tracking',
      priority: 'must',
      title: 'Keep closed-loop conversion proof fresh',
      rationale:
        'Provider-reported conversions alone are not enough; the dashboard needs business-confirmed conversion and value data.',
      command: 'unisane growth marketing conversion-pull --input <confirmed-conversions.json>',
      blocksLaunch:
        confirmedConversions.status === 'missing' || confirmedConversions.status === 'error',
    },
    {
      id: 'creative-assets-search-extension-plan',
      area: 'creativeAssets',
      priority: 'could',
      title:
        'Prepare logo and polished image assets for later asset extensions and cross-channel campaigns',
      rationale:
        'Search can launch without images, but assets are needed for richer Google placements and future paid-social tests.',
      command: 'unisane growth ads assets upload-plan --provider googleAds',
      blocksLaunch: false,
    },
  ];

  const readinessScore = scoreChecks(checks);
  const hasBlockingError = checks.some((check) => check.status === 'error');

  return {
    kind: 'unisane.marketing.ads.readiness-plan',
    version: 1,
    nonMutating: true,
    generatedAt: now.toISOString(),
    cwd,
    platformId: config.platformId,
    appId: config.appId,
    targetProduct: 'true-resume',
    ok: !hasBlockingError,
    readinessScore,
    providerReports,
    confirmedConversions,
    accountSettings: {
      autoTaggingEnabled: accountRecord?.autoTaggingEnabled,
      finalUrlSuffix: accountRecord?.finalUrlSuffix,
      conversionTrackingStatus: accountRecord?.conversionTrackingStatus,
      accountTimeZone: accountRecord?.accountTimeZone,
      currency: accountRecord?.currency,
    },
    campaignSettings: {
      targetGoogleSearch: searchDefaults?.targetGoogleSearch,
      targetSearchNetwork: searchDefaults?.targetSearchNetwork,
      targetContentNetwork: searchDefaults?.targetContentNetwork,
      locationCriterionIds: searchDefaults?.locationCriterionIds ?? [],
      languageCriterionIds: searchDefaults?.languageCriterionIds ?? [],
      finalUrlSuffix: searchDefaults?.finalUrlSuffix,
    },
    productStrategy: {
      primaryCampaignType: 'Search',
      recommendedAdGroups: [...recommendedAdGroups],
      recommendedConversionSequence: [...recommendedConversionSequence],
      recommendedNegativeKeywords: [...recommendedNegativeKeywords],
    },
    checks,
    actions,
    nextWorkflowStep: hasBlockingError
      ? 'Fix failed readiness checks, then rerun `unisane growth ads readiness` before live production launch.'
      : 'Run `unisane growth ads optimize` and use the readiness actions to refine campaign structure before production launch.',
  };
}

export async function writeMarketingAdsReadinessPlan(
  config: MarketingExecutionContext,
  options: MarketingAdsReadinessOptions = {},
): Promise<MarketingAdsReadinessResult> {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const plan = await buildMarketingAdsReadinessPlan(config, options);
  if (options.dryRun) {
    return { ok: plan.ok, dryRun: true, plan };
  }
  const outputPath = resolveOutputPath(cwd, options.out);
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
  return { ok: plan.ok, dryRun: false, path: outputPath, plan };
}
