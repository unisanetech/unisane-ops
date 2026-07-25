import { loadMarketingConfig, type MarketingConfig } from '@unisane/growth/marketing';

const MARKETING_META_PROFILE_ENV = 'UNISANE_MARKETING_META_AUTH_PROFILE';

function defaultMarketingProfileName(config: MarketingConfig): string {
  return config.appId || config.platformId;
}

export function resolveMarketingMetaProfile(
  config: MarketingConfig,
  options: { metaAuthProfile?: string } = {},
): string {
  return (
    options.metaAuthProfile ??
    process.env[MARKETING_META_PROFILE_ENV] ??
    defaultMarketingProfileName(config)
  );
}

export async function withDefaultMarketingMetaAuthProfile<
  TOptions extends { profile?: string; cwd?: string; config?: string },
>(options: TOptions): Promise<TOptions> {
  if (options.profile || process.env[MARKETING_META_PROFILE_ENV]) return options;
  try {
    const loaded = await loadMarketingConfig({
      cwd: options.cwd,
      configPath: options.config,
    });
    return { ...options, profile: defaultMarketingProfileName(loaded.config) };
  } catch {
    return options;
  }
}
