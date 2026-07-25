import type { MarketingProviderReportArtifact } from '../../schema/report.js';
import {
  asArray,
  asRecord,
  compactMetrics,
  microsToCurrency,
  optionalString,
  pickNumber,
  pickString,
  resolveWindow,
  type ProviderReportNormalizeOptions,
} from '../report-utils.js';

function rowsFromGoogleAdsInput(value: unknown): unknown[] {
  const root = asRecord(value);
  return asArray(root.results).length
    ? asArray(root.results)
    : asArray(root.rows).length
      ? asArray(root.rows)
      : asArray(value);
}

export function normalizeGoogleAdsReport(
  value: unknown,
  options: ProviderReportNormalizeOptions,
): MarketingProviderReportArtifact {
  const root = asRecord(value);
  const records = rowsFromGoogleAdsInput(value).map((rowValue, index) => {
    const row = asRecord(rowValue);
    const campaign = asRecord(row.campaign);
    const adGroup = asRecord(row.adGroup);
    const ad = asRecord(row.adGroupAd);
    const adGroupCriterion = asRecord(row.adGroupCriterion);
    const keywordView = asRecord(row.keywordView);
    const metrics = asRecord(row.metrics);
    const segments = asRecord(row.segments);
    const customer = asRecord(row.customer);
    const conversionAction = asRecord(row.conversionAction);
    const searchTermView = asRecord(row.searchTermView);
    const campaignId = optionalString(campaign.id) ?? pickString(row, ['campaignId']);
    const adGroupId = optionalString(adGroup.id) ?? pickString(row, ['adGroupId']);
    const adId = optionalString(asRecord(ad.ad).id) ?? pickString(row, ['adId']);
    const keyword =
      optionalString(asRecord(adGroupCriterion.keyword).text) ??
      optionalString(keywordView.resourceName) ??
      pickString(row, ['keyword', 'criterion']);
    const query =
      optionalString(searchTermView.searchTerm) ?? pickString(row, ['query', 'searchTerm']);
    const conversionId =
      optionalString(conversionAction.resourceName) ??
      optionalString(segments.conversionAction) ??
      pickString(row, ['conversionId']);
    const conversionName =
      optionalString(conversionAction.name) ??
      optionalString(segments.conversionActionName) ??
      pickString(row, ['conversionName']);
    const device = optionalString(segments.device) ?? pickString(row, ['device']);
    const auctionInsightDomain =
      optionalString(segments.auctionInsightDomain) ??
      optionalString(segments.auction_insight_domain) ??
      pickString(row, ['auctionInsightDomain', 'competitorDomain']);
    const accountId =
      options.accountId ??
      optionalString(customer.id) ??
      optionalString(asRecord(row.customer).id) ??
      pickString(row, ['accountId', 'customerId']) ??
      optionalString(root.accountId);
    const accountName =
      optionalString(customer.descriptiveName) ?? pickString(row, ['accountName', 'customerName']);

    return {
      id:
        conversionId ??
        adId ??
        keyword ??
        (options.reportType === 'query' && query && adGroupId
          ? `${adGroupId}:${query}`
          : undefined) ??
        (options.reportType === 'query' && query && campaignId
          ? `${campaignId}:${query}`
          : undefined) ??
        (options.reportType === 'query' ? query : undefined) ??
        (options.reportType === 'auctionInsight' && auctionInsightDomain && campaignId
          ? `${campaignId}:${auctionInsightDomain}`
          : undefined) ??
        (options.reportType === 'auctionInsight' ? auctionInsightDomain : undefined) ??
        adGroupId ??
        (options.reportType === 'device' && device && campaignId
          ? `${campaignId}:${device}`
          : undefined) ??
        (options.reportType === 'device' ? device : undefined) ??
        campaignId ??
        accountId ??
        `google_ads_row_${index + 1}`,
      name:
        conversionName ??
        optionalString(asRecord(ad.ad).name) ??
        optionalString(adGroup.name) ??
        optionalString(campaign.name) ??
        accountName ??
        pickString(row, ['name', 'campaignName']),
      level: conversionId
        ? 'conversion'
        : adId
          ? 'ad'
          : keyword
            ? 'keyword'
            : options.reportType === 'query' && query
              ? 'query'
              : options.reportType === 'auctionInsight' && auctionInsightDomain
                ? 'competitor'
                : adGroupId
                  ? 'adGroup'
                  : options.reportType === 'device' && device
                    ? 'device'
                    : campaignId
                      ? 'campaign'
                      : 'account',
      accountId,
      accountTimeZone: optionalString(customer.timeZone) ?? pickString(row, ['accountTimeZone']),
      autoTaggingEnabled:
        typeof customer.autoTaggingEnabled === 'boolean'
          ? customer.autoTaggingEnabled
          : typeof row.autoTaggingEnabled === 'boolean'
            ? row.autoTaggingEnabled
            : undefined,
      trackingUrlTemplate:
        optionalString(customer.trackingUrlTemplate) ?? pickString(row, ['trackingUrlTemplate']),
      finalUrlSuffix:
        optionalString(customer.finalUrlSuffix) ?? pickString(row, ['finalUrlSuffix']),
      conversionTrackingStatus:
        optionalString(asRecord(customer.conversionTrackingSetting).conversionTrackingStatus) ??
        pickString(row, ['conversionTrackingStatus']),
      campaignId,
      campaignName: optionalString(campaign.name) ?? pickString(row, ['campaignName']),
      adGroupId,
      adGroupName: optionalString(adGroup.name) ?? pickString(row, ['adGroupName']),
      adId,
      adName: optionalString(asRecord(ad.ad).name) ?? pickString(row, ['adName']),
      keyword,
      query,
      auctionInsightDomain,
      auctionInsightSearchImpressionShare:
        pickNumber(metrics, ['auctionInsightSearchImpressionShare']) ??
        pickNumber(row, ['auctionInsightSearchImpressionShare']),
      auctionInsightSearchOverlapRate:
        pickNumber(metrics, ['auctionInsightSearchOverlapRate']) ??
        pickNumber(row, ['auctionInsightSearchOverlapRate']),
      auctionInsightSearchPositionAboveRate:
        pickNumber(metrics, ['auctionInsightSearchPositionAboveRate']) ??
        pickNumber(row, ['auctionInsightSearchPositionAboveRate']),
      auctionInsightSearchOutrankingShare:
        pickNumber(metrics, ['auctionInsightSearchOutrankingShare']) ??
        pickNumber(row, ['auctionInsightSearchOutrankingShare']),
      auctionInsightSearchTopImpressionPercentage:
        pickNumber(metrics, ['auctionInsightSearchTopImpressionPercentage']) ??
        pickNumber(row, ['auctionInsightSearchTopImpressionPercentage']),
      auctionInsightSearchAbsoluteTopImpressionPercentage:
        pickNumber(metrics, ['auctionInsightSearchAbsoluteTopImpressionPercentage']) ??
        pickNumber(row, ['auctionInsightSearchAbsoluteTopImpressionPercentage']),
      conversionId,
      conversionName,
      device,
      currency:
        pickString(row, ['currency', 'currencyCode']) ??
        optionalString(customer.currencyCode) ??
        optionalString(segments.currencyCode),
      metrics: compactMetrics({
        impressions: pickNumber(metrics, ['impressions']) ?? pickNumber(row, ['impressions']),
        clicks: pickNumber(metrics, ['clicks']) ?? pickNumber(row, ['clicks']),
        cost: microsToCurrency(metrics.costMicros) ?? pickNumber(row, ['cost']),
        conversions: pickNumber(metrics, ['conversions']) ?? pickNumber(row, ['conversions']),
        conversionValue:
          pickNumber(metrics, ['conversionsValue']) ??
          pickNumber(metrics, ['conversionValue']) ??
          pickNumber(row, ['conversionValue']),
      }),
    } satisfies MarketingProviderReportArtifact['records'][number];
  });

  return {
    version: 1,
    platformId: options.platformId,
    appId: options.appId,
    provider: 'googleAds',
    reportType: options.reportType,
    source: options.source,
    accountId: options.accountId ?? optionalString(root.accountId),
    pulledAt: options.pulledAt,
    window: resolveWindow(value, options),
    partial: Boolean(root.partial),
    records,
  };
}
