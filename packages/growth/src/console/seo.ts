import type {
  MarketingConsoleCompetitorResearchSummary,
  MarketingConsoleFaqResearchSummary,
  MarketingConsoleFreshnessCell,
  MarketingConsoleKeywordResearchSummary,
  MarketingConsoleMetric,
  MarketingConsoleSeo,
  MarketingConsoleSeoHealthIssue,
  MarketingConsoleSeoIntelligenceSummary,
  MarketingConsoleSeoOpportunity,
  MarketingConsoleSeoPage,
  MarketingConsoleSeoQuery,
  MarketingConsoleSeoResearchIdea,
  MarketingConsoleSeoWorkflowItem,
  MarketingConsoleStatus,
} from './contracts.js';
import type { GrowthSeoOpportunityResearchOutput } from '../actions/seo-opportunity-research.js';
import type { SeoImplementationPacket } from '../playbooks/seo-opportunity-preparation.js';
import type {
  SeoPublicationRecord,
  SeoPublicationVerification,
} from '../playbooks/seo-publication-verification.js';
import type { PageOpportunity } from '../seo/schema/opportunity.js';
import { normalizeSeoOpportunityId, seoOpportunityIdsMatch } from '../seo/identifiers.js';

export type MarketingConsoleSeoWorkflowArtifacts = {
  approvedOpportunityIds: readonly string[];
  opportunityRecords?: ReadonlyArray<{ path: string; opportunity: PageOpportunity }>;
  packets: ReadonlyArray<{ path: string; packet: SeoImplementationPacket }>;
  publications: ReadonlyArray<{ path: string; publication: SeoPublicationRecord }>;
  verifications: ReadonlyArray<{
    path: string;
    verification: SeoPublicationVerification;
  }>;
};

export type MarketingConsoleSeoWorkflowPaths = {
  opportunitySource: string;
  preparedDirectory: string;
  publicationsDirectory: string;
  verificationsDirectory: string;
};

export type MarketingConsoleSeoSourceRow = {
  id: string;
  query: string;
  pageUrl?: string;
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
};

const comparisonLabel = 'Previous-period comparison is not available yet.';

function shellArgument(value: string): string {
  return `'${value.replaceAll("'", "'\\''")}'`;
}

function command(lines: readonly string[]): string {
  return lines.join(' \\\n  ');
}

function artifactBaseName(filePath: string): string {
  const name = filePath.split('/').at(-1) ?? 'seo-opportunity';
  return name.replace(/\.implementation\.json$/u, '').replace(/\.json$/u, '');
}

