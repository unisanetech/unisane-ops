import { log } from '../../../log.js';
import {
  loadMarketingConfig,
  MARKETING_GOOGLE_ADS_SCOPE,
  MARKETING_GOOGLE_ANALYTICS_SCOPE,
  MARKETING_GOOGLE_SEARCH_CONSOLE_SCOPE,
  marketingGoogleAuthReadyForProvider,
  writeMarketingGoogleDiscovery,
  type MarketingGoogleDiscoveryReport,
} from '@unisane/growth/marketing';
import { discoverMarketingGoogleAccounts } from '../../../provider-adapters.js';
import { getMarketingGoogleAuthStatus, resolveMarketingGoogleAccessToken } from '../auth/google.js';
import type { MarketingCliOptions } from '../options.js';
import { resolveMarketingGoogleProfile } from '../profile-defaults.js';

function printJson(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}

function printDiscovery(report: MarketingGoogleDiscoveryReport & { path?: string }): void {
  log.section('Marketing Google Discovery');
  if (report.path) log.info(`Artifact: ${report.path}`);
  log.info(`Google Ads: ${report.googleAds.message}`);
  log.info(`GA4: ${report.ga4.message}`);
  log.info(`Search Console: ${report.searchConsole.message}`);
  for (const action of report.nextActions) {
    log.info(`Next: ${action.message}`);
  }
}

function requiredScopesForConfiguredGoogleProviders(options: {
  googleAds: boolean;
  ga4: boolean;
  searchConsole: boolean;
}): string[] {
  const scopes: string[] = [];
  if (options.googleAds) scopes.push(MARKETING_GOOGLE_ADS_SCOPE);
  if (options.ga4) scopes.push(MARKETING_GOOGLE_ANALYTICS_SCOPE);
  if (options.searchConsole) scopes.push(MARKETING_GOOGLE_SEARCH_CONSOLE_SCOPE);
  return scopes;
}

export async function marketingSetupDiscoverGoogle(options: MarketingCliOptions): Promise<number> {
  try {
    const loaded = await loadMarketingConfig({
      cwd: options.cwd,
      configPath: options.config,
    });
    const authProfile = resolveMarketingGoogleProfile(loaded.config, options);
    const googleAuth = await getMarketingGoogleAuthStatus({ profile: authProfile });
    const enabled = {
      googleAds: loaded.config.providers.googleAds.state !== 'disabled',
      ga4: loaded.config.providers.ga4.state !== 'disabled',
      searchConsole: loaded.config.providers.searchConsole.state !== 'disabled',
    };
    if (googleAuth.configured) {
      const missingScopes = [
        enabled.googleAds && !marketingGoogleAuthReadyForProvider(googleAuth, 'googleAds')
          ? MARKETING_GOOGLE_ADS_SCOPE
          : undefined,
        enabled.ga4 && !marketingGoogleAuthReadyForProvider(googleAuth, 'ga4')
          ? MARKETING_GOOGLE_ANALYTICS_SCOPE
          : undefined,
        enabled.searchConsole && !marketingGoogleAuthReadyForProvider(googleAuth, 'searchConsole')
          ? MARKETING_GOOGLE_SEARCH_CONSOLE_SCOPE
          : undefined,
      ].filter((scope): scope is string => Boolean(scope));
      if (missingScopes.length > 0) {
        throw new Error(
          `[MARKETING_GOOGLE_DISCOVERY_SCOPE_MISSING] Re-run marketing auth login --profile ${googleAuth.profile}; missing scopes: ${missingScopes.join(', ')}.`,
        );
      }
    }
    const requiredScopes = requiredScopesForConfiguredGoogleProviders(enabled);
    const accessToken = await resolveMarketingGoogleAccessToken({
      authProfile,
      requiredScope: requiredScopes[0] ?? MARKETING_GOOGLE_ANALYTICS_SCOPE,
    });
    const report = await writeMarketingGoogleDiscovery(loaded.config, {
      cwd: options.cwd,
      out: options.out,
      accessToken,
      apiVersion: options.apiVersion,
      driver: discoverMarketingGoogleAccounts,
    });
    if (options.json) printJson(report);
    else printDiscovery(report);
    return report.ok ? 0 : 1;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Google discovery error';
    if (options.json) printJson({ ok: false, error: message });
    else console.error(message);
    return 1;
  }
}
