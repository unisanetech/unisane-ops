import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import type { MarketingConfig, MarketingProviderState } from '../schema/marketing-config.js';
import {
  marketingReportProviderSchema,
  type MarketingProviderReportType,
  type MarketingReportProvider,
} from '../schema/report.js';
import { readMarketingConfirmedConversionStatus } from '../reports/confirmed-conversions.js';
import { ensurePathWithinCwd } from '../reports/paths.js';
import { readMarketingProviderReportStatus } from '../reports/provider-pulls.js';
import { readMarketingStrategyMapStatus } from '../reports/strategy-map.js';
import {
  marketingGoogleAuthReadyForProvider,
  type MarketingGoogleAuthProfileStatus,
} from '../auth/google.js';
import { marketingMetaAuthReady, type MarketingMetaAuthProfileStatus } from '../auth/meta.js';

export type MarketingProofProvider =
  | 'gtm'
  | 'googleAds'
  | 'metaAds'
  | 'ga4'
  | 'searchConsole'
  | 'confirmedConversions'
  | 'strategyMap';

export type MarketingProofCheckStatus = 'pass' | 'warn' | 'error' | 'pending' | 'skip';

export type MarketingProofEnvRefStatus = {
  name: string;
  required: boolean;
  set: boolean;
  source?: 'env' | 'marketingAuth';
  profile?: string;
  authProblem?: string;
};

export type MarketingProofCommand = {
  id: string;
  provider?: MarketingProofProvider;
  reportType?: MarketingProviderReportType;
  command: string;
  purpose: string;
};

export type MarketingProofProviderReportFamilyStatus = {
  provider: MarketingReportProvider;
  reportType: MarketingProviderReportType;
  status: MarketingProofCheckStatus;
  message: string;
  path?: string;
  recordCount?: number;
  ageDays?: number;
};

export type MarketingProofProviderLimitRecord = {
  provider: MarketingReportProvider;
  accountRefEnv?: string;
  recordedAt?: string;
  scopes: string[];
  rateLimits: string[];
  failureModes: string[];
  notes: string[];
};

export type MarketingProofProviderStatus = {
  provider: MarketingProofProvider;
  state?: MarketingProviderState;
  requiredEnvRefs: MarketingProofEnvRefStatus[];
  optionalEnvRefs: MarketingProofEnvRefStatus[];
  reportFamilies: MarketingProofProviderReportFamilyStatus[];
  limitRecord?: MarketingProofProviderLimitRecord;
  evidenceStatus: MarketingProofCheckStatus;
  evidenceMessage: string;
  evidencePath?: string;
  proofCommands: MarketingProofCommand[];
};

export type MarketingProofCheck = {
  id: string;
  status: MarketingProofCheckStatus;
  message: string;
  provider?: MarketingProofProvider;
  command?: string;
  path?: string;
};

export type MarketingRealAccountProofStatusReport = {
  kind: 'unisane.marketing.real-account-proof-status';
  version: 1;
  nonMutating: true;
  generatedAt: string;
  ok: boolean;
  readyForScheduledPulls: boolean;
  cwd: string;
  configPath?: string;
  platformId: string;
  appId: string;
  defaultEnvironment: string;
  maxAgeDays: number;
  limitsPath?: string;
  providerLimits: MarketingProofProviderLimitRecord[];
  providers: MarketingProofProviderStatus[];
  checks: MarketingProofCheck[];
  nextWorkflowStep: string;
};

export type MarketingRealAccountProofStatusOptions = {
  cwd?: string;
  configPath?: string;
  env?: Record<string, string | undefined>;
  limitsPath?: string;
  maxAgeDays?: number;
  now?: Date;
  googleAuth?: MarketingGoogleAuthProfileStatus;
  metaAuth?: MarketingMetaAuthProfileStatus;
};

export type MarketingProofSetupProviderRecord = {
  provider: MarketingReportProvider;
  state: MarketingProviderState;
  accountRefEnv?: string;
  scopes: string[];
  rateLimits: string[];
  failureModes: string[];
  notes: string[];
};