function buildSeoOpportunityWorkflows(input: {
  review: GrowthSeoOpportunityResearchOutput;
  artifacts: MarketingConsoleSeoWorkflowArtifacts;
  paths: MarketingConsoleSeoWorkflowPaths;
  now: Date;
}): MarketingConsoleSeoWorkflowItem[] {
  const approved = new Set(input.artifacts.approvedOpportunityIds.map(normalizeSeoOpportunityId));
  const evidence = new Map(input.review.evidence.map((item) => [item.evidenceId, item]));
  return input.review.opportunities.map((opportunity) => {
    const sourceOpportunityArtifact = input.artifacts.opportunityRecords?.find((item) =>
      seoOpportunityIdsMatch(item.opportunity.id, opportunity.id),
    );
    const sourceOpportunity = sourceOpportunityArtifact?.opportunity;
    const opportunitySource = sourceOpportunityArtifact?.path ?? input.paths.opportunitySource;
    const selectionReview = sourceOpportunity
      ? {
          routePath: sourceOpportunity.routePath,
          title: sourceOpportunity.title,
          h1: sourceOpportunity.h1,
          metaDescription: sourceOpportunity.metaDescription,
          primaryKeyword: sourceOpportunity.primaryKeyword,
          supportingKeywords: sourceOpportunity.supportingKeywords,
          sections: sourceOpportunity.sections.map((section) => ({
            heading: section.heading,
            purpose: section.purpose,
            required: section.required,
          })),
          internalLinks: sourceOpportunity.internalLinks.map((link) => ({ ...link })),
          cta: { ...sourceOpportunity.cta },
          rationale: sourceOpportunity.rationale,
        }
      : undefined;
    const packetArtifact = input.artifacts.packets.find(
      (item) =>
        seoOpportunityIdsMatch(item.packet.selection.opportunityId, opportunity.id) &&
        item.packet.source.opportunityReviewObservedAt === input.review.observedAt,
    );
    const publicationArtifact = packetArtifact
      ? input.artifacts.publications.find(
          (item) =>
            seoOpportunityIdsMatch(item.publication.opportunity.id, opportunity.id) &&
            item.publication.packet.packetId === packetArtifact.packet.packetId,
        )
      : undefined;
    const verificationArtifact = publicationArtifact
      ? input.artifacts.verifications.find(
          (item) =>
            item.verification.publicationId === publicationArtifact.publication.publicationId,
        )
      : undefined;
    const supportingEvidence = opportunity.evidenceIds
      .map((id) => evidence.get(id))
      .filter((item) => item !== undefined);
    const requiredResearch = input.review.researchPlan.requests.some(
      (request) => request.opportunityId === opportunity.id && request.priority === 'required',
    );
    const unreliable =
      opportunity.confidence === 'low' ||
      supportingEvidence.length !== opportunity.evidenceIds.length ||
      supportingEvidence.some(
        (item) => item.sampleData || item.freshness !== 'fresh' || item.status === 'conflicting',
      );

    if (requiredResearch || unreliable) {
      return {
        opportunityId: opportunity.id,
        ...(selectionReview ? { selectionReview } : {}),
        stage: 'research-required',
        status: 'blocked',
        stageLabel: 'Research needs attention',
        summary:
          'Resolve required, stale, sample, conflicting, or low-confidence evidence before preparing this opportunity.',
      };
    }

    if (!packetArtifact) {
      if (!approved.has(normalizeSeoOpportunityId(opportunity.id))) {
        return {
          opportunityId: opportunity.id,
          ...(selectionReview ? { selectionReview } : {}),
          stage: 'approval-required',
          status: 'warn',
          stageLabel: 'Selection review required',
          summary:
            'Review the exact route, market, evidence, and limitations before marking this opportunity approved.',
          nextAction: {
            id: `seo.approve.${opportunity.id}`,
            label: 'Approve selection',
            description:
              'This command records the human opportunity-selection decision only. It does not prepare, edit, publish, or deploy a page.',
            command: command([
              'unisane-ops growth seo opportunities status',
              `--opportunities ${shellArgument(opportunitySource)}`,
              `--out ${shellArgument(opportunitySource)}`,
              `--id ${shellArgument(opportunity.id)}`,
              '--status approved',
            ]),
          },
        };
      }
      return {
        opportunityId: opportunity.id,
        ...(selectionReview ? { selectionReview } : {}),
        stage: 'ready-to-prepare',
        status: 'ready',
        stageLabel: 'Ready to prepare',
        summary:
          'The exact opportunity is approved and its recorded evidence supports an implementation packet.',
        nextAction: {
          id: `seo.prepare.${opportunity.id}`,
          label: 'Prepare implementation brief',
          description:
            'This creates a local evidence-bound packet for a coding agent. It does not edit, approve, publish, or deploy a page.',
          command: command([
            'unisane-ops growth seo opportunities prepare',
            `--opportunities ${shellArgument(opportunitySource)}`,
            `--id ${shellArgument(opportunity.id)}`,
            `--out-dir ${shellArgument(input.paths.preparedDirectory)}`,
            '--audience coding-agent',
          ]),
        },
      };
    }

    const packet = packetArtifact.packet;
    const packetView: NonNullable<MarketingConsoleSeoWorkflowItem['packet']> = {
      packetId: packet.packetId,
      preparedAt: packet.preparedAt,
      audience: packet.delivery.audience,
      jsonPath: packetArtifact.path,
      markdownPath: packetArtifact.path.replace(/\.json$/u, '.md'),
      baselineStatus: packet.measurementPlan.baseline.status,
      notBeforeDaysAfterPublication:
        packet.measurementPlan.verificationWindow.notBeforeDaysAfterPublication,
      expiresDaysAfterPublication:
        packet.measurementPlan.verificationWindow.expiresDaysAfterPublication,
    };
    const baseName = artifactBaseName(packetArtifact.path);
    const proposedPublicationPath = `${input.paths.publicationsDirectory}/${baseName}.json`;
    if (!publicationArtifact) {
      return {
        opportunityId: opportunity.id,
        ...(selectionReview ? { selectionReview } : {}),
        stage: 'prepared',
        status: 'ready',
        stageLabel: 'Implementation packet ready',
        summary:
          'Use the packet with a coding or content agent, review the resulting page, publish it through the owning workflow, then record that external publication.',
        packet: packetView,
        nextAction: {
          id: `seo.record-publication.${opportunity.id}`,
          label: 'Record publication',
          description:
            'Use this only after the exact page was reviewed and published externally. The command records that human-confirmed fact; it cannot publish the page.',
          command: command([
            'unisane-ops growth seo opportunities record-publication',
            `--packet ${shellArgument(packetArtifact.path)}`,
            `--published-url ${shellArgument('REPLACE_WITH_PUBLISHED_URL')}`,
            `--published-at ${shellArgument('REPLACE_WITH_ISO_8601_TIME')}`,
            `--recorded-by ${shellArgument('REPLACE_WITH_OPERATOR_ID')}`,
            '--confirm-reviewed',
            `--out ${shellArgument(proposedPublicationPath)}`,
          ]),
        },
      };
    }

    const publication = publicationArtifact.publication;
    const publicationView: NonNullable<MarketingConsoleSeoWorkflowItem['publication']> = {
      publicationId: publication.publicationId,
      publishedUrl: publication.publishedUrl,
      publishedAt: publication.publishedAt,
      recordedAt: publication.recordedAt,
      recordedBy: publication.review.recordedBy,
      path: publicationArtifact.path,
      notBeforeAt: publication.verification.notBeforeAt,
      expiresAt: publication.verification.expiresAt,
    };
    const proposedVerificationPath = `${input.paths.verificationsDirectory}/${baseName}.json`;
    const verificationCommand = {
      id: `seo.verify-publication.${opportunity.id}`,
      label: verificationArtifact ? 'Refresh measurement' : 'Verify result',
      description:
        'This refreshes the exact opportunity evidence and records an observed result. It does not establish causation or guarantee an outcome.',
      command: command([
        'unisane-ops growth seo opportunities verify-publication',
        `--publication ${shellArgument(publicationArtifact.path)}`,
        `--out ${shellArgument(proposedVerificationPath)}`,
      ]),
    };
    if (!verificationArtifact) {
      const waiting =
        input.now.getTime() < new Date(publication.verification.notBeforeAt).getTime();
      return {
        opportunityId: opportunity.id,
        ...(selectionReview ? { selectionReview } : {}),
        stage: waiting ? 'waiting-to-verify' : 'ready-to-verify',
        status: 'warn',
        stageLabel: waiting ? 'Waiting for measurement window' : 'Ready to verify',
        summary: waiting
          ? `The declared measurement window starts ${publication.verification.notBeforeAt}. No performance conclusion is available yet.`
          : 'The declared measurement window is open. Refresh the exact opportunity evidence before deciding what changed.',
        packet: packetView,
        publication: publicationView,
        nextAction: verificationCommand,
      };
    }

    const verification = verificationArtifact.verification;
    const needsAttention = ['declined', 'mixed', 'not-measurable'].includes(verification.outcome);
    return {
      opportunityId: opportunity.id,
      ...(selectionReview ? { selectionReview } : {}),
      stage: needsAttention ? 'needs-attention' : 'verified',
      status: needsAttention ? 'warn' : 'ready',
      stageLabel: needsAttention ? 'Measured result needs review' : 'Measured result recorded',
      summary: verification.summary,
      packet: packetView,
      publication: publicationView,
      verification: {
        verificationId: verification.verificationId,
        observedAt: verification.observedAt,
        outcome: verification.outcome,
        windowState: verification.windowState,
        summary: verification.summary,
        limitations: verification.limitations,
        nextStep: verification.nextStep,
        causalClaim: verification.causalClaim,
        path: verificationArtifact.path,
      },
      nextAction: verificationCommand,
    };
  });
}

