import {
  deriveMarketingMetrics,
  type MarketingAdsAuditReport,
  type MarketingProviderReportRecord,
  type MarketingReportMetrics,
} from '@unisane/growth/marketing';
import type {
  MarketingConsoleAdvertising,
  MarketingConsoleAdvertisingCampaign,
  MarketingConsoleAdvertisingChange,
  MarketingConsoleCampaignPauseReview,
  MarketingConsoleAdvertisingConversion,
  MarketingConsoleAdvertisingEntity,
  MarketingConsoleAdvertisingView,
  MarketingConsoleFreshnessCell,
  MarketingConsoleMetric,
  MarketingConsoleReceiptEvent,
  MarketingConsoleSourceSummary,
  MarketingConsoleStatus,
} from './contracts.js';

type AdvertisingProvider = 'googleAds' | 'metaAds';

type ProviderRows = {
  campaigns: MarketingProviderReportRecord[];
  conversions?: MarketingProviderReportRecord[];
  adSets?: MarketingProviderReportRecord[];
  ads?: MarketingProviderReportRecord[];
  creatives?: MarketingProviderReportRecord[];
};

export type BuildMarketingConsoleAdvertisingInput = {
  googleAds: ProviderRows;
  metaAds: ProviderRows;
  freshness: MarketingConsoleFreshnessCell[];
  receipts: MarketingConsoleReceiptEvent[];
  audit?: MarketingAdsAuditReport;
  campaignPauseApprovalAvailable?: boolean;
  campaignPauseReviews?: MarketingConsoleCampaignPauseReview[];
};

const providerLabels: Record<AdvertisingProvider, string> = {
  googleAds: 'Google Ads',
  metaAds: 'Meta Ads',
};

export function buildMarketingConsoleAdvertising(
  input: BuildMarketingConsoleAdvertisingInput,
): MarketingConsoleAdvertising {
  const changes = buildChanges(input.receipts);
  const google = buildProviderView('googleAds', input.googleAds, input.freshness, changes);
  const meta = buildProviderView('metaAds', input.metaAds, input.freshness, changes);
  const combined = buildCombinedView([google, meta]);
  return {
    combined,
    providers: [google, meta],
    campaignPauseApprovalAvailable: input.campaignPauseApprovalAvailable ?? false,
    campaignPauseReviews: input.campaignPauseReviews ?? [],
    auditSections: (input.audit?.sections ?? []).map((section) => ({
      id: section.id,
      label: section.label,
      status: auditStatus(section.status),
      summary: section.summary,
    })),
  };
}

function buildProviderView(
  provider: AdvertisingProvider,
  rows: ProviderRows,
  freshness: MarketingConsoleFreshnessCell[],
  allChanges: MarketingConsoleAdvertisingChange[],
): MarketingConsoleAdvertisingView & { scope: AdvertisingProvider } {
  const source = sourceSummary(provider, freshness);
  const campaigns = rows.campaigns
    .map((record) => campaignFromRecord(provider, record))
    .sort((left, right) => right.spend - left.spend || right.clicks - left.clicks);
  const conversions =
    provider === 'googleAds'
      ? (rows.conversions ?? []).map((record) => conversionFromGoogleRecord(record))
      : metaConversionSummary(campaigns);
  const adSets = provider === 'metaAds' ? entitiesFromRecords(rows.adSets ?? [], 'adSet') : [];
  const ads = provider === 'metaAds' ? entitiesFromRecords(rows.ads ?? [], 'ad') : [];
  const creatives =
    provider === 'metaAds' ? entitiesFromRecords(rows.creatives ?? [], 'creative') : [];
  const metrics = metricsForCampaigns(campaigns, [source]);
  const spend = campaigns.reduce((total, campaign) => total + campaign.spend, 0);
  const conversionCount = campaigns.reduce((total, campaign) => total + campaign.conversions, 0);
  return {
    scope: provider,
    label: providerLabels[provider],
    sources: [source],
    headline: headline(campaigns.length, spend, conversionCount, source),
    detail: detail(campaigns.length, spend, conversionCount, source),
    metrics,
    campaigns,
    conversions,
    changeHistory: allChanges.filter((change) => change.provider === provider),
    adSets,
    ads,
    creatives,
  };
}

