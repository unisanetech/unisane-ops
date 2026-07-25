import { log } from '../../../log.js';
import type {
  ControlPlaneAuthProfile,
  ControlPlaneEnvReport,
  ControlPlaneSetupStatus,
} from '@unisane/ops-engine';
import {
  buildMarketingSetupLifecycleStatus,
  loadMarketingConfig,
  MARKETING_GOOGLE_AUTH_SCOPES,
  type MarketingSetupLifecycleReport,
} from '@unisane/growth/marketing';
import {
  getMarketingGoogleAuthStatus,
  marketingGoogleAuthEnvEntries,
  marketingGoogleAuthStatusToControlPlaneProfile,
} from '../auth/google.js';
import {
  getMarketingMetaAuthStatus,
  marketingMetaAuthEnvEntries,
  marketingMetaAuthStatusToControlPlaneProfile,
} from '../auth/meta.js';
import type { MarketingCliOptions } from '../options.js';
import { resolveMarketingGoogleProfile, resolveMarketingMetaProfile } from '../profile-defaults.js';

function printJson(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}

export type MarketingSetupLifecycleReportWithControlPlane = MarketingSetupLifecycleReport & {
  controlPlane: {
    authProfiles: ControlPlaneAuthProfile[];
    envReport: ControlPlaneEnvReport;
    providerSetupStatuses: ControlPlaneSetupStatus[];
  };
};

function printSetupStatus(report: MarketingSetupLifecycleReportWithControlPlane): void {
  log.section('Marketing Setup Status');
  log.info(`App: ${report.appId}`);
  log.info(`Platform: ${report.platformId}`);
  log.info(`Current stage: ${report.currentStage}`);
  for (const profile of report.controlPlane.authProfiles) {
    log.info(`Auth ${profile.provider}: ${profile.status} (${profile.profile})`);
  }
  for (const provider of report.controlPlane.providerSetupStatuses) {
    log.info(`Provider ${provider.provider}: ${provider.ready ? 'ready' : 'needs setup'}`);
    for (const action of provider.nextActions.slice(0, 2)) {
      log.dim(`  Next ${provider.provider}: ${action.message}`);
    }
  }
  for (const stage of report.stages) {
    log.info(`${stage.status}: ${stage.title}`);
    log.dim(`  ${stage.message}`);
    for (const check of stage.checks) {
      log.dim(`  ${check.status}: ${check.message}`);
    }
  }
  for (const action of report.nextActions) {
    log.info(`Next: ${action.message}`);
    if (action.command) log.dim(`  ${action.command}`);
  }
}

function buildControlPlaneSetupReport(args: {
  report: MarketingSetupLifecycleReport;
  googleAuth: Awaited<ReturnType<typeof getMarketingGoogleAuthStatus>>;
  metaAuth: Awaited<ReturnType<typeof getMarketingMetaAuthStatus>>;
  providerSetupStatuses: ControlPlaneSetupStatus[];
  env: Record<string, string | undefined>;
}): MarketingSetupLifecycleReportWithControlPlane {
  return {
    ...args.report,
    controlPlane: {
      authProfiles: [
        marketingGoogleAuthStatusToControlPlaneProfile({
          status: args.googleAuth,
          requiredScopes: MARKETING_GOOGLE_AUTH_SCOPES,
        }),
        marketingMetaAuthStatusToControlPlaneProfile({
          status: args.metaAuth,
          requiredScopes: ['ads_read'],
        }),
      ],
      envReport: {
        schemaVersion: 1,
        kind: 'control-plane.env-report',
        provider: 'marketing',
        appId: args.report.appId,
        environment: 'default',
        generatedAt: args.report.generatedAt,
        entries: [
          ...marketingGoogleAuthEnvEntries({ env: args.env }),
          ...marketingMetaAuthEnvEntries({ env: args.env }),
        ],
      },
      providerSetupStatuses: args.providerSetupStatuses,
    },
  };
}

export async function buildMarketingSetupStatusReport(
  options: MarketingCliOptions,
  deps: { env?: Record<string, string | undefined> } = {},
): Promise<MarketingSetupLifecycleReportWithControlPlane> {
  const loaded = await loadMarketingConfig({
    cwd: options.cwd,
    configPath: options.config,
  });
  const googleProfile = resolveMarketingGoogleProfile(loaded.config, options);
  const metaProfile = resolveMarketingMetaProfile(loaded.config, options);
  const env = deps.env ?? process.env;
  const googleAuth = await getMarketingGoogleAuthStatus({
    profile: googleProfile,
  });
  const metaAuth = await getMarketingMetaAuthStatus({
    profile: metaProfile,
  });
  const providerSetupStatus = (
    provider: 'google' | 'meta',
    ready: boolean,
    message: string,
  ): ControlPlaneSetupStatus => ({
    schemaVersion: 1,
    kind: 'control-plane.setup-status',
    provider,
    appId: loaded.config.appId,
    environment: loaded.config.defaultEnvironment,
    generatedAt: new Date().toISOString(),
    ready,
    checks: [
      {
        id: `${provider}.auth`,
        status: ready ? 'pass' : 'fail',
        title: `${provider === 'google' ? 'Google' : 'Meta'} auth profile`,
        message,
      },
    ],
    nextActions: ready
      ? []
      : [
          {
            id: `${provider}.auth.configure`,
            owner: 'developer',
            title: `Configure ${provider === 'google' ? 'Google' : 'Meta'} auth`,
            message: `Save the ${provider} credential profile before provider-backed Growth commands run.`,
            command:
              provider === 'google'
                ? `unisane growth marketing auth login --profile ${googleProfile}`
                : `unisane growth marketing auth meta save --profile ${metaProfile}`,
            risk: 'none',
          },
        ],
  });
  const googleSetup = {
    setupStatus: providerSetupStatus(
      'google',
      googleAuth.configured && googleAuth.refreshTokenStored,
      googleAuth.configured
        ? 'Google profile metadata and refresh token were found.'
        : 'Google auth profile is not configured.',
    ),
  };
  const metaSetup = {
    setupStatus: providerSetupStatus(
      'meta',
      metaAuth.configured && metaAuth.accessTokenStored,
      metaAuth.configured
        ? 'Meta profile metadata and access token were found.'
        : 'Meta auth profile is not configured.',
    ),
  };
  const report = buildMarketingSetupLifecycleStatus(loaded.config, {
    cwd: options.cwd,
    configPath: loaded.path,
    env,
    googleAuth,
    metaAuth,
  });
  return buildControlPlaneSetupReport({
    report,
    googleAuth,
    metaAuth,
    providerSetupStatuses: [googleSetup.setupStatus, metaSetup.setupStatus],
    env,
  });
}

export async function marketingSetupStatus(options: MarketingCliOptions): Promise<number> {
  try {
    const controlPlaneReport = await buildMarketingSetupStatusReport(options);
    if (options.json) printJson(controlPlaneReport);
    else printSetupStatus(controlPlaneReport);
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown marketing setup status error';
    if (options.json) printJson({ ok: false, error: message });
    else console.error(message);
    return 1;
  }
}
