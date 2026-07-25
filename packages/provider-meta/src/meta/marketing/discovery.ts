import type {
  FetchLike,
  MarketingConfig,
  MarketingMetaAdAccountDiscovery,
  MarketingMetaDiscoveryAccount,
  MarketingMetaDiscoveryAction,
  MarketingMetaDiscoveryOptions,
  MarketingMetaDiscoveryPixel,
  MarketingMetaDiscoveryReport,
  MarketingMetaPixelDiscovery,
} from '@unisane/growth/contracts';
import { asArray, asRecord, optionalString } from './graph-utils.js';

async function readJson(response: Response, label: string): Promise<unknown> {
  if (response.ok) return response.json();
  let body = '';
  try {
    body = await response.text();
  } catch {
    body = '';
  }
  throw new Error(
    `${label} discovery failed with ${response.status} ${response.statusText}${body ? `: ${body.slice(0, 300)}` : ''}`,
  );
}

function accountPath(accountId: string): string {
  return accountId.startsWith('act_') ? accountId : `act_${accountId}`;
}

function normalizeAccountId(value: string): string {
  return value.startsWith('act_') ? value : `act_${value}`;
}

function nextPageUrl(value: unknown): string | undefined {
  return optionalString(asRecord(asRecord(value).paging).next);
}

function parseAccount(value: unknown): MarketingMetaDiscoveryAccount | undefined {
  const account = asRecord(value);
  const rawId = optionalString(account.id);
  const rawAccountId = optionalString(account.account_id) ?? rawId?.replace(/^act_/, '');
  if (!rawId && !rawAccountId) return undefined;
  const business = asRecord(account.business);
  return {
    id: rawId ?? normalizeAccountId(rawAccountId ?? ''),
    accountId: normalizeAccountId(rawAccountId ?? rawId ?? ''),
    displayName: optionalString(account.name),
    accountStatus: optionalString(account.account_status),
    currency: optionalString(account.currency),
    timezoneName: optionalString(account.timezone_name),
    businessId: optionalString(business.id),
    businessName: optionalString(business.name),
  };
}

function parsePixel(
  value: unknown,
  fallbackAccountId?: string,
): MarketingMetaDiscoveryPixel | undefined {
  const pixel = asRecord(value);
  const id = optionalString(pixel.id);
  if (!id) return undefined;
  return {
    id,
    name: optionalString(pixel.name),
    accountId: optionalString(pixel.account_id) ?? fallbackAccountId,
  };
}

async function fetchAllData(input: {
  url: URL | string;
  accessToken: string;
  fetch: FetchLike;
  maxPages: number;
}): Promise<unknown[]> {
  const rows: unknown[] = [];
  let next: string | undefined = String(input.url);
  for (let page = 0; next && page < input.maxPages; page += 1) {
    const value = await readJson(
      await input.fetch(next, { headers: { authorization: `Bearer ${input.accessToken}` } }),
      'metaAds',
    );
    rows.push(...asArray(asRecord(value).data));
    next = nextPageUrl(value);
  }
  return rows;
}

async function discoverMetaAdAccounts(input: {
  config: MarketingConfig;
  accessToken: string;
  fetch: FetchLike;
  apiVersion: string;
  maxPages: number;
  pageSize: number;
}): Promise<MarketingMetaAdAccountDiscovery> {
  const provider = input.config.providers.metaAds;
  if (provider.state === 'disabled') {
    return {
      status: 'skip',
      message: 'Meta Ads provider is disabled.',
      accountIdEnv: provider.accountIdEnv,
      accounts: [],
    };
  }
  try {
    const url = new URL(`https://graph.facebook.com/${input.apiVersion}/me/adaccounts`);
    url.searchParams.set(
      'fields',
      'id,account_id,name,account_status,currency,timezone_name,business{id,name}',
    );
    url.searchParams.set('limit', String(input.pageSize));
    const accounts = (
      await fetchAllData({
        url,
        accessToken: input.accessToken,
        fetch: input.fetch,
        maxPages: input.maxPages,
      })
    )
      .map(parseAccount)
      .filter((account): account is MarketingMetaDiscoveryAccount => Boolean(account));
    return {
      status: 'pass',
      message:
        accounts.length > 0
          ? `Found ${accounts.length} accessible Meta ad account${accounts.length === 1 ? '' : 's'}.`
          : 'No accessible Meta ad accounts were returned for this token.',
      accountIdEnv: provider.accountIdEnv,
      accounts,
    };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown Meta ad account discovery error.',
      accountIdEnv: provider.accountIdEnv,
      accounts: [],
    };
  }
}

