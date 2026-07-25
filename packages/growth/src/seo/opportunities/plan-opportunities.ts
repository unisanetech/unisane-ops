import { normalizeKeywordTerm } from '../expansion/normalize-keywords.js';
import {
  getSeoOpportunityPatternPackForKeywordPack,
  type SeoOpportunityPatternPack,
} from '../config/seo-pattern-packs.js';
import type { KeywordCluster, KeywordClusterFile } from '../schema/cluster.js';
import {
  pageOpportunityFileSchema,
  type PageOpportunity,
  type PageOpportunityFile,
} from '../schema/opportunity.js';

export type PlanPageOpportunitiesOptions = {
  clusterFile: KeywordClusterFile;
  basePath?: string;
  ctaLabel?: string;
  ctaTarget?: string;
};

export function planPageOpportunities(options: PlanPageOpportunitiesOptions): PageOpportunityFile {
  const patternPack = getSeoOpportunityPatternPackForKeywordPack(
    options.clusterFile.sourcePatternPack,
  );
  const basePath = normalizeBasePath(options.basePath ?? patternPack.basePath);
  const opportunities = options.clusterFile.clusters
    .filter((cluster) => cluster.status !== 'rejected')
    .map((cluster) =>
      createOpportunity({
        cluster,
        patternPack,
        sourcePatternPack: options.clusterFile.sourcePatternPack,
        basePath,
        ctaLabel: options.ctaLabel ?? patternPack.cta.label,
        ctaTarget: options.ctaTarget ?? patternPack.cta.target,
      }),
    );

  return pageOpportunityFileSchema.parse({
    version: 1,
    platformId: options.clusterFile.platformId,
    sourcePatternPack: options.clusterFile.sourcePatternPack,
    basePath,
    opportunities,
  });
}

function createOpportunity(options: {
  cluster: KeywordCluster;
  patternPack: SeoOpportunityPatternPack;
  sourcePatternPack: string;
  basePath: string;
  ctaLabel: string;
  ctaTarget: string;
}): PageOpportunity {
  const slug = slugify(options.cluster.label);
  const routePath = `/${options.basePath}/${slug}`;
  const label = options.cluster.label;

  return {
    id: `${options.cluster.id}:page`,
    platformId: options.cluster.platformId,
    clusterId: options.cluster.id,
    sourcePatternPack: options.sourcePatternPack,
    status: 'candidate',
    priority: options.cluster.priority,
    fit: options.cluster.fit,
    intent: options.cluster.intent,
    pageType: options.cluster.pageType,
    slug,
    routePath,
    title: options.patternPack.createTitle(label),
    h1: options.patternPack.createH1(label),
    metaDescription: options.patternPack.createMetaDescription(label),
    primaryKeyword: options.cluster.primaryKeyword,
    supportingKeywords: options.cluster.secondaryKeywords.slice(0, 10),
    totalVolume: options.cluster.totalVolume,
    sections: options.patternPack.createSections(label),
    internalLinks: options.patternPack.createInternalLinks(options.basePath),
    cta: {
      label: options.ctaLabel,
      target: options.ctaTarget,
    },
    rationale: options.cluster.rationale,
  };
}

function normalizeBasePath(value: string): string {
  const normalized = value.trim().replace(/^\/+|\/+$/g, '');
  if (!normalized) {
    throw new Error('Base path must not be empty.');
  }
  return normalized;
}

function slugify(value: string): string {
  return normalizeKeywordTerm(value).replace(/\s+/g, '-');
}
