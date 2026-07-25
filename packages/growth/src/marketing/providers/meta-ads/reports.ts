import type { MarketingProviderReportArtifact } from '../../schema/report.js';
import {
  asArray,
  asRecord,
  compactMetrics,
  optionalNumber,
  optionalString,
  pickNumber,
  pickString,
  resolveWindow,
  type ProviderReportNormalizeOptions,
} from '../report-utils.js';

function rowsFromMetaInput(value: unknown): unknown[] {
  const root = asRecord(value);
  return asArray(root.data).length
    ? asArray(root.data)
    : asArray(root.rows).length
      ? asArray(root.rows)
      : asArray(value);
}

function sumActions(value: unknown): number | undefined {
  const total = asArray(value).reduce<number>((sum, action) => {
    const record = asRecord(action);
    const parsed = optionalNumber(record.value);
    return parsed === undefined ? sum : sum + parsed;
  }, 0);
  return total > 0 ? total : undefined;
}

function firstArrayRecord(value: unknown): Record<string, unknown> {
  return asRecord(asArray(value)[0]);
}

function creativeNestedString(row: Record<string, unknown>, keys: string[]): string | undefined {
  const storySpec = asRecord(row.object_story_spec);
  const linkData = asRecord(storySpec.link_data);
  const videoData = asRecord(storySpec.video_data);
  const templateData = asRecord(storySpec.template_data);
  const linkCallToAction = asRecord(linkData.call_to_action);
  const videoCallToAction = asRecord(videoData.call_to_action);
  const assetFeed = asRecord(row.asset_feed_spec);
  const firstBody = firstArrayRecord(assetFeed.bodies);
  const firstTitle = firstArrayRecord(assetFeed.titles);
  const firstImage = firstArrayRecord(assetFeed.images);
  const firstVideo = firstArrayRecord(assetFeed.videos);
  const firstLinkUrl = firstArrayRecord(assetFeed.link_urls);
  const searchRecords = [
    row,
    linkData,
    videoData,
    templateData,
    linkCallToAction,
    videoCallToAction,
    firstBody,
    firstTitle,
    firstImage,
    firstVideo,
    firstLinkUrl,
  ];

  for (const record of searchRecords) {
    const value = pickString(record, keys);
    if (value) return value;
  }
  return undefined;
}

export function normalizeMetaAdsReport(
  value: unknown,
  options: ProviderReportNormalizeOptions,
): MarketingProviderReportArtifact {
  const root = asRecord(value);
  const records = rowsFromMetaInput(value).map((rowValue, index) => {
    const row = asRecord(rowValue);
    const campaignId = pickString(row, ['campaign_id', 'campaignId']);
    const adSetId = pickString(row, ['adset_id', 'adSetId']);
    const adId = pickString(row, ['ad_id', 'adId']);
    const creativeId = pickString(row, ['creative_id', 'creativeId', 'id']);
    const creativeName = pickString(row, ['creative_name', 'creativeName', 'name']);
    const creativeAssetType = pickString(row, ['object_type', 'objectType']);
    const device = pickString(row, ['impression_device', 'device']);

    return {
      id:
        adId ??
        creativeId ??
        adSetId ??
        (options.reportType === 'device' && device && campaignId
          ? `${campaignId}:${device}`
          : undefined) ??
        (options.reportType === 'device' ? device : undefined) ??
        campaignId ??
        pickString(row, ['account_id', 'accountId']) ??
        `meta_ads_row_${index + 1}`,
      name: pickString(row, [
        'ad_name',
        'adName',
        'creative_name',
        'creativeName',
        'name',
        'adset_name',
        'adSetName',
        'campaign_name',
        'campaignName',
        'account_name',
        'accountName',
      ]),
      level: adId
        ? 'ad'
        : creativeId
          ? 'creative'
          : adSetId
            ? 'adSet'
            : options.reportType === 'device' && device
              ? 'device'
              : campaignId
                ? 'campaign'
                : 'account',
      accountId:
        options.accountId ??
        pickString(row, ['account_id', 'accountId']) ??
        optionalString(root.accountId),
      campaignId,
      campaignName: pickString(row, ['campaign_name', 'campaignName']),
      adSetId,
      adSetName: pickString(row, ['adset_name', 'adSetName']),
      adId,
      adName: pickString(row, ['ad_name', 'adName']),
      creativeId,
      creativeName,
      creativeStatus: pickString(row, ['status', 'effective_status', 'configured_status']),
      creativeAssetType,
      creativeHeadline: creativeNestedString(row, ['title', 'headline', 'name']),
      creativeBody: creativeNestedString(row, ['body', 'message', 'text']),
      creativeImageUrl: creativeNestedString(row, ['image_url', 'imageUrl', 'url']),
      creativeThumbnailUrl: creativeNestedString(row, ['thumbnail_url', 'thumbnailUrl']),
      creativeVideoId: creativeNestedString(row, ['video_id', 'videoId']),
      creativeDestinationUrl: creativeNestedString(row, ['link', 'link_url', 'website_url', 'url']),
      creativeCallToActionType: creativeNestedString(row, ['call_to_action_type', 'type']),
      creativeUrlTags: pickString(row, ['url_tags', 'urlTags']),
      device,
      currency: pickString(row, ['account_currency', 'currency']),
      metrics: compactMetrics({
        impressions: pickNumber(row, ['impressions']),
        clicks: pickNumber(row, ['clicks', 'inline_link_clicks']),
        cost: pickNumber(row, ['spend', 'cost']),
        conversions: pickNumber(row, ['conversions']) ?? sumActions(row.actions),
        conversionValue: pickNumber(row, ['conversion_value']) ?? sumActions(row.action_values),
      }),
    } satisfies MarketingProviderReportArtifact['records'][number];
  });

  return {
    version: 1,
    platformId: options.platformId,
    appId: options.appId,
    provider: 'metaAds',
    reportType: options.reportType,
    source: options.source,
    accountId: options.accountId ?? optionalString(root.accountId),
    pulledAt: options.pulledAt,
    window: resolveWindow(value, options),
    partial: Boolean(root.partial),
    records,
  };
}