function buildCombinedView(
  providers: Array<MarketingConsoleAdvertisingView & { scope: AdvertisingProvider }>,
): MarketingConsoleAdvertisingView {
  const campaigns = providers.flatMap((provider) => provider.campaigns);
  const sources = providers.flatMap((provider) => provider.sources);
  const connectedSources = sources.filter((source) => source.available);
  const sampleSources = connectedSources.filter((source) => source.sourceKind === 'fixture');
  return {
    scope: 'all',
    label: 'All advertising',
    sources,
    headline: campaigns.length
      ? `${campaigns.length} campaigns are available across ${connectedSources.length || 1} advertising platform${connectedSources.length === 1 ? '' : 's'}.`
      : 'No advertising campaign evidence is available.',
    detail: sampleSources.length
      ? 'Combined results include explicitly labelled sample evidence. Use provider views before making account or spend decisions.'
      : campaigns.length
        ? 'Compare providers only where currency, freshness, and conversion measurement are compatible.'
        : 'Connect an advertising platform or load labelled sample evidence to validate the workspace.',
    metrics: metricsForCampaigns(campaigns, sources),
    campaigns,
    conversions: providers.flatMap((provider) => provider.conversions),
    changeHistory: providers.flatMap((provider) => provider.changeHistory),
    adSets: providers.flatMap((provider) => provider.adSets),
    ads: providers.flatMap((provider) => provider.ads),
    creatives: providers.flatMap((provider) => provider.creatives),
  };
}

function campaignFromRecord(
  provider: AdvertisingProvider,
  record: MarketingProviderReportRecord,
): MarketingConsoleAdvertisingCampaign {
  const metrics = record.metrics;
  const derived = deriveMarketingMetrics(metrics);
  return {
    id: `${provider}:${record.campaignId ?? record.id}`,
    provider,
    providerLabel: providerLabels[provider],
    name: record.campaignName ?? record.name ?? 'Unnamed campaign',
    ...(record.campaignStatus || record.creativeStatus
      ? { deliveryStatus: record.campaignStatus ?? record.creativeStatus }
      : {}),
    ...(record.campaignPrimaryStatus ? { primaryStatus: record.campaignPrimaryStatus } : {}),
    primaryStatusReasons: record.campaignPrimaryStatusReasons ?? [],
    ...(record.campaignServingStatus ? { servingStatus: record.campaignServingStatus } : {}),
    ...(record.campaignAdvertisingChannelType
      ? { channelType: record.campaignAdvertisingChannelType }
      : {}),
    ...(record.campaignDailyBudget !== undefined
      ? { dailyBudget: record.campaignDailyBudget }
      : {}),
    ...(record.campaignBudgetStatus ? { budgetStatus: record.campaignBudgetStatus } : {}),
    ...(record.campaignBudgetShared !== undefined
      ? { sharedBudget: record.campaignBudgetShared }
      : {}),
    ...(record.campaignBiddingStrategyType
      ? { biddingStrategy: record.campaignBiddingStrategyType }
      : {}),
    ...(record.campaignBiddingStrategySystemStatus
      ? { biddingStrategyStatus: record.campaignBiddingStrategySystemStatus }
      : {}),
    ...(record.campaignStartDate ? { startDate: record.campaignStartDate } : {}),
    ...(record.campaignEndDate ? { endDate: record.campaignEndDate } : {}),
    spend: metrics.cost ?? 0,
    impressions: metrics.impressions ?? 0,
    clicks: metrics.clicks ?? 0,
    conversions: metrics.conversions ?? 0,
    conversionValue: metrics.conversionValue ?? 0,
    ...(record.currency ? { currencyCode: record.currency } : {}),
    ...(derived.ctr !== undefined ? { ctr: derived.ctr } : {}),
    ...(derived.cpc !== undefined ? { cpc: derived.cpc } : {}),
    ...(derived.cpa !== undefined ? { cpa: derived.cpa } : {}),
    ...(derived.roas !== undefined ? { roas: derived.roas } : {}),
  };
}

