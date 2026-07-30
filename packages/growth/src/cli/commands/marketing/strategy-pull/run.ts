import { writeMarketingStrategyMapPull } from '@unisane/growth/marketing';
import { loadMarketingExecutionContext } from '../../../project-context.js';
import type { MarketingCliOptions } from '../options.js';

function printJson(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}

function printResult(result: ReturnType<typeof writeMarketingStrategyMapPull>): void {
  console.log(`Marketing strategy map cached: ${result.objectCount}`);
  console.log(`Pulled at: ${result.pulledAt}`);
  console.log(`Latest: ${result.latestPath}`);
}

export async function marketingStrategyPull(options: MarketingCliOptions): Promise<number> {
  try {
    if (!options.input) {
      throw new Error('[MARKETING_STRATEGY_PULL_INPUT_REQUIRED] Pass --input <artifact.json>.');
    }
    const loaded = await loadMarketingExecutionContext();
    const result = writeMarketingStrategyMapPull(loaded.config, {
      cwd: options.cwd,
      inputPath: options.input,
      source: options.source,
    });
    if (options.json) printJson(result);
    else printResult(result);
    return result.ok ? 0 : 1;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown marketing strategy-pull error';
    if (options.json) printJson({ ok: false, error: message });
    else console.error(message);
    return 1;
  }
}
