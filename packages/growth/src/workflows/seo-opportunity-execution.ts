import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import type { OpsPrincipal } from '@unisane/ops-engine/actions';
import {
  createGrowthSeoOpportunityResearchAction,
  growthSeoOpportunityResearchInputSchema,
  growthSeoOpportunityResearchOutputSchema,
  type GrowthSeoOpportunityResearchOutput,
} from '../actions/seo-opportunity-research.js';
import type { SeoOpportunityCandidate, SeoOpportunityEvidence } from '../playbooks/index.js';
import { keywordClusterFileSchema, type KeywordCluster } from '../seo/schema/cluster.js';
import { competitorResearchFileSchema } from '../seo/schema/competitor.js';
import { seoResearchConfigSchema, type SeoResearchConfig } from '../seo/schema/config.js';
import { pageOpportunityFileSchema, type PageOpportunity } from '../seo/schema/opportunity.js';
import {
  seoPageEvidenceFileSchema,
  type SeoPageEvidence,
  type SeoPageEvidenceFile,
} from '../seo/schema/page-evidence.js';
import { serpResearchFileSchema } from '../seo/schema/serp.js';
import { resolveSeoResearchWorkspacePaths } from '../seo/workspace/paths.js';
import { normalizeSeoOpportunityId } from '../seo/identifiers.js';

export type ExecuteGrowthSeoOpportunityOptions = {
  cwd: string;
  researchRoot?: string;
  projectId: string;
  environmentId: string;
  principal: OpsPrincipal;
  market?: string;
  opportunityId?: string;
  opportunityLimit?: number;
  maxAgeDays?: number;
  now?: Date;
  requestId?: string;
};

export type GrowthSeoOpportunityExecutionDependencies = {
  loadCandidates(options: {
    cwd: string;
    researchRoot?: string;
    platformId: string;
    maxAgeDays: number;
    now: Date;
  }): readonly SeoOpportunityCandidate[];
};

type Artifact<T> = { filePath: string; observedAt: string; revision: number; value: T };
function stableId(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9.-]+/g, '-')
      .replace(/^[.-]+|[.-]+$/g, '') || 'seo'
  );
}

function normalizedPath(value: string | undefined): string {
  if (!value) return '';
  const normalized = value.trim().replace(/\/+$/, '');
  return normalized || '/';
}

function pageTextMatchesKeyword(page: SeoPageEvidence, keyword: string | undefined): boolean {
  const term = normalized(keyword);
  if (!term || page.crawl.state !== 'available') return false;
  return [page.crawl.title, page.crawl.h1]
    .map(normalized)
    .some((value) => value === term || value.includes(term));
}

function matchPageEvidence(
  file: SeoPageEvidenceFile,
  opportunity: PageOpportunity,
): { page?: SeoPageEvidence; conflict: boolean; routeMismatch: boolean } {
  const routePath = normalizedPath(opportunity.routePath);
  const routeMatches = file.pages.filter((page) => normalizedPath(page.path) === routePath);
  if (routeMatches.length === 1) {
    return { page: routeMatches[0], conflict: false, routeMismatch: false };
  }
  if (routeMatches.length > 1) return { conflict: true, routeMismatch: false };
  const keywordMatches = file.pages.filter((page) =>
    pageTextMatchesKeyword(page, opportunity.primaryKeyword),
  );
  if (keywordMatches.length === 1) {
    return { page: keywordMatches[0], conflict: true, routeMismatch: true };
  }
  return { conflict: keywordMatches.length > 1, routeMismatch: false };
}

function marketLabel(country: string, language: string): string {
  return `${country.trim().toUpperCase()} / ${language.trim().toLowerCase()}`;
}

function keywordEvidenceLimitations(cluster: KeywordCluster): string[] {
  const metricEvidence = cluster.metricEvidence;
  if (!metricEvidence) {
    return ['The keyword cluster has no provider demand evidence attached.'];
  }
  const limitations = [
    'Keyword demand and competition are provider estimates, not observed site outcomes.',
  ];
  if (metricEvidence.matchedMetricCount < metricEvidence.keywordCount) {
    limitations.push(
      `Demand covers ${metricEvidence.matchedMetricCount} of ${metricEvidence.keywordCount} clustered keywords.`,
    );
  }
  return limitations;
}

