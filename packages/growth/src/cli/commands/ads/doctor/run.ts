import {
  buildMarketingAdsStatusReport,
  loadMarketingConfig,
  type MarketingConfig,
  marketingProviderReportTypeSchema,
  type MarketingAdsStatusReport,
} from '@unisane/growth/marketing';
import {
  isControlPlaneSecretName,
  publicControlPlaneEnvEntry,
  type ControlPlaneEnvEntry,
  type ControlPlaneEnvReport,
} from '@unisane/ops-engine';
import { marketingGoogleAuthEnvEntries } from '../../marketing/auth/google.js';
import { marketingMetaAuthEnvEntries } from '../../marketing/auth/meta.js';
import type { AdsCliOptions } from '../options.js';
import { printAdsStatusReport } from '../output/status.js';

type AdsStatusReportWithControlPlane = MarketingAdsStatusReport & {
  controlPlane: {
    envReport: ControlPlaneEnvReport;
  };
};

function parseMaxAgeDays(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error('[ADS_MAX_AGE_INVALID] --max-age-days must be a non-negative integer.');
  }
  return parsed;
}

function providerRefEntry(args: {
  name: string | undefined;
  env: Record<string, string | undefined>;
  required: boolean;
  description: string;
}): ControlPlaneEnvEntry[] {
  if (!args.name) return [];
  return [
    publicControlPlaneEnvEntry({
      name: args.name,
      kind: 'provider-resource-ref',
      required: args.required,
      secret: isControlPlaneSecretName(args.name),
      value: args.env[args.name],
      description: args.description,
      example: isControlPlaneSecretName(args.name) ? '<SECRET>' : `<${args.name.toLowerCase()}>`,
    }),
  ];
}

function buildAdsControlPlaneReport(args: {
  config: MarketingConfig;
  report: MarketingAdsStatusReport;
  env: Record<string, string | undefined>;
}): AdsStatusReportWithControlPlane {
  const entries = [
    ...providerRefEntry({
      name: args.config.providers.googleAds.accountIdEnv,
      env: args.env,
      required: args.config.providers.googleAds.state === 'configured',
      description: 'Google Ads customer id used by ads reports and planning.',
    }),
    ...providerRefEntry({
      name: args.config.providers.googleAds.loginCustomerIdEnv,
      env: args.env,
      required: false,
      description: 'Optional Google Ads manager account login customer id.',
    }),
    ...providerRefEntry({
      name: args.config.providers.googleAds.developerTokenEnv,
      env: args.env,
      required: args.config.providers.googleAds.state === 'configured',
      description: 'Google Ads developer token required by the Google Ads API.',
    }),
    ...providerRefEntry({
      name: args.config.providers.metaAds.accountIdEnv,
      env: args.env,
      required: args.config.providers.metaAds.state === 'configured',
      description: 'Meta ad account id used by ads reports and planning.',
    }),
    ...providerRefEntry({
      name: args.config.providers.metaAds.pageIdEnv,
      env: args.env,
      required: false,
      description: 'Meta Page actor id used for creative creation.',
    }),
    ...providerRefEntry({
      name: args.config.providers.metaAds.instagramActorIdEnv,
      env: args.env,
      required: false,
      description: 'Instagram actor id used for Instagram placements.',
    }),
    ...providerRefEntry({
      name: args.config.providers.metaAds.pixelIdEnv,
      env: args.env,
      required: false,
      description: 'Meta Pixel id used for paid conversion tracking proof.',
    }),
    ...marketingGoogleAuthEnvEntries({ env: args.env }),
    ...marketingMetaAuthEnvEntries({ env: args.env }),
  ];
  return {
    ...args.report,
    controlPlane: {
      envReport: {
        schemaVersion: 1,
        kind: 'control-plane.env-report',
        provider: 'ads',
        appId: args.report.appId,
        environment: args.report.defaultEnvironment,
        generatedAt: new Date().toISOString(),
        entries,
      },
    },
  };
}

export async function adsDoctor(options: AdsCliOptions): Promise<number> {
  try {
    const loaded = await loadMarketingConfig({
      cwd: options.cwd,
      configPath: options.config,
    });
    const env = process.env;
    const report = await buildMarketingAdsStatusReport(loaded.config, {
      cwd: options.cwd,
      configPath: loaded.path,
      env,
      maxAgeDays: parseMaxAgeDays(options.maxAgeDays),
      reportType: options.report
        ? marketingProviderReportTypeSchema.parse(options.report)
        : undefined,
    });
    const output = buildAdsControlPlaneReport({ config: loaded.config, report, env });
    printAdsStatusReport(output, { json: options.json });
    return output.ok ? 0 : 1;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown ads doctor error';
    if (options.json) console.log(JSON.stringify({ ok: false, error: message }, null, 2));
    else console.error(message);
    return 1;
  }
}
