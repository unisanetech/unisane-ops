import {
  loadMarketingConfig,
  writeMarketingScheduledReportingPlan,
} from '@unisane/growth/marketing';
import { getMarketingGoogleAuthStatus } from '../auth/google.js';
import { getMarketingMetaAuthStatus } from '../auth/meta.js';
import type { MarketingCliOptions } from '../options.js';
import { resolveMarketingGoogleProfile, resolveMarketingMetaProfile } from '../profile-defaults.js';

function printJson(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}

function parsePositiveInteger(
  value: string | undefined,
  fallback: number,
  optionName: string,
): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(
      `[MARKETING_SCHEDULE_OPTION_INVALID] ${optionName} must be a positive integer.`,
    );
  }
  return parsed;
}

export async function marketingScheduleReporting(options: MarketingCliOptions): Promise<number> {
  try {
    const loaded = await loadMarketingConfig({
      cwd: options.cwd,
      configPath: options.config,
    });
    const authProfile = resolveMarketingGoogleProfile(loaded.config, options);
    const metaAuthProfile = resolveMarketingMetaProfile(loaded.config, options);
    const googleAuth = await getMarketingGoogleAuthStatus({ profile: authProfile });
    const metaAuth = await getMarketingMetaAuthStatus({ profile: metaAuthProfile });
    const result = writeMarketingScheduledReportingPlan(loaded.config, {
      cwd: options.cwd,
      limitsPath: options.limits,
      out: options.out,
      authProfile,
      metaAuthProfile,
      googleAuth,
      metaAuth,
      cadence: options.cadence === 'weekly' ? 'weekly' : 'daily',
      windowDays: parsePositiveInteger(options.windowDays, 3, '--window-days'),
      maxAgeDays: parsePositiveInteger(options.maxAgeDays, 3, '--max-age-days'),
    });
    if (options.json) printJson(result);
    else {
      console.log(
        `# Marketing Scheduled Reporting\n\nOutput: ${result.path}\nReady: ${result.ok ? 'yes' : 'no'}\nJobs: ${result.plan.jobs.length}\n\n${result.plan.nextWorkflowStep}`,
      );
    }
    return result.ok ? 0 : 1;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown marketing schedule reporting error';
    if (options.json) printJson({ ok: false, error: message });
    else console.error(message);
    return 1;
  }
}
