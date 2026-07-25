import type {
  FetchLike,
  MarketingConfig,
  MarketingGa4Discovery,
  MarketingGa4DiscoveryProperty,
  MarketingGoogleAdsDiscovery,
  MarketingGoogleDiscoveryAction,
  MarketingGoogleDiscoveryOptions,
  MarketingGoogleDiscoveryReport,
  MarketingSearchConsoleDiscovery,
} from '@unisane/growth/contracts';
import { asArray, asRecord } from './transport-utils.js';

type AccountSummary = {
  account?: unknown;
  displayName?: unknown;
  propertySummaries?: unknown;
};

type PropertySummary = {
  property?: unknown;
  displayName?: unknown;
};

type SearchConsoleSiteEntry = {
  siteUrl?: unknown;
  permissionLevel?: unknown;
};

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

async function readJson(response: Response, provider: string): Promise<unknown> {
  if (response.ok) return response.json();
  let body = '';
  try {
    body = await response.text();
  } catch {
    body = '';
  }
  throw new Error(
    `${provider} discovery failed with ${response.status} ${response.statusText}${body ? `: ${body.slice(0, 300)}` : ''}`,
  );
}

function bearerHeaders(accessToken: string): Record<string, string> {
  return { authorization: `Bearer ${accessToken}` };
}

function customerIdFromResource(resourceName: string): string {
  return resourceName.replace(/^customers\//, '');
}

async function discoverGoogleAds(input: {
  config: MarketingConfig;
  env: Record<string, string | undefined>;
  accessToken: string;
  fetch: FetchLike;
  apiVersion: string;
}): Promise<MarketingGoogleAdsDiscovery> {
  const provider = input.config.providers.googleAds;
  if (provider.state === 'disabled') {
    return {
      status: 'skip',
      message: 'Google Ads provider is disabled.',
      developerTokenEnv: provider.developerTokenEnv,
      customerResourceNames: [],
      customerIds: [],
    };
  }
  if (!provider.developerTokenEnv) {
    return {
      status: 'warn',
      message: 'Google Ads developer token env name is not configured.',
      customerResourceNames: [],
      customerIds: [],
    };
  }
  const developerToken = input.env[provider.developerTokenEnv]?.trim();
  if (!developerToken) {
    return {
      status: 'warn',
      message: `${provider.developerTokenEnv} is required before Google Ads account discovery can run.`,
      developerTokenEnv: provider.developerTokenEnv,
      customerResourceNames: [],
      customerIds: [],
    };
  }
  try {
    const value = asRecord(
      await readJson(
        await input.fetch(
          `https://googleads.googleapis.com/${input.apiVersion}/customers:listAccessibleCustomers`,
          {
            method: 'GET',
            headers: {
              ...bearerHeaders(input.accessToken),
              'developer-token': developerToken,
            },
          },
        ),
        'googleAds',
      ),
    );
    const customerResourceNames = asArray(value.resourceNames)
      .map(optionalString)
      .filter((entry): entry is string => Boolean(entry));
    return {
      status: 'pass',
      message:
        customerResourceNames.length > 0
          ? `Found ${customerResourceNames.length} accessible Google Ads customer resource(s).`
          : 'No directly accessible Google Ads customers were returned.',
      developerTokenEnv: provider.developerTokenEnv,
      customerResourceNames,
      customerIds: customerResourceNames.map(customerIdFromResource),
    };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown Google Ads discovery error.',
      developerTokenEnv: provider.developerTokenEnv,
      customerResourceNames: [],
      customerIds: [],
    };
  }
}

async function discoverGa4(input: {
  config: MarketingConfig;
  accessToken: string;
  fetch: FetchLike;
}): Promise<MarketingGa4Discovery> {
  if (input.config.providers.ga4.state === 'disabled') {
    return { status: 'skip', message: 'GA4 provider is disabled.', properties: [] };
  }
  try {
    const properties: MarketingGa4DiscoveryProperty[] = [];
    let pageToken: string | undefined;
    for (let page = 0; page < 10; page += 1) {
      const url = new URL('https://analyticsadmin.googleapis.com/v1beta/accountSummaries');
      url.searchParams.set('pageSize', '200');
      if (pageToken) url.searchParams.set('pageToken', pageToken);
      const value = asRecord(
        await readJson(
          await input.fetch(url, {
            method: 'GET',
            headers: bearerHeaders(input.accessToken),
          }),
          'ga4',
        ),
      );
      for (const accountEntry of asArray(value.accountSummaries)) {
        const account = asRecord(accountEntry) as AccountSummary;
        const accountName = optionalString(account.account);
        if (!accountName) continue;
        for (const propertyEntry of asArray(account.propertySummaries)) {
          const property = asRecord(propertyEntry) as PropertySummary;
          const propertyName = optionalString(property.property);
          if (!propertyName) continue;
          properties.push({
            account: accountName,
            accountDisplayName: optionalString(account.displayName),
            property: propertyName,
            propertyId: propertyName.replace(/^properties\//, ''),
            displayName: optionalString(property.displayName),
          });
        }
      }
      pageToken = optionalString(value.nextPageToken);
      if (!pageToken) break;
    }
    return {
      status: 'pass',
      message:
        properties.length > 0
          ? `Found ${properties.length} GA4 propert${properties.length === 1 ? 'y' : 'ies'}.`
          : 'No GA4 properties were returned for this Google user.',
      properties,
    };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown GA4 discovery error.',
      properties: [],
    };
  }
}