export type MarketingProofSetupFile = {
  version: 1;
  providers: MarketingProofSetupProviderRecord[];
};

export type MarketingProofSetupCommand = {
  command: string;
  purpose: string;
};

export type MarketingProofSetupResult = {
  path: string;
  wrote: boolean;
  providerCount: number;
  providers: MarketingProofSetupProviderRecord[];
  nextCommands: MarketingProofSetupCommand[];
};

export type MarketingProofSetupOptions = {
  cwd?: string;
  out?: string;
  force?: boolean;
};

const reportProviders: MarketingReportProvider[] = ['googleAds', 'metaAds', 'ga4', 'searchConsole'];

const requiredReportFamilies: Record<MarketingReportProvider, MarketingProviderReportType[]> = {
  googleAds: ['campaign', 'keyword', 'conversion'],
  metaAds: ['campaign', 'adSet', 'ad', 'creative'],
  ga4: ['landingPage', 'channel', 'sourceMedium'],
  searchConsole: ['queryPage', 'page', 'query'],
};

const marketingProofProviderLimitFileSchema = z.object({
  version: z.literal(1),
  providers: z
    .array(
      z.object({
        provider: marketingReportProviderSchema,
        accountRefEnv: z.string().min(1).optional(),
        recordedAt: z.string().datetime().optional(),
        scopes: z.array(z.string().min(1)).default([]),
        rateLimits: z.array(z.string().min(1)).default([]),
        failureModes: z.array(z.string().min(1)).default([]),
        notes: z.array(z.string().min(1)).default([]),
      }),
    )
    .default([]),
});

function readJsonFile(filePath: string): unknown {
  return JSON.parse(readFileSync(filePath, 'utf8')) as unknown;
}

function defaultProofSetupPath(cwd: string): string {
  return path.join(cwd, 'docs', 'marketing', 'real-account-proof-limits.json');
}

function providerAccountRefEnv(
  config: MarketingConfig,
  provider: MarketingReportProvider,
): string | undefined {
  const providerConfig = config.providers[provider];
  if (provider === 'googleAds') return providerConfig.accountIdEnv;
  if (provider === 'metaAds') return providerConfig.accountIdEnv;
  if (provider === 'ga4') return providerConfig.accountIdEnv;
  return providerConfig.accountIdEnv;
}

function defaultProviderNotes(provider: MarketingReportProvider): string[] {
  if (provider === 'googleAds') {
    return [
      'Prefer marketing auth login for Google OAuth; keep raw access-token env vars as fallback only.',
      'Fill scopes after confirming read-only Google Ads access.',
      'Set login-customer-id only when the OAuth user acts through a Google Ads manager account.',
      'Record customer/reporting quota and failure modes before scheduled pulls.',
      'Do not paste developer tokens, OAuth tokens, or account ids into committed docs.',
    ];
  }
  if (provider === 'metaAds') {
    return [
      'Fill scopes after confirming read-only Meta Ads insights access.',
      'Record ad account/reporting rate limits and paging failure modes before scheduled pulls.',
      'Do not paste access tokens or account ids into committed docs.',
    ];
  }
  if (provider === 'ga4') {
    return [
      'Prefer marketing auth login for Google OAuth; keep raw access-token env vars as fallback only.',
      'Fill scopes after confirming GA4 runReport read access.',
      'Record property row/window limits and sampling/freshness notes before scheduled pulls.',
      'Do not paste access tokens or property ids into committed docs.',
    ];
  }
  return [
    'Prefer marketing auth login for Google OAuth; keep raw access-token env vars as fallback only.',
    'Fill scopes after confirming Search Console search analytics read access.',
    'Record site row limits, verified-site requirements, and freshness notes before scheduled pulls.',
    'Do not paste access tokens or site identifiers into committed docs.',
  ];
}

