import type { PageOpportunityFile } from '../schema/opportunity.js';
import {
  assertCompatibleSeoPerformanceFiles,
  type SeoPerformanceFile,
  type SeoPerformanceRecord,
} from '../schema/performance.js';

export type RenderSeoPerformanceReportOptions = {
  searchConsoleFile?: SeoPerformanceFile;
  ga4File?: SeoPerformanceFile;
  opportunityFile?: PageOpportunityFile;
};

type PageSummary = {
  path: string;
  clicks: number;
  impressions: number;
  sessions: number;
  analyticsConversions: number;
};

export function renderSeoPerformanceReport(options: RenderSeoPerformanceReportOptions): string {
  const performanceFiles = [options.searchConsoleFile, options.ga4File].filter(
    (file): file is SeoPerformanceFile => file !== undefined,
  );
  assertCompatibleSeoPerformanceFiles(performanceFiles);
  assertExpectedSources(options);
  assertOpportunityPlatform(options);
  const searchConsoleRecords = options.searchConsoleFile?.records ?? [];
  const ga4Records = options.ga4File?.records ?? [];
  const pageSummaries = summarizePages([...searchConsoleRecords, ...ga4Records]);
  const opportunityRows = options.opportunityFile
    ? summarizeOpportunities(options.opportunityFile, pageSummaries)
    : [];

  return [
    `# SEO Performance Report: ${resolvePlatformId(options)}`,
    '',
    '## Summary',
    '',
    `- Search Console rows: ${searchConsoleRecords.length}`,
    `- GA4 rows: ${ga4Records.length}`,
    `- Pages with performance: ${pageSummaries.length}`,
    `- Planned opportunities compared: ${opportunityRows.length}`,
    ...formatEvidenceSummary(performanceFiles),
    '',
    '## Top Organic Queries',
    '',
    ...formatTopQueries(searchConsoleRecords),
    '',
    '## Top Pages',
    '',
    ...formatTopPages(pageSummaries),
    '',
    '## Opportunity Feedback',
    '',
    ...formatOpportunityRows(opportunityRows),
  ].join('\n');
}

function assertExpectedSources(options: RenderSeoPerformanceReportOptions): void {
  if (
    options.searchConsoleFile?.source !== undefined &&
    options.searchConsoleFile.source !== 'google-search-console'
  ) {
    throw new Error('Search Console report input must contain Search Console evidence.');
  }
  if (options.ga4File?.source !== undefined && options.ga4File.source !== 'ga4') {
    throw new Error('GA4 report input must contain GA4 evidence.');
  }
}

function assertOpportunityPlatform(options: RenderSeoPerformanceReportOptions): void {
  const evidencePlatform = options.searchConsoleFile?.platformId ?? options.ga4File?.platformId;
  if (
    evidencePlatform &&
    options.opportunityFile &&
    options.opportunityFile.platformId !== evidencePlatform
  ) {
    throw new Error('Opportunity and performance evidence must belong to the same platform.');
  }
}

function formatEvidenceSummary(files: SeoPerformanceFile[]): string[] {
  if (files.length === 0) {
    return [];
  }
  return files.flatMap((file) => [
    `- ${sourceLabel(file)} evidence: ${file.evidence.acquisition}; ${file.evidence.sampleData ? 'sample' : 'live'}; fresh until ${file.evidence.freshUntil}`,
    ...file.evidence.limitations.map(
      (limitation) => `  - ${sourceLabel(file)} limitation: ${limitation}`,
    ),
  ]);
}

function sourceLabel(file: SeoPerformanceFile): string {
  return file.source === 'ga4' ? 'GA4' : 'Search Console';
}

function resolvePlatformId(options: RenderSeoPerformanceReportOptions): string {
  return (
    options.opportunityFile?.platformId ??
    options.searchConsoleFile?.platformId ??
    options.ga4File?.platformId ??
    'unknown-platform'
  );
}

function summarizePages(records: SeoPerformanceRecord[]): PageSummary[] {
  const byPath = new Map<string, PageSummary>();
  for (const record of records) {
    const current = byPath.get(record.pagePath) ?? {
      path: record.pagePath,
      clicks: 0,
      impressions: 0,
      sessions: 0,
      analyticsConversions: 0,
    };
    current.clicks += record.clicks ?? 0;
    current.impressions += record.impressions ?? 0;
    current.sessions += record.sessions ?? 0;
    current.analyticsConversions += record.analyticsConversions ?? 0;
    byPath.set(record.pagePath, current);
  }
  return [...byPath.values()].sort(
    (left, right) =>
      right.clicks - left.clicks ||
      right.impressions - left.impressions ||
      right.sessions - left.sessions ||
      left.path.localeCompare(right.path),
  );
}

function summarizeOpportunities(
  opportunityFile: PageOpportunityFile,
  pageSummaries: PageSummary[],
) {
  const byPath = new Map(pageSummaries.map((summary) => [summary.path, summary]));
  return opportunityFile.opportunities.map((opportunity) => {
    const performance = byPath.get(opportunity.routePath);
    return {
      title: opportunity.title,
      path: opportunity.routePath,
      status: opportunity.status,
      priority: opportunity.priority,
      clicks: performance?.clicks ?? 0,
      impressions: performance?.impressions ?? 0,
      sessions: performance?.sessions ?? 0,
      analyticsConversions: performance?.analyticsConversions ?? 0,
    };
  });
}

function formatTopQueries(records: SeoPerformanceRecord[]): string[] {
  const byQuery = new Map<string, { clicks: number; impressions: number }>();
  for (const record of records) {
    if (!record.query) {
      continue;
    }
    const current = byQuery.get(record.query) ?? { clicks: 0, impressions: 0 };
    current.clicks += record.clicks ?? 0;
    current.impressions += record.impressions ?? 0;
    byQuery.set(record.query, current);
  }
  const rows = [...byQuery.entries()].sort(
    (left, right) =>
      right[1].clicks - left[1].clicks ||
      right[1].impressions - left[1].impressions ||
      left[0].localeCompare(right[0]),
  );
  if (rows.length === 0) {
    return ['- No query data imported yet'];
  }
  return rows
    .slice(0, 12)
    .map(
      ([query, metrics]) =>
        `- ${query}: ${metrics.clicks} clicks, ${metrics.impressions} impressions`,
    );
}

function formatTopPages(pageSummaries: PageSummary[]): string[] {
  if (pageSummaries.length === 0) {
    return ['- No page performance imported yet'];
  }
  return pageSummaries
    .slice(0, 12)
    .map(
      (summary) =>
        `- ${summary.path}: ${summary.clicks} clicks, ${summary.impressions} impressions, ${summary.sessions} sessions, ${summary.analyticsConversions} Analytics conversions`,
    );
}

function formatOpportunityRows(rows: ReturnType<typeof summarizeOpportunities>): string[] {
  if (rows.length === 0) {
    return ['- No opportunity file supplied'];
  }
  return rows.map(
    (row) =>
      `- ${row.title} (${row.status}/${row.priority}): ${row.clicks} clicks, ${row.impressions} impressions, ${row.sessions} sessions, ${row.analyticsConversions} Analytics conversions`,
  );
}
