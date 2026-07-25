import type { InternalLinkPlanFile } from '../schema/internal-link.js';
import type { PageOpportunity, PageOpportunityFile } from '../schema/opportunity.js';

export type RenderSeoResearchReportOptions = {
  opportunityFile: PageOpportunityFile;
  internalLinkPlan?: InternalLinkPlanFile;
};

export function renderSeoResearchReport(options: RenderSeoResearchReportOptions): string {
  const opportunities = [...options.opportunityFile.opportunities].sort(sortOpportunities);
  const lines = [
    `# ${options.opportunityFile.platformId} SEO Research Report`,
    '',
    `Source pattern pack: \`${options.opportunityFile.sourcePatternPack}\``,
    `Base path: \`/${options.opportunityFile.basePath}\``,
    '',
    '## Summary',
    '',
    ...renderSummary(opportunities, options.internalLinkPlan),
    '',
    '## Top Opportunities',
    '',
    ...renderTopOpportunities(opportunities),
    '',
    '## Status',
    '',
    ...renderStatus(opportunities),
    '',
    '## Internal Linking',
    '',
    ...renderInternalLinkSummary(options.internalLinkPlan),
    '',
    '## Next Actions',
    '',
    ...renderNextActions(opportunities, options.internalLinkPlan),
    '',
  ];

  return `${lines.join('\n')}\n`;
}

function renderSummary(
  opportunities: PageOpportunity[],
  internalLinkPlan?: InternalLinkPlanFile,
): string[] {
  const totalVolume = opportunities.reduce(
    (total, opportunity) => total + (opportunity.totalVolume ?? 0),
    0,
  );
  const approved = opportunities.filter((opportunity) => opportunity.status === 'approved').length;
  const candidates = opportunities.filter(
    (opportunity) => opportunity.status === 'candidate',
  ).length;
  const built = opportunities.filter((opportunity) => opportunity.status === 'built').length;
  const orphanCount = internalLinkPlan?.orphanPaths.length ?? 0;

  return [
    `- Planned pages: ${opportunities.length}`,
    `- Candidate pages: ${candidates}`,
    `- Approved pages: ${approved}`,
    `- Built pages: ${built}`,
    `- Known search volume: ${totalVolume}`,
    `- Internal link orphan risks: ${orphanCount}`,
  ];
}

function renderTopOpportunities(opportunities: PageOpportunity[]): string[] {
  if (opportunities.length === 0) {
    return ['No page opportunities planned yet.'];
  }

  return opportunities.slice(0, 10).map((opportunity, index) => {
    const volume =
      opportunity.totalVolume === undefined
        ? 'unknown volume'
        : `${opportunity.totalVolume} searches`;
    return `${index + 1}. ${opportunity.title} - \`${opportunity.routePath}\` - ${opportunity.priority}, ${volume}`;
  });
}

function renderStatus(opportunities: PageOpportunity[]): string[] {
  const groups = ['candidate', 'approved', 'built', 'rejected'].map((status) => {
    const count = opportunities.filter((opportunity) => opportunity.status === status).length;
    return `- ${status}: ${count}`;
  });
  return groups;
}

function renderInternalLinkSummary(internalLinkPlan?: InternalLinkPlanFile): string[] {
  if (!internalLinkPlan) {
    return [
      'No internal link plan attached. Run `seo internal-links plan` to add link health data.',
    ];
  }

  const lines = [
    `- Hub path: \`${internalLinkPlan.hubPath}\``,
    `- Pages: ${internalLinkPlan.pages.length}`,
    `- Edges: ${internalLinkPlan.edges.length}`,
    `- Orphan risks: ${internalLinkPlan.orphanPaths.length}`,
  ];

  if (internalLinkPlan.orphanPaths.length > 0) {
    lines.push(...internalLinkPlan.orphanPaths.map((path) => `- Orphan risk: \`${path}\``));
  }

  return lines;
}

function renderNextActions(
  opportunities: PageOpportunity[],
  internalLinkPlan?: InternalLinkPlanFile,
): string[] {
  const actions: string[] = [];
  const candidateCount = opportunities.filter(
    (opportunity) => opportunity.status === 'candidate',
  ).length;
  const approvedCount = opportunities.filter(
    (opportunity) => opportunity.status === 'approved',
  ).length;

  if (candidateCount > 0) {
    actions.push('- Review candidate opportunities and mark the best pages approved.');
  }
  if (approvedCount > 0) {
    actions.push('- Generate or refresh content briefs for approved pages.');
  }
  if (!internalLinkPlan) {
    actions.push('- Generate an internal link plan before building pages.');
  } else if (internalLinkPlan.orphanPaths.length > 0) {
    actions.push('- Fix orphan-risk pages before publishing.');
  }
  if (actions.length === 0) {
    actions.push('- No immediate SEO planning action is required.');
  }

  return actions;
}

function sortOpportunities(left: PageOpportunity, right: PageOpportunity): number {
  return (
    getPriorityRank(left.priority) - getPriorityRank(right.priority) ||
    (right.totalVolume ?? -1) - (left.totalVolume ?? -1) ||
    left.title.localeCompare(right.title)
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
