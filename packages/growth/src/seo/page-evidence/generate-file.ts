import path from 'node:path';
import { exists, readJson, writeJson } from '../../utils/fs.js';
import { seoPerformanceFileSchema, type SeoPerformanceFile } from '../schema/performance.js';
import { siteCrawlSnapshotSchema } from '../schema/site-crawl.js';
import { siteRenderSnapshotSchema } from '../schema/site-render.js';
import { loadSeoResearchConfig } from '../workspace/config.js';
import { resolveSeoResearchWorkspacePaths } from '../workspace/paths.js';
import { resolveSeoPerformanceContext } from '../performance/context.js';
import { buildSeoPageEvidence } from './build-inventory.js';

export type GenerateSeoPageEvidenceFileOptions = {
  cwd?: string;
  platformId?: string;
  crawl?: string;
  searchConsole?: string;
  ga4?: string;
  render?: string;
  output?: string;
  dryRun?: boolean;
  now?: () => Date;
};

export type GenerateSeoPageEvidenceFileResult = {
  crawl: string;
  searchConsole?: string;
  ga4?: string;
  render?: string;
  output: string;
  platformId: string;
  siteUrl: string;
  pageCount: number;
  performanceOnlyPageCount: number;
  staleSources: string[];
  sampleData: boolean;
  dryRun: boolean;
};

export async function generateSeoPageEvidenceFile(
  options: GenerateSeoPageEvidenceFileOptions,
): Promise<GenerateSeoPageEvidenceFileResult> {
  const { cwd, config } = await loadSeoResearchConfig({
    cwd: options.cwd,
    platformId: options.platformId,
  });
  if (!config.site) {
    throw new Error('Configure the first-party site before generating page evidence.');
  }
  const paths = resolveSeoResearchWorkspacePaths(cwd);
  const crawlPath = resolvePath(cwd, options.crawl ?? path.join(paths.siteCrawls, 'latest.json'));
  const searchConsolePath = await resolveOptionalEvidencePath({
    cwd,
    explicit: options.searchConsole,
    fallback: path.join(paths.normalized, 'search-console-performance.latest.json'),
  });
  const ga4Path = await resolveOptionalEvidencePath({
    cwd,
    explicit: options.ga4,
    fallback: path.join(paths.normalized, 'ga4-performance.latest.json'),
  });
  const renderPath = await resolveOptionalEvidencePath({
    cwd,
    explicit: options.render,
    fallback: path.join(paths.siteRenders, 'latest.json'),
  });
  const outputPath = resolvePath(
    cwd,
    options.output ?? path.join(paths.pageAudits, 'page-evidence.latest.json'),
  );
  const crawl = siteCrawlSnapshotSchema.parse(await readJson(crawlPath));
  const render = renderPath
    ? siteRenderSnapshotSchema.parse(await readJson(renderPath))
    : undefined;
  assertConfiguredCrawl(config.platformId, config.site.url, crawl.platformId, crawl.site.origin);
  const searchConsole = await readPerformanceFile(searchConsolePath, 'google-search-console');
  const ga4 = await readPerformanceFile(ga4Path, 'ga4');
  await validateProviderBinding({ cwd, platformId: config.platformId, file: searchConsole });
  await validateProviderBinding({ cwd, platformId: config.platformId, file: ga4 });
  assertMarketContext(config.markets, searchConsole);
  assertMarketContext(config.markets, ga4);

  const artifact = buildSeoPageEvidence({
    crawl,
    render,
    targetMarkets: config.markets,
    searchConsole,
    ga4,
    generatedAt: (options.now ?? (() => new Date()))().toISOString(),
  });
  if (!options.dryRun) {
    await writeJson(outputPath, artifact);
  }
  return {
    crawl: path.relative(cwd, crawlPath),
    ...(searchConsolePath ? { searchConsole: path.relative(cwd, searchConsolePath) } : {}),
    ...(ga4Path ? { ga4: path.relative(cwd, ga4Path) } : {}),
    ...(renderPath ? { render: path.relative(cwd, renderPath) } : {}),
    output: path.relative(cwd, outputPath),
    platformId: artifact.platformId,
    siteUrl: artifact.siteUrl,
    pageCount: artifact.summary.pageCount,
    performanceOnlyPageCount: artifact.summary.performanceOnlyPageCount,
    staleSources: artifact.freshness.staleSources,
    sampleData: artifact.sampleData,
    dryRun: options.dryRun === true,
  };
}

async function readPerformanceFile(
  filePath: string | undefined,
  source: 'google-search-console' | 'ga4',
): Promise<SeoPerformanceFile | undefined> {
  if (!filePath) {
    return undefined;
  }
  const file = seoPerformanceFileSchema.parse(await readJson(filePath));
  if (file.source !== source) {
    throw new Error(`Expected ${source} evidence at ${filePath}.`);
  }
  return file;
}

async function resolveOptionalEvidencePath(options: {
  cwd: string;
  explicit?: string;
  fallback: string;
}): Promise<string | undefined> {
  const candidate = resolvePath(options.cwd, options.explicit ?? options.fallback);
  if (options.explicit || (await exists(candidate))) {
    return candidate;
  }
  return undefined;
}

async function validateProviderBinding(options: {
  cwd: string;
  platformId: string;
  file?: SeoPerformanceFile;
}): Promise<void> {
  if (!options.file) {
    return;
  }
  await resolveSeoPerformanceContext({
    cwd: options.cwd,
    platformId: options.platformId,
    source: options.file.source,
    property: options.file.property,
  });
}

function assertConfiguredCrawl(
  configuredPlatformId: string,
  configuredSiteUrl: string,
  crawlPlatformId: string,
  crawlSiteOrigin: string,
): void {
  if (configuredPlatformId !== crawlPlatformId) {
    throw new Error('Crawl evidence does not belong to the configured platform.');
  }
  if (new URL(configuredSiteUrl).origin !== new URL(crawlSiteOrigin).origin) {
    throw new Error('Crawl evidence does not belong to the configured site.');
  }
}

function assertMarketContext(
  markets: Array<{ country: string; language: string }>,
  file: SeoPerformanceFile | undefined,
): void {
  if (file && JSON.stringify(file.targetMarkets) !== JSON.stringify(markets)) {
    throw new Error('Performance evidence does not match the configured target markets.');
  }
}

function resolvePath(cwd: string, maybeRelativePath: string): string {
  return path.isAbsolute(maybeRelativePath)
    ? maybeRelativePath
    : path.resolve(cwd, maybeRelativePath);
}
