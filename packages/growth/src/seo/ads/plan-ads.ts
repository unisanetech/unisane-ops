import { adsPlanFileSchema, type AdsPlanFile, type AdsPlanStatusFilter } from '../schema/ads.js';
import type { PageOpportunity, PageOpportunityFile } from '../schema/opportunity.js';

export type PlanAdsFromOpportunitiesOptions = {
  opportunityFile: PageOpportunityFile;
  statusFilter?: AdsPlanStatusFilter;
  maxKeywordsPerAdGroup?: number;
};

export function planAdsFromOpportunities(options: PlanAdsFromOpportunitiesOptions): AdsPlanFile {
  const statusFilter = options.statusFilter ?? 'approved-or-built';
  const maxKeywordsPerAdGroup = options.maxKeywordsPerAdGroup ?? 12;
  const opportunities = options.opportunityFile.opportunities.filter((opportunity) =>
    shouldIncludeOpportunity(opportunity, statusFilter),
  );

  return adsPlanFileSchema.parse({
    version: 1,
    platformId: options.opportunityFile.platformId,
    sourcePatternPack: options.opportunityFile.sourcePatternPack,
    statusFilter,
    adGroups: opportunities.map((opportunity) =>
      planAdGroup(opportunity, Math.max(1, maxKeywordsPerAdGroup)),
    ),
    sharedNegativeKeywords: createSharedNegativeKeywords(),
  });
}

function planAdGroup(opportunity: PageOpportunity, maxKeywords: number) {
  const keywords = dedupeKeywords([
    opportunity.primaryKeyword,
    ...opportunity.supportingKeywords,
  ]).slice(0, maxKeywords);

  return {
    id: `adgroup-${opportunity.slug}`,
    name: opportunity.title,
    landingPage: opportunity.routePath,
    opportunityId: opportunity.id,
    opportunitySlug: opportunity.slug,
    primaryKeyword: opportunity.primaryKeyword,
    keywords: keywords.flatMap((keyword, index) =>
      createKeywordCandidates({
        keyword,
        opportunity,
        isPrimary: index === 0,
      }),
    ),
    negativeKeywords: createOpportunityNegativeKeywords(opportunity),
    rationale: `Send paid traffic to the matching ${opportunity.pageType} page instead of a generic landing page.`,
  };
}

function createKeywordCandidates(options: {
  keyword: string;
  opportunity: PageOpportunity;
  isPrimary: boolean;
}) {
  const base = {
    keyword: options.keyword,
    landingPage: options.opportunity.routePath,
    sourceOpportunityId: options.opportunity.id,
    sourceOpportunitySlug: options.opportunity.slug,
    volume: options.isPrimary ? options.opportunity.totalVolume : undefined,
  };

  if (options.isPrimary) {
    return [
      {
        ...base,
        matchType: 'exact' as const,
        rationale: 'Primary page keyword with highest intent control.',
      },
      {
        ...base,
        matchType: 'phrase' as const,
        rationale: 'Primary phrase match for close variants.',
      },
    ];
  }

  return [
    {
      ...base,
      matchType: 'phrase' as const,
      rationale: 'Supporting keyword that still maps to this page intent.',
    },
  ];
}

function createOpportunityNegativeKeywords(opportunity: PageOpportunity) {
  const blockers = [
    { keyword: 'jobs', reason: 'User is looking for job listings, not a resume workflow.' },
    { keyword: 'salary', reason: 'Compensation research intent usually needs a different page.' },
    { keyword: 'course', reason: 'Training intent is not the resume creation path.' },
  ];
  const haystack = [opportunity.primaryKeyword, ...opportunity.supportingKeywords].join(' ');
  return blockers.filter((candidate) => !haystack.includes(candidate.keyword));
}

function createSharedNegativeKeywords() {
  return [
    { keyword: 'free download', reason: 'Often attracts file-only intent with weak product fit.' },
    { keyword: 'definition', reason: 'Dictionary intent should not spend paid budget.' },
    { keyword: 'meaning', reason: 'Definition intent should be handled outside paid campaigns.' },
  ];
}

function shouldIncludeOpportunity(
  opportunity: PageOpportunity,
  statusFilter: AdsPlanStatusFilter,
): boolean {
  if (statusFilter === 'all') {
    return true;
  }
  if (statusFilter === 'approved-or-built') {
    return opportunity.status === 'approved' || opportunity.status === 'built';
  }
  return opportunity.status === statusFilter;
}

function dedupeKeywords(keywords: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const keyword of keywords) {
    const key = keyword.toLowerCase().trim();
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(keyword.trim());
  }
  return result;
}
