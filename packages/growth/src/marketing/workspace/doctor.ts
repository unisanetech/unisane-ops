import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { loadMarketingConfig, type LoadMarketingConfigOptions } from './load-config.js';
import { validateMarketingRegistries } from '../registry/validate-registries.js';
import type { MarketingConfig, MarketingProviderState } from '../schema/marketing-config.js';
import {
  marketingGoogleAuthReadyForProvider,
  requiredMarketingGoogleScope,
  type MarketingGoogleAuthProfileStatus,
} from '../auth/google.js';
import { marketingMetaAuthReady, type MarketingMetaAuthProfileStatus } from '../auth/meta.js';

export type MarketingCheckStatus = 'pass' | 'warn' | 'error' | 'skip';

export type MarketingDoctorCheck = {
  id: string;
  status: MarketingCheckStatus;
  message: string;
  path?: string;
};

export type MarketingDoctorProvider = {
  id: 'googleAds' | 'metaAds' | 'ga4' | 'searchConsole';
  state: MarketingProviderState;
  configured: boolean;
  env: Array<{ name: string; set: boolean; required: boolean; source?: 'env' | 'marketingAuth' }>;
};

export type MarketingDoctorArtifact = {
  id: string;
  label: string;
  path: string;
  exists: boolean;
  updatedAt?: string;
  ageDays?: number;
};

export type MarketingDoctorReport = {
  ok: boolean;
  cwd: string;
  configPath?: string;
  appId?: string;
  platformId?: string;
  auth?: {
    google?: MarketingGoogleAuthProfileStatus;
    meta?: MarketingMetaAuthProfileStatus;
  };
  providers?: MarketingDoctorProvider[];
  artifacts?: MarketingDoctorArtifact[];
  nextWorkflowStep?: string;
  checks: MarketingDoctorCheck[];
};

export type MarketingDoctorOptions = LoadMarketingConfigOptions & {
  env?: Record<string, string | undefined>;
  googleAuth?: MarketingGoogleAuthProfileStatus;
  metaAuth?: MarketingMetaAuthProfileStatus;
};

function checkFile(
  cwd: string,
  id: string,
  label: string,
  relativePath: string,
): MarketingDoctorCheck {
  const absolutePath = path.resolve(cwd, relativePath);
  if (existsSync(absolutePath)) {
    return {
      id,
      status: 'pass',
      message: `${label} exists.`,
      path: absolutePath,
    };
  }
  return {
    id,
    status: 'warn',
    message: `${label} is missing at ${relativePath}.`,
    path: absolutePath,
  };
}

