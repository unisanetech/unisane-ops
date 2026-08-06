import path from 'node:path';
import { readJson, writeJson } from '../../utils/fs.js';
import { siteCrawlSnapshotSchema } from '../schema/site-crawl.js';
import type { SiteRenderSnapshot } from '../schema/site-render.js';
import { loadSeoResearchConfig } from '../workspace/config.js';
import { resolveSeoResearchWorkspacePaths } from '../workspace/paths.js';
import { renderSite, type SitePageRenderer } from './render-site.js';

export type RenderSiteFileOptions = {
  cwd?: string;
  platformId?: string;
  crawl?: string;
  output?: string;
  renderer: SitePageRenderer;
  urls?: string[];
  maxPages?: number;
  timeoutMs?: number;
  settleMs?: number;
  minStaticWordCount?: number;
  freshnessHours?: number;
  signal?: AbortSignal;
  dryRun?: boolean;
  now?: () => Date;
};

export type RenderSiteFileResult = {
  crawl: string;
  output: string;
  platformId: string;
  siteUrl: string;
  renderId: string;
  selectedPageCount: number;
  renderedPageCount: number;
  failureCount: number;
  truncated: boolean;
  dryRun: boolean;
  snapshot: SiteRenderSnapshot;
};

export async function renderSiteFile(
  options: RenderSiteFileOptions,
): Promise<RenderSiteFileResult> {
  const { cwd, config } = await loadSeoResearchConfig({
    cwd: options.cwd,
    platformId: options.platformId,
  });
  if (!config.site) throw new Error('Configure the first-party site before rendering pages.');
  const paths = resolveSeoResearchWorkspacePaths(cwd);
  const crawlPath = resolvePath(cwd, options.crawl ?? path.join(paths.siteCrawls, 'latest.json'));
  const outputPath = resolvePath(
    cwd,
    options.output ?? path.join(paths.siteRenders, 'latest.json'),
  );
  const crawl = siteCrawlSnapshotSchema.parse(await readJson(crawlPath));
  if (
    crawl.platformId !== config.platformId ||
    new URL(crawl.site.origin).origin !== new URL(config.site.url).origin
  ) {
    throw new Error('Crawl evidence does not belong to the configured platform and site.');
  }
  const snapshot = await renderSite({
    crawl,
    renderer: options.renderer,
    urls: options.urls,
    maxPages: options.maxPages,
    timeoutMs: options.timeoutMs,
    settleMs: options.settleMs,
    minStaticWordCount: options.minStaticWordCount,
    freshnessHours: options.freshnessHours,
    signal: options.signal,
    now: options.now,
  });
  if (!options.dryRun) await writeJson(outputPath, snapshot);
  return {
    crawl: path.relative(cwd, crawlPath),
    output: path.relative(cwd, outputPath),
    platformId: snapshot.platformId,
    siteUrl: snapshot.site.origin,
    renderId: snapshot.renderId,
    selectedPageCount: snapshot.summary.selectedPageCount,
    renderedPageCount: snapshot.summary.renderedPageCount,
    failureCount: snapshot.summary.failureCount,
    truncated: snapshot.summary.truncated,
    dryRun: options.dryRun === true,
    snapshot,
  };
}

function resolvePath(cwd: string, value: string): string {
  return path.isAbsolute(value) ? value : path.resolve(cwd, value);
}