function pageEvidenceLimitations(input: {
  file: SeoPageEvidenceFile;
  page?: SeoPageEvidence;
  conflict: boolean;
  routeMismatch: boolean;
  marketConflict: boolean;
}): string[] {
  const limitations = new Set(input.file.limitations);
  if (input.marketConflict) {
    limitations.add('The opportunity market does not match the page inventory target markets.');
  }
  if (!input.page) {
    limitations.add(
      input.conflict
        ? 'More than one recorded page matches this opportunity; review the target before acting.'
        : 'No current page in the inventory matches this proposed route or primary keyword.',
    );
    return [...limitations];
  }
  if (input.routeMismatch) {
    limitations.add(
      'The proposed route differs from the current page matched by primary keyword; resolve the target before acting.',
    );
  }
  for (const limitation of input.page.evidence.limitations) limitations.add(limitation);
  if (input.page.crawl.state === 'failed') {
    limitations.add(
      'The matching page could not be crawled, so its current page facts are unknown.',
    );
  }
  if (input.page.crawl.state === 'not-present-in-source') {
    limitations.add('The matching performance page was not present in the current crawl.');
  }
  if (input.page.search.state !== 'available') {
    limitations.add('Search Console did not report page-level performance for this page.');
  }
  return [...limitations];
}

function loadResearchConfig(filePath: string): SeoResearchConfig | undefined {
  if (!existsSync(filePath)) return undefined;
  return seoResearchConfigSchema.parse(JSON.parse(readFileSync(filePath, 'utf8')));
}

function loadPageEvidenceArtifact(root: string): Artifact<SeoPageEvidenceFile> | undefined {
  const filePath = path.join(root, 'page-evidence.latest.json');
  if (!existsSync(filePath)) return undefined;
  const stat = statSync(filePath);
  return {
    filePath,
    observedAt: stat.mtime.toISOString(),
    revision: Math.max(1, Math.round(stat.mtimeMs)),
    value: seoPageEvidenceFileSchema.parse(JSON.parse(readFileSync(filePath, 'utf8'))),
  };
}

function validatePageEvidenceContext(input: {
  pageEvidence: Artifact<SeoPageEvidenceFile> | undefined;
  opportunities: Artifact<ReturnType<typeof pageOpportunityFileSchema.parse>>[];
  config: SeoResearchConfig | undefined;
  expectedPlatformId: string;
}) {
  if (!input.pageEvidence) return;
  const platformIds = new Set(
    input.opportunities.flatMap((artifact) => [
      artifact.value.platformId,
      ...artifact.value.opportunities.map((opportunity) => opportunity.platformId),
    ]),
  );
  if (
    platformIds.size > 1 ||
    (platformIds.size === 1 && !platformIds.has(input.pageEvidence.value.platformId))
  ) {
    throw new Error(
      `SEO page evidence platform ${input.pageEvidence.value.platformId} does not match the recorded opportunities.`,
    );
  }
  if (input.pageEvidence.value.platformId !== input.expectedPlatformId) {
    throw new Error(
      `SEO page evidence platform ${input.pageEvidence.value.platformId} does not match requested project ${input.expectedPlatformId}.`,
    );
  }
  if (input.config && input.config.platformId !== input.pageEvidence.value.platformId) {
    throw new Error(
      `SEO page evidence platform ${input.pageEvidence.value.platformId} does not match configured platform ${input.config.platformId}.`,
    );
  }
  if (
    input.config?.site &&
    normalizedSiteUrl(input.config.site.url) !== normalizedSiteUrl(input.pageEvidence.value.siteUrl)
  ) {
    throw new Error(
      `SEO page evidence site ${input.pageEvidence.value.siteUrl} does not match configured site ${input.config.site.url}.`,
    );
  }
  if (input.config) {
    const configuredMarkets = new Set(
      input.config.markets.map((market) => marketLabel(market.country, market.language)),
    );
    const evidenceMarkets = new Set(
      input.pageEvidence.value.targetMarkets.map((market) =>
        marketLabel(market.country, market.language),
      ),
    );
    if (
      configuredMarkets.size !== evidenceMarkets.size ||
      [...configuredMarkets].some((market) => !evidenceMarkets.has(market))
    ) {
      throw new Error('SEO page evidence target markets do not match the configured markets.');
    }
  }
}

