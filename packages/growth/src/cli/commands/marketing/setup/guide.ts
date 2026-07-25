import { existsSync } from 'node:fs';
import path from 'node:path';
import { log } from '../../../log.js';
import {
  loadMarketingConfig,
  marketingGoogleAuthReadyForProvider,
  marketingMetaAuthReady,
  type MarketingConfig,
  type MarketingGoogleAuthProfileStatus,
  type MarketingMetaAuthProfileStatus,
} from '@unisane/growth/marketing';
import { getMarketingGoogleAuthStatus } from '../auth/google.js';
import { getMarketingMetaAuthStatus } from '../auth/meta.js';
import type { MarketingCliOptions } from '../options.js';
import { resolveMarketingGoogleProfile, resolveMarketingMetaProfile } from '../profile-defaults.js';

type MarketingSetupAction = {
  id: string;
  title: string;
  command?: string;
  details: string[];
};

type MarketingSetupGuideReport = {
  ok: boolean;
  cwd: string;
  configPath: string;
  appId: string;
  platformId: string;
  authProfile: string;
  googleAuthConfigured: boolean;
  metaAuthConfigured: boolean;
  nextActions: MarketingSetupAction[];
  queuedActionCount: number;
};

function configuredGoogleProviders(
  config: MarketingConfig,
): Array<'googleAds' | 'ga4' | 'searchConsole'> {
  return (['googleAds', 'ga4', 'searchConsole'] as const).filter(
    (provider) => config.providers[provider].state !== 'disabled',
  );
}

function missingEnvNames(
  env: Record<string, string | undefined>,
  names: Array<string | undefined>,
): string[] {
  return names.filter((name): name is string => Boolean(name && !env[name]));
}

function buildSetupActions(input: {
  config: MarketingConfig;
  cwd: string;
  env: Record<string, string | undefined>;
  googleAuth: MarketingGoogleAuthProfileStatus;
  metaAuth: MarketingMetaAuthProfileStatus;
}): MarketingSetupAction[] {
  const actions: MarketingSetupAction[] = [];
  const googleProviders = configuredGoogleProviders(input.config);
  const googleAuthReady = googleProviders.every((provider) =>
    marketingGoogleAuthReadyForProvider(input.googleAuth, provider),
  );
  if (googleProviders.length > 0 && !googleAuthReady) {
    actions.push({
      id: 'google.auth.login',
      title: 'Connect Google once',
      command: `unisane growth marketing auth login --profile ${input.googleAuth.profile}`,
      details: [
        'Covers Google Ads, GA4, and Search Console read-only pulls from one saved profile.',
      ],
    });
  }

  const googleEnvNames = missingEnvNames(input.env, [
    input.config.providers.googleAds.accountIdEnv,
    input.config.providers.googleAds.developerTokenEnv,
    input.config.providers.ga4.accountIdEnv,
    input.config.providers.searchConsole.accountIdEnv,
  ]);
  if (googleEnvNames.length > 0) {
    actions.push({
      id: 'google.products.inventory',
      title: 'Inventory Google product identifiers',
      command: `unisane provider google products inventory --auth-namespace marketing --profile ${input.googleAuth.profile} --output .unisane/google/inventory/products/latest.json`,
      details: [
        'Use the saved Marketing Google profile to discover accessible GTM, GA4, Search Console, and Google Ads resources.',
        ...googleEnvNames.map(
          (name) => `Set ${name} after selecting the correct discovered resource.`,
        ),
        ...(input.config.providers.googleAds.loginCustomerIdEnv &&
        !input.env[input.config.providers.googleAds.loginCustomerIdEnv]
          ? [
              `Set ${input.config.providers.googleAds.loginCustomerIdEnv} only if Google Ads access goes through a manager account.`,
            ]
          : []),
      ],
    });
  }

  const meta = input.config.providers.metaAds;
  if (meta.state !== 'disabled') {
    const metaAccessTokenSet =
      Boolean(meta.accessTokenEnv && input.env[meta.accessTokenEnv]) ||
      marketingMetaAuthReady(input.metaAuth);
    const missingMeta = missingEnvNames(input.env, [
      meta.accountIdEnv,
      meta.pixelIdEnv,
      meta.datasetIdEnv,
      meta.pageIdEnv,
      meta.instagramActorIdEnv,
      marketingMetaAuthReady(input.metaAuth) ? undefined : meta.accessTokenEnv,
    ]);
    if (missingMeta.length > 0) {
      actions.push({
        id: 'meta.ads.inventory',
        title: 'Inventory Meta ad identifiers',
        command: metaAccessTokenSet
          ? `unisane provider meta ads inventory --profile ${input.metaAuth.profile} --output .unisane/meta/inventory/ads/latest.json`
          : undefined,
        details: metaAccessTokenSet
          ? [
              'Use the saved Meta profile to discover accessible ad accounts and pixels.',
              ...missingMeta.map(
                (name) =>
                  `Set ${name} after selecting the correct discovered resource or explicit review.`,
              ),
            ]
          : missingMeta.map((name) => `Set ${name} after Meta Business/App permissions are ready.`),
      });
    }
  }

  const proofLimitsPath = path.join(
    input.cwd,
    'docs',
    'marketing',
    'real-account-proof-limits.json',
  );
  if (!existsSync(proofLimitsPath)) {
    actions.push({
      id: 'proof.setup',
      title: 'Create the proof checklist',
      command: 'unisane growth marketing proof setup',
      details: ['Creates the local provider scopes/rate-limit checklist without storing secrets.'],
    });
  }

  if (actions.length === 0) {
    actions.push({
      id: 'proof.status',
      title: 'Run proof status',
      command: `unisane growth marketing proof status --limits docs/marketing/real-account-proof-limits.json --out .unisane/marketing/proof/status.json --auth-profile ${input.googleAuth.profile}`,
      details: [
        'Checks provider report freshness, scoped access records, and the next workflow step.',
      ],
    });
  }

  return actions;
}