function buildProofSetupFile(config: MarketingConfig): MarketingProofSetupFile {
  return {
    version: 1,
    providers: reportProviders
      .filter((provider) => config.providers[provider].state !== 'disabled')
      .map((provider) => ({
        provider,
        state: config.providers[provider].state,
        accountRefEnv: providerAccountRefEnv(config, provider),
        scopes: [],
        rateLimits: [],
        failureModes: [],
        notes: defaultProviderNotes(provider),
      })),
  };
}

function buildProofSetupCommands(outPath: string): MarketingProofSetupCommand[] {
  return [
    {
      command: `unisane growth marketing auth login --profile <name>`,
      purpose: 'Connect Google once for Google Ads, GA4, and Search Console read-only pulls.',
    },
    {
      command: `unisane growth marketing auth status --profile <name>`,
      purpose: 'Confirm the saved Marketing Google auth profile without printing secrets.',
    },
    {
      command: `unisane growth marketing doctor`,
      purpose: 'Confirm configured providers and env refs without printing secrets.',
    },
    {
      command: `unisane growth ads doctor`,
      purpose: 'Confirm paid provider account refs before any ads workflow.',
    },
    {
      command: `unisane growth analytics status`,
      purpose: 'Check analytics/provider freshness before report pulls.',
    },
    {
      command: `unisane growth marketing proof status --limits ${outPath} --out .unisane/marketing/proof/status.json`,
      purpose: 'Write the real-account proof artifact after env refs and read-only evidence exist.',
    },
  ];
}

export function writeMarketingProofSetup(
  config: MarketingConfig,
  options: MarketingProofSetupOptions = {},
): MarketingProofSetupResult {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const resolved = options.out ? path.resolve(cwd, options.out) : defaultProofSetupPath(cwd);
  ensurePathWithinCwd(cwd, resolved);
  if (existsSync(resolved) && !options.force) {
    throw new Error(
      `[MARKETING_PROOF_SETUP_EXISTS] Proof limits/scopes file already exists at ${resolved}. Use --force to overwrite.`,
    );
  }
  const file = buildProofSetupFile(config);
  mkdirSync(path.dirname(resolved), { recursive: true });
  writeFileSync(resolved, `${JSON.stringify(file, null, 2)}\n`, 'utf8');
  const relativePath = path.relative(cwd, resolved);
  return {
    path: resolved,
    wrote: true,
    providerCount: file.providers.length,
    providers: file.providers,
    nextCommands: buildProofSetupCommands(relativePath),
  };
}

function envStatus(
  env: Record<string, string | undefined>,
  name: string | undefined,
  required: boolean,
  authReady?: { profile: string },
  authProblem?: string,
): MarketingProofEnvRefStatus[] {
  if (!name) return [];
  const envSet = Boolean(env[name]);
  return [
    {
      name,
      required,
      set: envSet || Boolean(authReady),
      source: envSet ? 'env' : authReady ? 'marketingAuth' : undefined,
      profile: authReady?.profile,
      authProblem: envSet || authReady ? undefined : authProblem,
    },
  ];
}

function configuredRequired(state: MarketingProviderState): boolean {
  return state === 'configured';
}