async function discoverSearchConsole(input: {
  config: MarketingConfig;
  accessToken: string;
  fetch: FetchLike;
}): Promise<MarketingSearchConsoleDiscovery> {
  if (input.config.providers.searchConsole.state === 'disabled') {
    return { status: 'skip', message: 'Search Console provider is disabled.', sites: [] };
  }
  try {
    const value = asRecord(
      await readJson(
        await input.fetch('https://www.googleapis.com/webmasters/v3/sites', {
          method: 'GET',
          headers: bearerHeaders(input.accessToken),
        }),
        'searchConsole',
      ),
    );
    const sites = asArray(value.siteEntry).flatMap((entry) => {
      const site = asRecord(entry) as SearchConsoleSiteEntry;
      const siteUrl = optionalString(site.siteUrl);
      if (!siteUrl) return [];
      return [{ siteUrl, permissionLevel: optionalString(site.permissionLevel) }];
    });
    return {
      status: 'pass',
      message:
        sites.length > 0
          ? `Found ${sites.length} Search Console site${sites.length === 1 ? '' : 's'}.`
          : 'No Search Console sites were returned for this Google user.',
      sites,
    };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown Search Console discovery error.',
      sites: [],
    };
  }
}

function buildNextActions(
  config: MarketingConfig,
  report: Pick<MarketingGoogleDiscoveryReport, 'googleAds' | 'ga4' | 'searchConsole'>,
): MarketingGoogleDiscoveryAction[] {
  const actions: MarketingGoogleDiscoveryAction[] = [];
  const googleAdsCustomerEnv = config.providers.googleAds.accountIdEnv;
  if (googleAdsCustomerEnv && report.googleAds.customerIds.length === 1) {
    actions.push({
      id: 'googleAds.customerId',
      message: `Set ${googleAdsCustomerEnv} to ${report.googleAds.customerIds[0]}.`,
    });
  } else if (googleAdsCustomerEnv && report.googleAds.customerIds.length > 1) {
    actions.push({
      id: 'googleAds.customerId',
      message: `Choose a Google Ads customer id and set ${googleAdsCustomerEnv}.`,
    });
  }
  const ga4PropertyEnv = config.providers.ga4.accountIdEnv;
  if (ga4PropertyEnv && report.ga4.properties.length === 1) {
    actions.push({
      id: 'ga4.propertyId',
      message: `Set ${ga4PropertyEnv} to ${report.ga4.properties[0]?.propertyId}.`,
    });
  } else if (ga4PropertyEnv && report.ga4.properties.length > 1) {
    actions.push({
      id: 'ga4.propertyId',
      message: `Choose a GA4 property and set ${ga4PropertyEnv}.`,
    });
  }
  const searchConsoleSiteEnv = config.providers.searchConsole.accountIdEnv;
  if (searchConsoleSiteEnv && report.searchConsole.sites.length === 1) {
    actions.push({
      id: 'searchConsole.siteUrl',
      message: `Set ${searchConsoleSiteEnv} to ${report.searchConsole.sites[0]?.siteUrl}.`,
    });
  } else if (searchConsoleSiteEnv && report.searchConsole.sites.length > 1) {
    actions.push({
      id: 'searchConsole.siteUrl',
      message: `Choose a Search Console site URL and set ${searchConsoleSiteEnv}.`,
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

export async function discoverMarketingGoogleAccounts(
  config: MarketingConfig,
  options: MarketingGoogleDiscoveryOptions,
): Promise<MarketingGoogleDiscoveryReport> {
  const env = options.env ?? process.env;
  const fetcher = options.fetch ?? fetch;
  const apiVersion = options.apiVersion ?? 'v22';
  const [googleAds, ga4, searchConsole] = await Promise.all([
    discoverGoogleAds({
      config,
      env,
      accessToken: options.accessToken,
      fetch: fetcher,
      apiVersion,
    }),
    discoverGa4({ config, accessToken: options.accessToken, fetch: fetcher }),
    discoverSearchConsole({ config, accessToken: options.accessToken, fetch: fetcher }),
  ]);
  const reportWithoutActions = {
    kind: 'unisane.marketing.google-discovery' as const,
    version: 1 as const,
    nonMutating: true as const,
    generatedAt: (options.now ?? new Date()).toISOString(),
    ok: [googleAds, ga4, searchConsole].every((provider) => provider.status !== 'error'),
    googleAds,
    ga4,
    searchConsole,
  };
  return {
    ...reportWithoutActions,
    nextActions: buildNextActions(config, reportWithoutActions),
  };
}
