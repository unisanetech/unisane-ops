import { writeMarketingConfirmedConversionPull } from '@unisane/growth/marketing';
import { loadMarketingExecutionContext } from '../../../project-context.js';
import type { MarketingCliOptions } from '../options.js';

function printJson(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}

function printResult(result: ReturnType<typeof writeMarketingConfirmedConversionPull>): void {
  console.log(`Canonical outcome ledger ${result.disposition}: ${result.recordCount} revisions`);
  console.log(`Artifact revision: ${result.revision}`);
  console.log(`Window: ${result.window.start} to ${result.window.end}`);
  console.log(`Latest: ${result.latestPath}`);
}

export async function marketingConversionPull(options: MarketingCliOptions): Promise<number> {
  try {
    if (!options.input) {
      throw new Error('[MARKETING_CONVERSION_PULL_INPUT_REQUIRED] Pass --input <artifact.json>.');
    }
    const loaded = await loadMarketingExecutionContext();
    const result = writeMarketingConfirmedConversionPull(loaded.config, {
      cwd: options.cwd,
      inputPath: options.input,
    });
    if (options.json) printJson(result);
    else printResult(result);
    return result.ok ? 0 : 1;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown marketing conversion-pull error';
    if (options.json) printJson({ ok: false, error: message });
    else console.error(message);
    return 1;
  }
}