function normalizedSiteUrl(value: string): string {
  const url = new URL(value);
  const pathName = url.pathname.replace(/\/+$/, '');
  return `${url.protocol}//${url.host}${pathName}`;
}

function jsonFiles(root: string): string[] {
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(root, entry.name);
    if (entry.isDirectory()) return jsonFiles(target);
    return entry.isFile() && entry.name.endsWith('.json') ? [target] : [];
  });
}

function artifacts<T>(root: string, parse: (value: unknown) => T): Artifact<T>[] {
  return jsonFiles(root).map((filePath) => {
    const stat = statSync(filePath);
    return {
      filePath,
      observedAt: stat.mtime.toISOString(),
      revision: Math.max(1, Math.round(stat.mtimeMs)),
      value: parse(JSON.parse(readFileSync(filePath, 'utf8'))),
    };
  });
}

function evidenceFreshness(observedAt: string, now: Date, maxAgeDays: number): 'fresh' | 'stale' {
  return now.getTime() - new Date(observedAt).getTime() <= maxAgeDays * 86_400_000
    ? 'fresh'
    : 'stale';
}

function createEvidence(input: {
  id: string;
  kind: SeoOpportunityEvidence['kind'];
  source: string;
  observedAt: string;
  revision: number;
  summary: string;
  now: Date;
  maxAgeDays: number;
  sampleData?: boolean;
  limitations?: readonly string[];
  issues?: readonly SeoOpportunityEvidence['issues'][number][];
  status?: SeoOpportunityEvidence['status'];
  freshness?: SeoOpportunityEvidence['freshness'];
}): SeoOpportunityEvidence {
  return {
    evidenceId: stableId(input.id),
    revision: input.revision,
    kind: input.kind,
    source: input.source.slice(0, 160),
    observedAt: input.observedAt,
    freshness: input.freshness ?? evidenceFreshness(input.observedAt, input.now, input.maxAgeDays),
    summary: input.summary.slice(0, 280),
    sampleData: input.sampleData ?? false,
    limitations: [...(input.limitations ?? [])].slice(0, 8).map((item) => item.slice(0, 280)),
    issues: [...(input.issues ?? [])],
    status: input.status ?? 'current',
  };
}

function normalized(value: string | undefined): string {
  return value?.trim().toLowerCase() ?? '';
}