function providerEnvRefs(
  config: MarketingConfig,
  provider: Extract<MarketingProofProvider, 'googleAds' | 'metaAds' | 'ga4' | 'searchConsole'>,
  env: Record<string, string | undefined>,
  googleAuth?: MarketingGoogleAuthProfileStatus,
  metaAuth?: MarketingMetaAuthProfileStatus,
): Pick<MarketingProofProviderStatus, 'requiredEnvRefs' | 'optionalEnvRefs'> {
  const providerConfig = config.providers[provider];
  const required = configuredRequired(providerConfig.state);
  const authReady =
    googleAuth && marketingGoogleAuthReadyForProvider(googleAuth, provider)
      ? { profile: googleAuth.profile }
      : undefined;
  const googleAuthProblem =
    provider !== 'metaAds' &&
    provider !== 'googleAds' &&
    provider !== 'ga4' &&
    provider !== 'searchConsole'
      ? undefined
      : provider === 'metaAds'
        ? undefined
        : googleAuth?.configured
          ? `Marketing auth profile ${googleAuth.profile} is configured but not usable for ${provider}; rerun marketing auth login.`
          : 'Marketing auth profile is not configured; run marketing auth login.';
  if (provider === 'googleAds') {
    return {
      requiredEnvRefs: [
        ...envStatus(env, providerConfig.accountIdEnv, required),
        ...envStatus(env, providerConfig.developerTokenEnv, required),
        ...envStatus(env, providerConfig.accessTokenEnv, required, authReady, googleAuthProblem),
      ],
      optionalEnvRefs: [...envStatus(env, providerConfig.loginCustomerIdEnv, false)],
    };
  }
  if (provider === 'metaAds') {
    const metaAuthReady = marketingMetaAuthReady(metaAuth)
      ? { profile: metaAuth.profile }
      : undefined;
    return {
      requiredEnvRefs: [
        ...envStatus(env, providerConfig.accountIdEnv, required),
        ...envStatus(env, providerConfig.accessTokenEnv, required, metaAuthReady),
      ],
      optionalEnvRefs: [
        ...envStatus(env, providerConfig.pixelIdEnv, false),
        ...envStatus(env, providerConfig.datasetIdEnv, false),
      ],
    };
  }
  return {
    requiredEnvRefs: [
      ...envStatus(env, providerConfig.accountIdEnv, required),
      ...envStatus(env, providerConfig.accessTokenEnv, required, authReady, googleAuthProblem),
    ],
    optionalEnvRefs: [],
  };
}

function envChecks(provider: MarketingProofProviderStatus): MarketingProofCheck[] {
  return [...provider.requiredEnvRefs, ...provider.optionalEnvRefs].map((envRef) => ({
    id: `providers.${provider.provider}.env.${envRef.name}`,
    provider: provider.provider,
    status: envRef.set ? 'pass' : envRef.required ? 'error' : 'warn',
    message:
      envRef.source === 'marketingAuth'
        ? `${provider.provider} Marketing auth profile ${envRef.profile} satisfies ${envRef.name}.`
        : envRef.authProblem
          ? `${provider.provider} ${envRef.authProblem} ${envRef.name} remains a fallback/debug token and is not set.`
          : envRef.set
            ? `${provider.provider} env ref ${envRef.name} is set.`
            : envRef.required
              ? `${provider.provider} required env ref ${envRef.name} is not set.`
              : `${provider.provider} optional env ref ${envRef.name} is not set.`,
  }));
}

function evidenceStatus(status: string): MarketingProofCheckStatus {
  if (status === 'fresh') return 'pass';
  if (status === 'error') return 'error';
  if (status === 'missing' || status === 'stale' || status === 'partial') return 'pending';
  return 'warn';
}

