import type { MarketingProviderReportArtifact } from '../../schema/report.js';
import {
  asArray,
  asRecord,
  compactMetrics,
  optionalNumber,
  optionalString,
  resolveWindow,
  type ProviderReportNormalizeOptions,
} from '../report-utils.js';

function headerNames(headers: unknown): string[] {
  return asArray(headers)
    .map((header) => optionalString(asRecord(header).name))
    .filter((name): name is string => Boolean(name));
}

function ga4Rows(value: unknown): Array<Record<string, string | undefined>> {
  const root = asRecord(value);
  const dimensions = headerNames(root.dimensionHeaders);
  const metrics = headerNames(root.metricHeaders);
  return asArray(root.rows).map((rowValue) => {
    const row = asRecord(rowValue);
    const output: Record<string, string | undefined> = {};
    asArray(row.dimensionValues).forEach((dimension, index) => {
      output[dimensions[index] ?? `dimension_${index + 1}`] = optionalString(
        asRecord(dimension).value,
      );
    });
    asArray(row.metricValues).forEach((metric, index) => {
      output[metrics[index] ?? `metric_${index + 1}`] = optionalString(asRecord(metric).value);
    });
    return output;
  });
}

export function normalizeGa4Report(
  value: unknown,
  options: ProviderReportNormalizeOptions,
): MarketingProviderReportArtifact {
  const root = asRecord(value);
  const records = ga4Rows(value).map((row, index) => {
    const eventName = row.eventName;
    const pagePath =
      row.pagePath ?? row.pageLocation ?? row.landingPage ?? row.landingPagePlusQueryString;
    const campaignName = row.sessionCampaignName ?? row.campaignName;
    const channel = row.sessionDefaultChannelGroup ?? row.defaultChannelGroup;
    const sourceMedium = row.sessionSourceMedium ?? row.sourceMedium;
    const itemName = row.itemName;

    return {
      id:
        eventName ??
        pagePath ??
        channel ??
        sourceMedium ??
        itemName ??
        campaignName ??
        `ga4_row_${index + 1}`,
      name: eventName ?? pagePath ?? channel ?? sourceMedium ?? itemName ?? campaignName,
      level: eventName
        ? 'event'
        : pagePath
          ? 'page'
          : channel
            ? 'channel'
            : sourceMedium
              ? 'sourceMedium'
              : itemName
                ? 'ecommerce'
                : 'campaign',
      accountId:
        options.accountId ?? optionalString(root.accountId) ?? optionalString(root.propertyId),
      campaignName,
      pageUrl: pagePath,
      channel,
      sourceMedium,
      itemName,
      metrics: compactMetrics({
        sessions: optionalNumber(row.sessions),
        users: optionalNumber(row.activeUsers) ?? optionalNumber(row.totalUsers),
        conversions: optionalNumber(row.conversions),
        keyEvents: optionalNumber(row.keyEvents) ?? optionalNumber(row.eventCount),
        revenue: optionalNumber(row.totalRevenue) ?? optionalNumber(row.purchaseRevenue),
        purchases: optionalNumber(row.ecommercePurchases),
      }),
    } satisfies MarketingProviderReportArtifact['records'][number];
  });

  return {
    version: 1,
    platformId: options.platformId,
    appId: options.appId,
    provider: 'ga4',
    reportType: options.reportType,
    source: options.source,
    accountId:
      options.accountId ?? optionalString(root.accountId) ?? optionalString(root.propertyId),
    pulledAt: options.pulledAt,
    window: resolveWindow(value, options),
    partial: Boolean(root.partial),
    records,
  };
}
