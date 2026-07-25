import {
  buildUnifiedMarketingReport,
  loadMarketingConfig,
  readMarketingProviderReportStatus,
} from '@unisane/growth/marketing';
import type { MarketingCliOptions } from '../options.js';
import { printMarketingProviderReportStatus } from '../output/doctor.js';
import { printUnifiedMarketingReport } from '../output/report.js';

function printJson(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}

function parseMaxAgeDays(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(
      '[MARKETING_REPORT_MAX_AGE_INVALID] --max-age-days must be a non-negative integer.',
    );
  }
  return parsed;
}

export async function marketingReport(options: MarketingCliOptions): Promise<number> {
  try {
    if (options.unified) {
      const loaded = await loadMarketingConfig({
        cwd: options.cwd,
        configPath: options.config,
      });
      const unified = await buildUnifiedMarketingReport(loaded.config, {
        cwd: options.cwd,
        sourceRoots: options.sourceRoot,
        maxAgeDays: parseMaxAgeDays(options.maxAgeDays),
      });
      if (options.json) printJson(unified);
      else printUnifiedMarketingReport(unified);
      return unified.ok ? 0 : 1;
    }

    const report = readMarketingProviderReportStatus({
      cwd: options.cwd,
      provider: options.provider,
      reportType: options.report,
      maxAgeDays: parseMaxAgeDays(options.maxAgeDays),
    });
    if (options.json) printJson(report);
    else printMarketingProviderReportStatus(report);
    return report.ok ? 0 : 1;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown marketing report error';
    if (options.json) printJson({ ok: false, error: message });
    else console.error(message);
    return 1;
  }
}
