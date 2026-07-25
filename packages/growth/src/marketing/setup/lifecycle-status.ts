import { existsSync } from 'node:fs';
import path from 'node:path';
import type { MarketingConfig } from '../schema/marketing-config.js';
import {
  marketingGoogleAuthReadyForProvider,
  type MarketingGoogleAuthProfileStatus,
} from '../auth/google.js';
import { marketingMetaAuthReady, type MarketingMetaAuthProfileStatus } from '../auth/meta.js';
import { buildMarketingRealAccountProofStatus } from '../proof/real-account-proof.js';

export type MarketingSetupStageId =
  | 'local'
  | 'deployedDomain'
  | 'providerAuth'
  | 'providerDiscovery'
  | 'proofReady';

export type MarketingSetupStageStatus = 'pass' | 'current' | 'pending' | 'blocked';

export type MarketingSetupLifecycleStage = {
  id: MarketingSetupStageId;
  status: MarketingSetupStageStatus;
  title: string;
  message: string;
  checks: Array<{ id: string; status: 'pass' | 'warn' | 'error'; message: string }>;
};

export type MarketingSetupLifecycleAction = {
  id: string;
  command?: string;
  message: string;
};

export type MarketingSetupLifecycleReport = {
  kind: 'unisane.marketing.setup-lifecycle-status';
  version: 1;
  nonMutating: true;
  generatedAt: string;
  ok: boolean;
  cwd: string;
  configPath?: string;
  appId: string;
  platformId: string;
  currentStage: MarketingSetupStageId;
  stages: MarketingSetupLifecycleStage[];
  nextActions: MarketingSetupLifecycleAction[];
};

export type MarketingSetupLifecycleOptions = {
  cwd?: string;
  configPath?: string;
  env?: Record<string, string | undefined>;
  googleAuth?: MarketingGoogleAuthProfileStatus;
  metaAuth?: MarketingMetaAuthProfileStatus;
  now?: Date;
};

const googleProviders = ['googleAds', 'ga4', 'searchConsole'] as const;

function checkPath(cwd: string, id: string, label: string, relativePath: string) {
  const absolutePath = path.resolve(cwd, relativePath);
  const exists = existsSync(absolutePath);
  return {
    id,
    status: exists ? ('pass' as const) : ('warn' as const),
    message: exists ? `${label} exists.` : `${label} is missing at ${relativePath}.`,
  };
}

function publicBaseUrl(config: MarketingConfig): string | undefined {
  return config.environments[config.defaultEnvironment]?.publicBaseUrl;
}

function isDeployablePublicUrl(value: string | undefined): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return false;
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return false;
    if (url.hostname.endsWith('.example.com') || url.hostname === 'example.com') return false;
    return true;
  } catch {
    return false;
  }
}

function requiredGoogleProviderIds(
  config: MarketingConfig,
): Array<(typeof googleProviders)[number]> {
  return googleProviders.filter((provider) => config.providers[provider].state === 'configured');
}

function envSet(env: Record<string, string | undefined>, name: string | undefined): boolean {
  return Boolean(name && env[name]?.trim());
}

function requiredIdentifierChecks(
  config: MarketingConfig,
  env: Record<string, string | undefined>,
): Array<{ id: string; status: 'pass' | 'warn' | 'error'; message: string }> {
  const refs = [
    [
      'googleAds.customer',
      config.providers.googleAds.state,
      config.providers.googleAds.accountIdEnv,
    ],
    [
      'googleAds.developerToken',
      config.providers.googleAds.state,
      config.providers.googleAds.developerTokenEnv,
    ],
    ['ga4.property', config.providers.ga4.state, config.providers.ga4.accountIdEnv],
    [
      'searchConsole.site',
      config.providers.searchConsole.state,
      config.providers.searchConsole.accountIdEnv,
    ],
    ['metaAds.account', config.providers.metaAds.state, config.providers.metaAds.accountIdEnv],
    ['metaAds.pixel', config.providers.metaAds.state, config.providers.metaAds.pixelIdEnv],
  ] as const;
  return refs
    .filter(([, state]) => state !== 'disabled')
    .map(([id, state, name]) => {
      if (!name) {
        return {
          id,
          status: state === 'configured' ? ('error' as const) : ('warn' as const),
          message: `${id} env ref is not declared in marketing config.`,
        };
      }
      const isSet = envSet(env, name);
      return {
        id,
        status: isSet
          ? ('pass' as const)
          : state === 'configured'
            ? ('error' as const)
            : ('warn' as const),
        message: isSet ? `${name} is set.` : `${name} is not set.`,
      };
    });
}

