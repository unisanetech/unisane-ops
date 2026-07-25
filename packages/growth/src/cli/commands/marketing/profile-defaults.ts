import { loadMarketingConfig, type MarketingConfig } from '@unisane/growth/marketing';

const MARKETING_GOOGLE_PROFILE_ENV = 'UNISANE_MARKETING_AUTH_PROFILE';
const MARKETING_META_PROFILE_ENV = 'UNISANE_MARKETING_META_AUTH_PROFILE';

type MarketingProfileOptions = {
  authProfile?: string;
  metaAuthProfile?: string;
  profile?: string;
  cwd?: string;
  config?: string;
};

export function defaultMarketingProfileName(config: MarketingConfig): string {
  return config.appId || config.platformId;
}

export function resolveMarketingGoogleProfile(
  config: MarketingConfig,
  options: Pick<MarketingProfileOptions, 'authProfile'> = {},
): string {
  return (
    options.authProfile ??
    process.env[MARKETING_GOOGLE_PROFILE_ENV] ??
    defaultMarketingProfileName(config)
  );
}

export function resolveMarketingMetaProfile(
  config: MarketingConfig,
  options: Pick<MarketingProfileOptions, 'metaAuthProfile'> = {},
): string {
  return (
    options.metaAuthProfile ??
    process.env[MARKETING_META_PROFILE_ENV] ??
    defaultMarketingProfileName(config)
  );
}

export async function withDefaultMarketingGoogleAuthProfile<
  TOptions extends Pick<MarketingProfileOptions, 'profile' | 'cwd' | 'config'>,
>(options: TOptions): Promise<TOptions> {
  if (options.profile || process.env[MARKETING_GOOGLE_PROFILE_ENV]) return options;
  const profile = await inferMarketingProfileName(options);
  return profile ? { ...options, profile } : options;
}

export async function withDefaultMarketingMetaAuthProfile<
  TOptions extends Pick<MarketingProfileOptions, 'profile' | 'cwd' | 'config'>,
>(options: TOptions): Promise<TOptions> {
  if (options.profile || process.env[MARKETING_META_PROFILE_ENV]) return options;
  const profile = await inferMarketingProfileName(options);
  return profile ? { ...options, profile } : options;
}

async function inferMarketingProfileName(
  options: Pick<MarketingProfileOptions, 'cwd' | 'config'>,
): Promise<string | undefined> {
  try {
    const loaded = await loadMarketingConfig({
      cwd: options.cwd,
      configPath: options.config,
    });
    return defaultMarketingProfileName(loaded.config);
  } catch {
    return undefined;
  }
}
