import path from 'node:path';
import { exists, readJson, writeJson } from '../../utils/fs.js';
import { siteCrawlSnapshotSchema, type SiteCrawlSnapshot } from '../schema/site-crawl.js';
import { loadSeoResearchConfig } from '../workspace/config.js';
import { resolveSeoResearchWorkspacePaths } from '../workspace/paths.js';
import { crawlSite, type SiteCrawlFetch } from './crawl-site.js';

export type CrawlSiteFileOptions = {
  cwd?: string;
  platformId?: string;
  siteUrl?: string;
  output?: string;
  previous?: string;
  incremental?: boolean;
  fetchImpl?: SiteCrawlFetch;
  signal?: AbortSignal;
  userAgent?: string;
  maxPages?: number;
  maxDepth?: number;
  maxSitemaps?: number;
  maxDiscoveredUrls?: number;
  maxResponseBytes?: number;
  timeoutMs?: number;
  freshnessHours?: number;
  discoverSitemaps?: boolean;
  dryRun?: boolean;
  now?: () => Date;
};

export type CrawlSiteFileResult = {
  output: string;
  platformId: string;
  siteUrl: string;
  snapshotId: string;
  previousSnapshotId?: string;
  pageCount: number;
  failureCount: number;
  changedPageCount: number;
  reusedPageCount: number;
  discoveredUrlCount: number;
  truncated: boolean;
  dryRun: boolean;
  snapshot: SiteCrawlSnapshot;
};

export async function crawlSiteFile(options: CrawlSiteFileOptions): Promise<CrawlSiteFileResult> {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const { config } = await loadSeoResearchConfig({ cwd, platformId: options.platformId });
  const siteUrl = options.siteUrl ?? config.site?.url;
  if (!siteUrl) {
    throw new Error(
      'No site is configured. Run `unisane growth seo site configure` or pass --site.',
    );
  }
  const crawlDefaults = config.site?.crawl;
  const paths = resolveSeoResearchWorkspacePaths(cwd);
  const outputPath = resolvePath(cwd, options.output ?? path.join(paths.siteCrawls, 'latest.json'));
  const previousPath = options.previous ? resolvePath(cwd, options.previous) : outputPath;
  const previousSnapshot =
    options.incremental === false ? undefined : await readPreviousSnapshot(previousPath);
  const snapshot = await crawlSite({
    platformId: config.platformId,
    siteUrl,
    previousSnapshot,
    fetchImpl: options.fetchImpl,
    signal: options.signal,
    userAgent: options.userAgent,
    maxPages: options.maxPages ?? crawlDefaults?.maxPages,
    maxDepth: options.maxDepth ?? crawlDefaults?.maxDepth,
    maxSitemaps: options.maxSitemaps ?? crawlDefaults?.maxSitemaps,
    maxDiscoveredUrls: options.maxDiscoveredUrls ?? crawlDefaults?.maxDiscoveredUrls,
    maxResponseBytes: options.maxResponseBytes ?? crawlDefaults?.maxResponseBytes,
    timeoutMs: options.timeoutMs ?? crawlDefaults?.timeoutMs,
    freshnessHours: options.freshnessHours ?? crawlDefaults?.freshnessHours,
    discoverSitemaps: options.discoverSitemaps ?? crawlDefaults?.discoverSitemaps,
    now: options.now,
  });

  if (!options.dryRun) {
    await writeJson(outputPath, snapshot);
  }

  return {
    output: path.relative(cwd, outputPath),
    platformId: snapshot.platformId,
    siteUrl: snapshot.site.requestedUrl,
    snapshotId: snapshot.snapshotId,
    ...(snapshot.previousSnapshotId ? { previousSnapshotId: snapshot.previousSnapshotId } : {}),
    pageCount: snapshot.summary.pageCount,
    failureCount: snapshot.summary.failureCount,
    changedPageCount: snapshot.summary.changedPageCount,
    reusedPageCount: snapshot.summary.reusedPageCount,
    discoveredUrlCount: snapshot.discovery.discoveredUrlCount,
    truncated: snapshot.discovery.truncated,
    dryRun: options.dryRun === true,
    snapshot,
  };
}

async function readPreviousSnapshot(filePath: string): Promise<SiteCrawlSnapshot | undefined> {
  if (!(await exists(filePath))) {
    return undefined;
  }
  return siteCrawlSnapshotSchema.parse(await readJson(filePath));
}

function resolvePath(cwd: string, maybeRelativePath: string): string {
  return path.isAbsolute(maybeRelativePath)
    ? maybeRelativePath
    : path.resolve(cwd, maybeRelativePath);
}
