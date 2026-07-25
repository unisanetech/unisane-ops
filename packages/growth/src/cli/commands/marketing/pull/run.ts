import { loadMarketingConfig, writeMarketingProviderReportPull } from '@unisane/growth/marketing';
import type { MarketingCliOptions } from '../options.js';
import { printMarketingProviderPullResult } from '../output/doctor.js';

function printJson(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}

export async function marketingPull(options: MarketingCliOptions): Promise<number> {
  try {
    if (!options.provider) {
      throw new Error('[MARKETING_PULL_PROVIDER_REQUIRED] Pass --provider <provider>.');
    }
    if (!options.input) {
      throw new Error('[MARKETING_PULL_INPUT_REQUIRED] Pass --input <artifact.json>.');
    }
    const loaded = await loadMarketingConfig({
      cwd: options.cwd,
      configPath: options.config,
    });
    const result = writeMarketingProviderReportPull(loaded.config, {
      cwd: options.cwd,
      provider: options.provider,
      inputPath: options.input,
      inputFormat: options.inputFormat,
      source: options.source,
      reportType: options.report,
      accountId: options.accountId,
      startDate: options.startDate,
      endDate: options.endDate,
      timeZone: options.timeZone,
    });
    if (options.json) printJson(result);
    else printMarketingProviderPullResult(result);
    return result.ok ? 0 : 1;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown marketing pull error';
    if (options.json) printJson({ ok: false, error: message });
    else console.error(message);
    return 1;
  }
}
