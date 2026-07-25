import path from 'node:path';
import { publicControlPlaneEnvEntry, type ControlPlaneSetupStatus } from '@unisane/ops-engine';
import { loadMarketingConfig } from '@unisane/growth/marketing';
import {
  getMarketingMetaAuthStatus,
  marketingMetaAuthEnvEntries,
  marketingMetaAuthStatusToControlPlaneProfile,
} from '../../../meta/auth.js';
import { resolveMarketingMetaProfile } from '../../profile.js';
import { metaAuthRuntimeFromOptions } from '../shared/runtime.js';
import type { MetaProviderCliOptions, MetaProviderSetupStatusReport } from '../shared/types.js';

export async function buildMetaSetupStatus(
  options: MetaProviderCliOptions,
  deps?: { env?: Record<string, string | undefined> },
): Promise<MetaProviderSetupStatusReport> {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const loaded = await loadMarketingConfig({ cwd, configPath: options.config });
  const appId = options.app?.trim() || loaded.config.appId;
  const environment = options.env ?? loaded.config.defaultEnvironment;
  const profile = options.profile ?? resolveMarketingMetaProfile(loaded.config, {});
  const authStatus = await getMarketingMetaAuthStatus({
    profile,
    runtime: metaAuthRuntimeFromOptions(options),
  });
  const authProfile = marketingMetaAuthStatusToControlPlaneProfile({ status: authStatus });
  const provider = loaded.config.providers.metaAds;
  const env = deps?.env ?? process.env;
  const entries = [
    ...marketingMetaAuthEnvEntries({ env }),
    ...(provider.accountIdEnv
      ? [
          publicControlPlaneEnvEntry({
            name: provider.accountIdEnv,
            kind: 'provider-resource-ref',
            required: provider.state === 'configured',
            secret: false,
            value: env[provider.accountIdEnv],
            description: 'Meta ad account id used by ads reporting, planning, and inventory.',
            example: '<meta-ad-account-id>',
          }),
        ]
      : []),
    ...(provider.pixelIdEnv
      ? [
          publicControlPlaneEnvEntry({
            name: provider.pixelIdEnv,
            kind: 'provider-resource-ref',
            required: false,
            secret: false,
            value: env[provider.pixelIdEnv],
            description: 'Meta Pixel id used for conversion tracking proof.',
            example: '<meta-pixel-id>',
          }),
        ]
      : []),
  ];
  const checks: ControlPlaneSetupStatus['checks'] = [
    {
      id: 'meta.config',
      status: provider.state === 'disabled' ? 'warn' : 'pass',
      title: 'Meta provider config',
      message:
        provider.state === 'disabled'
          ? 'Meta Ads provider is disabled in marketing config.'
          : `Meta Ads provider is ${provider.state}.`,
    },
    {
      id: 'meta.auth',
      status: authProfile.status === 'ready' ? 'pass' : 'fail',
      title: 'Meta token profile',
      message:
        authProfile.status === 'ready'
          ? `Profile ${authProfile.profile} has a stored token.`
          : 'Save a Meta token profile before inventory or ads workflows can run.',
    },
    {
      id: 'meta.review',
      status: 'blocked',
      title: 'Provider-side permissions',
      message:
        'Meta app review, business access, billing, and policy restrictions remain provider-side blockers.',
    },
  ];
  const nextActions: ControlPlaneSetupStatus['nextActions'] = [];
  if (authProfile.status !== 'ready') {
    nextActions.push({
      id: 'meta.auth.save',
      owner: 'developer',
      title: 'Save Meta token profile',
      message:
        'Set a Meta access token env locally once, then let Codex save it into the secret store.',
      command: `unisane provider meta auth save --profile ${profile}`,
      risk: 'none',
    });
  } else {
    nextActions.push({
      id: 'meta.ads.inventory',
      owner: 'codex',
      title: 'Inventory Meta ads resources',
      message: 'Read accessible ad accounts and pixels without mutation.',
      command: `unisane provider meta ads inventory --profile ${profile}`,
      risk: 'none',
    });
  }
  nextActions.push({
    id: 'meta.provider.review',
    owner: 'provider',
    title: 'Review provider-side access',
    message:
      'Use Meta Business surfaces for app review, token permissions, business access, and policy issues.',
    command: null,
    risk: 'blocked',
  });
  const generatedAt = new Date().toISOString();
  return {
    schemaVersion: 1,
    kind: 'meta.setup-status',
    provider: 'meta',
    appId,
    environment,
    generatedAt,
    authProfile,
    envReport: {
      schemaVersion: 1,
      kind: 'control-plane.env-report',
      provider: 'meta',
      appId,
      environment,
      generatedAt,
      entries,
    },
    setupStatus: {
      schemaVersion: 1,
      kind: 'control-plane.setup-status',
      provider: 'meta',
      appId,
      environment,
      generatedAt,
      ready: checks
        .filter((check) => check.id !== 'meta.review')
        .every((check) => check.status === 'pass' || check.status === 'warn'),
      checks,
      nextActions,
    },
  };
}