function loadArtifactCandidates(options: {
  cwd: string;
  researchRoot?: string;
  platformId: string;
  maxAgeDays: number;
  now: Date;
}): SeoOpportunityCandidate[] {
  const paths = resolveSeoResearchWorkspacePaths(options.cwd, options.researchRoot);
  const config = loadResearchConfig(paths.config);
  const opportunities = artifacts(paths.opportunities, (value) =>
    pageOpportunityFileSchema.parse(value),
  );
  const clusters = artifacts(paths.clusters, (value) => keywordClusterFileSchema.parse(value));
  const competitors = artifacts(paths.competitors, (value) =>
    competitorResearchFileSchema.parse(value),
  );
  const serp = artifacts(paths.serp, (value) => serpResearchFileSchema.parse(value));
  const pageEvidence = loadPageEvidenceArtifact(paths.pageAudits);
  validatePageEvidenceContext({
    pageEvidence,
    opportunities,
    config,
    expectedPlatformId: options.platformId,
  });
  const clusterById = new Map<string, Artifact<KeywordCluster>>();
  for (const artifact of clusters) {
    for (const cluster of artifact.value.clusters)
      clusterById.set(cluster.id, { ...artifact, value: cluster });
  }
  const latest = new Map<string, { artifact: Artifact<unknown>; opportunity: PageOpportunity }>();
  for (const artifact of opportunities.sort((left, right) => right.revision - left.revision)) {
    for (const opportunity of artifact.value.opportunities) {
      if (!latest.has(opportunity.id)) latest.set(opportunity.id, { artifact, opportunity });
    }
  }
  return [...latest.values()].map(({ artifact, opportunity }) => {
    const cluster = clusterById.get(opportunity.clusterId);
    const matchedCompetitor = competitors.find(({ value }) =>
      value.pages.some((page) =>
        [page.keyword, ...(page.keywordSignals ?? []).map((signal) => signal.term)]
          .map(normalized)
          .includes(normalized(opportunity.primaryKeyword)),
      ),
    );
    const matchedSerp = serp.find(({ value }) =>
      (value.snapshots ?? []).some(
        (snapshot) => normalized(snapshot.keyword) === normalized(opportunity.primaryKeyword),
      ),
    );
    const matchedSerpSnapshot = matchedSerp?.value.snapshots?.find(
      (snapshot) => normalized(snapshot.keyword) === normalized(opportunity.primaryKeyword),
    );
    const matchedPage = pageEvidence
      ? matchPageEvidence(pageEvidence.value, opportunity)
      : { conflict: false, routeMismatch: false };
    const pageMarket =
      pageEvidence?.value.targetMarkets.length === 1
        ? marketLabel(
            pageEvidence.value.targetMarkets[0]!.country,
            pageEvidence.value.targetMarkets[0]!.language,
          )
        : undefined;
    const metricMarket = cluster?.value.metricEvidence
      ? marketLabel(cluster.value.metricEvidence.country, cluster.value.metricEvidence.language)
      : undefined;
    const candidateMarket =
      metricMarket ??
      (matchedSerpSnapshot?.country
        ? `${matchedSerpSnapshot.country} / ${matchedSerpSnapshot.language ?? 'en'}`
        : pageMarket);
    const evidenceMarkets = new Set(
      pageEvidence?.value.targetMarkets.map((market) =>
        marketLabel(market.country, market.language).toLowerCase(),
      ) ?? [],
    );
    const pageMarketConflict = Boolean(
      candidateMarket && pageEvidence && !evidenceMarkets.has(candidateMarket.toLowerCase()),
    );
    const supportingEvidence: SeoOpportunityEvidence[] = [
      createEvidence({
        id: `${opportunity.id}.page`,
        kind: 'page',
        source: path.relative(options.cwd, artifact.filePath),
        observedAt: artifact.observedAt,
        revision: artifact.revision,
        summary: `Recorded page opportunity for ${opportunity.routePath}.`,
        now: options.now,
        maxAgeDays: options.maxAgeDays,
      }),
    ];
    if (cluster) {
      const metricEvidence = cluster.value.metricEvidence;
      supportingEvidence.push(
        createEvidence({
          id: `${opportunity.id}.keyword`,
          kind: 'keyword',
          source: path.relative(options.cwd, cluster.filePath),
          observedAt: metricEvidence?.observedAt ?? cluster.observedAt,
          revision: cluster.revision,
          summary:
            metricEvidence && cluster.value.totalVolume !== undefined
              ? `Recorded ${metricEvidence.provider} demand estimates total ${cluster.value.totalVolume} monthly searches across ${metricEvidence.matchedMetricCount} matched keywords.`
              : `Recorded keyword cluster with ${cluster.value.secondaryKeywords.length + 1} keyword candidates and no provider demand estimate.`,
          now: options.now,
          maxAgeDays: options.maxAgeDays,
          sampleData: metricEvidence?.sampleData ?? false,
          limitations: keywordEvidenceLimitations(cluster.value),
        }),
      );
    }
    if (matchedCompetitor) {
      const matchingPages = matchedCompetitor.value.pages.filter((page) =>
        [page.keyword, ...(page.keywordSignals ?? []).map((signal) => signal.term)]
          .map(normalized)
          .includes(normalized(opportunity.primaryKeyword)),
      );
      const recordedEvidence = matchedCompetitor.value.evidence;
      supportingEvidence.push(
        createEvidence({
          id: `${opportunity.id}.competitor`,
          kind: 'competitor',
          source: path.relative(options.cwd, matchedCompetitor.filePath),
          observedAt: recordedEvidence?.observedAt ?? matchedCompetitor.observedAt,
          revision: matchedCompetitor.revision,
          summary: `${matchingPages.length} recorded competitor page${matchingPages.length === 1 ? '' : 's'} contain matching keyword evidence.`,
          now: options.now,
          maxAgeDays: options.maxAgeDays,
          sampleData: recordedEvidence?.sampleData ?? false,
          limitations: recordedEvidence
            ? recordedEvidence.limitations
            : ['The competitor artifact does not record when its source evidence was observed.'],
          ...(recordedEvidence ? {} : { freshness: 'unknown' as const }),
        }),
      );
    }
    if (matchedSerp) {
      const snapshot = matchedSerpSnapshot!;
      supportingEvidence.push(
        createEvidence({
          id: `${opportunity.id}.serp`,
          kind: 'serp',
          source: path.relative(options.cwd, matchedSerp.filePath),
          observedAt: snapshot.capturedAt,
          revision: matchedSerp.revision,
          summary: `Recorded ${matchedSerp.value.source} search-result evidence matches the opportunity primary keyword.`,
          now: options.now,
          maxAgeDays: options.maxAgeDays,
          sampleData: matchedSerp.value.sampleData,
          limitations: [...matchedSerp.value.limitations, ...snapshot.limitations],
        }),
      );
    }
    if (pageEvidence) {
      const page = matchedPage.page;
      const limitations = pageEvidenceLimitations({
        file: pageEvidence.value,
        ...(page ? { page } : {}),
        conflict: matchedPage.conflict,
        routeMismatch: matchedPage.routeMismatch,
        marketConflict: pageMarketConflict,
      });
      const issues: SeoOpportunityEvidence['issues'] = [];
      if (matchedPage.conflict) issues.push('ambiguous-page');
      if (pageMarketConflict) issues.push('market-mismatch');
      if (page?.crawl.state === 'failed') issues.push('crawl-failed');
      if (page && page.search.state !== 'available') issues.push('search-performance-missing');
      supportingEvidence.push(
        createEvidence({
          id: `${opportunity.id}.page-inventory`,
          kind: 'page',
          source: path.relative(options.cwd, pageEvidence.filePath),
          observedAt: pageEvidence.value.generatedAt,
          revision: pageEvidence.revision,
          summary: page
            ? `The page inventory matches ${page.path} to this opportunity.`
            : 'The page inventory does not identify one unambiguous current page for this opportunity.',
          now: options.now,
          maxAgeDays: options.maxAgeDays,
          sampleData: page?.evidence.sampleData ?? pageEvidence.value.sampleData,
          limitations,
          issues,
          status: matchedPage.conflict || pageMarketConflict ? 'conflicting' : 'current',
          freshness:
            page?.evidence.stale === true ||
            pageEvidence.value.freshness.staleSources.length > 0 ||
            new Date(pageEvidence.value.freshness.freshUntil).getTime() <= options.now.getTime()
              ? 'stale'
              : 'fresh',
        }),
      );
    }
    return {
      id: normalizeSeoOpportunityId(opportunity.id),
      title: opportunity.title,
      routePath: opportunity.routePath,
      primaryKeyword: opportunity.primaryKeyword,
      ...(candidateMarket ? { market: candidateMarket } : {}),
      intent: opportunity.intent,
      rationale: opportunity.rationale,
      signals: {
        ...(cluster?.value.metricEvidence && cluster.value.totalVolume !== undefined
          ? { estimatedMonthlySearches: cluster.value.totalVolume }
          : {}),
        ...(cluster?.value.metricEvidence?.primaryCompetitionIndex !== undefined
          ? { competitionIndex: cluster.value.metricEvidence.primaryCompetitionIndex }
          : {}),
        marketFit: opportunity.fit,
        ...(matchedPage.page?.search.state === 'available' &&
        matchedPage.page.search.averagePosition !== undefined
          ? { currentPosition: matchedPage.page.search.averagePosition }
          : {}),
        ...(matchedPage.page?.search.state === 'available'
          ? {
              currentClicks: matchedPage.page.search.clicks,
              currentImpressions: matchedPage.page.search.impressions,
              ...(matchedPage.page.search.ctr !== undefined
                ? { currentCtr: matchedPage.page.search.ctr }
                : {}),
            }
          : {}),
      },
      evidence: supportingEvidence,
    };
  });
}