function conversionFromGoogleRecord(
  record: MarketingProviderReportRecord,
): MarketingConsoleAdvertisingConversion {
  return {
    id: `googleAds:${record.conversionId ?? record.id}`,
    provider: 'googleAds',
    providerLabel: 'Google Ads',
    name: record.conversionName ?? record.name ?? 'Unnamed conversion',
    ...(record.metrics.conversions !== undefined
      ? { conversions: record.metrics.conversions }
      : {}),
    ...(record.metrics.conversionValue !== undefined
      ? { conversionValue: record.metrics.conversionValue }
      : {}),
    ...(record.currency ? { currencyCode: record.currency } : {}),
    measurementLabel:
      record.metrics.conversions === undefined
        ? 'Configured; this report does not include outcome counts'
        : 'Outcome count reported by Google Ads',
  };
}

function metaConversionSummary(
  campaigns: MarketingConsoleAdvertisingCampaign[],
): MarketingConsoleAdvertisingConversion[] {
  if (!campaigns.length) return [];
  const conversions = campaigns.reduce((total, campaign) => total + campaign.conversions, 0);
  const conversionValue = campaigns.reduce(
    (total, campaign) => total + campaign.conversionValue,
    0,
  );
  const currencies = uniqueCurrencies(campaigns);
  return [
    {
      id: 'metaAds:reported-actions',
      provider: 'metaAds',
      providerLabel: 'Meta Ads',
      name: 'Meta attributed actions',
      conversions,
      conversionValue,
      ...(currencies.length === 1 ? { currencyCode: currencies[0] } : {}),
      measurementLabel:
        'Aggregate actions reported by Meta campaign evidence; canonical conversion reconciliation remains separate.',
    },
  ];
}

function entitiesFromRecords(
  records: MarketingProviderReportRecord[],
  level: MarketingConsoleAdvertisingEntity['level'],
): MarketingConsoleAdvertisingEntity[] {
  return records
    .map((record) => {
      const metrics = record.metrics;
      const derived = deriveMarketingMetrics(metrics);
      const id =
        level === 'adSet' ? record.adSetId : level === 'ad' ? record.adId : record.creativeId;
      const name =
        level === 'adSet' ? record.adSetName : level === 'ad' ? record.adName : record.creativeName;
      return {
        id: `metaAds:${level}:${id ?? record.id}`,
        provider: 'metaAds' as const,
        providerLabel: 'Meta Ads' as const,
        level,
        name: name ?? record.name ?? `Unnamed ${level}`,
        ...(record.campaignName ? { campaignName: record.campaignName } : {}),
        ...(record.adSetName ? { adSetName: record.adSetName } : {}),
        ...(record.creativeStatus ? { deliveryStatus: record.creativeStatus } : {}),
        ...(record.creativeAssetType ? { assetType: record.creativeAssetType } : {}),
        ...(record.creativeHeadline ? { headline: record.creativeHeadline } : {}),
        ...(record.creativeBody ? { body: record.creativeBody } : {}),
        ...(record.creativeDestinationUrl ? { destinationUrl: record.creativeDestinationUrl } : {}),
        spend: metrics.cost ?? 0,
        impressions: metrics.impressions ?? 0,
        clicks: metrics.clicks ?? 0,
        conversions: metrics.conversions ?? 0,
        conversionValue: metrics.conversionValue ?? 0,
        ...(record.currency ? { currencyCode: record.currency } : {}),
        ...(derived.ctr !== undefined ? { ctr: derived.ctr } : {}),
        ...(derived.cpc !== undefined ? { cpc: derived.cpc } : {}),
        ...(derived.cpa !== undefined ? { cpa: derived.cpa } : {}),
        ...(derived.roas !== undefined ? { roas: derived.roas } : {}),
      };
    })
    .sort((left, right) => right.spend - left.spend || right.clicks - left.clicks);
}