function proofCommands(
  provider: MarketingProofProvider,
  googleAuth?: MarketingGoogleAuthProfileStatus,
  metaAuth?: MarketingMetaAuthProfileStatus,
): MarketingProofCommand[] {
  if (provider === 'gtm') {
    return [
      {
        id: 'gtm.validate',
        provider,
        command: 'unisane growth gtm validate',
        purpose: 'Validate GTM desired state before live GTM apply or publish.',
      },
      {
        id: 'gtm.diff',
        provider,
        command: 'unisane growth gtm diff',
        purpose: 'Compare GTM desired state against pulled container state.',
      },
    ];
  }
  if (provider === 'confirmedConversions') {
    return [
      {
        id: 'marketing.conversionPull',
        provider,
        command: 'unisane growth marketing conversion-pull --input <confirmed-conversions.json>',
        purpose: 'Cache Unisane-confirmed business conversion truth.',
      },
    ];
  }
  if (provider === 'strategyMap') {
    return [
      {
        id: 'marketing.strategyPull',
        provider,
        command: 'unisane growth marketing strategy-pull --input <strategy-map.json>',
        purpose: 'Cache marketing strategy-object joins for reports and optimization.',
      },
    ];
  }
  if (
    provider === 'googleAds' ||
    provider === 'metaAds' ||
    provider === 'ga4' ||
    provider === 'searchConsole'
  ) {
    const authProfileSuffix =
      googleAuth &&
      provider !== 'metaAds' &&
      marketingGoogleAuthReadyForProvider(googleAuth, provider)
        ? ` --auth-profile ${googleAuth.profile}`
        : '';
    const metaProfileSuffix =
      provider === 'metaAds' && marketingMetaAuthReady(metaAuth)
        ? ` --meta-auth-profile ${metaAuth.profile}`
        : '';
    return requiredReportFamilies[provider].flatMap((reportType) => [
      {
        id: `marketing.pullApi.${provider}.${reportType}`,
        provider,
        reportType,
        command: `unisane growth marketing pull-api --provider ${provider} --report ${reportType} --start-date <YYYY-MM-DD> --end-date <YYYY-MM-DD>${authProfileSuffix}${metaProfileSuffix}`,
        purpose: `Pull a narrow read-only ${provider}/${reportType} report into the normalized local cache.`,
      },
      {
        id: `marketing.pull.${provider}.${reportType}`,
        provider,
        reportType,
        command: `unisane growth marketing pull --provider ${provider} --report ${reportType} --input <normalized-or-export.json>`,
        purpose: `Import a ${provider}/${reportType} export when API proof is not ready.`,
      },
    ]);
  }
  return [];
}

function readProviderLimits(input: { cwd: string; limitsPath?: string }): {
  path?: string;
  records: MarketingProofProviderLimitRecord[];
  error?: string;
} {
  const resolved = input.limitsPath
    ? path.resolve(input.cwd, input.limitsPath)
    : defaultProofSetupPath(input.cwd);
  ensurePathWithinCwd(input.cwd, resolved);
  if (!existsSync(resolved)) {
    return { path: resolved, records: [], error: 'Provider limit/scope record file is missing.' };
  }
  try {
    const parsed = marketingProofProviderLimitFileSchema.parse(readJsonFile(resolved));
    return { path: resolved, records: parsed.providers };
  } catch (error) {
    return {
      path: resolved,
      records: [],
      error:
        error instanceof Error ? error.message : 'Provider limit/scope record file is invalid.',
    };
  }
}

function limitRecordFor(
  records: MarketingProofProviderLimitRecord[],
  provider: MarketingReportProvider,
): MarketingProofProviderLimitRecord | undefined {
  return records.find((record) => record.provider === provider);
}

function readReportFamilyStatuses(input: {
  cwd: string;
  provider: MarketingReportProvider;
  now: Date;
  maxAgeDays: number;
}): MarketingProofProviderReportFamilyStatus[] {
  return requiredReportFamilies[input.provider].map((reportType) => {
    const status = readMarketingProviderReportStatus({
      cwd: input.cwd,
      provider: input.provider,
      reportType,
      maxAgeDays: input.maxAgeDays,
      now: input.now,
    }).providers[0] ?? {
      provider: input.provider,
      reportType,
      status: 'missing' as const,
      path: '',
      exists: false,
      message: `${input.provider}/${reportType} has no latest provider pull artifact.`,
    };
    return {
      provider: input.provider,
      reportType,
      status: evidenceStatus(status.status),
      message: status.message,
      path: status.path,
      recordCount: status.recordCount,
      ageDays: status.ageDays,
    };
  });
}