const defaultDependencies: GrowthSeoOpportunityExecutionDependencies = {
  loadCandidates: loadArtifactCandidates,
};

export function createGrowthSeoOpportunityExecutor(
  dependencies: GrowthSeoOpportunityExecutionDependencies = defaultDependencies,
) {
  return async function executeGrowthSeoOpportunityResearch(
    options: ExecuteGrowthSeoOpportunityOptions,
  ): Promise<GrowthSeoOpportunityResearchOutput> {
    const now = options.now ?? new Date();
    const action = createGrowthSeoOpportunityResearchAction({
      loadCandidates: () =>
        dependencies.loadCandidates({
          cwd: options.cwd,
          ...(options.researchRoot ? { researchRoot: options.researchRoot } : {}),
          platformId: stableId(options.projectId),
          maxAgeDays: options.maxAgeDays ?? 30,
          now,
        }),
      now: () => now,
    });
    const output = await action.execute(
      growthSeoOpportunityResearchInputSchema.parse({
        ...(options.market ? { market: options.market } : {}),
        ...(options.opportunityId ? { opportunityId: options.opportunityId } : {}),
        opportunityLimit: options.opportunityLimit ?? 10,
      }),
      {
        requestId: options.requestId ?? `request.seo-opportunities.${now.getTime()}`,
        scopeId: `scope.${stableId(options.projectId)}`,
        projectId: stableId(options.projectId),
        environmentId: stableId(options.environmentId),
        principal: options.principal,
        requestedAt: now.toISOString(),
      },
    );
    return growthSeoOpportunityResearchOutputSchema.parse(output);
  };
}