function providerChecks(
  config: MarketingConfig,
  env: Record<string, string | undefined>,
  googleAuth?: MarketingGoogleAuthProfileStatus,
  metaAuth?: MarketingMetaAuthProfileStatus,
): MarketingDoctorCheck[] {
  const checks: MarketingDoctorCheck[] = [];
  const providers = config.providers;
  const providerEnvRefs = [
    ['providers.googleAds.account', providers.googleAds, providers.googleAds.accountIdEnv],
    [
      'providers.googleAds.developerToken',
      providers.googleAds,
      providers.googleAds.developerTokenEnv,
    ],
    [
      'providers.googleAds.loginCustomer',
      providers.googleAds,
      providers.googleAds.loginCustomerIdEnv,
    ],
    ['providers.googleAds.accessToken', providers.googleAds, providers.googleAds.accessTokenEnv],
    ['providers.metaAds.account', providers.metaAds, providers.metaAds.accountIdEnv],
    ['providers.metaAds.pixel', providers.metaAds, providers.metaAds.pixelIdEnv],
    ['providers.metaAds.dataset', providers.metaAds, providers.metaAds.datasetIdEnv],
    ['providers.metaAds.page', providers.metaAds, providers.metaAds.pageIdEnv],
    ['providers.metaAds.instagramActor', providers.metaAds, providers.metaAds.instagramActorIdEnv],
    ['providers.metaAds.accessToken', providers.metaAds, providers.metaAds.accessTokenEnv],
    ['providers.ga4.account', providers.ga4, providers.ga4.accountIdEnv],
    ['providers.ga4.accessToken', providers.ga4, providers.ga4.accessTokenEnv],
    [
      'providers.searchConsole.account',
      providers.searchConsole,
      providers.searchConsole.accountIdEnv,
    ],
    [
      'providers.searchConsole.accessToken',
      providers.searchConsole,
      providers.searchConsole.accessTokenEnv,
    ],
  ] as const;

  for (const [id, provider, envName] of providerEnvRefs) {
    if (provider.state === 'disabled') {
      checks.push({
        id,
        status: 'skip',
        message: 'Provider is disabled.',
      });
      continue;
    }
    if (!envName) {
      checks.push({
        id,
        status: provider.state === 'configured' ? 'error' : 'warn',
        message: 'Provider env var is not declared in marketing config.',
      });
      continue;
    }
    const isGoogleAccessToken =
      id === 'providers.googleAds.accessToken' ||
      id === 'providers.ga4.accessToken' ||
      id === 'providers.searchConsole.accessToken';
    const optionalProviderRef =
      id === 'providers.googleAds.loginCustomer' || id === 'providers.metaAds.dataset';
    const authReady =
      isGoogleAccessToken &&
      marketingGoogleAuthReadyForProvider(
        googleAuth,
        id === 'providers.googleAds.accessToken'
          ? 'googleAds'
          : id === 'providers.ga4.accessToken'
            ? 'ga4'
            : 'searchConsole',
      );
    const metaAuthReady =
      id === 'providers.metaAds.accessToken' && marketingMetaAuthReady(metaAuth);
    const googleProvider =
      id === 'providers.googleAds.accessToken'
        ? 'googleAds'
        : id === 'providers.ga4.accessToken'
          ? 'ga4'
          : id === 'providers.searchConsole.accessToken'
            ? 'searchConsole'
            : undefined;
    const googleAuthFallbackMessage =
      isGoogleAccessToken && googleProvider
        ? googleAuth?.configured
          ? `Marketing Google auth profile ${googleAuth.profile} is configured but is not usable for ${requiredMarketingGoogleScope(
              googleProvider,
            )}; rerun \`unisane growth marketing auth login --profile ${googleAuth.profile}\`. ${envName} remains a fallback/debug token and is not set.`
          : `Marketing Google auth profile is not configured; run \`unisane growth marketing auth login --profile <name>\`. ${envName} remains a fallback/debug token and is not set.`
        : undefined;
    checks.push({
      id,
      status:
        env[envName] || authReady || metaAuthReady
          ? 'pass'
          : provider.state === 'configured' && !optionalProviderRef
            ? 'error'
            : 'warn',
      message: env[envName]
        ? `${envName} is set.`
        : authReady
          ? `Marketing Google auth profile ${googleAuth?.profile} covers ${requiredMarketingGoogleScope(
              id === 'providers.googleAds.accessToken'
                ? 'googleAds'
                : id === 'providers.ga4.accessToken'
                  ? 'ga4'
                  : 'searchConsole',
            )}; ${envName} is not required for local pulls.`
          : metaAuthReady
            ? `Marketing Meta auth profile ${metaAuth?.profile} satisfies ${envName}.`
            : googleAuthFallbackMessage
              ? googleAuthFallbackMessage
              : optionalProviderRef
                ? `${envName} is not set. This is optional unless the provider account requires it.`
                : `${envName} is not set for ${provider.state} provider.`,
    });
  }

  for (const envRef of config.requiredEnv) {
    checks.push({
      id: `requiredEnv.${envRef.env}`,
      status: env[envRef.env] ? 'pass' : envRef.required ? 'error' : 'warn',
      message: env[envRef.env] ? `${envRef.env} is set.` : `${envRef.env} is not set.`,
    });
  }

  return checks;
}