function aggregateEvidence(
  provider: MarketingReportProvider,
  familyStatuses: MarketingProofProviderReportFamilyStatus[],
): Pick<MarketingProofProviderStatus, 'evidenceStatus' | 'evidenceMessage' | 'evidencePath'> {
  const error = familyStatuses.find((family) => family.status === 'error');
  if (error) {
    return {
      evidenceStatus: 'error',
      evidenceMessage: `${provider}/${error.reportType} proof evidence is invalid: ${error.message}`,
      evidencePath: error.path,
    };
  }
  const pending = familyStatuses.find((family) => family.status === 'pending');
  if (pending) {
    return {
      evidenceStatus: 'pending',
      evidenceMessage: `${provider}/${pending.reportType} proof evidence is pending: ${pending.message}`,
      evidencePath: pending.path,
    };
  }
  const warn = familyStatuses.find((family) => family.status === 'warn');
  if (warn) {
    return {
      evidenceStatus: 'warn',
      evidenceMessage: `${provider}/${warn.reportType} proof evidence needs review: ${warn.message}`,
      evidencePath: warn.path,
    };
  }
  return {
    evidenceStatus: 'pass',
    evidenceMessage: `${provider} required proof report families are fresh.`,
    evidencePath: familyStatuses[0]?.path,
  };
}

function buildProviderStatuses(input: {
  config: MarketingConfig;
  cwd: string;
  env: Record<string, string | undefined>;
  now: Date;
  maxAgeDays: number;
  providerLimits: MarketingProofProviderLimitRecord[];
  googleAuth?: MarketingGoogleAuthProfileStatus;
  metaAuth?: MarketingMetaAuthProfileStatus;
}): MarketingProofProviderStatus[] {
  const statuses: MarketingProofProviderStatus[] = [];
  const gtmManifestPath = path.resolve(input.cwd, input.config.paths.gtmManifest);
  statuses.push({
    provider: 'gtm',
    requiredEnvRefs: [],
    optionalEnvRefs: [],
    reportFamilies: [],
    evidenceStatus: existsSync(gtmManifestPath) ? 'pass' : 'pending',
    evidenceMessage: existsSync(gtmManifestPath)
      ? 'GTM manifest exists for proof validation.'
      : 'GTM manifest is missing or not generated yet.',
    evidencePath: gtmManifestPath,
    proofCommands: proofCommands('gtm', input.googleAuth, input.metaAuth),
  });

  for (const provider of reportProviders) {
    const providerConfig = input.config.providers[provider];
    const reportFamilies = readReportFamilyStatuses({
      cwd: input.cwd,
      provider,
      maxAgeDays: input.maxAgeDays,
      now: input.now,
    });
    statuses.push({
      provider,
      state: providerConfig.state,
      ...providerEnvRefs(input.config, provider, input.env, input.googleAuth, input.metaAuth),
      reportFamilies,
      limitRecord: limitRecordFor(input.providerLimits, provider),
      ...aggregateEvidence(provider, reportFamilies),
      proofCommands: proofCommands(provider, input.googleAuth, input.metaAuth),
    });
  }

  const confirmedConversions = readMarketingConfirmedConversionStatus({
    cwd: input.cwd,
    maxAgeDays: input.maxAgeDays,
    now: input.now,
  });
  statuses.push({
    provider: 'confirmedConversions',
    requiredEnvRefs: [],
    optionalEnvRefs: [],
    reportFamilies: [],
    evidenceStatus: evidenceStatus(confirmedConversions.status),
    evidenceMessage: confirmedConversions.message,
    evidencePath: confirmedConversions.path,
    proofCommands: proofCommands('confirmedConversions', input.googleAuth, input.metaAuth),
  });

  const strategyMap = readMarketingStrategyMapStatus({
    cwd: input.cwd,
    maxAgeDays: input.maxAgeDays,
    now: input.now,
  });
  statuses.push({
    provider: 'strategyMap',
    requiredEnvRefs: [],
    optionalEnvRefs: [],
    reportFamilies: [],
    evidenceStatus: evidenceStatus(strategyMap.status),
    evidenceMessage: strategyMap.message,
    evidencePath: strategyMap.path,
    proofCommands: proofCommands('strategyMap', input.googleAuth, input.metaAuth),
  });

  return statuses;
}

