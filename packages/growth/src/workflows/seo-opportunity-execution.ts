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
import { pageOpportunityFileSchema, type PageOpportunity } from '../seo/schema/opportunity.js';
import { resolveSeoResearchWorkspacePaths } from '../seo/workspace/paths.js';

export type ExecuteGrowthSeoOpportunityOptions = {
  cwd: string;
  researchRoot?: string;
  projectId: string;
  environmentId: string;
  principal: OpsPrincipal;
  market?: string;
  opportunityLimit?: number;
  maxAgeDays?: number;
  now?: Date;
  requestId?: string;
};

export type GrowthSeoOpportunityExecutionDependencies = {
  loadCandidates(options: {
    cwd: string;
    researchRoot?: string;
    maxAgeDays: number;
    now: Date;
  }): readonly SeoOpportunityCandidate[];
};

type Artifact<T> = { filePath: string; observedAt: string; revision: number; value: T };
type SerpArtifact = {
  snapshots?: Array<{
    keyword?: string;
    country?: string;
    language?: string;
    capturedAt?: string;
  }>;
};
type PageAuditArtifact = {
  audits?: Array<{ routePath?: string; primaryKeyword?: string; score?: number }>;
};

function stableId(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9.-]+/g, '-')
      .replace(/^[.-]+|[.-]+$/g, '') || 'seo'
  );
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
  return jsonFiles(root).flatMap((filePath) => {
    try {
      const stat = statSync(filePath);
      return [
        {
          filePath,
          observedAt: stat.mtime.toISOString(),
          revision: Math.max(1, Math.round(stat.mtimeMs)),
          value: parse(JSON.parse(readFileSync(filePath, 'utf8'))),
        },
      ];
    } catch {
      return [];
    }
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
}): SeoOpportunityEvidence {
  return {
    evidenceId: stableId(input.id),
    revision: input.revision,
    kind: input.kind,
    source: input.source.slice(0, 160),
    observedAt: input.observedAt,
    freshness: evidenceFreshness(input.observedAt, input.now, input.maxAgeDays),
    summary: input.summary.slice(0, 280),
    status: 'current',
  };
}

function normalized(value: string | undefined): string {
  return value?.trim().toLowerCase() ?? '';
}

function loadArtifactCandidates(options: {
  cwd: string;
  researchRoot?: string;
  maxAgeDays: number;
  now: Date;
}): SeoOpportunityCandidate[] {
  const paths = resolveSeoResearchWorkspacePaths(options.cwd, options.researchRoot);
  const opportunities = artifacts(paths.opportunities, (value) =>
    pageOpportunityFileSchema.parse(value),
  );
  const clusters = artifacts(paths.clusters, (value) => keywordClusterFileSchema.parse(value));
  const competitors = artifacts(paths.competitors, (value) =>
    competitorResearchFileSchema.parse(value),
  );
  const serp = artifacts(paths.serp, (value) => value as SerpArtifact);
  const pageAudits = artifacts(paths.pageAudits, (value) => value as PageAuditArtifact);
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
    const matchedPageAudit = pageAudits.find(({ value }) =>
      (value.audits ?? []).some(
        (audit) =>
          audit.routePath === opportunity.routePath ||
          normalized(audit.primaryKeyword) === normalized(opportunity.primaryKeyword),
      ),
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
      supportingEvidence.push(
        createEvidence({
          id: `${opportunity.id}.keyword`,
          kind: 'keyword',
          source: path.relative(options.cwd, cluster.filePath),
          observedAt: cluster.observedAt,
          revision: cluster.revision,
          summary: `Recorded keyword cluster with ${cluster.value.secondaryKeywords.length + 1} keyword signals.`,
          now: options.now,
          maxAgeDays: options.maxAgeDays,
        }),
      );
    }
    if (matchedCompetitor) {
      supportingEvidence.push(
        createEvidence({
          id: `${opportunity.id}.competitor`,
          kind: 'competitor',
          source: path.relative(options.cwd, matchedCompetitor.filePath),
          observedAt: matchedCompetitor.observedAt,
          revision: matchedCompetitor.revision,
          summary: 'Recorded competitor pages contain matching keyword evidence.',
          now: options.now,
          maxAgeDays: options.maxAgeDays,
        }),
      );
    }
    if (matchedSerp) {
      supportingEvidence.push(
        createEvidence({
          id: `${opportunity.id}.serp`,
          kind: 'serp',
          source: path.relative(options.cwd, matchedSerp.filePath),
          observedAt: matchedSerpSnapshot?.capturedAt ?? matchedSerp.observedAt,
          revision: matchedSerp.revision,
          summary: 'Recorded search results match the opportunity primary keyword.',
          now: options.now,
          maxAgeDays: options.maxAgeDays,
        }),
      );
    }
    if (matchedPageAudit) {
      supportingEvidence.push(
        createEvidence({
          id: `${opportunity.id}.page-audit`,
          kind: 'page',
          source: path.relative(options.cwd, matchedPageAudit.filePath),
          observedAt: matchedPageAudit.observedAt,
          revision: matchedPageAudit.revision,
          summary: 'Recorded page-audit evidence matches the proposed route or keyword.',
          now: options.now,
          maxAgeDays: options.maxAgeDays,
        }),
      );
    }
    return {
      id: stableId(opportunity.id),
      title: opportunity.title,
      routePath: opportunity.routePath,
      primaryKeyword: opportunity.primaryKeyword,
      ...(matchedCompetitor?.value.market
        ? { market: matchedCompetitor.value.market }
        : matchedSerpSnapshot?.country
          ? {
              market: `${matchedSerpSnapshot.country} / ${matchedSerpSnapshot.language ?? 'en'}`,
            }
          : {}),
      intent: opportunity.intent,
      rationale: opportunity.rationale,
      signals: {
        ...(opportunity.totalVolume !== undefined
          ? { estimatedMonthlySearches: opportunity.totalVolume }
          : {}),
        marketFit: opportunity.fit,
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
          maxAgeDays: options.maxAgeDays ?? 30,
          now,
        }),
      now: () => now,
    });
    const output = await action.execute(
      growthSeoOpportunityResearchInputSchema.parse({
        ...(options.market ? { market: options.market } : {}),
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
    '',
    `Next: ${presentation.nextStep.label}`,
    presentation.nextStep.reason,
  ];
  if (presentation.nextStep.deepLink) lines.push(`Open: ${presentation.nextStep.deepLink}`);
  return `${lines.join('\n')}\n`;
}
