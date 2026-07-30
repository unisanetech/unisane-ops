import {
  MARKETING_GOOGLE_ADS_SCOPE,
  MARKETING_GOOGLE_ANALYTICS_SCOPE,
  MARKETING_GOOGLE_SEARCH_CONSOLE_SCOPE,
  MARKETING_GOOGLE_TAG_MANAGER_SCOPE,
  writeMarketingScheduledReportingPlan,
} from '@unisane/growth/marketing';
import type { MarketingCliOptions } from '../options.js';
import {
  loadGrowthProjectContext,
  loadMarketingExecutionContext,
  selectGrowthEnvironment,
} from '../../../project-context.js';

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
    const loaded = await loadMarketingExecutionContext();
    const context = await loadGrowthProjectContext();
    const environment =
      context.growth.environments[selectGrowthEnvironment(context, options.environment)]!;
    const connectionId = options.connection ?? environment.connections.google;
    const serviceScopes = new Map([
      ['ads', MARKETING_GOOGLE_ADS_SCOPE],
      ['analytics', MARKETING_GOOGLE_ANALYTICS_SCOPE],
      ['search-console', MARKETING_GOOGLE_SEARCH_CONSOLE_SCOPE],
      ['tag-manager', MARKETING_GOOGLE_TAG_MANAGER_SCOPE],
    ]);
    const googleAuth = {
      connectionId: connectionId ?? 'google',
      connected: Boolean(connectionId),
      scopes: environment.resources.flatMap((resource) => {
        const scope = serviceScopes.get(resource.service);
        return scope ? [scope] : [];
      }),
      credentialAvailable: Boolean(connectionId),
    };
    const metaConnectionId = environment.connections.meta;
    const metaAuth = {
      ok: false,
      connectionId: metaConnectionId ?? 'meta',
      connected: Boolean(metaConnectionId),
      scopes: [],
      credentialAvailable: false,
    };
    const result = writeMarketingScheduledReportingPlan(loaded.config, {
      cwd: options.cwd,
      out: options.out,
      connection: connectionId,
      metaConnection: metaConnectionId,
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