function isReportProvider(
  provider: MarketingProofProvider,
): provider is Extract<MarketingProofProvider, 'googleAds' | 'metaAds' | 'ga4' | 'searchConsole'> {
  return (
    provider === 'googleAds' ||
    provider === 'metaAds' ||
    provider === 'ga4' ||
    provider === 'searchConsole'
  );
}

function proofEvidenceRequired(provider: MarketingProofProviderStatus): boolean {
  if (provider.state === 'disabled') return false;
  if (isReportProvider(provider.provider)) return provider.state === 'configured';
  return provider.provider === 'gtm' || provider.provider === 'confirmedConversions';
}

function providerChecks(providers: MarketingProofProviderStatus[]): MarketingProofCheck[] {
  return providers.flatMap((provider) => {
    const checks: MarketingProofCheck[] = [
      ...envChecks(provider),
      {
        id: `providers.${provider.provider}.evidence`,
        provider: provider.provider,
        status: proofEvidenceRequired(provider)
          ? provider.evidenceStatus
          : provider.state === 'disabled'
            ? 'skip'
            : provider.evidenceStatus === 'pass'
              ? 'pass'
              : 'warn',
        message:
          provider.state === 'disabled'
            ? `${provider.provider} is disabled.`
            : provider.evidenceMessage,
        path: provider.evidencePath,
        command: provider.proofCommands[0]?.command,
      },
    ];
    for (const family of provider.reportFamilies) {
      checks.push({
        id: `providers.${family.provider}.reports.${family.reportType}`,
        provider: family.provider,
        status:
          provider.state === 'disabled'
            ? 'skip'
            : provider.state === 'configured'
              ? family.status
              : family.status === 'pass'
                ? 'pass'
                : 'warn',
        message: family.message,
        path: family.path,
        command:
          family.status === 'pass'
            ? undefined
            : `unisane growth marketing pull-api --provider ${family.provider} --report ${family.reportType} --start-date <YYYY-MM-DD> --end-date <YYYY-MM-DD>`,
      });
    }
    if (isReportProvider(provider.provider)) {
      const hasLimits = Boolean(
        provider.limitRecord &&
        provider.limitRecord.scopes.length > 0 &&
        provider.limitRecord.rateLimits.length > 0,
      );
      checks.push({
        id: `providers.${provider.provider}.limits`,
        provider: provider.provider,
        status:
          provider.state === 'disabled'
            ? 'skip'
            : provider.state === 'configured'
              ? hasLimits
                ? 'pass'
                : 'pending'
              : hasLimits
                ? 'pass'
                : 'warn',
        message: hasLimits
          ? `${provider.provider} scopes and provider limits are recorded by env ref only.`
          : `${provider.provider} scopes and provider limits are not recorded yet.`,
      });
    }
    return checks;
  });
}

function commandChecks(providers: MarketingProofProviderStatus[]): MarketingProofCheck[] {
  return providers.flatMap((provider) =>
    provider.proofCommands.map((command) => ({
      id: `commands.${command.id}`,
      provider: provider.provider,
      status: 'pending' as const,
      message: command.purpose,
      command: command.command,
    })),
  );
}

