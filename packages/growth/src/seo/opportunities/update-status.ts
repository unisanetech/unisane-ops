import { keywordClusterStatusSchema, type KeywordCluster } from '../schema/cluster.js';
import {
  pageOpportunityFileSchema,
  type PageOpportunity,
  type PageOpportunityFile,
} from '../schema/opportunity.js';
import { seoOpportunityIdsMatch } from '../identifiers.js';

export type OpportunityStatus = KeywordCluster['status'];

export type UpdateOpportunityStatusOptions = {
  opportunityFile: PageOpportunityFile;
  match: {
    id?: string;
    slug?: string;
    routePath?: string;
  };
  status: OpportunityStatus;
};

export type UpdateOpportunityStatusResult = {
  opportunityFile: PageOpportunityFile;
  updated: PageOpportunity;
};

export function updateOpportunityStatus(
  options: UpdateOpportunityStatusOptions,
): UpdateOpportunityStatusResult {
  const nextStatus = keywordClusterStatusSchema.parse(options.status);
  const opportunityFile = pageOpportunityFileSchema.parse(options.opportunityFile);
  const match = normalizeMatch(options.match);
  let updated: PageOpportunity | undefined;

  const opportunities = opportunityFile.opportunities.map((opportunity) => {
    if (!matchesOpportunity(opportunity, match)) {
      return opportunity;
    }
    if (updated) {
      throw new Error(`Multiple opportunities matched ${formatMatch(match)}.`);
    }
    updated = {
      ...opportunity,
      status: nextStatus,
    };
    return updated;
  });

  if (!updated) {
    throw new Error(`No opportunity matched ${formatMatch(match)}.`);
  }

  return {
    opportunityFile: pageOpportunityFileSchema.parse({
      ...opportunityFile,
      opportunities,
    }),
    updated,
  };
}

function normalizeMatch(match: UpdateOpportunityStatusOptions['match']) {
  if (match.id) {
    return { kind: 'id' as const, value: match.id };
  }
  if (match.slug) {
    return { kind: 'slug' as const, value: match.slug };
  }
  if (match.routePath) {
    return { kind: 'routePath' as const, value: match.routePath };
  }
  throw new Error('Provide one of --id, --slug, or --route-path.');
}

function matchesOpportunity(
  opportunity: PageOpportunity,
  match: ReturnType<typeof normalizeMatch>,
): boolean {
  if (match.kind === 'id') {
    return seoOpportunityIdsMatch(opportunity.id, match.value);
  }
  return opportunity[match.kind] === match.value;
}

function formatMatch(match: ReturnType<typeof normalizeMatch>): string {
  return `${match.kind}=${match.value}`;
}
