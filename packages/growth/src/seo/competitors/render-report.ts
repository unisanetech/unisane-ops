import type { CompetitorPage, CompetitorResearchFile } from '../schema/competitor.js';

export type RenderCompetitorResearchReportOptions = {
  competitorFile: CompetitorResearchFile;
};

export function renderCompetitorResearchReport(
  options: RenderCompetitorResearchReportOptions,
): string {
  const { competitorFile } = options;
  const domains = countBy(competitorFile.pages, (page) => page.domain);
  const keywords = countBy(
    competitorFile.pages.filter((page) => page.keyword),
    (page) => page.keyword ?? '',
  );
  const patterns = countBy(
    competitorFile.pages.flatMap((page) =>
      page.contentPatterns.map((pattern) => ({
        ...page,
        patternLabel: pattern.label,
      })),
    ),
    (page) => page.patternLabel,
  );
  const keywordSignals = sumBy(
    competitorFile.pages.flatMap((page) => page.keywordSignals ?? []),
    (signal) => signal.term,
    (signal) => signal.count,
  );
  const schemaTypes = countBy(
    competitorFile.pages.flatMap((page) => page.onPageSignals?.schemaTypes ?? []),
    (schemaType) => schemaType,
  );
  const ctaPatterns = countBy(
    competitorFile.pages.flatMap((page) => page.onPageSignals?.ctaPatterns ?? []),
    (ctaPattern) => ctaPattern,
  );
  const rankedPages = competitorFile.pages.filter((page) => page.position !== undefined);

  return [
    `# Competitor Research Report: ${competitorFile.platformId}`,
    '',
    `Source: ${competitorFile.source}`,
    competitorFile.market ? `Market: ${competitorFile.market}` : undefined,
    '',
    '## Summary',
    '',
    `- Competitor pages: ${competitorFile.pages.length}`,
    `- Domains: ${domains.length}`,
    `- Keywords covered: ${keywords.length}`,
    `- Content patterns captured: ${patterns.length}`,
    `- Pages with ranking evidence: ${rankedPages.length}`,
    '',
    '## Top Domains',
    '',
    ...formatCountRows(domains),
    '',
    '## Keyword Coverage',
    '',
    ...formatCountRows(keywords),
    '',
    '## Repeated Content Patterns',
    '',
    ...formatCountRows(patterns),
    '',
    '## Inferred Keyword Signals',
    '',
    ...formatCountRows(keywordSignals),
    '',
    '## On-Page Signals',
    '',
    ...formatOnPageSummary({ schemaTypes, ctaPatterns }),
    '',
    '## Pages',
    '',
    ...competitorFile.pages.flatMap(formatPage),
  ]
    .filter((line): line is string => line !== undefined)
    .join('\n');
}

function formatPage(page: CompetitorPage): string[] {
  return [
    `### ${page.title ?? page.h1 ?? page.url}`,
    '',
    `- URL: ${page.url}`,
    `- Domain: ${page.domain}`,
    page.keyword ? `- Keyword: ${page.keyword}` : undefined,
    page.position ? `- Position: ${page.position}` : undefined,
    page.h1 ? `- H1: ${page.h1}` : undefined,
    page.metaDescription ? `- Meta description: ${page.metaDescription}` : undefined,
    page.categoryPath.length > 0 ? `- Category path: ${page.categoryPath.join(' > ')}` : undefined,
    page.contentPatterns.length > 0
      ? `- Patterns: ${page.contentPatterns.map((pattern) => pattern.label).join(', ')}`
      : undefined,
    page.keywordSignals && page.keywordSignals.length > 0
      ? `- Inferred terms: ${page.keywordSignals
          .slice(0, 8)
          .map((signal) => signal.term)
          .join(', ')}`
      : undefined,
    page.onPageSignals ? `- On-page: ${formatPageOnPageSignals(page.onPageSignals)}` : undefined,
    page.notes ? `- Notes: ${page.notes}` : undefined,
    '',
  ].filter((line): line is string => line !== undefined);
}

function countBy<T>(
  items: T[],
  getKey: (item: T) => string,
): Array<{ key: string; count: number }> {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = getKey(item).trim();
    if (!key) {
      continue;
    }
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((left, right) => right.count - left.count || left.key.localeCompare(right.key));
}

function sumBy<T>(
  items: T[],
  getKey: (item: T) => string,
  getCount: (item: T) => number,
): Array<{ key: string; count: number }> {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = getKey(item).trim();
    if (!key) {
      continue;
    }
    counts.set(key, (counts.get(key) ?? 0) + getCount(item));
  }
  return [...counts.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((left, right) => right.count - left.count || left.key.localeCompare(right.key));
}

function formatCountRows(rows: Array<{ key: string; count: number }>): string[] {
  if (rows.length === 0) {
    return ['- None captured yet'];
  }
  return rows.slice(0, 12).map((row) => `- ${row.key}: ${row.count}`);
}

function formatOnPageSummary(options: {
  schemaTypes: Array<{ key: string; count: number }>;
  ctaPatterns: Array<{ key: string; count: number }>;
}): string[] {
  return [
    '- Schema types:',
    ...formatIndentedCountRows(options.schemaTypes),
    '- CTA patterns:',
    ...formatIndentedCountRows(options.ctaPatterns),
  ];
}

function formatIndentedCountRows(rows: Array<{ key: string; count: number }>): string[] {
  if (rows.length === 0) {
    return ['  - None captured yet'];
  }
  return rows.slice(0, 8).map((row) => `  - ${row.key}: ${row.count}`);
}

function formatPageOnPageSignals(signals: CompetitorPage['onPageSignals']): string {
  if (!signals) {
    return 'none captured';
  }
  return [
    `${signals.wordCount} words`,
    `${signals.h1Count} H1`,
    `${signals.h2Count} H2`,
    `${signals.h3Count} H3`,
    `${signals.internalLinkCount} internal links`,
    `${signals.externalLinkCount} external links`,
    signals.canonicalPresent ? 'canonical present' : 'canonical missing',
  ].join(', ');
}
