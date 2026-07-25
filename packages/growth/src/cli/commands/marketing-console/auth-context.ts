import { loadMarketingConfig } from '@unisane/growth/marketing';
import { getMarketingGoogleAuthStatus } from '../marketing/auth/google.js';
import { getMarketingMetaAuthStatus } from '../marketing/auth/meta.js';
import {
  resolveMarketingGoogleProfile,
  resolveMarketingMetaProfile,
} from '../marketing/profile-defaults.js';
import type { MarketingConsoleCliOptions } from './options.js';

export async function resolveMarketingConsoleAuthContext(options: MarketingConsoleCliOptions) {
  const loaded = await loadMarketingConfig({
    cwd: options.cwd,
    configPath: options.config,
  });
  const googleProfile = resolveMarketingGoogleProfile(loaded.config);
  const metaProfile = resolveMarketingMetaProfile(loaded.config);
  const [googleAuth, metaAuth] = await Promise.all([
    getMarketingGoogleAuthStatus({ profile: googleProfile }),
    getMarketingMetaAuthStatus({ profile: metaProfile }),
  ]);
  return { googleAuth, metaAuth };
}
