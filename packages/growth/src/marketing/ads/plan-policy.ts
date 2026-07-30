import type {
  MarketingAdsPlanBidStrategy,
  MarketingAdsPlanBudgetGuardrail,
  MarketingAdsPlanProvider,
  MarketingAdsPlanUtm,
  MarketingGoogleAdsSearchSettings,
} from '../schema/ads-plan.js';
import type { MarketingExecutionContext } from '../schema/execution-context.js';
import type { MarketingStrategyObjectJoin } from '../reports/strategy-object-report.js';

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function withUtm(landingPageUrl: string | undefined, utm: Omit<MarketingAdsPlanUtm, 'finalUrl'>) {
  if (!landingPageUrl) return undefined;
  const separator = landingPageUrl.includes('?') ? '&' : '?';
  const params = new URLSearchParams({
    utm_source: utm.source,
    utm_medium: utm.medium,
    utm_campaign: utm.campaign,
  });
  if (utm.content) params.set('utm_content', utm.content);
  if (utm.term) params.set('utm_term', utm.term);
  return `${landingPageUrl}${separator}${params.toString()}`;
}

export function marketingAdsUtmFromParts(input: {
  provider: MarketingAdsPlanProvider;
  campaignName: string;
  content: string;
  landingPageUrl?: string;
  term?: string;
}): MarketingAdsPlanUtm {
  const source = input.provider === 'googleAds' ? 'google' : 'meta';
  const medium = input.provider === 'googleAds' ? 'cpc' : 'paid_social';
  const campaign = slugify(input.campaignName);
  const content = slugify(input.content);
  const term = input.term ? slugify(input.term) : undefined;
  return {
    source,
    medium,
    campaign,
    content,
    term,
    finalUrl: withUtm(input.landingPageUrl, {
      source,
      medium,
      campaign,
      content,
      term,
    }),
  };
}

export function marketingAdsUtmFor(input: {
  provider: MarketingAdsPlanProvider;
  objectJoin: MarketingStrategyObjectJoin;
}): MarketingAdsPlanUtm {
  return marketingAdsUtmFromParts({
    provider: input.provider,
    campaignName: input.objectJoin.object.name ?? input.objectJoin.object.id,
    content: input.objectJoin.object.kind,
    landingPageUrl: input.objectJoin.object.landingPageUrl,
    term: input.provider === 'googleAds' ? input.objectJoin.object.keywords[0] : undefined,
  });
}

export function marketingAdsBudgetGuardrail(input: {
  dailyBudgetAmount?: number;
  currency?: string;
}): MarketingAdsPlanBudgetGuardrail {
  return {
    currency: input.currency ?? 'USD',
    dailyBudgetAmount: input.dailyBudgetAmount,
    budgetIncreaseRequiresApproval: true,
    campaignEnableRequiresApproval: true,
    status: input.dailyBudgetAmount === undefined ? 'needs_budget_review' : 'reviewable',
    message:
      input.dailyBudgetAmount === undefined
        ? 'No spend amount is proposed yet; select a reviewed daily budget before apply planning.'
        : 'Daily budget is reviewable, but live increases and campaign enables still require explicit approval.',
  };
}

export function marketingAdsBidStrategy(
  provider: MarketingAdsPlanProvider,
): MarketingAdsPlanBidStrategy {
  if (provider === 'googleAds') {
    return {
      type: 'manual_cpc',
      requiresApproval: true,
      message:
        'Start paid search planning with controlled manual CPC until enough clean conversion signal exists.',
    };
  }
  return {
    type: 'lowest_cost',
    requiresApproval: true,
    message:
      'Start Meta planning with lowest-cost delivery only after creative and conversion mapping are reviewed.',
  };
}

export function marketingGoogleAdsSearchSettings(
  config: MarketingExecutionContext,
): MarketingGoogleAdsSearchSettings {
  const defaults = config.providers.googleAds.googleSearchDefaults;
  return {
    targetGoogleSearch: true,
    targetSearchNetwork: defaults.targetSearchNetwork,
    targetContentNetwork: defaults.targetContentNetwork,
    locationCriterionIds: defaults.locationCriterionIds,
    languageCriterionIds: defaults.languageCriterionIds,
    finalUrlSuffix: defaults.finalUrlSuffix,
    trackingUrlTemplate: defaults.trackingUrlTemplate,
    accountPreferencesRequired: {
      autoTaggingEnabled: true,
      conversionTrackingReady: true,
      currencyCodeReviewed: true,
      timeZoneReviewed: true,
    },
  };
}
