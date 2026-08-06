import path from 'node:path';
import type { SeoResearchConfig } from '../schema/config.js';
import {
  normalizeGa4Property,
  normalizeSearchConsoleProperty,
  searchConsolePropertyMatchesSite,
  type SeoPerformanceSource,
} from '../schema/performance.js';
import { loadSeoResearchConfig } from '../workspace/config.js';
import { resolveSeoResearchWorkspacePaths } from '../workspace/paths.js';

export type SeoPerformanceContext = {
  cwd: string;
  platformId: string;
  siteUrl: string;
  targetMarkets: SeoResearchConfig['markets'];
  property: string;
  freshnessHours: number;
  defaultOutput: string;
};

export async function resolveSeoPerformanceContext(options: {
  cwd?: string;
  platformId?: string;
  source: SeoPerformanceSource;
  property?: string;
}): Promise<SeoPerformanceContext> {
  const { cwd, config } = await loadSeoResearchConfig({
    cwd: options.cwd,
    platformId: options.platformId,
  });
  if (!config.site) {
    throw new Error('Configure the first-party site before recording performance evidence.');
  }

  const configuredProperty = readConfiguredProperty(config, options.source);
  if (!configuredProperty) {
    const flag = options.source === 'ga4' ? '--ga4-property' : '--search-console-property';
    throw new Error(
      `Configure the expected provider resource with ${flag} before recording evidence.`,
    );
  }
  const property = normalizeProperty(options.source, options.property ?? configuredProperty);
  if (property !== configuredProperty) {
    throw new Error(
      `Resolved ${sourceLabel(options.source)} resource does not match the configured resource.`,
    );
  }
  if (
    options.source === 'google-search-console' &&
    !searchConsolePropertyMatchesSite(property, config.site.url)
  ) {
    throw new Error('Search Console property does not cover the configured site.');
  }

  const paths = resolveSeoResearchWorkspacePaths(cwd);
  return {
    cwd,
    platformId: config.platformId,
    siteUrl: config.site.url,
    targetMarkets: config.markets,
    property,
    freshnessHours: config.site.crawl.freshnessHours,
    defaultOutput: path.join(
      paths.normalized,
      options.source === 'ga4'
        ? 'ga4-performance.latest.json'
        : 'search-console-performance.latest.json',
    ),
  };
}

function readConfiguredProperty(
  config: SeoResearchConfig,
  source: SeoPerformanceSource,
): string | undefined {
  const property =
    source === 'ga4' ? config.providers.ga4.property : config.providers.searchConsole.property;
  return property ? normalizeProperty(source, property) : undefined;
}

function normalizeProperty(source: SeoPerformanceSource, property: string): string {
  return source === 'ga4'
    ? normalizeGa4Property(property)
    : normalizeSearchConsoleProperty(property);
}

function sourceLabel(source: SeoPerformanceSource): string {
  return source === 'ga4' ? 'GA4' : 'Search Console';
}
