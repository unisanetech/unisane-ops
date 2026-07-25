import { log } from '../../../log.js';
import { loadSeoResearchConfig } from '@unisane/growth/seo';
import { fetchGoogleAdsKeywordMetricsFile } from '../../../provider-adapters.js';
import { printFetchGoogleAdsKeywordMetricsFileResult } from '../format-output.js';
import { resolveSeoGoogleAccessToken } from '../google-suite-auth.js';
import type { SeoKeywordFetchGoogleAdsCliOptions } from '../options.js';

const GOOGLE_ADS_SCOPE = 'https://www.googleapis.com/auth/adwords';

export async function seoKeywordsFetchGoogleAds(
  options: SeoKeywordFetchGoogleAdsCliOptions,
): Promise<number> {
  try {
    if (!options.platform) {
      throw new Error('Missing required --platform id.');
    }
    if (!options.out) {
      throw new Error('Missing required --out path.');
    }
    if (!options.candidates && !options.seedFile && !options.keywords && !options.pageUrl) {
      throw new Error('Pass --candidates, --seed-file, --keywords, or --page-url.');
    }
    const { config } = await loadSeoResearchConfig({
      cwd: options.cwd,
      platformId: options.platform,
    });
    const accessToken = await resolveAdsAccessToken(options);
    const result = await fetchGoogleAdsKeywordMetricsFile({
      cwd: options.cwd,
      platformId: options.platform,
      output: options.out,
      env: process.env,
      accessToken,
      candidates: options.candidates,
      seedFile: options.seedFile,
      keywords: parseCsvList(options.keywords),
      pageUrl: options.pageUrl,
      country: options.country ?? config.defaultCountry,
      language: options.language ?? config.defaultLanguage,
      languageId: options.languageId ?? '1000',
      locationIds: parseCsvList(options.locationIds ?? '2840'),
      currencyCode: normalizeCurrencyCode(
        options.currencyCode ?? process.env.GOOGLE_ADS_CURRENCY_CODE,
      ),
      clusterId: cleanOptional(options.clusterId),
      campaignIntent: cleanOptional(options.campaignIntent),
      requireTermGroups: parseTermGroups(options.requireTermGroups),
      excludeTerms: parseCsvList(options.excludeTerms),
      pageSize: parsePositiveInteger(options.pageSize),
      dryRun: options.dryRun,
    });
    printFetchGoogleAdsKeywordMetricsFileResult(result, { json: options.json });
    return 0;
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Unknown Google Ads keyword metrics error';
    if (options.json) {
      process.stdout.write(`${JSON.stringify({ ok: false, error: { message } }, null, 2)}\n`);
    } else {
      log.error(message);
    }
    return 1;
  }
}

function normalizeCurrencyCode(value: string | undefined): string | undefined {
  const currencyCode = value?.trim().toUpperCase();
  return currencyCode && /^[A-Z]{3}$/.test(currencyCode) ? currencyCode : undefined;
}

function cleanOptional(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

async function resolveAdsAccessToken(
  options: SeoKeywordFetchGoogleAdsCliOptions,
): Promise<string | undefined> {
  const accessTokenEnv = options.accessTokenEnv ?? 'GOOGLE_ADS_ACCESS_TOKEN';
  if (process.env[accessTokenEnv]?.trim() || options.authProfile || options.platform) {
    return resolveSeoGoogleAccessToken({
      accessTokenEnv,
      authProfile: options.authProfile,
      platform: options.platform,
      requiredScope: GOOGLE_ADS_SCOPE,
    });
  }
  return undefined;
}

function parseCsvList(value: string | undefined): string[] {
  if (!value) {
    return [];
  }
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function parseTermGroups(value: string | undefined): string[][] {
  if (!value) {
    return [];
  }
  return value
    .split(';')
    .map((group) =>
      group
        .split('|')
        .map((item) => item.trim())
        .filter((item) => item.length > 0),
    )
    .filter((group) => group.length > 0);
}

function parsePositiveInteger(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}
