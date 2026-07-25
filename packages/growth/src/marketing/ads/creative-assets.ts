import {
  marketingCreativeAssetSchema,
  type MarketingCreativeAsset,
  type MarketingCreativeAssetType,
  type MarketingCreativePolicyStatus,
} from '../schema/ads-creative.js';
import type { MarketingAdsPlanCandidate } from '../schema/ads-plan.js';
import type {
  MarketingProviderReportArtifact,
  MarketingProviderReportRecord,
} from '../schema/report.js';

export function planMarketingCreativeAssets(
  candidates: MarketingAdsPlanCandidate[],
): MarketingCreativeAsset[] {
  return candidates.flatMap((candidate) => {
    const destinationUrl = candidate.utm.finalUrl ?? candidate.landingPageUrl;
    const landingPageVariant = marketingCreativeAssetSchema.parse({
      id: `landing-page-variant:${candidate.provider}:${candidate.strategyObjectId}`,
      provider: candidate.provider,
      source: 'planned',
      assetType: 'landing_page_variant',
      approvalStatus: 'draft',
      policyStatus: 'needs_review',
      owner: candidate.strategyObjectId,
      strategyObjectId: candidate.strategyObjectId,
      name: `${candidate.name} landing page`,
      destinationUrl,
      urlTags: renderUtmTags(candidate),
    });

    if (candidate.provider === 'googleAds') {
      return [
        landingPageVariant,
        marketingCreativeAssetSchema.parse({
          id: `text-ad:${candidate.provider}:${candidate.strategyObjectId}`,
          provider: candidate.provider,
          source: 'planned',
          assetType: 'text_ad',
          approvalStatus: 'draft',
          policyStatus: 'needs_review',
          owner: candidate.strategyObjectId,
          strategyObjectId: candidate.strategyObjectId,
          name: `${candidate.name} search ad`,
          headline: candidate.name,
          body: 'Draft search copy requires human review before provider mutation.',
          destinationUrl,
          urlTags: renderUtmTags(candidate),
        }),
      ];
    }

    return [
      landingPageVariant,
      marketingCreativeAssetSchema.parse({
        id: `image-ad:${candidate.provider}:${candidate.strategyObjectId}`,
        provider: candidate.provider,
        source: 'planned',
        assetType: 'image',
        approvalStatus: 'draft',
        policyStatus: 'needs_review',
        owner: candidate.strategyObjectId,
        strategyObjectId: candidate.strategyObjectId,
        name: `${candidate.name} paid social creative`,
        headline: candidate.name,
        body: 'Draft paid social creative requires image/video asset review before provider mutation.',
        destinationUrl,
        urlTags: renderUtmTags(candidate),
      }),
    ];
  });
}

export function creativeAssetsFromProviderArtifact(
  artifact: MarketingProviderReportArtifact,
): MarketingCreativeAsset[] {
  return artifact.records.flatMap((record) => {
    if (!record.creativeId) return [];
    return [
      marketingCreativeAssetSchema.parse({
        id: `provider:${artifact.provider}:${record.creativeId}`,
        provider: artifact.provider,
        source: 'provider-pull',
        assetType: mapAssetType(record),
        approvalStatus: 'reviewed',
        policyStatus: mapPolicyStatus(record.creativeStatus),
        owner: record.campaignId ?? record.adSetId ?? record.creativeId,
        campaignId: record.campaignId,
        adSetId: record.adSetId,
        creativeId: record.creativeId,
        name: record.creativeName ?? record.name,
        headline: record.creativeHeadline,
        body: record.creativeBody,
        imageUrl: record.creativeImageUrl,
        thumbnailUrl: record.creativeThumbnailUrl,
        videoId: record.creativeVideoId,
        destinationUrl: record.creativeDestinationUrl,
        callToActionType: record.creativeCallToActionType,
        urlTags: record.creativeUrlTags,
        providerStatus: record.creativeStatus,
      }),
    ];
  });
}

function renderUtmTags(candidate: MarketingAdsPlanCandidate): string {
  return [
    ['utm_source', candidate.utm.source],
    ['utm_medium', candidate.utm.medium],
    ['utm_campaign', candidate.utm.campaign],
    ['utm_content', candidate.utm.content],
    ['utm_term', candidate.utm.term],
  ]
    .filter((entry): entry is [string, string] => Boolean(entry[1]))
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');
}

function mapAssetType(record: MarketingProviderReportRecord): MarketingCreativeAssetType {
  const rawType = record.creativeAssetType?.toLowerCase() ?? '';
  if (record.creativeVideoId || rawType.includes('video')) return 'video';
  if (record.creativeImageUrl || record.creativeThumbnailUrl || rawType.includes('image')) {
    return 'image';
  }
  if (rawType.includes('carousel')) return 'carousel';
  if (record.creativeHeadline || record.creativeBody) return 'text_ad';
  return 'unknown';
}

function mapPolicyStatus(status: string | undefined): MarketingCreativePolicyStatus {
  const normalized = status?.trim().toLowerCase();
  if (!normalized) return 'unknown';
  if (normalized.includes('disapproved') || normalized.includes('rejected')) return 'disapproved';
  if (normalized.includes('limited')) return 'limited';
  if (['active', 'eligible', 'approved'].includes(normalized)) return 'eligible';
  if (normalized.includes('review')) return 'needs_review';
  return 'unknown';
}