function printSetupGuide(report: MarketingSetupGuideReport): void {
  log.section('Marketing Setup Guide');
  log.info(`App: ${report.appId}`);
  log.info(`Platform: ${report.platformId}`);
  log.info(
    `Google auth: ${report.googleAuthConfigured ? 'configured' : 'not-configured'} (${report.authProfile})`,
  );
  log.info(`Meta auth: ${report.metaAuthConfigured ? 'configured' : 'not-configured'}`);
  for (const action of report.nextActions) {
    log.info(action.title);
    if (action.command) log.dim(`  ${action.command}`);
    for (const detail of action.details) log.dim(`  ${detail}`);
  }
  if (report.queuedActionCount > report.nextActions.length) {
    log.dim(`More actions queued after these ${report.nextActions.length}.`);
  }
}

function printJson(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}

export async function marketingSetupGuide(options: MarketingCliOptions): Promise<number> {
  try {
    const loaded = await loadMarketingConfig({
      cwd: options.cwd,
      configPath: options.config,
    });
    const cwd = path.resolve(options.cwd ?? process.cwd());
    const googleAuth = await getMarketingGoogleAuthStatus({
      profile: resolveMarketingGoogleProfile(loaded.config, options),
    });
    const metaAuth = await getMarketingMetaAuthStatus({
      profile: resolveMarketingMetaProfile(loaded.config, options),
    });
    const actions = buildSetupActions({
      config: loaded.config,
      cwd,
      env: process.env,
      googleAuth,
      metaAuth,
    });
    const report: MarketingSetupGuideReport = {
      ok: true,
      cwd,
      configPath: loaded.path,
      appId: loaded.config.appId,
      platformId: loaded.config.platformId,
      authProfile: googleAuth.profile,
      googleAuthConfigured: googleAuth.configured,
      metaAuthConfigured: metaAuth.configured,
      nextActions: actions.slice(0, 3),
      queuedActionCount: actions.length,
    };
    if (options.json) printJson(report);
    else printSetupGuide(report);
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown marketing setup guide error';
    if (options.json) printJson({ ok: false, error: message });
    else console.error(message);
    return 1;
  }
}
