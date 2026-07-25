import path from 'node:path';
import type {
  MarketingConfirmedConversionArtifact,
  MarketingConfirmedConversionRecord,
  MarketingProviderReportArtifact,
  MarketingProviderReportRecord,
  MarketingReportMetrics,
  MarketingReportProvider,
  MarketingStrategyObject,
} from '../schema/report.js';
import { readLatestMarketingConfirmedConversionArtifact } from './confirmed-conversions.js';
import { readLatestMarketingProviderReportArtifacts } from './provider-pulls.js';
import {
  readLatestMarketingStrategyMapArtifact,
  readMarketingStrategyMapStatus,
  type MarketingStrategyMapStatus,
  type MarketingStrategyMapStatusOptions,
} from './strategy-map.js';
import { addConfirmedConversionMetrics, addProviderRecordMetrics } from './metrics.js';

export type MarketingStrategyObjectJoin = {
  object: MarketingStrategyObject;
  metrics: {
    ads: MarketingReportMetrics;
    analytics: MarketingReportMetrics;
    seo: MarketingReportMetrics;
    confirmed: MarketingReportMetrics;
  };
  matches: {
    adsRecords: number;
    analyticsRecords: number;
    seoRecords: number;
    confirmedRecords: number;
    providers: MarketingReportProvider[];
  };
  dimensions: {
    creativeIds: string[];
    audienceIds: string[];
    audienceNames: string[];
    utmSources: string[];
    utmMediums: string[];
    utmCampaigns: string[];
    utmContents: string[];
    utmTerms: string[];
    experimentIds: string[];
  };
  reconciliation: {
    status: 'ready' | 'missing_unisane_truth' | 'provider_missing' | 'mismatch';
    conversionDelta?: number;
    conversionValueDelta?: number;
    message: string;
  };
  gaps: string[];
};

export type MarketingStrategyObjectReport = {
  status: 'available' | 'missing' | 'error';
  freshness: MarketingStrategyMapStatus;
  objectCount: number;
  objects: MarketingStrategyObjectJoin[];
  gaps: string[];
};

function normalized(value: string | undefined): string | undefined {
  const trimmed = value?.trim().toLowerCase();
  return trimmed ? trimmed : undefined;
}

function hasString(values: string[], value: string | undefined): boolean {
  const normalizedValue = normalized(value);
  if (!normalizedValue) return false;
  return values.some((entry) => normalized(entry) === normalizedValue);
}

function pagePath(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    return new URL(value, 'https://unisane.local').pathname.replace(/\/$/, '') || '/';
  } catch {
    return value.replace(/\/$/, '');
  }
}

function samePage(left: string | undefined, right: string | undefined): boolean {
  if (!left || !right) return false;
  return normalized(left) === normalized(right) || pagePath(left) === pagePath(right);
}

function addValue(values: Set<string>, value: string | undefined): void {
  const normalizedValue = value?.trim();
  if (normalizedValue) values.add(normalizedValue);
}

function objectCampaignIds(object: MarketingStrategyObject): string[] {
  return object.kind === 'campaign' ? [object.id, ...object.campaignIds] : object.campaignIds;
}

function recordMatchesObject(
  record: MarketingProviderReportRecord,
  object: MarketingStrategyObject,
): boolean {
  return (
    hasString(objectCampaignIds(object), record.campaignId) ||
    hasString(object.campaignNames, record.campaignName) ||
    hasString(object.adGroupIds, record.adGroupId) ||
    hasString(object.adSetIds, record.adSetId) ||
    hasString(object.adIds, record.adId) ||
    hasString(object.creativeIds, record.creativeId) ||
    hasString(object.audienceIds, record.audienceId) ||
    hasString(object.audienceNames, record.audienceName) ||
    hasString(object.experimentIds, record.experimentId) ||
    hasString(object.utmSources, record.utmSource) ||
    hasString(object.utmMediums, record.utmMedium) ||
    hasString(object.utmCampaigns, record.utmCampaign) ||
    hasString(object.utmContents, record.utmContent) ||
    hasString(object.utmTerms, record.utmTerm) ||
    hasString(object.keywords, record.keyword) ||
    hasString(object.queries, record.query) ||
    hasString(object.conversionIds, record.conversionId) ||
    samePage(object.landingPageUrl, record.pageUrl)
  );
}

