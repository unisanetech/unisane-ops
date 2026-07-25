import { log } from '../../../log.js';
import {
  loadMarketingConfig,
  writeMarketingMetaDiscovery,
  type MarketingMetaDiscoveryReport,
} from '@unisane/growth/marketing';
import { discoverMarketingMetaAccounts } from '../../../provider-adapters.js';
import { resolveMarketingMetaAccessToken } from '../auth/meta.js';
import type { MarketingCliOptions } from '../options.js';
import { resolveMarketingMetaProfile } from '../profile-defaults.js';

function printJson(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}

function printDiscovery(report: MarketingMetaDiscoveryReport & { path?: string }): void {
  log.section('Marketing Meta Discovery');
  if (report.path) log.info(`Artifact: ${report.path}`);
  log.info(`Ad accounts: ${report.adAccounts.message}`);
  log.info(`Pixels: ${report.pixels.message}`);
  for (const action of report.nextActions) {
    log.info(`Next: ${action.message}`);
  }
}

function optionalNumber(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return fallback;
}

export async function marketingSetupDiscoverMeta(options: MarketingCliOptions): Promise<number> {
  try {
    const loaded = await loadMarketingConfig({
      cwd: options.cwd,
      configPath: options.config,
    });
    const provider = loaded.config.providers.metaAds;
    if (provider.state === 'disabled') {
      throw new Error('[MARKETING_META_DISCOVERY_DISABLED] Meta Ads provider is disabled.');
    }
    const accessToken = await resolveMarketingMetaAccessToken({
      accessTokenEnv: provider.accessTokenEnv,
      authProfile: resolveMarketingMetaProfile(loaded.config, options),
    });
    const accountId =
      options.accountId ?? (provider.accountIdEnv ? process.env[provider.accountIdEnv] : undefined);
    const report = await writeMarketingMetaDiscovery(loaded.config, {
      driver: discoverMarketingMetaAccounts,
      cwd: options.cwd,
      out: options.out,
      accessToken,
      accountId,
      apiVersion: options.apiVersion,
      maxPages: optionalNumber(options.maxPages, 10),
      pageSize: optionalNumber(options.pageSize, 100),
    });
    if (options.json) printJson(report);
    else printDiscovery(report);
    return report.ok ? 0 : 1;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Meta discovery error';
    if (options.json) printJson({ ok: false, error: message });
    else console.error(message);
    return 1;
  }
}
