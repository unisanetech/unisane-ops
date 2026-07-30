import { log } from '../../log.js';
import { serveMarketingConsoleApp } from '../../marketing-console/index.js';
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

export async function marketingConsoleServe(options: MarketingConsoleCliOptions): Promise<number> {
  try {
    const authContext = await resolveMarketingConsoleAuthContext();
    const result = await serveMarketingConsoleApp({
      cwd: options.cwd,
      outputDirectory: options.out,
      host: options.host,
      port: parsePositiveInteger(options.port, 4174, '--port'),
      maxAgeDays: parsePositiveInteger(options.maxAgeDays, 3, '--max-age-days'),
      googleAuth: authContext.googleAuth,
      metaAuth: authContext.metaAuth,
    });
    if (options.json) {
      console.log(JSON.stringify({ ...result, server: undefined }, null, 2));
    } else {
      console.log(
        [
          '# Marketing Console',
          '',
          `URL: ${result.url}`,
          `Output: ${result.outputDirectory}`,
          `Readiness: ${result.readiness.label}`,
          '',
          'Press Ctrl+C to stop.',
        ].join('\n'),
      );
    }
    await new Promise<void>((resolve) => {
      result.server.on('close', resolve);
    });
    return 0;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown marketing console serve error';
    if (options.json) console.log(JSON.stringify({ ok: false, error: message }, null, 2));
    else log.error(message);
    return 1;
  }
}
