import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import {
  loadMarketingRegistries,
  type LoadedMarketingRegistries,
} from '../registry/load-registries.js';
import type {
  MarketingExecutionContext,
  MarketingProviderAvailability,
} from '../schema/execution-context.js';
import type { MarketingProviderReportStatus } from '../reports/provider-pulls.js';
import { readMarketingProviderReportStatus } from '../reports/provider-pulls.js';
import type { MarketingProviderReportType } from '../schema/report.js';

export type MarketingAdsProvider = 'googleAds' | 'metaAds';
export type MarketingAdsStatusCheckStatus = 'pass' | 'warn' | 'error' | 'skip';

export type MarketingAdsStatusCheck = {
  id: string;
  status: MarketingAdsStatusCheckStatus;
  message: string;
  path?: string;
};

export type MarketingAdsProviderStatus = {
  provider: MarketingAdsProvider;
  state: MarketingProviderAvailability;
  accountIdEnv?: string;
  accountIdSet: boolean;
  loginCustomerIdEnv?: string;
  loginCustomerIdSet: boolean;
  pageIdEnv?: string;
  pageIdSet: boolean;
  instagramActorIdEnv?: string;
  instagramActorIdSet: boolean;
  environmentAccountRefs: Array<{
    environment: string;
    production: boolean;
    accountIdEnv?: string;
    accountIdSet: boolean;
  }>;
};

export type MarketingAdsConversionMappingStatus = {
  provider: MarketingAdsProvider;
  mappedConversions: number;
  missingConversions: string[];
};

export type MarketingAdsLatestArtifact = {
  path: string;
  updatedAt: string;
  ageDays: number;
};

export type MarketingAdsStatusReport = {
  ok: boolean;
  cwd: string;
  configPath?: string;
  platformId: string;
  appId: string;
  defaultEnvironment: string;
  providers: MarketingAdsProviderStatus[];
  conversionMappings: MarketingAdsConversionMappingStatus[];
  providerReports: MarketingProviderReportStatus[];
  creativeInventory: MarketingProviderReportStatus[];
  latestPlan?: MarketingAdsLatestArtifact;
  latestReceipt?: MarketingAdsLatestArtifact;
  nextWorkflowStep: string;
  checks: MarketingAdsStatusCheck[];
};

export type MarketingAdsStatusOptions = {
  cwd?: string;
  configPath?: string;
  env?: Record<string, string | undefined>;
  now?: Date;
  maxAgeDays?: number;
  reportType?: MarketingProviderReportType;
};

const adsProviders: MarketingAdsProvider[] = ['googleAds', 'metaAds'];

function providerAccountEnv(
  config: MarketingExecutionContext,
  provider: MarketingAdsProvider,
): string | undefined {
  return config.providers[provider].accountIdEnv;
}

function environmentAccountEnv(
  environment: MarketingExecutionContext['environments'][string],
  provider: MarketingAdsProvider,
): string | undefined {
  return provider === 'googleAds'
    ? environment.googleAdsCustomerIdEnv
    : environment.metaAdAccountIdEnv;
}

function providerStatuses(
  config: MarketingExecutionContext,
  env: Record<string, string | undefined>,
): MarketingAdsProviderStatus[] {
  return adsProviders.map((provider) => {
    const accountIdEnv = providerAccountEnv(config, provider);
    const loginCustomerIdEnv =
      provider === 'googleAds' ? config.providers.googleAds.loginCustomerIdEnv : undefined;
    const pageIdEnv = provider === 'metaAds' ? config.providers.metaAds.pageIdEnv : undefined;
    const instagramActorIdEnv =
      provider === 'metaAds' ? config.providers.metaAds.instagramActorIdEnv : undefined;
    return {
      provider,
      state: config.providers[provider].state,
      accountIdEnv,
      accountIdSet: Boolean(accountIdEnv && env[accountIdEnv]),
      loginCustomerIdEnv,
      loginCustomerIdSet: Boolean(loginCustomerIdEnv && env[loginCustomerIdEnv]),
      pageIdEnv,
      pageIdSet: Boolean(pageIdEnv && env[pageIdEnv]),
      instagramActorIdEnv,
      instagramActorIdSet: Boolean(instagramActorIdEnv && env[instagramActorIdEnv]),
      environmentAccountRefs: Object.entries(config.environments).map(([name, environment]) => {
        const envName = environmentAccountEnv(environment, provider) ?? accountIdEnv;
        return {
          environment: name,
          production: environment.production,
          accountIdEnv: envName,
          accountIdSet: Boolean(envName && env[envName]),
        };
      }),
    };
  });
}

