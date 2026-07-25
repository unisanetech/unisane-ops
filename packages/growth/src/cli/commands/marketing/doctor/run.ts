import { loadMarketingConfig, runMarketingDoctor } from '@unisane/growth/marketing';
import { getMarketingGoogleAuthStatus } from '../auth/google.js';
import { getMarketingMetaAuthStatus } from '../auth/meta.js';
import type { MarketingCliOptions } from '../options.js';
import { printMarketingDoctorReport } from '../output/doctor.js';
import { resolveMarketingGoogleProfile, resolveMarketingMetaProfile } from '../profile-defaults.js';

function printJson(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}

export async function marketingDoctor(options: MarketingCliOptions): Promise<number> {
  const loaded = await loadMarketingConfig({ cwd: options.cwd, configPath: options.config });
  const googleAuth = await getMarketingGoogleAuthStatus({
    profile: resolveMarketingGoogleProfile(loaded.config, options),
  });
  const metaAuth = await getMarketingMetaAuthStatus({
    profile: resolveMarketingMetaProfile(loaded.config, options),
  });
  const reportWithAuth = await runMarketingDoctor({
    cwd: options.cwd,
    configPath: options.config,
    googleAuth,
    metaAuth,
  });
  if (options.json) printJson(reportWithAuth);
  else printMarketingDoctorReport(reportWithAuth);
  return reportWithAuth.ok ? 0 : 1;
}
