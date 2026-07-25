import {
  buildMarketingRealAccountProofStatus,
  loadMarketingConfig,
  writeMarketingRealAccountProofStatus,
} from '@unisane/growth/marketing';
import { getMarketingGoogleAuthStatus } from '../auth/google.js';
import { getMarketingMetaAuthStatus } from '../auth/meta.js';
import type { MarketingCliOptions } from '../options.js';
import { printMarketingProofStatus } from '../output/proof-status.js';
import { resolveMarketingGoogleProfile, resolveMarketingMetaProfile } from '../profile-defaults.js';

function parseMaxAgeDays(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(
      '[MARKETING_PROOF_MAX_AGE_INVALID] --max-age-days must be a non-negative integer.',
    );
  }
  return parsed;
}

export async function marketingProofStatus(options: MarketingCliOptions): Promise<number> {
  try {
    const loaded = await loadMarketingConfig({
      cwd: options.cwd,
      configPath: options.config,
    });
    const googleAuth = await getMarketingGoogleAuthStatus({
      profile: resolveMarketingGoogleProfile(loaded.config, options),
    });
    const metaAuth = await getMarketingMetaAuthStatus({
      profile: resolveMarketingMetaProfile(loaded.config, options),
    });
    const result = options.out
      ? writeMarketingRealAccountProofStatus(loaded.config, {
          cwd: options.cwd,
          configPath: loaded.path,
          limitsPath: options.limits,
          maxAgeDays: parseMaxAgeDays(options.maxAgeDays),
          out: options.out,
          googleAuth,
          metaAuth,
        })
      : {
          report: buildMarketingRealAccountProofStatus(loaded.config, {
            cwd: options.cwd,
            configPath: loaded.path,
            limitsPath: options.limits,
            maxAgeDays: parseMaxAgeDays(options.maxAgeDays),
            googleAuth,
            metaAuth,
          }),
        };
    const report = result.report;
    printMarketingProofStatus(report, { json: options.json });
    return report.ok ? 0 : 1;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown marketing proof status error';
    if (options.json) console.log(JSON.stringify({ ok: false, error: message }, null, 2));
    else console.error(message);
    return 1;
  }
}