function providerChecks(providers: MarketingAdsProviderStatus[]): MarketingAdsStatusCheck[] {
  return providers.flatMap((provider) => {
    if (provider.state === 'disabled') {
      return [
        {
          id: `providers.${provider.provider}.state`,
          status: 'skip' as const,
          message: `${provider.provider} is disabled.`,
        },
      ];
    }

    const checks: MarketingAdsStatusCheck[] = [
      {
        id: `providers.${provider.provider}.accountIdEnv`,
        status: provider.accountIdEnv
          ? provider.accountIdSet
            ? 'pass'
            : provider.state === 'connected'
              ? 'error'
              : 'warn'
          : provider.state === 'connected'
            ? 'error'
            : 'warn',
        message: provider.accountIdEnv
          ? provider.accountIdSet
            ? `${provider.provider} account env ${provider.accountIdEnv} is set.`
            : `${provider.provider} account env ${provider.accountIdEnv} is not set.`
          : `${provider.provider} account env is not declared.`,
      },
    ];
    if (provider.provider === 'googleAds') {
      checks.push({
        id: 'providers.googleAds.loginCustomerIdEnv',
        status: provider.loginCustomerIdEnv
          ? provider.loginCustomerIdSet
            ? 'pass'
            : 'warn'
          : 'skip',
        message: provider.loginCustomerIdEnv
          ? provider.loginCustomerIdSet
            ? `googleAds login customer env ${provider.loginCustomerIdEnv} is set.`
            : `googleAds login customer env ${provider.loginCustomerIdEnv} is not set; this is only required for manager-account access.`
          : 'googleAds login customer env is not declared; set one only for manager-account access.',
      });
    }
    if (provider.provider === 'metaAds') {
      checks.push(
        {
          id: 'providers.metaAds.pageIdEnv',
          status: provider.pageIdEnv ? (provider.pageIdSet ? 'pass' : 'warn') : 'warn',
          message: provider.pageIdEnv
            ? provider.pageIdSet
              ? `metaAds page env ${provider.pageIdEnv} is set.`
              : `metaAds page env ${provider.pageIdEnv} is not set; Meta creative creation needs a Page actor.`
            : 'metaAds page env is not declared; Meta creative creation needs a Page actor.',
        },
        {
          id: 'providers.metaAds.instagramActorIdEnv',
          status: provider.instagramActorIdEnv
            ? provider.instagramActorIdSet
              ? 'pass'
              : 'warn'
            : 'warn',
          message: provider.instagramActorIdEnv
            ? provider.instagramActorIdSet
              ? `metaAds Instagram actor env ${provider.instagramActorIdEnv} is set.`
              : `metaAds Instagram actor env ${provider.instagramActorIdEnv} is not set; Instagram placements need an Instagram actor.`
            : 'metaAds Instagram actor env is not declared; Instagram placements need an Instagram actor.',
        },
      );
    }

    for (const environment of provider.environmentAccountRefs) {
      checks.push({
        id: `providers.${provider.provider}.environments.${environment.environment}.account`,
        status: environment.accountIdEnv
          ? environment.production && !environment.accountIdSet && provider.state === 'connected'
            ? 'error'
            : 'pass'
          : environment.production
            ? 'warn'
            : 'skip',
        message: environment.accountIdEnv
          ? `${environment.environment} uses ${environment.accountIdEnv} for ${provider.provider}.`
          : `${environment.environment} does not declare an environment-scoped ${provider.provider} account env.`,
      });
    }

    return checks;
  });
}

function conversionMappingStatuses(
  config: MarketingExecutionContext,
  registries: LoadedMarketingRegistries,
): MarketingAdsConversionMappingStatus[] {
  return adsProviders.map((provider) => {
    const missingConversions = registries.conversions.value.conversions
      .filter((conversion) => {
        if (provider === 'googleAds') return !conversion.mappings.googleAds;
        return (
          !conversion.mappings.meta?.pixelEventName && !conversion.mappings.meta?.capiEventName
        );
      })
      .map((conversion) => conversion.id);
    return {
      provider,
      mappedConversions:
        registries.conversions.value.conversions.length - missingConversions.length,
      missingConversions:
        config.providers[provider].state === 'disabled' ? [] : missingConversions.sort(),
    };
  });
}

