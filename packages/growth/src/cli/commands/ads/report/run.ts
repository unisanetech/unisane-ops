import {
  marketingProviderReportTypeSchema,
  readMarketingProviderReportStatus,
  type MarketingProviderReportStatusReport,
  type MarketingReportProvider,
} from '@unisane/growth/marketing';
import type { AdsCliOptions } from '../options.js';
import { printAdsProviderReportStatus } from '../output/status.js';

function parseMaxAgeDays(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error('[ADS_REPORT_MAX_AGE_INVALID] --max-age-days must be a non-negative integer.');
  }
  return parsed;
}

function adsReportProviders(provider: AdsCliOptions['provider']): MarketingReportProvider[] {
  if (!provider || provider === 'all') return ['googleAds', 'metaAds'];
  if (provider === 'googleAds' || provider === 'metaAds') return [provider];
  throw new Error(
    '[ADS_REPORT_PROVIDER_INVALID] ads report only supports googleAds, metaAds, or all.',
  );
}

export async function adsReport(options: AdsCliOptions): Promise<number> {
  try {
    const providers = adsReportProviders(options.provider);
    const reportType = options.report
      ? marketingProviderReportTypeSchema.parse(options.report)
      : undefined;
    const reports = providers.map((provider) =>
      readMarketingProviderReportStatus({
        cwd: options.cwd,
        provider,
        reportType,
        maxAgeDays: parseMaxAgeDays(options.maxAgeDays),
      }),
    );
    const report: MarketingProviderReportStatusReport = {
      ok: reports.every((entry) => entry.ok),
      cwd: reports[0]?.cwd ?? options.cwd ?? process.cwd(),
      cacheRoot: reports[0]?.cacheRoot ?? '',
      maxAgeDays: reports[0]?.maxAgeDays ?? 3,
      providers: reports.flatMap((entry) => entry.providers),
      nextWorkflowStep: reports.some((entry) => !entry.ok)
        ? 'Fix invalid ads provider pull artifacts, then rerun `unisane growth ads report`.'
        : 'Run `unisane growth marketing report --unified` to join ads with analytics, SEO, and confirmed conversion truth.',
    };
    if (options.json) console.log(JSON.stringify(report, null, 2));
    else printAdsProviderReportStatus(report);
    return report.ok ? 0 : 1;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown ads report error';
    if (options.json) console.log(JSON.stringify({ ok: false, error: message }, null, 2));
    else console.error(message);
    return 1;
  }
}