function confirmedRecordMatchesObject(
  record: MarketingConfirmedConversionRecord,
  object: MarketingStrategyObject,
): boolean {
  return (
    hasString(object.conversionIds, record.conversionId) ||
    hasString(objectCampaignIds(object), record.campaignId) ||
    hasString(object.campaignNames, record.campaignName) ||
    samePage(object.landingPageUrl, record.pageUrl)
  );
}

function reconcileObjectMetrics(input: {
  ads: MarketingReportMetrics;
  confirmed: MarketingReportMetrics;
}): MarketingStrategyObjectJoin['reconciliation'] {
  if (input.confirmed.conversions === undefined && input.confirmed.conversionValue === undefined) {
    return {
      status: 'missing_unisane_truth',
      message: 'No Unisane-confirmed conversion truth matched this strategy object.',
    };
  }
  if (input.ads.conversions === undefined && input.ads.conversionValue === undefined) {
    return {
      status: 'provider_missing',
      message: 'No provider conversion metrics matched this strategy object.',
    };
  }
  const conversionDelta =
    input.ads.conversions === undefined
      ? undefined
      : input.ads.conversions - (input.confirmed.conversions ?? 0);
  const conversionValueDelta =
    input.ads.conversionValue === undefined
      ? undefined
      : input.ads.conversionValue - (input.confirmed.conversionValue ?? 0);
  const mismatch =
    (conversionDelta !== undefined && Math.abs(conversionDelta) > 0) ||
    (conversionValueDelta !== undefined && Math.abs(conversionValueDelta) > 0.01);
  return {
    status: mismatch ? 'mismatch' : 'ready',
    conversionDelta,
    conversionValueDelta,
    message: mismatch
      ? 'Provider and Unisane-confirmed metrics differ for this strategy object.'
      : 'Provider and Unisane-confirmed metrics match for this strategy object.',
  };
}

function gapIds(input: {
  object: MarketingStrategyObject;
  adsRecords: number;
  analyticsRecords: number;
  seoRecords: number;
  confirmedRecords: number;
}): string[] {
  const gaps: string[] = [];
  if (input.object.kind !== 'offer' && input.adsRecords === 0) gaps.push('missing_ads_data');
  if (input.analyticsRecords === 0) gaps.push('missing_analytics_data');
  if (['landingPage', 'keyword', 'offer'].includes(input.object.kind) && input.seoRecords === 0) {
    gaps.push('missing_seo_data');
  }
  if (input.object.conversionIds.length > 0 && input.confirmedRecords === 0) {
    gaps.push('missing_confirmed_conversions');
  }
  return gaps;
}