export const executeGrowthSeoOpportunityResearch = createGrowthSeoOpportunityExecutor();

export function formatGrowthSeoOpportunityResearch(
  output: GrowthSeoOpportunityResearchOutput,
): string {
  const presentation = output.workflow.presentation;
  const lines = [
    '# SEO opportunity review',
    '',
    presentation.headline,
    presentation.whyItMatters,
    '',
    ...output.opportunities.map(
      (item) => `${item.rank}. ${item.title} — ${item.score}/100, ${item.confidence} confidence`,
    ),
    ...(output.truncated
      ? [
          '',
          `${output.totalCandidateCount - output.returnedOpportunityCount} additional supported candidates were not returned.`,
        ]
      : []),
    ...(output.researchPlan.requests.length > 0
      ? [
          '',
          'Targeted research needed:',
          ...output.researchPlan.requests
            .slice(0, 3)
            .map(
              (request) =>
                `- ${request.priority === 'required' ? 'Required' : 'Recommended'}: ${request.reason}`,
            ),
          'Research runs only after an explicit user request or admitted automation.',
        ]
      : []),
    '',
    `Next: ${presentation.nextStep.label}`,
    presentation.nextStep.reason,
  ];
  if (presentation.nextStep.deepLink) lines.push(`Open: ${presentation.nextStep.deepLink}`);
  return `${lines.join('\n')}\n`;
}
