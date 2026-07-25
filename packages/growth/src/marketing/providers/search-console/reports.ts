import type { MarketingProviderReportArtifact } from '../../schema/report.js';
import {
  asArray,
  asRecord,
  compactMetrics,
  optionalString,
  pickNumber,
  resolveWindow,
  type ProviderReportNormalizeOptions,
} from '../report-utils.js';

function rowsFromSearchConsoleInput(value: unknown): unknown[] {
  const root = asRecord(value);
  return asArray(root.rows).length ? asArray(root.rows) : asArray(value);
}

export function normalizeSearchConsoleReport(
  value: unknown,
  options: ProviderReportNormalizeOptions,
): MarketingProviderReportArtifact {
  const root = asRecord(value);
  const records = rowsFromSearchConsoleInput(value).map((rowValue, index) => {
    const row = asRecord(rowValue);
    const keys = asArray(row.keys).map(optionalString);
    const dimensions = asArray(root.dimensions).map(optionalString);
    const dimensionValue = (name: string): string | undefined => {
      const dimensionIndex = dimensions.indexOf(name);
      return dimensionIndex >= 0 ? keys[dimensionIndex] : undefined;
    };
    const query =
      optionalString(row.query) ??
      dimensionValue('query') ??
      keys.find(
        (key) => key && !key.startsWith('/') && !['DESKTOP', 'MOBILE', 'TABLET'].includes(key),
      );
    const pageUrl =
      optionalString(row.page) ??
      dimensionValue('page') ??
      keys.find((key) => key?.startsWith('/'));
    const country = optionalString(row.country) ?? dimensionValue('country');
    const device = optionalString(row.device) ?? dimensionValue('device');
    const searchAppearance =
      optionalString(row.searchAppearance) ?? dimensionValue('searchAppearance');
    const level = query
      ? 'query'
      : pageUrl
        ? 'page'
        : country
          ? 'country'
          : device
            ? 'device'
            : searchAppearance
              ? 'searchAppearance'
              : 'query';

    return {
      id:
        pageUrl || query
          ? `${query ?? 'all'}:${pageUrl ?? 'all'}`
          : (country ?? device ?? searchAppearance ?? `search_console_row_${index + 1}`),
      name: query ?? pageUrl ?? country ?? device ?? searchAppearance,
      level,
      accountId:
        options.accountId ?? optionalString(root.siteUrl) ?? optionalString(root.accountId),
      query,
      pageUrl,
      country,
      device,
      searchAppearance,
      ctr: pickNumber(row, ['ctr']),
      position: pickNumber(row, ['position']),
      metrics: compactMetrics({
        impressions: pickNumber(row, ['impressions']),
        clicks: pickNumber(row, ['clicks']),
      }),
    } satisfies MarketingProviderReportArtifact['records'][number];
  });

  return {
    version: 1,
    platformId: options.platformId,
    appId: options.appId,
    provider: 'searchConsole',
    reportType: options.reportType,
    source: options.source,
    accountId: options.accountId ?? optionalString(root.siteUrl) ?? optionalString(root.accountId),
    pulledAt: options.pulledAt,
    window: resolveWindow(value, options),
    partial: Boolean(root.partial),
    records,
  };
}