function providerSummaries(
  config: MarketingConfig,
  env: Record<string, string | undefined>,
  googleAuth?: MarketingGoogleAuthProfileStatus,
  metaAuth?: MarketingMetaAuthProfileStatus,
): MarketingDoctorProvider[] {
  const providers = config.providers;
  const rows: Array<{
    id: MarketingDoctorProvider['id'];
    state: MarketingProviderState;
    env: Array<{ name: string; required: boolean }>;
  }> = [
    {
      id: 'googleAds',
      state: providers.googleAds.state,
      env: [
        { name: providers.googleAds.accountIdEnv, required: true },
        { name: providers.googleAds.loginCustomerIdEnv, required: false },
        { name: providers.googleAds.developerTokenEnv, required: true },
        { name: providers.googleAds.accessTokenEnv, required: true },
      ].filter((entry): entry is { name: string; required: boolean } => Boolean(entry.name)),
    },
    {
      id: 'metaAds',
      state: providers.metaAds.state,
      env: [
        { name: providers.metaAds.accountIdEnv, required: true },
        { name: providers.metaAds.pixelIdEnv, required: true },
        { name: providers.metaAds.datasetIdEnv, required: false },
        { name: providers.metaAds.pageIdEnv, required: false },
        { name: providers.metaAds.instagramActorIdEnv, required: false },
        { name: providers.metaAds.accessTokenEnv, required: true },
      ].filter((entry): entry is { name: string; required: boolean } => Boolean(entry.name)),
    },
    {
      id: 'ga4',
      state: providers.ga4.state,
      env: [
        { name: providers.ga4.accountIdEnv, required: true },
        { name: providers.ga4.accessTokenEnv, required: true },
      ].filter((entry): entry is { name: string; required: boolean } => Boolean(entry.name)),
    },
    {
      id: 'searchConsole',
      state: providers.searchConsole.state,
      env: [
        { name: providers.searchConsole.accountIdEnv, required: true },
        { name: providers.searchConsole.accessTokenEnv, required: true },
      ].filter((entry): entry is { name: string; required: boolean } => Boolean(entry.name)),
    },
  ];

  return rows.map((row) => {
    const resolvedEnv = row.env.map((entry) => ({
      ...entry,
      set:
        Boolean(env[entry.name]) ||
        (entry.name === providers[row.id].accessTokenEnv &&
          (marketingGoogleAuthReadyForProvider(googleAuth, row.id) ||
            (row.id === 'metaAds' && marketingMetaAuthReady(metaAuth)))),
      source:
        !env[entry.name] &&
        entry.name === providers[row.id].accessTokenEnv &&
        (marketingGoogleAuthReadyForProvider(googleAuth, row.id) ||
          (row.id === 'metaAds' && marketingMetaAuthReady(metaAuth)))
          ? ('marketingAuth' as const)
          : undefined,
    }));
    return {
      ...row,
      env: resolvedEnv,
      configured:
        row.state !== 'disabled' &&
        resolvedEnv.filter((entry) => entry.required).every((entry) => entry.set),
    };
  });
}

function artifactSummaries(config: MarketingConfig, cwd: string): MarketingDoctorArtifact[] {
  const artifactPaths = [
    ['gtmManifest', 'GTM manifest', config.paths.gtmManifest],
    ['webTrackingConfig', 'Web tracking config', config.paths.webTrackingConfig],
    ['webConversionsConfig', 'Web conversions config', config.paths.webConversionsConfig],
    ['eventRegistry', 'Event registry', config.paths.eventRegistry],
    ['conversionRegistry', 'Conversion registry', config.paths.conversionRegistry],
    ['seoRoot', 'SEO docs root', config.paths.seoRoot],
    ['marketingRoot', 'Marketing docs root', config.paths.marketingRoot],
    ['analyticsRoot', 'Analytics docs root', config.paths.analyticsRoot],
  ] as const;
  const now = Date.now();

  return artifactPaths.map(([id, label, relativePath]) => {
    const absolutePath = path.resolve(cwd, relativePath);
    if (!existsSync(absolutePath)) {
      return { id, label, path: absolutePath, exists: false };
    }
    const stat = statSync(absolutePath);
    const ageDays = Math.max(0, Math.round((now - stat.mtimeMs) / 86_400_000));
    return {
      id,
      label,
      path: absolutePath,
      exists: true,
      updatedAt: stat.mtime.toISOString(),
      ageDays,
    };
  });
}