function conversionMappingChecks(
  config: MarketingExecutionContext,
  mappings: MarketingAdsConversionMappingStatus[],
): MarketingAdsStatusCheck[] {
  return mappings.map((mapping) => {
    const state = config.providers[mapping.provider].state;
    if (state === 'disabled') {
      return {
        id: `conversions.${mapping.provider}.mappings`,
        status: 'skip',
        message: `${mapping.provider} is disabled.`,
      };
    }
    const missingCount = mapping.missingConversions.length;
    return {
      id: `conversions.${mapping.provider}.mappings`,
      status: missingCount === 0 ? 'pass' : state === 'connected' ? 'error' : 'warn',
      message:
        missingCount === 0
          ? `${mapping.provider} conversion mappings cover all canonical conversions.`
          : `${mapping.provider} is missing ${missingCount} canonical conversion mapping(s).`,
    };
  });
}

function latestArtifact(
  cwd: string,
  relativeDir: string,
  now: Date,
): MarketingAdsLatestArtifact | undefined {
  const directory = path.resolve(cwd, relativeDir);
  if (!existsSync(directory)) return undefined;
  const files = readdirSync(directory)
    .map((name) => path.join(directory, name))
    .filter((filePath) => statSync(filePath).isFile())
    .map((filePath) => ({ filePath, stat: statSync(filePath) }))
    .sort((left, right) => right.stat.mtimeMs - left.stat.mtimeMs);
  const latest = files[0];
  if (!latest) return undefined;
  return {
    path: latest.filePath,
    updatedAt: latest.stat.mtime.toISOString(),
    ageDays: Math.max(0, Math.round((now.getTime() - latest.stat.mtimeMs) / 86_400_000)),
  };
}

function resolveNextWorkflowStep(
  report: Omit<MarketingAdsStatusReport, 'nextWorkflowStep'>,
): string {
  if (report.checks.some((check) => check.status === 'error')) {
    return 'Fix ads doctor errors, then rerun `unisane growth ads doctor`.';
  }
  if (report.providerReports.some((provider) => provider.status === 'missing')) {
    return 'Pull read-only Google Ads and Meta Ads reports before optimization: `unisane growth marketing pull-api --provider <provider> --report campaign ...`.';
  }
  if (!report.latestPlan) {
    return 'Build the first non-mutating paid plan with `unisane growth ads plan`.';
  }
  if (!report.latestReceipt) {
    return 'Review the ads plan, then run `unisane growth ads apply --dry-run` to create the guarded receipt.';
  }
  return 'Review recommendations and experiments before any live provider mutation work.';
}

export async function buildMarketingAdsStatusReport(
  config: MarketingExecutionContext,
  options: MarketingAdsStatusOptions = {},
): Promise<MarketingAdsStatusReport> {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const now = options.now ?? new Date();
  const env = options.env ?? process.env;
  const providers = providerStatuses(config, env);
  const registries = await loadMarketingRegistries(config, { cwd });
  const conversionMappings = conversionMappingStatuses(config, registries);
  const providerReports = adsProviders.flatMap(
    (provider) =>
      readMarketingProviderReportStatus({
        cwd,
        provider,
        reportType: options.reportType,
        maxAgeDays: options.maxAgeDays,
        now,
      }).providers,
  );
  const creativeInventory = readMarketingProviderReportStatus({
    cwd,
    provider: 'metaAds',
    reportType: 'creative',
    maxAgeDays: options.maxAgeDays,
    now,
  }).providers;
  const checks = [
    ...providerChecks(providers),
    ...conversionMappingChecks(config, conversionMappings),
  ];
  for (const providerReport of providerReports) {
    checks.push({
      id: `reports.${providerReport.provider}.${providerReport.reportType ?? 'latest'}`,
      status:
        providerReport.status === 'error'
          ? 'error'
          : providerReport.status === 'fresh'
            ? 'pass'
            : 'warn',
      message: providerReport.message,
      path: providerReport.path,
    });
  }
  for (const providerReport of creativeInventory) {
    checks.push({
      id: `creative.${providerReport.provider}.${providerReport.reportType ?? 'latest'}`,
      status:
        providerReport.status === 'error'
          ? 'error'
          : providerReport.status === 'fresh'
            ? 'pass'
            : 'warn',
      message: providerReport.message,
      path: providerReport.path,
    });
  }

  const reportWithoutNext = {
    ok: checks.every((check) => check.status !== 'error'),
    cwd,
    configPath: options.configPath,
    platformId: config.platformId,
    appId: config.appId,
    defaultEnvironment: config.defaultEnvironment,
    providers,
    conversionMappings,
    providerReports,
    creativeInventory,
    latestPlan: latestArtifact(cwd, 'docs/marketing/ads/plans', now),
    latestReceipt: latestArtifact(
      cwd,
      `.unisane/marketing/${config.defaultEnvironment}/receipts`,
      now,
    ),
    checks,
  };

  return {
    ...reportWithoutNext,
    nextWorkflowStep: resolveNextWorkflowStep(reportWithoutNext),
  };
}
