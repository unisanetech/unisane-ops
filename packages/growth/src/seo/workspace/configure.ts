import path from 'node:path';
import { writeJson } from '../../utils/fs.js';
import { seoResearchConfigSchema, type SeoResearchConfig } from '../schema/config.js';
import {
  normalizeGa4Property,
  normalizeSearchConsoleProperty,
  searchConsolePropertyMatchesSite,
} from '../schema/performance.js';
import { loadSeoResearchConfig } from './config.js';

export type SeoTargetMarketInput = {
  country: string;
  language: string;
};

export type ConfigureSeoResearchWorkspaceOptions = {
  cwd?: string;
  platformId?: string;
  siteUrl: string;
  markets: SeoTargetMarketInput[];
  ownershipConfirmed: boolean;
  searchConsoleProperty?: string;
  ga4Property?: string;
  crawl?: Partial<NonNullable<SeoResearchConfig['site']>['crawl']>;
  dryRun?: boolean;
  now?: () => Date;
};

export type ConfigureSeoResearchWorkspaceResult = {
  configPath: string;
  platformId: string;
  siteUrl: string;
  markets: SeoResearchConfig['markets'];
  source: 'file' | 'default';
  dryRun: boolean;
  config: SeoResearchConfig;
};

export async function configureSeoResearchWorkspace(
  options: ConfigureSeoResearchWorkspaceOptions,
): Promise<ConfigureSeoResearchWorkspaceResult> {
  if (!options.ownershipConfirmed) {
    throw new Error('Confirm that you own or are authorized to crawl this site.');
  }
  const {
    cwd,
    config: existingConfig,
    configPath,
    source,
  } = await loadSeoResearchConfig({
    cwd: options.cwd,
    platformId: options.platformId,
  });
  const siteUrl = normalizeSiteIdentity(options.siteUrl);
  const markets = normalizeTargetMarkets(options.markets);
  const searchConsoleProperty = options.searchConsoleProperty
    ? normalizeSearchConsoleProperty(options.searchConsoleProperty)
    : existingConfig.providers.searchConsole.property;
  if (searchConsoleProperty && !searchConsolePropertyMatchesSite(searchConsoleProperty, siteUrl)) {
    throw new Error('Search Console property does not cover the configured site.');
  }
  const ga4Property = options.ga4Property
    ? normalizeGa4Property(options.ga4Property)
    : existingConfig.providers.ga4.property;
  const crawlOverrides = Object.fromEntries(
    Object.entries(options.crawl ?? {}).filter(([, value]) => value !== undefined),
  );
  const config = seoResearchConfigSchema.parse({
    ...existingConfig,
    site: {
      url: siteUrl,
      ownershipConfirmedAt: (options.now ?? (() => new Date()))().toISOString(),
      crawl: {
        ...(existingConfig.site?.crawl ?? {}),
        ...crawlOverrides,
      },
    },
    markets,
    providers: {
      ...existingConfig.providers,
      searchConsole: {
        ...existingConfig.providers.searchConsole,
        enabled: Boolean(searchConsoleProperty),
        ...(searchConsoleProperty ? { property: searchConsoleProperty } : {}),
      },
      ga4: {
        ...existingConfig.providers.ga4,
        enabled: Boolean(ga4Property),
        ...(ga4Property ? { property: ga4Property } : {}),
      },
    },
  });

  if (!options.dryRun) {
    await writeJson(configPath, config);
  }

  return {
    configPath: path.relative(cwd, configPath),
    platformId: config.platformId,
    siteUrl: config.site?.url ?? siteUrl,
    markets: config.markets,
    source,
    dryRun: options.dryRun === true,
    config,
  };
}

export function parseSeoTargetMarket(value: string): SeoTargetMarketInput {
  const [country, language, ...rest] = value.split('/').map((part) => part.trim());
  if (!country || !language || rest.length > 0) {
    throw new Error(`Invalid market "${value}"; expected COUNTRY/LANGUAGE, for example US/en.`);
  }
  return { country, language };
}

function normalizeTargetMarkets(markets: SeoTargetMarketInput[]): SeoResearchConfig['markets'] {
  if (!markets.length) {
    throw new Error('Configure at least one target market.');
  }
  const unique = new Map<string, SeoTargetMarketInput>();
  for (const market of markets) {
    const country = market.country.trim().toUpperCase();
    const language = market.language.trim().toLowerCase();
    unique.set(`${country}/${language}`, { country, language });
  }
  return [...unique.values()];
}

function normalizeSiteIdentity(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('Site must be an absolute HTTP or HTTPS URL.');
  }
  if ((url.protocol !== 'http:' && url.protocol !== 'https:') || url.username || url.password) {
    throw new Error('Site must be an HTTP or HTTPS URL without credentials.');
  }
  return `${url.origin}/`;
}