function metricsForCampaigns(
  campaigns: MarketingConsoleAdvertisingCampaign[],
  sources: MarketingConsoleSourceSummary[],
): MarketingConsoleMetric[] {
  if (!campaigns.length) return [];
  const totals: MarketingReportMetrics = {
    impressions: campaigns.reduce((total, campaign) => total + campaign.impressions, 0),
    clicks: campaigns.reduce((total, campaign) => total + campaign.clicks, 0),
    cost: campaigns.reduce((total, campaign) => total + campaign.spend, 0),
    conversions: campaigns.reduce((total, campaign) => total + campaign.conversions, 0),
    conversionValue: campaigns.reduce((total, campaign) => total + campaign.conversionValue, 0),
  };
  const currencies = uniqueCurrencies(campaigns);
  const currencyCode = currencies.length === 1 ? currencies[0] : undefined;
  const comparableMoney = currencies.length <= 1;
  const derived = deriveMarketingMetrics(
    comparableMoney
      ? totals
      : {
          impressions: totals.impressions,
          clicks: totals.clicks,
          conversions: totals.conversions,
        },
  );
  const sourceLabel = sources.map((source) => source.label).join(' + ') || 'Advertising';
  const freshnessLabel = sources.some((source) => source.sourceKind === 'fixture')
    ? 'Includes sample data'
    : sources.map((source) => source.freshnessLabel).join(' · ');
  const status = combinedStatus(sources.map((source) => source.status));
  const metric = (
    id: string,
    label: string,
    numericValue: number | undefined,
    value: string,
    definition: string,
    currency?: string,
  ): MarketingConsoleMetric => ({
    id,
    label,
    value,
    ...(numericValue !== undefined ? { numericValue } : {}),
    ...(currency ? { currencyCode: currency } : {}),
    definition,
    sourceLabel,
    freshnessLabel,
    comparisonLabel: 'Provider comparison is shown without a previous-period baseline.',
    status,
  });
  return [
    ...(comparableMoney
      ? [
          metric(
            'spend',
            'Advertising spend',
            totals.cost,
            money(totals.cost, currencyCode),
            'Cost reported by the selected advertising platform scope.',
            currencyCode,
          ),
        ]
      : []),
    metric(
      'paid-impressions',
      'Advertising impressions',
      totals.impressions,
      number(totals.impressions),
      'Times campaigns were shown across the selected advertising platform scope.',
    ),
    metric(
      'paid-clicks',
      'Advertising clicks',
      totals.clicks,
      number(totals.clicks),
      'Clicks reported by campaigns in the selected advertising platform scope.',
    ),
    metric(
      'paid-conversions',
      'Advertising conversions',
      totals.conversions,
      number(totals.conversions),
      'Provider-attributed outcomes; canonical conversion reconciliation remains separate.',
    ),
    ...(comparableMoney
      ? [
          metric(
            'roas',
            'Return on ad spend',
            derived.roas,
            derived.roas === undefined ? 'Not available' : `${derived.roas.toFixed(2)}×`,
            'Reported conversion value divided by advertising spend.',
          ),
        ]
      : []),
  ];
}

function sourceSummary(
  provider: AdvertisingProvider,
  freshness: MarketingConsoleFreshnessCell[],
): MarketingConsoleSourceSummary {
  const source = freshness.find(
    (cell) => cell.provider === provider && cell.reportType === 'campaign',
  );
  const sample = source?.sourceKind === 'fixture';
  return {
    provider,
    ...(source?.sourceKind ? { sourceKind: source.sourceKind } : {}),
    status: source?.status ?? 'missing',
    label: providerLabels[provider],
    freshnessLabel: sample ? 'Sample data' : freshnessLabel(source),
    detail: sample
      ? `${providerLabels[provider]} sample evidence is loaded for interface and workflow validation. It is not connected account data.`
      : (source?.message ??
        `Connect ${providerLabels[provider]} and pull campaign reports before evaluating paid performance.`),
    available: Boolean(source?.path && source.recordCount),
  };
}

