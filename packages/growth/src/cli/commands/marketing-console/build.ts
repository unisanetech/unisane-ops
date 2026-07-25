import { log } from '../../log.js';
import { buildMarketingConsoleApp } from '../../marketing-console/index.js';
import { resolveMarketingConsoleAuthContext } from './auth-context.js';
import type { MarketingConsoleCliOptions } from './options.js';

function parsePositiveInteger(
  value: string | undefined,
  fallback: number,
  optionName: string,
): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`[MARKETING_CONSOLE_OPTION_INVALID] ${optionName} must be a positive integer.`);
  }
  return parsed;
}

export async function marketingConsoleBuild(options: MarketingConsoleCliOptions): Promise<number> {
  try {
    const authContext = await resolveMarketingConsoleAuthContext(options);
    const result = await buildMarketingConsoleApp({
      cwd: options.cwd,
      configPath: options.config,
      outputDirectory: options.out,
      dryRun: options.dryRun,
      maxAgeDays: parsePositiveInteger(options.maxAgeDays, 3, '--max-age-days'),
      limitsPath: options.limits,
      googleAuth: authContext.googleAuth,
      metaAuth: authContext.metaAuth,
    });
    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(
        [
          '# Marketing Console',
          '',
          `Output: ${result.outputDirectory}`,
          `Entry: ${result.entryHtmlPath}`,
          `Readiness: ${result.readiness.label}`,
          `Status: ${result.readiness.status}`,
          '',
          result.readiness.nextWorkflowStep,
        ].join('\n'),
      );
    }
    return 0;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown marketing console build error';
    if (options.json) console.log(JSON.stringify({ ok: false, error: message }, null, 2));
    else log.error(message);
    return 1;
  }
}
