import {
  type MarketingAdsPlanAction,
  type MarketingAdsPlanCandidate,
  type MarketingAdsPlanKeyword,
  type MarketingAdsPlanProvider,
  type MarketingMetaAdsBuildout,
} from '../schema/ads-plan.js';
import type { MarketingStrategyObjectJoin } from '../reports/strategy-object-report.js';
import {
  marketingAdsBidStrategy,
  marketingAdsBudgetGuardrail,
  marketingAdsUtmFor,
  marketingGoogleAdsSearchSettings,
} from './plan-policy.js';
import type { MarketingExecutionContext } from '../schema/execution-context.js';

export type PlanMarketingAdsCandidateOptions = {
  provider: MarketingAdsPlanProvider;
  config: MarketingExecutionContext;
  objectJoin: MarketingStrategyObjectJoin;
  dailyBudgetAmount?: number;
  currency?: string;
};

const sharedNegativeKeywords = [
  { text: 'free download', reason: 'Often attracts file-only traffic with weak conversion fit.' },
  { text: 'definition', reason: 'Dictionary intent should not spend paid budget.' },
  { text: 'meaning', reason: 'Definition intent should stay outside paid campaigns.' },
];

function countryCodesForCurrency(currency: string | undefined): string[] {
  const normalized = currency?.trim().toUpperCase();
  if (normalized === 'INR') return ['IN'];
  if (normalized === 'USD') return ['US'];
  return ['IN'];
}

function keywordCandidates(objectJoin: MarketingStrategyObjectJoin): MarketingAdsPlanKeyword[] {
  const rawKeywords = [...objectJoin.object.keywords, ...objectJoin.object.queries];
  const seen = new Set<string>();
  const keywords: MarketingAdsPlanKeyword[] = [];
  for (const keyword of rawKeywords) {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    keywords.push({ text: keyword.trim(), matchType: 'phrase', source: 'strategy-map' });
  }
  return keywords;
}

function baseBlockers(objectJoin: MarketingStrategyObjectJoin): string[] {
  const blockers: string[] = [];
  if (!objectJoin.object.landingPageUrl) blockers.push('landing_page_required');
  if (objectJoin.object.conversionIds.length === 0) blockers.push('conversion_mapping_required');
  if (objectJoin.reconciliation.status === 'mismatch') {
    blockers.push('conversion_reconciliation_mismatch');
  }
  return blockers;
}