async function discoverMetaPixels(input: {
  config: MarketingConfig;
  accessToken: string;
  accountIds: string[];
  fetch: FetchLike;
  apiVersion: string;
  maxPages: number;
  pageSize: number;
}): Promise<MarketingMetaPixelDiscovery> {
  const provider = input.config.providers.metaAds;
  if (provider.state === 'disabled') {
    return {
      status: 'skip',
      message: 'Meta Ads provider is disabled.',
      pixelIdEnv: provider.pixelIdEnv,
      pixels: [],
    };
  }
  if (input.accountIds.length === 0) {
    return {
      status: 'warn',
      message: 'Meta pixel discovery needs at least one accessible ad account.',
      pixelIdEnv: provider.pixelIdEnv,
      pixels: [],
    };
  }
  try {
    const pixels: MarketingMetaDiscoveryPixel[] = [];
    for (const id of input.accountIds) {
      const url = new URL(
        `https://graph.facebook.com/${input.apiVersion}/${accountPath(id)}/adspixels`,
      );
      url.searchParams.set('fields', 'id,name,account_id');
      url.searchParams.set('limit', String(input.pageSize));
      const accountPixels = await fetchAllData({
        url,
        accessToken: input.accessToken,
        fetch: input.fetch,
        maxPages: input.maxPages,
      });
      pixels.push(
        ...accountPixels
          .map((pixel) => parsePixel(pixel, accountPath(id)))
          .filter((pixel): pixel is MarketingMetaDiscoveryPixel => Boolean(pixel)),
      );
    }
    return {
      status: 'pass',
      message:
        pixels.length > 0
          ? `Found ${pixels.length} Meta pixel${pixels.length === 1 ? '' : 's'}.`
          : 'No Meta pixels were returned for the discovered ad account(s).',
      pixelIdEnv: provider.pixelIdEnv,
      pixels,
    };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown Meta pixel discovery error.',
      pixelIdEnv: provider.pixelIdEnv,
      pixels: [],
    };
  }
}

function buildNextActions(
  config: MarketingConfig,
  report: Pick<MarketingMetaDiscoveryReport, 'adAccounts' | 'pixels'>,
): MarketingMetaDiscoveryAction[] {
  const actions: MarketingMetaDiscoveryAction[] = [];
  const provider = config.providers.metaAds;
  if (provider.accountIdEnv && report.adAccounts.accounts.length === 1) {
    actions.push({
      id: 'metaAds.accountId',
      message: `Set ${provider.accountIdEnv} to ${report.adAccounts.accounts[0]?.accountId}.`,
    });
  } else if (provider.accountIdEnv && report.adAccounts.accounts.length > 1) {
    actions.push({
      id: 'metaAds.accountId',
      message: `Choose a Meta ad account and set ${provider.accountIdEnv}.`,
    });
  }
  if (provider.pixelIdEnv && report.pixels.pixels.length === 1) {
    actions.push({
      id: 'metaAds.pixelId',
      message: `Set ${provider.pixelIdEnv} to ${report.pixels.pixels[0]?.id}.`,
    });
  } else if (provider.pixelIdEnv && report.pixels.pixels.length > 1) {
    actions.push({
      id: 'metaAds.pixelId',
      message: `Choose the production Meta pixel and set ${provider.pixelIdEnv}.`,
    });
  }
  if (provider.datasetIdEnv) {
    actions.push({
      id: 'metaAds.datasetId',
      message: `Confirm the Events Manager dataset id for CAPI and set ${provider.datasetIdEnv} if used; do not assume it without review.`,
    });
  }
  if (actions.length === 0) {
    actions.push({
      id: 'setup.guide',
      message: 'Run marketing setup guide for the remaining provider setup actions.',
    });
  }
  return actions;
}

export async function discoverMarketingMetaAccounts(
  config: MarketingConfig,
  options: MarketingMetaDiscoveryOptions,
): Promise<MarketingMetaDiscoveryReport> {
  const fetcher = options.fetch ?? fetch;
  const apiVersion = options.apiVersion ?? 'v25.0';
  const maxPages = options.maxPages ?? 10;
  const pageSize = options.pageSize ?? 100;
  const adAccounts = await discoverMetaAdAccounts({
    config,
    accessToken: options.accessToken,
    fetch: fetcher,
    apiVersion,
    maxPages,
    pageSize,
  });
  const configuredAccount = options.accountId ? [options.accountId] : [];
  const discoveredAccounts = adAccounts.accounts.map((account) => account.accountId);
  const pixelAccountIds = [...new Set([...configuredAccount, ...discoveredAccounts])].slice(0, 10);
  const pixels = await discoverMetaPixels({
    config,
    accessToken: options.accessToken,
    accountIds: pixelAccountIds,
    fetch: fetcher,
    apiVersion,
    maxPages,
    pageSize,
  });
  const reportWithoutActions = {
    kind: 'unisane.marketing.meta-discovery' as const,
    version: 1 as const,
    nonMutating: true as const,
    generatedAt: (options.now ?? new Date()).toISOString(),
    ok: [adAccounts, pixels].every((provider) => provider.status !== 'error'),
    adAccounts,
    pixels,
  };
  return {
    ...reportWithoutActions,
    nextActions: buildNextActions(config, reportWithoutActions),
  };
}
