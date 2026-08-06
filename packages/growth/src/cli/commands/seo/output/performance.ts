import { log } from '../../../log.js';
import type {
  GenerateSeoPerformanceReportFileResult,
  ImportSeoPerformanceFileResult,
} from '@unisane/growth/seo';
import type {
  FetchGa4PerformanceFileResult,
  FetchSearchConsolePerformanceFileResult,
} from '../../../provider-adapters.js';

export function printImportSeoPerformanceFileResult(
  result: ImportSeoPerformanceFileResult,
  options: { json?: boolean },
): void {
  if (options.json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }

  log.success(
    result.dryRun
      ? `SEO performance import previewed (${result.recordCount} rows)`
      : `SEO performance imported (${result.recordCount} rows)`,
  );
  log.kv('Input', result.input);
  log.kv('Output', result.output);
  log.kv('Platform', result.platformId);
  log.kv('Source', result.source);
  log.kv('Site', result.siteUrl);
  log.kv('Property', result.property);
  log.kv('Data', result.sampleData ? 'Sample' : 'Live');
  log.kv('Fresh until', result.freshUntil);
  log.kv('Pages', String(result.pageCount));
  log.kv('Queries', String(result.queryCount));
}

export function printFetchGa4PerformanceFileResult(
  result: FetchGa4PerformanceFileResult,
  options: { json?: boolean },
): void {
  if (options.json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }

  log.success(
    result.dryRun
      ? `GA4 performance fetch previewed (${result.recordCount} records)`
      : `GA4 performance fetched (${result.recordCount} records)`,
  );
  log.kv('Output', result.output);
  log.kv('Platform', result.platformId);
  log.kv('Property', result.propertyId);
  log.kv('Site', result.configuredSiteUrl);
  log.kv('Data', 'Live');
  log.kv('Fresh until', result.freshUntil);
  log.kv('Date range', `${result.startDate}..${result.endDate}`);
  log.kv('Dimensions', result.dimensions.join(', '));
  log.kv('Metrics', result.metrics.join(', '));
  log.kv('Pages', String(result.pageCount));
}

export function printFetchSearchConsolePerformanceFileResult(
  result: FetchSearchConsolePerformanceFileResult,
  options: { json?: boolean },
): void {
  if (options.json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }

  log.success(
    result.dryRun
      ? `Search Console performance fetch previewed (${result.recordCount} records)`
      : `Search Console performance fetched (${result.recordCount} records)`,
  );
  log.kv('Output', result.output);
  log.kv('Platform', result.platformId);
  log.kv('Property', result.siteUrl);
  log.kv('Site', result.configuredSiteUrl);
  log.kv('Data', 'Live');
  log.kv('Fresh until', result.freshUntil);
  log.kv('Date range', `${result.startDate}..${result.endDate}`);
  log.kv('Dimensions', result.dimensions.join(', '));
  log.kv('Pages', String(result.pageCount));
  log.kv('Queries', String(result.queryCount));
}

export function printGenerateSeoPerformanceReportFileResult(
  result: GenerateSeoPerformanceReportFileResult,
  options: { json?: boolean },
): void {
  if (options.json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }

  log.success(
    result.dryRun ? 'SEO performance report previewed' : 'SEO performance report written',
  );
  if (result.searchConsole) {
    log.kv('Search Console', result.searchConsole);
  }
  if (result.ga4) {
    log.kv('GA4', result.ga4);
  }
  if (result.opportunities) {
    log.kv('Opportunities', result.opportunities);
  }
  log.kv('Output', result.output);
  log.kv('Platform', result.platformId);
}