function nextWorkflowStep(
  report: Omit<MarketingRealAccountProofStatusReport, 'nextWorkflowStep'>,
): string {
  const requiresAction = (check: MarketingProofCheck): boolean => {
    const provider = report.providers.find((entry) => entry.provider === check.provider);
    return !provider?.state || provider.state === 'configured';
  };
  const error = report.checks.find((check) => check.status === 'error');
  if (error?.message.includes('Marketing auth profile')) {
    return 'Rerun `unisane growth marketing auth login --profile <name>`, then rerun `unisane growth marketing proof status`.';
  }
  if (error)
    return `Fix proof blocker ${error.id}, then rerun \`unisane growth marketing proof status\`.`;
  const pendingReportFamily = report.checks.find(
    (check) =>
      check.id.includes('.reports.') &&
      ['pending', 'warn'].includes(check.status) &&
      requiresAction(check),
  );
  if (pendingReportFamily?.command) return `Run ${pendingReportFamily.command}.`;
  const pendingEvidence = report.checks.find(
    (check) =>
      check.id.endsWith('.evidence') &&
      ['pending', 'warn'].includes(check.status) &&
      requiresAction(check),
  );
  if (pendingEvidence?.command) return `Run ${pendingEvidence.command}.`;
  if (pendingEvidence) {
    return 'Run the narrow read-only proof commands for pending providers, then rerun `unisane growth marketing proof status`.';
  }
  const pendingLimits = report.checks.find(
    (check) => check.id.endsWith('.limits') && check.status === 'pending',
  );
  if (pendingLimits) {
    return 'Record provider scopes and rate limits in a local proof limits file, then rerun `unisane growth marketing proof status --limits <path>`.';
  }
  if (!report.readyForScheduledPulls) {
    return 'Run and record the pending proof commands before enabling scheduled provider pulls.';
  }
  return 'Real-account proof evidence is fresh; scheduled read-only pulls can be considered with provider limits documented.';
}

export function buildMarketingRealAccountProofStatus(
  config: MarketingConfig,
  options: MarketingRealAccountProofStatusOptions = {},
): MarketingRealAccountProofStatusReport {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const now = options.now ?? new Date();
  const maxAgeDays = options.maxAgeDays ?? 3;
  const providerLimits = readProviderLimits({ cwd, limitsPath: options.limitsPath });
  const providers = buildProviderStatuses({
    config,
    cwd,
    env: options.env ?? process.env,
    now,
    maxAgeDays,
    providerLimits: providerLimits.records,
    googleAuth: options.googleAuth,
    metaAuth: options.metaAuth,
  });
  const checks = [...providerChecks(providers), ...commandChecks(providers)];
  if (providerLimits.error) {
    checks.unshift({
      id: 'limits.file',
      status: 'pending',
      message: providerLimits.error,
      path: providerLimits.path,
    });
  }
  const blockingChecks = checks.filter((check) => check.status === 'error');
  const evidenceReady = providers.every(
    (provider) => !proofEvidenceRequired(provider) || provider.evidenceStatus === 'pass',
  );
  const requiredEnvReady = providers.every((provider) =>
    provider.requiredEnvRefs.every((envRef) => envRef.set || !envRef.required),
  );
  const providerLimitsReady = providers.every((provider) => {
    if (!isReportProvider(provider.provider)) return true;
    if (provider.state !== 'configured') return true;
    return Boolean(
      provider.limitRecord &&
      provider.limitRecord.scopes.length > 0 &&
      provider.limitRecord.rateLimits.length > 0,
    );
  });
  const reportWithoutNext = {
    kind: 'unisane.marketing.real-account-proof-status' as const,
    version: 1 as const,
    nonMutating: true as const,
    generatedAt: now.toISOString(),
    ok: blockingChecks.length === 0,
    readyForScheduledPulls:
      blockingChecks.length === 0 && evidenceReady && requiredEnvReady && providerLimitsReady,
    cwd,
    configPath: options.configPath,
    platformId: config.platformId,
    appId: config.appId,
    defaultEnvironment: config.defaultEnvironment,
    maxAgeDays,
    limitsPath: providerLimits.path,
    providerLimits: providerLimits.records,
    providers,
    checks,
  };

  return {
    ...reportWithoutNext,
    nextWorkflowStep: nextWorkflowStep(reportWithoutNext),
  };
}

export function writeMarketingRealAccountProofStatus(
  config: MarketingConfig,
  options: MarketingRealAccountProofStatusOptions & { out: string },
): { report: MarketingRealAccountProofStatusReport; path: string } {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const resolved = path.resolve(cwd, options.out);
  ensurePathWithinCwd(cwd, resolved);
  const report = buildMarketingRealAccountProofStatus(config, { ...options, cwd });
  mkdirSync(path.dirname(resolved), { recursive: true });
  writeFileSync(resolved, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return { report, path: resolved };
}