function rounded(value: number | undefined, digits = 1): number | undefined {
  if (value === undefined || !Number.isFinite(value)) return undefined;
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

function pagePath(url: string): string {
  try {
    return new URL(url).pathname || '/';
  } catch {
    return url.startsWith('/') ? url : '/';
  }
}

function titleCase(value: string): string {
  return value.replace(/[-_]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function pageTitle(url: string): string {
  const pathname = pagePath(url);
  if (pathname === '/') return 'Homepage';
  const segments = pathname.split('/').filter(Boolean);
  const leaf = segments.at(-1) ?? pathname;
  const label = titleCase(leaf);
  if (segments.at(-2) === 'templates') return `${label} template`;
  return label;
}

function freshnessContext(freshness: readonly MarketingConsoleFreshnessCell[]): {
  status: MarketingConsoleStatus;
  label: string;
  ageDays?: number;
} {
  const cells = freshness.filter((cell) => cell.provider === 'searchConsole');
  const usable = cells
    .filter((cell) => cell.ageDays !== undefined)
    .sort((left, right) => (left.ageDays ?? Number.MAX_SAFE_INTEGER) - (right.ageDays ?? 0))[0];
  if (!usable) return { status: 'missing', label: 'No usable Search Console data' };
  const ageDays = usable.ageDays ?? 0;
  return {
    status: usable.status,
    label: ageDays === 0 ? 'Updated today' : `${ageDays} day${ageDays === 1 ? '' : 's'} old`,
    ageDays,
  };
}

function weightedAverage(
  rows: readonly MarketingConsoleSeoSourceRow[],
  field: 'position',
): number | undefined {
  let weighted = 0;
  let weight = 0;
  for (const row of rows) {
    const value = row[field];
    if (value === undefined) continue;
    const rowWeight = Math.max(row.impressions ?? 0, 1);
    weighted += value * rowWeight;
    weight += rowWeight;
  }
  return weight > 0 ? weighted / weight : undefined;
}

function auditForPath(intelligence: MarketingConsoleSeoIntelligenceSummary, path: string) {
  return intelligence.pageAudits.audits.find((audit) => audit.routePath === path);
}

function buildPages(
  rows: readonly MarketingConsoleSeoSourceRow[],
  intelligence: MarketingConsoleSeoIntelligenceSummary,
): MarketingConsoleSeoPage[] {
  const grouped = new Map<string, MarketingConsoleSeoSourceRow[]>();
  for (const row of rows) {
    if (!row.pageUrl) continue;
    const path = pagePath(row.pageUrl);
    grouped.set(path, [...(grouped.get(path) ?? []), row]);
  }
  return [...grouped.entries()]
    .map(([path, pageRows]) => {
      const url =
        pageRows
          .map((row) => row.pageUrl)
          .filter((value): value is string => value !== undefined)
          .sort(
            (left, right) =>
              Number(right.startsWith('https://')) - Number(left.startsWith('https://')),
          )[0] ?? path;
      const clicks = pageRows.reduce((sum, row) => sum + (row.clicks ?? 0), 0);
      const searchViews = pageRows.reduce((sum, row) => sum + (row.impressions ?? 0), 0);
      const audit = auditForPath(intelligence, path);
      const indexingWarning =
        audit?.status === 'blocked'
          ? (audit.missing[0] ?? audit.warnings[0] ?? 'This page may not appear in search.')
          : undefined;
      return {
        id: path,
        title: pageTitle(url),
        path,
        fullUrl: url,
        clicks,
        searchViews,
        ...(weightedAverage(pageRows, 'position') !== undefined
          ? { averagePosition: rounded(weightedAverage(pageRows, 'position')) }
          : {}),
        ...(searchViews > 0 ? { clickThroughRate: rounded((clicks / searchViews) * 100) } : {}),
        changeLabel: comparisonLabel,
        status: indexingWarning ? 'Not indexed' : 'Review',
        statusDetail: indexingWarning
          ? 'A search visibility check found an indexing problem.'
          : 'Previous-period data is needed before this page can be classified as growing or declining.',
        ...(indexingWarning ? { indexingWarning } : {}),
        topQueries: [...pageRows]
          .sort(
            (left, right) =>
              (right.clicks ?? 0) - (left.clicks ?? 0) ||
              (right.impressions ?? 0) - (left.impressions ?? 0),
          )
          .map((row) => row.query)
          .filter((query, index, values) => values.indexOf(query) === index)
          .slice(0, 5),
      } satisfies MarketingConsoleSeoPage;
    })
    .sort(
      (left, right) =>
        right.clicks - left.clicks ||
        right.searchViews - left.searchViews ||
        left.title.localeCompare(right.title),
    );
}

function buildQueries(rows: readonly MarketingConsoleSeoSourceRow[]): MarketingConsoleSeoQuery[] {
  const grouped = new Map<string, MarketingConsoleSeoSourceRow[]>();
  for (const row of rows) {
    grouped.set(row.query, [...(grouped.get(row.query) ?? []), row]);
  }
  return [...grouped.entries()]
    .map(([query, queryRows]) => {
      const clicks = queryRows.reduce((sum, row) => sum + (row.clicks ?? 0), 0);
      const searchViews = queryRows.reduce((sum, row) => sum + (row.impressions ?? 0), 0);
      const bestPageRow = [...queryRows]
        .filter((row) => row.pageUrl)
        .sort(
          (left, right) =>
            (right.clicks ?? 0) - (left.clicks ?? 0) ||
            (right.impressions ?? 0) - (left.impressions ?? 0),
        )[0];
      return {
        id: query,
        query,
        clicks,
        searchViews,
        ...(weightedAverage(queryRows, 'position') !== undefined
          ? { averagePosition: rounded(weightedAverage(queryRows, 'position')) }
          : {}),
        ...(searchViews > 0 ? { clickThroughRate: rounded((clicks / searchViews) * 100) } : {}),
        changeLabel: comparisonLabel,
        ...(bestPageRow?.pageUrl
          ? {
              bestPage: {
                title: pageTitle(bestPageRow.pageUrl),
                path: pagePath(bestPageRow.pageUrl),
              },
            }
          : {}),
      } satisfies MarketingConsoleSeoQuery;
    })
    .sort(
      (left, right) =>
        right.clicks - left.clicks ||
        right.searchViews - left.searchViews ||
        left.query.localeCompare(right.query),
    );
}

function pageOpportunity(
  page: MarketingConsoleSeoPage,
  freshnessLabel: string,
): MarketingConsoleSeoOpportunity | undefined {
  if (page.searchViews < 5 || page.clickThroughRate === undefined || page.clickThroughRate >= 5) {
    return undefined;
  }
  return {
    id: `page:${page.path}`,
    kind:
      page.averagePosition !== undefined && page.averagePosition <= 20
        ? 'quick-win'
        : 'high-impact',
    title: `Improve ${page.title} search click-through`,
    expectedOutcome: 'Turn existing search visibility into more qualified organic visits.',
    reason: `${page.searchViews} search views produced ${page.clicks} organic click${page.clicks === 1 ? '' : 's'} in the available period.`,
    affectedLabel: `1 page · ${page.topQueries.length} known search${page.topQueries.length === 1 ? '' : 'es'}`,
    impactLabel: `${page.searchViews} existing search views`,
    confidenceLabel: 'Medium confidence',
    effortLabel: 'Medium effort',
    freshnessLabel,
    evidence: `Search Console · ${page.clickThroughRate}% click-through rate${
      page.averagePosition === undefined ? '' : ` · average position ${page.averagePosition}`
    }`,
    action: {
      label: 'Review page',
      path: '/seo/pages',
    },
  };
}

function auditOpportunity(
  audit: MarketingConsoleSeoIntelligenceSummary['pageAudits']['audits'][number],
  freshnessLabel: string,
): MarketingConsoleSeoOpportunity | undefined {
  if (audit.status === 'ready') return undefined;
  const issue = [...audit.missing, ...audit.warnings].find((detail) =>
    technicalHealthGroupFor(detail),
  );
  if (!issue) return undefined;
  return {
    id: `audit:${audit.id}`,
    kind: 'problem',
    title: `Restore search visibility for ${pageTitle(audit.routePath)}`,
    expectedOutcome:
      'Make the important page easier for search engines to discover and understand.',
    reason: issue,
    affectedLabel: '1 page',
    impactLabel:
      audit.status === 'blocked'
        ? 'Search visibility may be blocked'
        : 'Search visibility may be reduced',
    confidenceLabel: 'High confidence',
    effortLabel: 'Medium effort',
    freshnessLabel,
    evidence: `Page check · ${audit.status === 'blocked' ? 'blocking issue' : 'issue to review'}`,
    action: {
      label: 'Review site health',
      path: '/seo/site-health',
    },
  };
}

function buildOpportunities(
  pages: readonly MarketingConsoleSeoPage[],
  intelligence: MarketingConsoleSeoIntelligenceSummary,
  freshnessLabel: string,
): MarketingConsoleSeoOpportunity[] {
  const auditItems = intelligence.pageAudits.audits
    .map((audit) => auditOpportunity(audit, freshnessLabel))
    .filter((item): item is MarketingConsoleSeoOpportunity => item !== undefined);
  const pageItems = pages
    .map((page) => pageOpportunity(page, freshnessLabel))
    .filter((item): item is MarketingConsoleSeoOpportunity => item !== undefined);
  return [...auditItems, ...pageItems]
    .sort((left, right) => {
      const kindRank = { problem: 0, 'quick-win': 1, 'high-impact': 2 };
      return kindRank[left.kind] - kindRank[right.kind] || left.title.localeCompare(right.title);
    })
    .slice(0, 12);
}

const healthGroups: MarketingConsoleSeo['siteHealth']['groups'] = [
  { id: 'indexing', label: 'Indexing and visibility', issues: [] },
  { id: 'crawling', label: 'Crawling and access', issues: [] },
  { id: 'sitemaps', label: 'Sitemaps and canonical pages', issues: [] },
  { id: 'structured-data', label: 'Structured data', issues: [] },
  { id: 'links', label: 'Links and redirects', issues: [] },
];

function technicalHealthGroupFor(
  text: string,
): MarketingConsoleSeo['siteHealth']['groups'][number]['id'] | undefined {
  const normalized = text.toLowerCase();
  if (/schema|structured|json-ld/.test(normalized)) return 'structured-data';
  if (
    /missing sitemap|sitemap error|invalid sitemap|canonical (error|conflict|missing)|missing canonical/.test(
      normalized,
    )
  ) {
    return 'sitemaps';
  }
  if (
    /broken (internal )?link|orphaned page|redirect (loop|chain|error)|\b404\b|page not found/.test(
      normalized,
    )
  ) {
    return 'links';
  }
  if (
    /blocked by robots|robots\.txt|crawl (error|blocked)|access denied|invalid http status|server response error|rendering failed/.test(
      normalized,
    )
  ) {
    return 'crawling';
  }
  if (
    /blocked from indexing|not indexed|indexing (blocked|error)|not indexable|\bnoindex\b|excluded from (the )?index/.test(
      normalized,
    )
  ) {
    return 'indexing';
  }
  return undefined;
}

function buildSiteHealth(
  intelligence: MarketingConsoleSeoIntelligenceSummary,
  freshnessLabel: string,
): MarketingConsoleSeo['siteHealth'] {
  const groups: MarketingConsoleSeo['siteHealth']['groups'] = healthGroups.map((group) => ({
    ...group,
    issues: [],
  }));
  for (const audit of intelligence.pageAudits.audits) {
    const details = [...audit.missing, ...audit.warnings];
    for (const [index, detail] of details.entries()) {
      const groupId = technicalHealthGroupFor(detail);
      if (!groupId) continue;
      const group = groups.find((item) => item.id === groupId);
      if (!group) continue;
      group.issues.push({
        id: `${audit.id}:${index}`,
        title: detail,
        impact:
          audit.status === 'blocked'
            ? 'This page may not appear in Google Search.'
            : 'Search engines may understand or present this page less reliably.',
        affectedLabel: pageTitle(audit.routePath),
        confidenceLabel: 'High confidence',
        firstSeenLabel: 'First seen date is not available',
        lastCheckedLabel: freshnessLabel,
        actionLabel: 'Review page',
        path: '/seo/pages',
        status: audit.status,
      } satisfies MarketingConsoleSeoHealthIssue);
    }
  }
  const issueCount = groups.reduce((sum, group) => sum + group.issues.length, 0);
  const blockedCount = groups.reduce(
    (sum, group) => sum + group.issues.filter((issue) => issue.status === 'blocked').length,
    0,
  );
  if (intelligence.pageAudits.pageCount === 0) {
    return {
      available: false,
      status: 'missing',
      headline: 'Search site health has not been checked yet.',
      detail:
        'No indexing, crawl, sitemap, structured-data, or link result is shown until a real page check exists.',
      groups,
    };
  }
  return {
    available: true,
    status: blockedCount > 0 ? 'blocked' : issueCount > 0 ? 'warn' : 'ready',
    headline:
      issueCount === 0
        ? 'No technical search problem was found in the latest page checks.'
        : `${issueCount} technical search issue${issueCount === 1 ? '' : 's'} need attention.`,
    detail:
      issueCount === 0
        ? `${intelligence.pageAudits.pageCount} checked page${intelligence.pageAudits.pageCount === 1 ? '' : 's'} have no reported indexing, crawl, sitemap, structured-data, or link issue. Content strategy findings remain in Research and Opportunities.`
        : blockedCount > 0
          ? `${blockedCount} issue${blockedCount === 1 ? '' : 's'} may prevent an important page from appearing in search.`
          : `${issueCount} non-blocking technical issue${issueCount === 1 ? '' : 's'} should be reviewed.`,
    groups,
  };
}

function difficultyLabel(
  competition: string | undefined,
  competitionIndex: number | undefined,
): MarketingConsoleSeoResearchIdea['difficultyLabel'] {
  if (competition) {
    const value = competition.toLowerCase();
    if (value.includes('low')) return 'Low';
    if (value.includes('high')) return 'High';
    if (value.includes('medium')) return 'Medium';
  }
  if (competitionIndex === undefined) return 'Not available';
  if (competitionIndex < 34) return 'Low';
  if (competitionIndex < 67) return 'Medium';
  return 'High';
}

function intentLabel(topic: string): MarketingConsoleSeoResearchIdea['intentLabel'] {
  if (/\b(vs|best|compare|comparison)\b/i.test(topic)) return 'Compare';
  if (/\b(builder|maker|template|download|service|software)\b/i.test(topic)) return 'Buy';
  return 'Learn';
}

function buildResearch(args: {
  keywords: MarketingConsoleKeywordResearchSummary;
  competitors: MarketingConsoleCompetitorResearchSummary;
  faq: MarketingConsoleFaqResearchSummary;
  intelligence: MarketingConsoleSeoIntelligenceSummary;
  queries: readonly MarketingConsoleSeoQuery[];
}): MarketingConsoleSeo['research'] {
  const keywordIdeas = args.keywords.matrix
    .map((keyword) => {
      const source = args.keywords.keywords.find(
        (item) => (item.normalizedTerm ?? item.term).toLowerCase() === keyword.normalizedTerm,
      );
      const current = args.queries.find(
        (query) => query.query.toLowerCase() === keyword.normalizedTerm,
      );
      return {
        id: keyword.normalizedTerm,
        topic: keyword.term,
        ...(keyword.totalKnownVolume > 0
          ? { estimatedMonthlySearches: keyword.totalKnownVolume }
          : {}),
        demandLabel:
          keyword.totalKnownVolume > 0
            ? `About ${keyword.totalKnownVolume.toLocaleString('en-US')} estimated monthly searches across measured markets`
            : 'Estimated demand is not available',
        interestLabel: 'Interest direction needs another measurement period',
        visibilityLabel: current
          ? `${current.searchViews} current search views`
          : 'The site does not appear in the available query data',
        difficultyLabel: difficultyLabel(source?.competition, source?.competitionIndex),
        intentLabel: intentLabel(keyword.term),
        ...(current?.averagePosition !== undefined
          ? { currentPosition: current.averagePosition }
          : {}),
        ...(keyword.bestMarket ? { country: keyword.bestMarket.split('/')[0]?.trim() } : {}),
        ...(source?.language ? { language: source.language } : {}),
      } satisfies MarketingConsoleSeoResearchIdea;
    })
    .sort(
      (left, right) =>
        (right.estimatedMonthlySearches ?? 0) - (left.estimatedMonthlySearches ?? 0) ||
        left.topic.localeCompare(right.topic),
    )
    .slice(0, 30);
  const questions = args.faq.topQuestions.slice(0, 20).map((question) => ({
    id: question.id,
    question: question.question,
    demandLabel:
      question.avgMonthlySearches === undefined
        ? 'Estimated demand is not available'
        : `About ${question.avgMonthlySearches.toLocaleString('en-US')} estimated monthly searches`,
    intentLabel: titleCase(question.answerIntent),
    visibilityLabel: args.queries.some((query) =>
      question.sourceTerms.some((term) => term.toLowerCase() === query.query.toLowerCase()),
    )
      ? 'Visible in current search data'
      : 'Not visible in current search data',
  }));
  const gapTitles = [
    ...args.competitors.opportunities,
    ...args.intelligence.serp.snapshots.flatMap((snapshot) => snapshot.opportunities),
  ].filter((title, index, values) => values.indexOf(title) === index);
  const contentGaps = gapTitles.slice(0, 20).map((title, index) => ({
    id: `gap:${index}`,
    title,
    reason: 'This gap comes from recorded competitor or search-result research.',
    actionLabel: 'Review opportunity',
  }));
  const markets = args.keywords.markets
    .map((market) => [market.country, market.language].filter(Boolean).join(' / '))
    .filter(Boolean);
  return {
    available: keywordIdeas.length > 0 || questions.length > 0 || contentGaps.length > 0,
    contextLabel:
      markets.length > 0
        ? `Markets: ${markets.join(', ')}`
        : 'Country and language context is not available yet.',
    demandExplanation:
      'An estimate of how often people search for this topic each month. Use it to compare opportunities, not as an exact traffic forecast.',
    keywordIdeas,
    questions,
    contentGaps,
  };
}

function findMetric(
  metrics: readonly MarketingConsoleMetric[],
  id: string,
): MarketingConsoleMetric | undefined {
  return metrics.find((metric) => metric.id === id && metric.numericValue !== undefined);
}

function buildOverviewMetrics(args: {
  metrics: readonly MarketingConsoleMetric[];
  rows: readonly MarketingConsoleSeoSourceRow[];
  freshnessLabel: string;
  status: MarketingConsoleStatus;
}): MarketingConsoleSeo['overview']['metrics'] {
  const organicClicks = findMetric(args.metrics, 'organic-clicks');
  const searchViews = findMetric(args.metrics, 'organic-impressions');
  const averagePosition = rounded(weightedAverage(args.rows, 'position'));
  return [
    ...(organicClicks ? [organicClicks] : []),
    ...(searchViews ? [searchViews] : []),
    ...(averagePosition === undefined
      ? []
      : [
          {
            id: 'average-position',
            label: 'Average position',
            value: averagePosition.toFixed(1),
            definition:
              'Average Google Search position across the available query and page evidence.',
            sourceLabel: 'Search Console',
            freshnessLabel: args.freshnessLabel,
            comparisonLabel,
            status: args.status,
          },
        ]),
  ];
}

export function buildMarketingConsoleSeo(args: {
  rows: readonly MarketingConsoleSeoSourceRow[];
  metrics: readonly MarketingConsoleMetric[];
  freshness: readonly MarketingConsoleFreshnessCell[];
  keywordResearch: MarketingConsoleKeywordResearchSummary;
  competitorResearch: MarketingConsoleCompetitorResearchSummary;
  faqResearch: MarketingConsoleFaqResearchSummary;
  intelligence: MarketingConsoleSeoIntelligenceSummary;
  opportunityReview: GrowthSeoOpportunityResearchOutput;
  workflowArtifacts?: MarketingConsoleSeoWorkflowArtifacts;
  workflowPaths?: MarketingConsoleSeoWorkflowPaths;
  now?: Date;
}): MarketingConsoleSeo {
  const sourceFreshness = freshnessContext(args.freshness);
  const pages = buildPages(args.rows, args.intelligence);
  const queries = buildQueries(args.rows);
  const opportunities = buildOpportunities(pages, args.intelligence, sourceFreshness.label);
  const hasData = pages.length > 0 || queries.length > 0;
  const stale = sourceFreshness.status !== 'ready';
  const status: MarketingConsoleStatus = !hasData ? 'missing' : stale ? 'warn' : 'ready';
  const headline = !hasData
    ? 'Search performance data is not available yet.'
    : stale
      ? `Search results are available, but they are ${sourceFreshness.label}.`
      : opportunities.length > 0
        ? `${opportunities.length} search improvement${opportunities.length === 1 ? '' : 's'} are supported by current evidence.`
        : 'Search performance is ready to review.';
  const detail = !hasData
    ? 'Connect Search Console or wait for its first successful update before reviewing clicks, search views, pages, or queries.'
    : `${comparisonLabel} Current-period results remain usable when read with the source freshness below.`;

  return {
    sourceLabel: 'Google Search Console',
    freshnessLabel: sourceFreshness.label,
    comparisonAvailable: false,
    comparisonLabel,
    opportunityReview: args.opportunityReview,
    opportunityWorkflows:
      args.workflowArtifacts && args.workflowPaths
        ? buildSeoOpportunityWorkflows({
            review: args.opportunityReview,
            artifacts: args.workflowArtifacts,
            paths: args.workflowPaths,
            now: args.now ?? new Date(),
          })
        : [],
    overview: {
      status,
      headline,
      detail,
      metrics: buildOverviewMetrics({
        metrics: args.metrics,
        rows: args.rows,
        freshnessLabel: sourceFreshness.label,
        status,
      }),
      opportunities: opportunities.slice(0, 3),
      pagePreview: pages.slice(0, 5),
    },
    opportunities,
    pages,
    queries,
    siteHealth: buildSiteHealth(args.intelligence, sourceFreshness.label),
    research: buildResearch({
      keywords: args.keywordResearch,
      competitors: args.competitorResearch,
      faq: args.faqResearch,
      intelligence: args.intelligence,
      queries,
    }),
  };
}