function stageStatus(
  passed: boolean,
  previousPassed: boolean,
  previousBlocked: boolean,
): MarketingSetupStageStatus {
  if (passed) return 'pass';
  if (previousBlocked) return 'blocked';
  return previousPassed ? 'current' : 'pending';
}

function hasBlockingCheck(stage: MarketingSetupLifecycleStage): boolean {
  return stage.checks.some((check) => check.status === 'error');
}

function firstActiveStage(stages: MarketingSetupLifecycleStage[]): MarketingSetupStageId {
  return (
    stages.find((stage) => stage.status === 'current' || stage.status === 'blocked')?.id ??
    'proofReady'
  );
}

function nextActionsFor(
  stage: MarketingSetupLifecycleStage,
  input: {
    config: MarketingConfig;
    googleAuth?: MarketingGoogleAuthProfileStatus;
    metaAuth?: MarketingMetaAuthProfileStatus;
  },
): MarketingSetupLifecycleAction[] {
  if (stage.id === 'local') {
    return [
      {
        id: 'local.docs',
        command: 'unisane growth marketing validate',
        message: 'Fix missing local marketing registries/config files, then rerun setup status.',
      },
    ];
  }
  if (stage.id === 'deployedDomain') {
    return [
      {
        id: 'deploy.domain',
        message:
          'Deploy the app and set a real HTTPS publicBaseUrl/domain before connecting production provider properties.',
      },
    ];
  }
  if (stage.id === 'providerAuth') {
    const actions: MarketingSetupLifecycleAction[] = [];
    const requiredGoogleProviders = requiredGoogleProviderIds(input.config);
    if (
      requiredGoogleProviders.length > 0 &&
      !requiredGoogleProviders.every((provider) =>
        marketingGoogleAuthReadyForProvider(input.googleAuth, provider),
      )
    ) {
      actions.push({
        id: 'google.auth',
        command: `unisane growth marketing auth login --profile ${input.googleAuth?.profile ?? '<name>'}`,
        message: 'Connect Google once for Google Ads, GA4, and Search Console read-only setup.',
      });
    }
    if (
      input.config.providers.metaAds.state === 'configured' &&
      !marketingMetaAuthReady(input.metaAuth)
    ) {
      actions.push({
        id: 'meta.auth',
        command: `unisane growth marketing auth meta save --profile ${input.metaAuth?.profile ?? '<name>'}`,
        message:
          'Save a read-only Meta token profile once the Meta access token is available locally; keep raw token env as the one-time input or fallback lane.',
      });
    }
    return actions;
  }
  if (stage.id === 'providerDiscovery') {
    return [
      {
        id: 'google.products.inventory',
        command: `unisane provider google products inventory --auth-namespace marketing --profile ${input.googleAuth?.profile ?? '<name>'} --output .unisane/google/inventory/products/latest.json`,
        message:
          'Inventory accessible GTM, GA4, Search Console, and Google Ads resources, then set the selected identifiers in marketing config/env.',
      },
      {
        id: 'meta.ads.inventory',
        command: `unisane provider meta ads inventory --profile ${input.metaAuth?.profile ?? '<name>'} --output .unisane/meta/inventory/ads/latest.json`,
        message:
          'Inventory accessible Meta ad accounts and pixels, then set the selected identifiers in marketing config/env.',
      },
    ];
  }
  if (stage.status === 'pass') {
    return [
      {
        id: 'schedule.consider',
        message:
          'Real-account proof is complete; scheduled read-only pulls can be considered with provider limits documented.',
      },
    ];
  }
  return [
    {
      id: 'proof.status',
      command:
        'unisane growth marketing proof status --limits docs/marketing/real-account-proof-limits.json --out .unisane/marketing/proof/status.json',
      message: 'Run real-account proof after narrow read-only provider pulls exist.',
    },
  ];
}

