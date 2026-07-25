import type { PageOpportunity, PageOpportunityFile } from '../schema/opportunity.js';
import {
  internalLinkPlanFileSchema,
  type InternalLinkEdge,
  type InternalLinkPlanFile,
} from '../schema/internal-link.js';

export type PlanInternalLinksOptions = {
  opportunityFile: PageOpportunityFile;
  hubLabel?: string;
  maxRelated?: number;
  includeConversionLinks?: boolean;
};

const DEFAULT_MAX_RELATED = 3;

export function planInternalLinks(options: PlanInternalLinksOptions): InternalLinkPlanFile {
  const opportunities = options.opportunityFile.opportunities
    .filter((opportunity) => opportunity.status !== 'rejected')
    .sort(sortOpportunities);
  const hubPath = `/${options.opportunityFile.basePath}`;
  const hubLabel = options.hubLabel ?? createHubLabel(options.opportunityFile.basePath);
  const maxRelated = options.maxRelated ?? DEFAULT_MAX_RELATED;
  const edges = createEdges({
    opportunities,
    hubPath,
    hubLabel,
    maxRelated,
    includeConversionLinks: options.includeConversionLinks === true,
  });
  const pages = opportunities.map((opportunity) => {
    const inboundCount = edges.filter((edge) => edge.toPath === opportunity.routePath).length;
    const outboundCount = edges.filter((edge) => edge.fromPath === opportunity.routePath).length;
    return {
      routePath: opportunity.routePath,
      title: opportunity.title,
      primaryKeyword: opportunity.primaryKeyword,
      priority: opportunity.priority,
      inboundCount,
      outboundCount,
      orphanRisk: inboundCount === 0,
    };
  });

  return internalLinkPlanFileSchema.parse({
    version: 1,
    platformId: options.opportunityFile.platformId,
    sourcePatternPack: options.opportunityFile.sourcePatternPack,
    hubPath,
    pages,
    edges,
    orphanPaths: pages.filter((page) => page.orphanRisk).map((page) => page.routePath),
  });
}

function createEdges(options: {
  opportunities: PageOpportunity[];
  hubPath: string;
  hubLabel: string;
  maxRelated: number;
  includeConversionLinks: boolean;
}): InternalLinkEdge[] {
  const edgeMap = new Map<string, InternalLinkEdge>();

  for (const opportunity of options.opportunities) {
    addEdge(edgeMap, {
      fromPath: options.hubPath,
      toPath: opportunity.routePath,
      label: opportunity.title,
      type: 'hub',
      reason: 'Hub page should link to every planned detail page.',
    });
    addEdge(edgeMap, {
      fromPath: opportunity.routePath,
      toPath: options.hubPath,
      label: options.hubLabel,
      type: 'hub',
      reason: 'Detail page should link back to the hub page.',
    });

    for (const related of findRelatedOpportunities(
      opportunity,
      options.opportunities,
      options.maxRelated,
    )) {
      addEdge(edgeMap, {
        fromPath: opportunity.routePath,
        toPath: related.routePath,
        label: related.title,
        type: 'related',
        reason: 'Related pages share search vocabulary or page intent.',
      });
    }

    if (options.includeConversionLinks) {
      addEdge(edgeMap, {
        fromPath: opportunity.routePath,
        toPath: opportunity.cta.target,
        label: opportunity.cta.label,
        type: 'conversion',
        reason: 'Detail page should connect organic readers to the product action.',
      });
    }
  }

  return Array.from(edgeMap.values()).sort(sortEdges);
}

function findRelatedOpportunities(
  current: PageOpportunity,
  opportunities: PageOpportunity[],
  maxRelated: number,
): PageOpportunity[] {
  return opportunities
    .filter((candidate) => candidate.routePath !== current.routePath)
    .map((candidate) => ({
      candidate,
      score: scoreRelatedness(current, candidate),
    }))
    .filter((entry) => entry.score > 0)
    .sort(
      (left, right) =>
        right.score - left.score || sortOpportunities(left.candidate, right.candidate),
    )
    .slice(0, maxRelated)
    .map((entry) => entry.candidate);
}

function scoreRelatedness(left: PageOpportunity, right: PageOpportunity): number {
  const leftTerms = getComparableTerms(left);
  const rightTerms = getComparableTerms(right);
  let score = left.pageType === right.pageType ? 1 : 0;
  for (const term of leftTerms) {
    if (rightTerms.has(term)) {
      score += 1;
    }
  }
  return score;
}

function getComparableTerms(opportunity: PageOpportunity): Set<string> {
  return new Set(
    [opportunity.primaryKeyword, ...opportunity.supportingKeywords]
      .flatMap((keyword) => keyword.split(/\s+/g))
      .map((term) => term.toLowerCase())
      .filter((term) => term.length > 3 && !STOP_WORDS.has(term)),
  );
}

const STOP_WORDS = new Set([
  'resume',
  'example',
  'examples',
  'format',
  'formats',
  'template',
  'templates',
]);

function addEdge(edges: Map<string, InternalLinkEdge>, edge: InternalLinkEdge): void {
  edges.set(`${edge.fromPath}->${edge.toPath}:${edge.type}`, edge);
}

function sortOpportunities(left: PageOpportunity, right: PageOpportunity): number {
  return (
    getPriorityRank(left.priority) - getPriorityRank(right.priority) ||
    (right.totalVolume ?? -1) - (left.totalVolume ?? -1) ||
    left.title.localeCompare(right.title)
  );
}

function sortEdges(left: InternalLinkEdge, right: InternalLinkEdge): number {
  return (
    left.fromPath.localeCompare(right.fromPath) ||
    getLinkTypeRank(left.type) - getLinkTypeRank(right.type) ||
    left.toPath.localeCompare(right.toPath)
  );
}

function getPriorityRank(priority: string): number {
  return (
    {
      p0: 0,
      p1: 1,
      p2: 2,
      later: 3,
    }[priority] ?? 4
  );
}

function getLinkTypeRank(type: InternalLinkEdge['type']): number {
  return {
    hub: 0,
    related: 1,
    conversion: 2,
  }[type];
}

function createHubLabel(basePath: string): string {
  return basePath
    .split(/[-/]+/g)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ');
}