function attributionStoreChecks(config: MarketingConfig): MarketingDoctorCheck[] {
  const store = config.attributionStore;
  if (store.state === 'disabled') {
    return [
      {
        id: 'attributionStore.config',
        status: 'skip',
        message: 'Attribution store is disabled.',
      },
    ];
  }

  const missing: string[] = [];
  if (!store.collectionName) missing.push('collectionName');
  if (!store.ttlDays) missing.push('ttlDays');
  if (!store.setupCommand) missing.push('setupCommand');

  if (missing.length > 0) {
    return [
      {
        id: 'attributionStore.config',
        status: store.state === 'configured' ? 'error' : 'warn',
        message: `Attribution store is ${store.state} but missing ${missing.join(', ')}.`,
      },
    ];
  }

  return [
    {
      id: 'attributionStore.config',
      status: 'pass',
      message: `${store.collectionName} keeps attribution for ${store.ttlDays} days. Setup: ${store.setupCommand}.`,
    },
  ];
}

function resolveNextWorkflowStep(input: {
  checks: MarketingDoctorCheck[];
  providers: MarketingDoctorProvider[];
  config: MarketingConfig;
}): string {
  if (input.checks.some((check) => check.status === 'error')) {
    return 'Fix marketing doctor errors, then rerun `unisane growth marketing doctor`.';
  }
  if (input.config.attributionStore.state === 'configured') {
    return `Run \`${input.config.attributionStore.setupCommand}\`, then run \`unisane growth marketing audit\`.`;
  }
  const plannedProvider = input.providers.find(
    (provider) => provider.state === 'planned' && !provider.configured,
  );
  if (plannedProvider) {
    return `Configure ${plannedProvider.id} env vars when that provider is ready, or mark it disabled in marketing config.`;
  }
  return 'Run `unisane growth marketing audit`, then pull provider reports into `.unisane/marketing/**`.';
}

export async function runMarketingDoctor(
  options: MarketingDoctorOptions = {},
): Promise<MarketingDoctorReport> {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const checks: MarketingDoctorCheck[] = [];

  try {
    const loaded = await loadMarketingConfig(options);
    checks.push({
      id: 'marketing.config',
      status: 'pass',
      message: 'Marketing config is valid.',
      path: loaded.path,
    });
    checks.push(
      checkFile(cwd, 'paths.gtmManifest', 'GTM manifest', loaded.config.paths.gtmManifest),
      checkFile(
        cwd,
        'paths.webTrackingConfig',
        'Web tracking config',
        loaded.config.paths.webTrackingConfig,
      ),
      checkFile(
        cwd,
        'paths.webConversionsConfig',
        'Web conversions config',
        loaded.config.paths.webConversionsConfig,
      ),
      checkFile(cwd, 'paths.eventRegistry', 'Event registry', loaded.config.paths.eventRegistry),
      checkFile(
        cwd,
        'paths.conversionRegistry',
        'Conversion registry',
        loaded.config.paths.conversionRegistry,
      ),
      checkFile(cwd, 'paths.seoRoot', 'SEO docs root', loaded.config.paths.seoRoot),
      checkFile(
        cwd,
        'paths.marketingRoot',
        'Marketing docs root',
        loaded.config.paths.marketingRoot,
      ),
      checkFile(
        cwd,
        'paths.analyticsRoot',
        'Analytics docs root',
        loaded.config.paths.analyticsRoot,
      ),
      ...attributionStoreChecks(loaded.config),
      ...providerChecks(
        loaded.config,
        options.env ?? process.env,
        options.googleAuth,
        options.metaAuth,
      ),
    );
    const registryReport = await validateMarketingRegistries(loaded.config, {
      cwd,
      missingStatus: 'warn',
    });
    checks.push(...registryReport.checks);
    const env = options.env ?? process.env;
    const providers = providerSummaries(loaded.config, env, options.googleAuth, options.metaAuth);

    return {
      ok: checks.every((check) => check.status !== 'error'),
      cwd,
      configPath: loaded.path,
      appId: loaded.config.appId,
      platformId: loaded.config.platformId,
      auth: {
        google: options.googleAuth,
        meta: options.metaAuth,
      },
      providers,
      artifacts: artifactSummaries(loaded.config, cwd),
      nextWorkflowStep: resolveNextWorkflowStep({
        checks,
        providers,
        config: loaded.config,
      }),
      checks,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown marketing doctor error';
    checks.push({
      id: 'marketing.config',
      status: 'error',
      message,
    });
    return {
      ok: false,
      cwd,
      checks,
    };
  }
}