export function buildMarketingSetupLifecycleStatus(
  config: MarketingConfig,
  options: MarketingSetupLifecycleOptions = {},
): MarketingSetupLifecycleReport {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const env = options.env ?? process.env;
  const generatedAt = (options.now ?? new Date()).toISOString();

  const localChecks = [
    checkPath(cwd, 'paths.eventRegistry', 'Event registry', config.paths.eventRegistry),
    checkPath(
      cwd,
      'paths.conversionRegistry',
      'Conversion registry',
      config.paths.conversionRegistry,
    ),
    checkPath(cwd, 'paths.gtmManifest', 'GTM manifest', config.paths.gtmManifest),
  ];
  const localPassed = localChecks.every((check) => check.status === 'pass');

  const url = publicBaseUrl(config);
  const deployedDomainPassed = isDeployablePublicUrl(url);
  const deployedChecks = [
    {
      id: 'publicBaseUrl',
      status: deployedDomainPassed ? ('pass' as const) : ('error' as const),
      message: deployedDomainPassed
        ? `${url} is a deployable HTTPS public URL.`
        : `${url ?? 'publicBaseUrl'} is not a deployed HTTPS production domain yet.`,
    },
  ];

  const requiredGoogleProviders = requiredGoogleProviderIds(config);
  const googleAuthPassed = requiredGoogleProviders.every((provider) =>
    marketingGoogleAuthReadyForProvider(options.googleAuth, provider),
  );
  const metaAuthPassed =
    config.providers.metaAds.state !== 'configured' || marketingMetaAuthReady(options.metaAuth);
  const authChecks = [
    {
      id: 'google.auth',
      status: googleAuthPassed ? ('pass' as const) : ('error' as const),
      message: googleAuthPassed
        ? requiredGoogleProviders.length > 0
          ? `Google auth profile ${options.googleAuth?.profile} is ready.`
          : 'No Google provider is required for this phase yet.'
        : 'Google auth profile is not ready for all configured Google providers.',
    },
    {
      id: 'meta.auth',
      status: metaAuthPassed ? ('pass' as const) : ('error' as const),
      message: metaAuthPassed
        ? `Meta auth profile ${options.metaAuth?.profile ?? 'disabled'} is ready.`
        : 'Meta auth profile is not ready.',
    },
  ];

  const identifierChecks = requiredIdentifierChecks(config, env);
  const discoveryPassed = identifierChecks.every((check) => check.status !== 'error');

  const proof = buildMarketingRealAccountProofStatus(config, {
    cwd,
    env,
    googleAuth: options.googleAuth,
    metaAuth: options.metaAuth,
    now: options.now,
  });
  const proofPassed = proof.readyForScheduledPulls;
  const proofChecks = [
    {
      id: 'proof.ready',
      status: proofPassed ? ('pass' as const) : ('error' as const),
      message: proofPassed
        ? 'Real-account proof is ready for scheduled pull consideration.'
        : proof.nextWorkflowStep,
    },
  ];

  const stageSpecs = [
    {
      id: 'local' as const,
      title: 'Local Marketing Pack',
      passed: localPassed,
      checks: localChecks,
      message: localPassed
        ? 'Local marketing config and registries are present.'
        : 'Complete local marketing files first.',
    },
    {
      id: 'deployedDomain' as const,
      title: 'Deployed Domain',
      passed: deployedDomainPassed,
      checks: deployedChecks,
      message: deployedDomainPassed
        ? 'A deployable public URL is configured.'
        : 'Deploy the app and set the real public URL/domain.',
    },
    {
      id: 'providerAuth' as const,
      title: 'Provider Login',
      passed: googleAuthPassed && metaAuthPassed,
      checks: authChecks,
      message:
        googleAuthPassed && metaAuthPassed
          ? 'Provider auth profiles are ready.'
          : 'Connect provider login profiles.',
    },
    {
      id: 'providerDiscovery' as const,
      title: 'Provider Discovery',
      passed: discoveryPassed,
      checks: identifierChecks,
      message: discoveryPassed
        ? 'Provider identifiers are configured.'
        : 'Discover and set provider account/property identifiers.',
    },
    {
      id: 'proofReady' as const,
      title: 'Provider Proof',
      passed: proofPassed,
      checks: proofChecks,
      message: proofPassed
        ? 'Proof is ready.'
        : 'Run narrow read-only pulls and proof status before scheduling.',
    },
  ];

  let previousPassed = true;
  let previousBlocked = false;
  const stages = stageSpecs.map((spec) => {
    const stage: MarketingSetupLifecycleStage = {
      id: spec.id,
      title: spec.title,
      status: stageStatus(spec.passed, previousPassed, previousBlocked),
      message: spec.message,
      checks: spec.checks,
    };
    previousPassed = previousPassed && spec.passed;
    previousBlocked = previousBlocked || (stage.status === 'current' && hasBlockingCheck(stage));
    return stage;
  });
  const currentStage = firstActiveStage(stages);
  const activeStage = stages.find((stage) => stage.id === currentStage) ?? stages.at(-1);
  if (!activeStage) throw new Error('[MARKETING_SETUP_LIFECYCLE_EMPTY] No setup stages available.');
  return {
    kind: 'unisane.marketing.setup-lifecycle-status',
    version: 1,
    nonMutating: true,
    generatedAt,
    ok: stages.every((stage) => stage.status === 'pass'),
    cwd,
    configPath: options.configPath,
    appId: config.appId,
    platformId: config.platformId,
    currentStage,
    stages,
    nextActions: nextActionsFor(activeStage, {
      config,
      googleAuth: options.googleAuth,
      metaAuth: options.metaAuth,
    }),
  };
}