function buildChanges(
  receipts: MarketingConsoleReceiptEvent[],
): MarketingConsoleAdvertisingChange[] {
  return receipts
    .filter((receipt) => receipt.lane === 'ads')
    .map((receipt) => {
      const provider =
        receipt.providerLabel === 'Meta Ads'
          ? ('metaAds' as const)
          : receipt.providerLabel === 'Google Ads'
            ? ('googleAds' as const)
            : undefined;
      return {
        id: receipt.id,
        ...(provider ? { provider, providerLabel: providerLabels[provider] } : {}),
        title: humanizeAction(receipt.action),
        summary:
          receipt.status === 'ready'
            ? 'The recorded advertising change completed successfully.'
            : receipt.message,
        status: receipt.status,
        ...(receipt.timestamp ? { timestamp: receipt.timestamp } : {}),
      };
    });
}

function headline(
  campaignCount: number,
  spend: number,
  conversions: number,
  source: MarketingConsoleSourceSummary,
): string {
  if (campaignCount === 0) return `No ${source.label} campaign results are available yet.`;
  if (source.status !== 'ready') {
    return `${campaignCount} historical ${source.label} campaign${campaignCount === 1 ? '' : 's'} ${campaignCount === 1 ? 'needs' : 'need'} fresh evidence.`;
  }
  if (spend > 0 && conversions === 0) {
    return `${source.label} traffic is arriving, but no advertising conversions are recorded.`;
  }
  return `${campaignCount} ${source.label} campaign${campaignCount === 1 ? '' : 's'} have usable performance evidence.`;
}

function detail(
  campaignCount: number,
  spend: number,
  conversions: number,
  source: MarketingConsoleSourceSummary,
): string {
  if (source.sourceKind === 'fixture') {
    return 'Use this sample evidence to validate layout, hierarchy, and workflow only. Do not use it for spend decisions.';
  }
  if (campaignCount === 0) {
    return `Connect ${source.label} and refresh campaign data before comparing performance.`;
  }
  if (source.status !== 'ready') {
    return `The last usable campaign report is ${source.freshnessLabel.toLowerCase()}. Treat its spend, clicks, and conversions as historical context.`;
  }
  if (spend > 0 && conversions === 0) {
    return 'Review conversion measurement before increasing spend; a zero here is a reported result, not missing data.';
  }
  return 'Compare spend with attributed outcomes, then act on the highest-confidence recommendation.';
}

function freshnessLabel(cell: MarketingConsoleFreshnessCell | undefined): string {
  if (!cell) return 'No usable campaign report';
  if (cell.ageDays === 0) return 'Updated today';
  if (cell.ageDays !== undefined) {
    return `${cell.ageDays} day${cell.ageDays === 1 ? '' : 's'} old`;
  }
  return cell.status === 'ready' ? 'Current' : 'Update needed';
}

function uniqueCurrencies(campaigns: MarketingConsoleAdvertisingCampaign[]): string[] {
  return [
    ...new Set(
      campaigns
        .map((campaign) => campaign.currencyCode)
        .filter((currency): currency is string => Boolean(currency)),
    ),
  ];
}

function combinedStatus(statuses: MarketingConsoleStatus[]): MarketingConsoleStatus {
  if (statuses.includes('blocked')) return 'blocked';
  if (statuses.includes('warn')) return 'warn';
  if (statuses.includes('missing')) return 'missing';
  return 'ready';
}

function auditStatus(status: 'pass' | 'warn' | 'error'): MarketingConsoleStatus {
  if (status === 'pass') return 'ready';
  if (status === 'error') return 'blocked';
  return 'warn';
}

function number(value: number | undefined): string {
  return value === undefined ? 'Not available' : value.toLocaleString('en-US');
}

function money(value: number | undefined, currencyCode?: string): string {
  if (value === undefined) return 'Not available';
  if (!currencyCode) return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 2,
  }).format(value);
}

function humanizeAction(action: string): string {
  return action
    .replace(/^ads[._-]?/i, '')
    .replace(/[-_.]+/g, ' ')
    .replace(/\breceipt\b/gi, '')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .trim();
}
