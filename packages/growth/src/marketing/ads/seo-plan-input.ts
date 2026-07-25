import { readFileSync } from 'node:fs';
import path from 'node:path';
import { adsPlanFileSchema, type AdsPlanFile } from '../../seo/index.js';
import { marketingStrategyObjectSchema, type MarketingReportMetrics } from '../schema/report.js';
import type {
  MarketingAdsPlanCandidate,
  MarketingAdsPlanNegativeKeyword,
  MarketingAdsPlanProvider,
} from '../schema/ads-plan.js';
import type { MarketingConfig } from '../schema/marketing-config.js';
import type { MarketingStrategyObjectJoin } from '../reports/strategy-object-report.js';
import { ensurePathWithinCwd } from '../reports/paths.js';
import { planMarketingAdsCandidate } from './plan-candidates.js';

export type SeoAdsPlanInputOptions = {
  cwd: string;
  path: string;
  providers: MarketingAdsPlanProvider[];
  config: MarketingConfig;
  dailyBudgetAmount?: number;
  currency?: string;
};

function emptyMetrics(): MarketingReportMetrics {
  return {};
}

function readSeoAdsPlan(cwd: string, maybePath: string): AdsPlanFile {
  const resolved = path.resolve(cwd, maybePath);
  ensurePathWithinCwd(cwd, resolved);
  return adsPlanFileSchema.parse(JSON.parse(readFileSync(resolved, 'utf8')));
}

function uniqueNegativeKeywords(
  candidates: MarketingAdsPlanNegativeKeyword[],
): MarketingAdsPlanNegativeKeyword[] {
  const seen = new Set<string>();
  const result: MarketingAdsPlanNegativeKeyword[] = [];
  for (const candidate of candidates) {
    const key = candidate.text.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(candidate);
  }
  return result;
}

function seoAdGroupJoin(adGroup: AdsPlanFile['adGroups'][number]): MarketingStrategyObjectJoin {
  return {
    object: marketingStrategyObjectSchema.parse({
      id: `seo-${adGroup.id}`,
      kind: 'campaign',
      name: adGroup.name,
      status: 'planned',
      landingPageUrl: adGroup.landingPage,
      keywords: adGroup.keywords.map((keyword) => keyword.keyword),
    }),
    metrics: {
      ads: emptyMetrics(),
      analytics: emptyMetrics(),
      seo: emptyMetrics(),
      confirmed: emptyMetrics(),
    },
    matches: {
      adsRecords: 0,
      analyticsRecords: 0,
      seoRecords: 0,
      confirmedRecords: 0,
      providers: [],
    },
    dimensions: {
      creativeIds: [],
      audienceIds: [],
      audienceNames: [],
      utmSources: [],
      utmMediums: [],
      utmCampaigns: [],
      utmContents: [],
      utmTerms: [],
      experimentIds: [],
    },
    reconciliation: {
      status: 'missing_unisane_truth',
      message: 'SEO ads-plan input does not include Unisane-confirmed conversion truth.',
    },
    gaps: ['missing_confirmed_conversions'],
  };
}

export function planMarketingAdsCandidatesFromSeoAdsPlan(
  options: SeoAdsPlanInputOptions,
): MarketingAdsPlanCandidate[] {
  if (!options.providers.includes('googleAds')) return [];
  const seoPlan = readSeoAdsPlan(options.cwd, options.path);
  return seoPlan.adGroups.map((adGroup) => {
    const candidate = planMarketingAdsCandidate({
      provider: 'googleAds',
      config: options.config,
      objectJoin: seoAdGroupJoin(adGroup),
      dailyBudgetAmount: options.dailyBudgetAmount,
      currency: options.currency,
    });
    return {
      ...candidate,
      source: 'seo-ads-plan',
      sourceSeoAdGroupId: adGroup.id,
      sourceOpportunityId: adGroup.opportunityId,
      sourceOpportunitySlug: adGroup.opportunitySlug,
      strategyObjectKind: 'seoAdGroup',
      keywords: adGroup.keywords.map((keyword) => ({
        text: keyword.keyword,
        matchType: keyword.matchType,
        source: 'seo-ads-plan' as const,
      })),
      negativeKeywords: uniqueNegativeKeywords([
        ...adGroup.negativeKeywords.map((keyword) => ({
          text: keyword.keyword,
          reason: keyword.reason,
        })),
        ...seoPlan.sharedNegativeKeywords.map((keyword) => ({
          text: keyword.keyword,
          reason: keyword.reason,
        })),
      ]),
      rationale: `${adGroup.rationale} Imported from SEO ads-plan output; attach canonical conversion mappings before apply planning.`,
    };
  });
}