function googleAdsActions(input: {
  keywords: MarketingAdsPlanKeyword[];
  blockers: string[];
}): MarketingAdsPlanAction[] {
  const actions: MarketingAdsPlanAction[] = [
    {
      type: 'validate_account_settings',
      provider: 'googleAds',
      risk: 'medium',
      summary:
        'Verify account auto-tagging, conversion tracking, currency, time zone, and URL tracking before launch.',
      requiresApproval: true,
      blocksApply: false,
    },
    {
      type: 'validate_landing_page',
      provider: 'googleAds',
      risk: 'low',
      summary:
        'Confirm the landing page is live, relevant, and tagged before sending paid search traffic.',
      requiresApproval: false,
      blocksApply: input.blockers.includes('landing_page_required'),
    },
    {
      type: 'validate_conversion_mapping',
      provider: 'googleAds',
      risk: 'medium',
      summary: 'Verify Google Ads conversion actions map to canonical Unisane conversions.',
      requiresApproval: true,
      blocksApply: input.blockers.includes('conversion_mapping_required'),
    },
  ];
  if (input.keywords.length === 0) {
    actions.push({
      type: 'hold',
      provider: 'googleAds',
      risk: 'low',
      summary: 'Hold paid search launch until approved keywords exist for this strategy object.',
      requiresApproval: false,
      blocksApply: true,
    });
    return actions;
  }
  actions.push(
    {
      type: 'create_campaign',
      provider: 'googleAds',
      risk: 'high',
      summary: 'Draft a Search campaign for this strategy object; live creation remains blocked.',
      requiresApproval: true,
      blocksApply: false,
    },
    {
      type: 'configure_campaign_settings',
      provider: 'googleAds',
      risk: 'high',
      summary: 'Apply reviewed Search-only network, location, language, and URL tracking settings.',
      requiresApproval: true,
      blocksApply: false,
    },
    {
      type: 'create_ad_group',
      provider: 'googleAds',
      risk: 'high',
      summary: 'Draft one tightly themed ad group around the strategy keywords and landing page.',
      requiresApproval: true,
      blocksApply: false,
    },
    {
      type: 'add_keywords',
      provider: 'googleAds',
      risk: 'high',
      summary: 'Draft phrase-match keywords from the approved strategy map.',
      requiresApproval: true,
      blocksApply: false,
    },
    {
      type: 'add_negative_keywords',
      provider: 'googleAds',
      risk: 'medium',
      summary: 'Add shared negatives that reduce weak informational traffic.',
      requiresApproval: true,
      blocksApply: false,
    },
    {
      type: 'create_responsive_search_ad',
      provider: 'googleAds',
      risk: 'high',
      summary: 'Draft a responsive search ad using reviewed copy and final URL tracking.',
      requiresApproval: true,
      blocksApply: false,
    },
    {
      type: 'set_budget_guardrail',
      provider: 'googleAds',
      risk: 'high',
      summary:
        'Set a reviewed daily budget guardrail; live budget increases remain approval-gated.',
      requiresApproval: true,
      blocksApply: false,
    },
    {
      type: 'set_bid_strategy',
      provider: 'googleAds',
      risk: 'high',
      summary: 'Use a controlled initial bid strategy until conversion volume supports automation.',
      requiresApproval: true,
      blocksApply: false,
    },
  );
  return actions;
}

function metaAdsActions(blockers: string[]): MarketingAdsPlanAction[] {
  return [
    {
      type: 'validate_landing_page',
      provider: 'metaAds',
      risk: 'low',
      summary: 'Confirm the landing page and Pixel/CAPI mapping before paid social traffic.',
      requiresApproval: false,
      blocksApply: blockers.includes('landing_page_required'),
    },
    {
      type: 'validate_conversion_mapping',
      provider: 'metaAds',
      risk: 'medium',
      summary: 'Verify Meta Pixel and CAPI events map to canonical Unisane conversions.',
      requiresApproval: true,
      blocksApply: blockers.includes('conversion_mapping_required'),
    },
    {
      type: 'prepare_creative',
      provider: 'metaAds',
      risk: 'medium',
      summary: 'Prepare image/video creative and primary text before creating a Meta ad.',
      requiresApproval: true,
      blocksApply: true,
    },
    {
      type: 'create_campaign',
      provider: 'metaAds',
      risk: 'high',
      summary: 'Draft a Meta campaign for the reviewed conversion objective.',
      requiresApproval: true,
      blocksApply: false,
    },
    {
      type: 'create_ad_set',
      provider: 'metaAds',
      risk: 'high',
      summary:
        'Draft an ad set linked to this landing page and conversion goal; live creation remains blocked.',
      requiresApproval: true,
      blocksApply: false,
    },
    {
      type: 'create_ad_creative',
      provider: 'metaAds',
      risk: 'high',
      summary:
        'Draft a Meta ad creative from uploaded provider refs, reviewed copy, and Page/Instagram actors.',
      requiresApproval: true,
      blocksApply: false,
    },
    {
      type: 'create_ad',
      provider: 'metaAds',
      risk: 'high',
      summary: 'Draft the Meta ad that attaches the reviewed creative to the reviewed ad set.',
      requiresApproval: true,
      blocksApply: false,
    },
    {
      type: 'set_budget_guardrail',
      provider: 'metaAds',
      risk: 'high',
      summary:
        'Set a reviewed daily budget guardrail; live budget increases remain approval-gated.',
      requiresApproval: true,
      blocksApply: false,
    },
    {
      type: 'set_bid_strategy',
      provider: 'metaAds',
      risk: 'high',
      summary: 'Use conservative initial delivery settings until clean conversion signal exists.',
      requiresApproval: true,
      blocksApply: false,
    },
  ];
}