function joinStrategyObject(input: {
  object: MarketingStrategyObject;
  providerArtifacts: MarketingProviderReportArtifact[];
  confirmedArtifact?: MarketingConfirmedConversionArtifact;
}): MarketingStrategyObjectJoin {
  const ads: MarketingReportMetrics = {};
  const analytics: MarketingReportMetrics = {};
  const seo: MarketingReportMetrics = {};
  const confirmed: MarketingReportMetrics = {};
  const providers = new Set<MarketingReportProvider>();
  let adsRecords = 0;
  let analyticsRecords = 0;
  let seoRecords = 0;
  let confirmedRecords = 0;
  const creativeIds = new Set(input.object.creativeIds);
  const audienceIds = new Set(input.object.audienceIds);
  const audienceNames = new Set(input.object.audienceNames);
  const utmSources = new Set(input.object.utmSources);
  const utmMediums = new Set(input.object.utmMediums);
  const utmCampaigns = new Set(input.object.utmCampaigns);
  const utmContents = new Set(input.object.utmContents);
  const utmTerms = new Set(input.object.utmTerms);
  const experimentIds = new Set(input.object.experimentIds);

  for (const artifact of input.providerArtifacts) {
    for (const record of artifact.records) {
      if (!recordMatchesObject(record, input.object)) continue;
      providers.add(artifact.provider);
      addValue(creativeIds, record.creativeId);
      addValue(audienceIds, record.audienceId);
      addValue(audienceNames, record.audienceName);
      addValue(utmSources, record.utmSource);
      addValue(utmMediums, record.utmMedium);
      addValue(utmCampaigns, record.utmCampaign);
      addValue(utmContents, record.utmContent);
      addValue(utmTerms, record.utmTerm);
      addValue(experimentIds, record.experimentId);
      if (artifact.provider === 'googleAds' || artifact.provider === 'metaAds') {
        adsRecords += 1;
        addProviderRecordMetrics(ads, record);
      } else if (artifact.provider === 'ga4') {
        analyticsRecords += 1;
        addProviderRecordMetrics(analytics, record);
      } else if (artifact.provider === 'searchConsole') {
        seoRecords += 1;
        addProviderRecordMetrics(seo, record);
      }
    }
  }

  for (const record of input.confirmedArtifact?.records ?? []) {
    if (!confirmedRecordMatchesObject(record, input.object)) continue;
    confirmedRecords += 1;
    addConfirmedConversionMetrics(confirmed, record);
  }

  return {
    object: input.object,
    metrics: { ads, analytics, seo, confirmed },
    matches: {
      adsRecords,
      analyticsRecords,
      seoRecords,
      confirmedRecords,
      providers: [...providers].sort(),
    },
    dimensions: {
      creativeIds: [...creativeIds].sort(),
      audienceIds: [...audienceIds].sort(),
      audienceNames: [...audienceNames].sort(),
      utmSources: [...utmSources].sort(),
      utmMediums: [...utmMediums].sort(),
      utmCampaigns: [...utmCampaigns].sort(),
      utmContents: [...utmContents].sort(),
      utmTerms: [...utmTerms].sort(),
      experimentIds: [...experimentIds].sort(),
    },
    reconciliation: reconcileObjectMetrics({ ads, confirmed }),
    gaps: gapIds({
      object: input.object,
      adsRecords,
      analyticsRecords,
      seoRecords,
      confirmedRecords,
    }),
  };
}

export function buildMarketingStrategyObjectReport(
  options: MarketingStrategyMapStatusOptions = {},
): MarketingStrategyObjectReport {
  const freshness = readMarketingStrategyMapStatus(options);
  if (freshness.status === 'missing') {
    return {
      status: 'missing',
      freshness,
      objectCount: 0,
      objects: [],
      gaps: ['missing_strategy_map'],
    };
  }
  if (freshness.status === 'error') {
    return {
      status: 'error',
      freshness,
      objectCount: 0,
      objects: [],
      gaps: ['invalid_strategy_map'],
    };
  }

  const cwd = path.resolve(options.cwd ?? process.cwd());
  const artifact = readLatestMarketingStrategyMapArtifact({ cwd });
  if (!artifact) {
    return {
      status: 'missing',
      freshness,
      objectCount: 0,
      objects: [],
      gaps: ['missing_strategy_map'],
    };
  }
  const providerArtifacts = readLatestMarketingProviderReportArtifacts({ cwd });
  const confirmedArtifact = readLatestMarketingConfirmedConversionArtifact({ cwd });
  const objects = artifact.objects.map((object) =>
    joinStrategyObject({ object, providerArtifacts, confirmedArtifact }),
  );
  return {
    status: 'available',
    freshness,
    objectCount: objects.length,
    objects,
    gaps: [...new Set(objects.flatMap((object) => object.gaps))].sort(),
  };
}