function metaAdsBuildout(input: {
  candidateName: string;
  landingPageUrl?: string;
  finalUrl?: string;
  currency?: string;
}): MarketingMetaAdsBuildout | undefined {
  const destinationUrl = input.finalUrl ?? input.landingPageUrl;
  if (!destinationUrl) return undefined;
  return {
    destinationUrl,
    adSetName: `${input.candidateName} Meta Ad Set`,
    adName: `${input.candidateName} Meta Ad`,
    objective: 'OUTCOME_SALES',
    status: 'PAUSED',
    specialAdCategories: [],
    optimizationGoal: 'OFFSITE_CONVERSIONS',
    billingEvent: 'IMPRESSIONS',
    bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
    promotedObjectCustomEventType: 'PURCHASE',
    countryCodes: countryCodesForCurrency(input.currency),
    placementTargeting: {
      publisherPlatforms: ['facebook', 'instagram'],
      facebookPositions: ['feed'],
      instagramPositions: ['stream'],
    },
    creative: {
      name: `${input.candidateName} Meta Creative`,
      assetType: 'image',
      providerAssetId: 'REVIEW_REQUIRED_PROVIDER_ASSET_ID',
      primaryText: 'REVIEW_REQUIRED_PRIMARY_TEXT',
      headline: 'REVIEW_REQUIRED_HEADLINE',
      callToActionType: 'LEARN_MORE',
    },
  };
}

export function planMarketingAdsCandidate(
  input: PlanMarketingAdsCandidateOptions,
): MarketingAdsPlanCandidate {
  const keywords = input.provider === 'googleAds' ? keywordCandidates(input.objectJoin) : [];
  const blockers = baseBlockers(input.objectJoin);
  const actions =
    input.provider === 'googleAds'
      ? googleAdsActions({ keywords, blockers })
      : metaAdsActions(blockers);
  const name = input.objectJoin.object.name ?? input.objectJoin.object.id;
  const utm = marketingAdsUtmFor(input);

  return {
    id: `${input.provider}-${input.objectJoin.object.id}`,
    provider: input.provider,
    source: 'strategy-map',
    strategyObjectId: input.objectJoin.object.id,
    strategyObjectKind: input.objectJoin.object.kind,
    name,
    landingPageUrl: input.objectJoin.object.landingPageUrl,
    conversionIds: input.objectJoin.object.conversionIds,
    campaignIds: input.objectJoin.object.campaignIds,
    campaignNames: input.objectJoin.object.campaignNames,
    utm,
    budgetGuardrail: marketingAdsBudgetGuardrail({
      dailyBudgetAmount: input.dailyBudgetAmount,
      currency: input.currency,
    }),
    bidStrategy: marketingAdsBidStrategy(input.provider),
    googleSearchSettings:
      input.provider === 'googleAds' ? marketingGoogleAdsSearchSettings(input.config) : undefined,
    metaAdsBuildout:
      input.provider === 'metaAds'
        ? metaAdsBuildout({
            candidateName: name,
            landingPageUrl: input.objectJoin.object.landingPageUrl,
            finalUrl: utm.finalUrl,
            currency: input.currency,
          })
        : undefined,
    keywords,
    negativeKeywords: input.provider === 'googleAds' ? sharedNegativeKeywords : [],
    currentMetrics: input.objectJoin.metrics,
    actions,
    blockers: [
      ...new Set([
        ...blockers,
        ...actions.filter((action) => action.blocksApply).map((action) => action.type),
      ]),
    ],
    rationale:
      input.provider === 'googleAds'
        ? 'Use paid search only where strategy keywords, landing page, and conversion truth are explicit.'
        : 'Use paid social only after creative and conversion mapping are reviewable.',
  };
}
