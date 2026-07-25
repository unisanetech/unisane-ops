import type {
  FetchLike,
  MarketingAdsLiveProviderExecutionOptions,
  MarketingAdsLiveProviderExecutionResult,
  MarketingAdsPlanCandidate,
  MarketingConfig,
  MarketingGoogleAdsSearchBuildout,
} from '@unisane/growth/contracts';
import { asArray, asRecord } from './transport-utils.js';

function envValue(
  env: Record<string, string | undefined>,
  name: string | undefined,
): string | undefined {
  if (!name) return undefined;
  const value = env[name]?.trim();
  return value ? value : undefined;
}

function normalizeGoogleAdsCustomerId(value: string): string {
  return value.replaceAll('-', '');
}

function microsFromDailyBudgetAmount(value: number | undefined): number {
  const amount = value && Number.isFinite(value) ? value : 1;
  return Math.max(1, Math.round(amount * 1_000_000));
}

function safeGoogleAdsName(value: string): string {
  return value
    .replace(/[^\w -]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180);
}

function absoluteFinalUrl(origin: string | undefined, value: string): string {
  if (/^https?:\/\//i.test(value)) return value;
  const base = origin?.trim() || 'https://trueresume.io';
  return new URL(value.startsWith('/') ? value : `/${value}`, base).toString();
}

function googleAdsCampaignBidding(candidate: MarketingAdsPlanCandidate): Record<string, unknown> {
  if (candidate.bidStrategy.type === 'maximize_conversions') {
    return { maximizeConversions: {} };
  }
  return { manualCpc: {} };
}

function productionCustomerMutationEnabled(env: Record<string, string | undefined>): boolean {
  return env.UNISANE_MARKETING_ADS_PRODUCTION_CUSTOMER_MUTATION === 'enabled';
}

async function parseProviderResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text.trim()) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { raw: text };
  }
}

async function readProviderResponse(
  response: Response,
  code: string,
  label: string,
): Promise<unknown> {
  const body = await parseProviderResponse(response);
  if (!response.ok) {
    throw new Error(`[${code}] ${label} failed: ${JSON.stringify(body)}`);
  }
  return body;
}

async function mutateGoogleAds(args: {
  fetcher: FetchLike;
  apiVersion: string;
  customerId: string;
  service: string;
  headers: Record<string, string>;
  body: Record<string, unknown>;
  errorCode: string;
  label: string;
}): Promise<Record<string, unknown>> {
  const response = await args.fetcher(
    `https://googleads.googleapis.com/${args.apiVersion}/customers/${args.customerId}/${args.service}:mutate`,
    {
      method: 'POST',
      headers: args.headers,
      body: JSON.stringify(args.body),
    },
  );
  return asRecord(await readProviderResponse(response, args.errorCode, args.label));
}

function resultResourceNames(body: Record<string, unknown>): string[] {
  return asArray(body.results)
    .map((result) => asRecord(result).resourceName)
    .filter((resourceName): resourceName is string => typeof resourceName === 'string');
}

function firstResourceName(body: Record<string, unknown>, errorCode: string): string {
  const resourceName = resultResourceNames(body)[0];
  if (!resourceName) {
    throw new Error(`[${errorCode}] Google Ads mutate returned no resource name.`);
  }
  return resourceName;
}

async function assertGoogleAdsCustomerMutationAllowed(args: {
  customerId: string;
  loginCustomerId?: string;
  developerToken: string;
  accessToken: string;
  env: Record<string, string | undefined>;
  fetcher: FetchLike;
  apiVersion: string;
}): Promise<void> {
  const response = await args.fetcher(
    `https://googleads.googleapis.com/${args.apiVersion}/customers/${args.customerId}/googleAds:searchStream`,
    {
      method: 'POST',
      headers: {
        authorization: `Bearer ${args.accessToken}`,
        'content-type': 'application/json',
        'developer-token': args.developerToken,
        ...(args.loginCustomerId ? { 'login-customer-id': args.loginCustomerId } : {}),
      },
      body: JSON.stringify({
        query: 'SELECT customer.id, customer.test_account FROM customer',
      }),
    },
  );
  const body = asArray(
    await readProviderResponse(
      response,
      'ADS_LIVE_GOOGLE_TEST_ACCOUNT_CHECK_FAILED',
      'Google Ads test account check',
    ),
  );
  const firstResult = asRecord(asArray(asRecord(body[0]).results)[0]);
  const customer = asRecord(firstResult.customer);
  if (typeof customer.testAccount !== 'boolean') {
    throw new Error(
      '[ADS_LIVE_GOOGLE_CUSTOMER_TYPE_UNKNOWN] Google Ads campaign creation requires customer.test_account evidence before live mutation.',
    );
  }
  if (customer.testAccount === true || productionCustomerMutationEnabled(args.env)) {
    return;
  }
  throw new Error(
    '[ADS_LIVE_GOOGLE_CREATE_PRODUCTION_CUSTOMER_REQUIRES_CONFIRMATION] Google Ads campaign creation for a production customer requires UNISANE_MARKETING_ADS_PRODUCTION_CUSTOMER_MUTATION=enabled.',
  );
}

async function createGoogleAdsCampaignCriteria(args: {
  campaignResourceName: string;
  settings: MarketingAdsPlanCandidate['googleSearchSettings'];
  buildout?: MarketingGoogleAdsSearchBuildout;
  fetcher: FetchLike;
  apiVersion: string;
  customerId: string;
  headers: Record<string, string>;
}): Promise<string[]> {
  const operations = [
    ...(args.settings?.locationCriterionIds ?? []).map((criterionId) => ({
      create: {
        campaign: args.campaignResourceName,
        location: {
          geoTargetConstant: `geoTargetConstants/${criterionId}`,
        },
      },
    })),
    ...(args.settings?.languageCriterionIds ?? []).map((criterionId) => ({
      create: {
        campaign: args.campaignResourceName,
        language: {
          languageConstant: `languageConstants/${criterionId}`,
        },
      },
    })),
    ...(args.buildout?.campaignNegativeKeywords ?? []).map((keyword) => ({
      create: {
        campaign: args.campaignResourceName,
        negative: true,
        keyword: {
          text: keyword,
          matchType: 'BROAD',
        },
      },
    })),
  ];
  if (operations.length === 0) return [];
  const body = await mutateGoogleAds({
    fetcher: args.fetcher,
    apiVersion: args.apiVersion,
    customerId: args.customerId,
    service: 'campaignCriteria',
    headers: args.headers,
    body: { operations, partialFailure: false },
    errorCode: 'ADS_LIVE_GOOGLE_CAMPAIGN_CRITERIA_CREATE_FAILED',
    label: 'Google Ads campaign criteria create',
  });
  return resultResourceNames(body);
}

async function createGoogleAdsAdGroups(args: {
  campaignResourceName: string;
  buildout?: MarketingGoogleAdsSearchBuildout;
  fetcher: FetchLike;
  apiVersion: string;
  customerId: string;
  headers: Record<string, string>;
}): Promise<Array<{ resourceName: string; index: number }>> {
  const adGroups = args.buildout?.adGroups ?? [];
  if (adGroups.length === 0) return [];
  const body = await mutateGoogleAds({
    fetcher: args.fetcher,
    apiVersion: args.apiVersion,
    customerId: args.customerId,
    service: 'adGroups',
    headers: args.headers,
    body: {
      operations: adGroups.map((adGroup) => ({
        create: {
          name: safeGoogleAdsName(adGroup.name),
          campaign: args.campaignResourceName,
          status: 'PAUSED',
          type: 'SEARCH_STANDARD',
          cpcBidMicros: adGroup.cpcBidMicros ?? 1_000_000,
        },
      })),
      partialFailure: false,
    },
    errorCode: 'ADS_LIVE_GOOGLE_AD_GROUP_CREATE_FAILED',
    label: 'Google Ads ad group create',
  });
  return resultResourceNames(body).map((resourceName, index) => ({ resourceName, index }));
}

async function createGoogleAdsAdGroupKeywords(args: {
  adGroupResourceName: string;
  adGroup: NonNullable<MarketingGoogleAdsSearchBuildout['adGroups']>[number];
  fetcher: FetchLike;
  apiVersion: string;
  customerId: string;
  headers: Record<string, string>;
}): Promise<string[]> {
  const body = await mutateGoogleAds({
    fetcher: args.fetcher,
    apiVersion: args.apiVersion,
    customerId: args.customerId,
    service: 'adGroupCriteria',
    headers: args.headers,
    body: {
      operations: args.adGroup.keywords.map((keyword) => ({
        create: {
          adGroup: args.adGroupResourceName,
          status: 'ENABLED',
          keyword: {
            text: keyword.text,
            matchType: keyword.matchType,
          },
        },
      })),
      partialFailure: false,
    },
    errorCode: 'ADS_LIVE_GOOGLE_KEYWORD_CREATE_FAILED',
    label: 'Google Ads keyword create',
  });
  return resultResourceNames(body);
}

async function createGoogleAdsResponsiveSearchAd(args: {
  adGroupResourceName: string;
  adGroup: NonNullable<MarketingGoogleAdsSearchBuildout['adGroups']>[number];
  origin?: string;
  fetcher: FetchLike;
  apiVersion: string;
  customerId: string;
  headers: Record<string, string>;
}): Promise<string> {
  const ad = args.adGroup.responsiveSearchAd;
  const body = await mutateGoogleAds({
    fetcher: args.fetcher,
    apiVersion: args.apiVersion,
    customerId: args.customerId,
    service: 'adGroupAds',
    headers: args.headers,
    body: {
      operations: [
        {
          create: {
            adGroup: args.adGroupResourceName,
            status: 'PAUSED',
            ad: {
              finalUrls: [absoluteFinalUrl(args.origin, args.adGroup.landingPageUrl)],
              responsiveSearchAd: {
                ...(ad.path1 ? { path1: ad.path1 } : {}),
                ...(ad.path2 ? { path2: ad.path2 } : {}),
                headlines: ad.headlines.map((text) => ({ text })),
                descriptions: ad.descriptions.map((text) => ({ text })),
              },
            },
          },
        },
      ],
    },
    errorCode: 'ADS_LIVE_GOOGLE_RSA_CREATE_FAILED',
    label: 'Google Ads responsive search ad create',
  });
  return firstResourceName(body, 'ADS_LIVE_GOOGLE_RSA_CREATE_INVALID');
}

async function createGoogleAdsAsset(args: {
  create: Record<string, unknown>;
  fetcher: FetchLike;
  apiVersion: string;
  customerId: string;
  headers: Record<string, string>;
}): Promise<string> {
  const body = await mutateGoogleAds({
    fetcher: args.fetcher,
    apiVersion: args.apiVersion,
    customerId: args.customerId,
    service: 'assets',
    headers: args.headers,
    body: {
      operations: [{ create: args.create }],
    },
    errorCode: 'ADS_LIVE_GOOGLE_ASSET_CREATE_FAILED',
    label: 'Google Ads asset create',
  });
  return firstResourceName(body, 'ADS_LIVE_GOOGLE_ASSET_CREATE_INVALID');
}

async function linkGoogleAdsCampaignAsset(args: {
  campaignResourceName: string;
  assetResourceName: string;
  fieldType: 'SITELINK' | 'CALLOUT' | 'STRUCTURED_SNIPPET';
  fetcher: FetchLike;
  apiVersion: string;
  customerId: string;
  headers: Record<string, string>;
}): Promise<string> {
  const body = await mutateGoogleAds({
    fetcher: args.fetcher,
    apiVersion: args.apiVersion,
    customerId: args.customerId,
    service: 'campaignAssets',
    headers: args.headers,
    body: {
      operations: [
        {
          create: {
            campaign: args.campaignResourceName,
            asset: args.assetResourceName,
            fieldType: args.fieldType,
          },
        },
      ],
    },
    errorCode: 'ADS_LIVE_GOOGLE_CAMPAIGN_ASSET_LINK_FAILED',
    label: 'Google Ads campaign asset link',
  });
  return firstResourceName(body, 'ADS_LIVE_GOOGLE_CAMPAIGN_ASSET_LINK_INVALID');
}

async function createGoogleAdsCampaignAssets(args: {
  campaignResourceName: string;
  buildout?: MarketingGoogleAdsSearchBuildout;
  fetcher: FetchLike;
  apiVersion: string;
  customerId: string;
  headers: Record<string, string>;
}): Promise<string[]> {
  const assets = args.buildout?.assets;
  const origin = args.buildout?.finalUrlOrigin;
  const linkedAssets: string[] = [];
  for (const sitelink of assets?.sitelinks ?? []) {
    const asset = await createGoogleAdsAsset({
      fetcher: args.fetcher,
      apiVersion: args.apiVersion,
      customerId: args.customerId,
      headers: args.headers,
      create: {
        finalUrls: [absoluteFinalUrl(origin, sitelink.url)],
        sitelinkAsset: {
          linkText: sitelink.text,
          ...(sitelink.description1 ? { description1: sitelink.description1 } : {}),
          ...(sitelink.description2 ? { description2: sitelink.description2 } : {}),
        },
      },
    });
    linkedAssets.push(
      await linkGoogleAdsCampaignAsset({
        campaignResourceName: args.campaignResourceName,
        assetResourceName: asset,
        fieldType: 'SITELINK',
        fetcher: args.fetcher,
        apiVersion: args.apiVersion,
        customerId: args.customerId,
        headers: args.headers,
      }),
    );
  }
  for (const callout of assets?.callouts ?? []) {
    const asset = await createGoogleAdsAsset({
      fetcher: args.fetcher,
      apiVersion: args.apiVersion,
      customerId: args.customerId,
      headers: args.headers,
      create: {
        calloutAsset: {
          calloutText: callout,
        },
      },
    });
    linkedAssets.push(
      await linkGoogleAdsCampaignAsset({
        campaignResourceName: args.campaignResourceName,
        assetResourceName: asset,
        fieldType: 'CALLOUT',
        fetcher: args.fetcher,
        apiVersion: args.apiVersion,
        customerId: args.customerId,
        headers: args.headers,
      }),
    );
  }
  for (const snippet of assets?.structuredSnippets ?? []) {
    const asset = await createGoogleAdsAsset({
      fetcher: args.fetcher,
      apiVersion: args.apiVersion,
      customerId: args.customerId,
      headers: args.headers,
      create: {
        structuredSnippetAsset: {
          header: snippet.header,
          values: snippet.values,
        },
      },
    });
    linkedAssets.push(
      await linkGoogleAdsCampaignAsset({
        campaignResourceName: args.campaignResourceName,
        assetResourceName: asset,
        fieldType: 'STRUCTURED_SNIPPET',
        fetcher: args.fetcher,
        apiVersion: args.apiVersion,
        customerId: args.customerId,
        headers: args.headers,
      }),
    );
  }
  return linkedAssets;
}

async function pauseGoogleAdsCampaign(args: {
  config: MarketingConfig;
  campaignId: string;
  env: Record<string, string | undefined>;
  fetcher: FetchLike;
  apiVersion?: string;
}): Promise<{ providerOperationId?: string; message: string }> {
  const provider = args.config.providers.googleAds;
  const customerId = envValue(args.env, provider.accountIdEnv);
  const loginCustomerId = envValue(args.env, provider.loginCustomerIdEnv);
  const developerToken = envValue(args.env, provider.developerTokenEnv);
  const accessToken = envValue(args.env, provider.accessTokenEnv);
  if (!customerId || !developerToken || !accessToken) {
    throw new Error(
      '[ADS_LIVE_GOOGLE_ENV_MISSING] Google Ads live pause requires customer id, developer token, and access token env refs.',
    );
  }
  const apiVersion = args.apiVersion ?? 'v24';
  const normalizedCustomerId = normalizeGoogleAdsCustomerId(customerId);
  const response = await args.fetcher(
    `https://googleads.googleapis.com/${apiVersion}/customers/${normalizedCustomerId}/campaigns:mutate`,
    {
      method: 'POST',
      headers: {
        authorization: `Bearer ${accessToken}`,
        'content-type': 'application/json',
        'developer-token': developerToken,
        ...(loginCustomerId
          ? { 'login-customer-id': normalizeGoogleAdsCustomerId(loginCustomerId) }
          : {}),
      },
      body: JSON.stringify({
        operations: [
          {
            updateMask: 'status',
            update: {
              resourceName: `customers/${normalizedCustomerId}/campaigns/${args.campaignId}`,
              status: 'PAUSED',
            },
          },
        ],
      }),
    },
  );
  const body = await parseProviderResponse(response);
  if (!response.ok) {
    throw new Error(
      `[ADS_LIVE_GOOGLE_PAUSE_FAILED] Google Ads pause failed: ${JSON.stringify(body)}`,
    );
  }
  const result = Array.isArray((body as { results?: unknown[] }).results)
    ? (body as { results: Array<{ resourceName?: string }> }).results[0]?.resourceName
    : undefined;
  return {
    providerOperationId: result,
    message: 'Google Ads campaign pause mutation sent.',
  };
}

async function createPausedGoogleAdsSearchCampaign(args: {
  config: MarketingConfig;
  candidate: MarketingAdsPlanCandidate;
  env: Record<string, string | undefined>;
  fetcher: FetchLike;
  apiVersion?: string;
}): Promise<{ providerOperationId?: string; message: string }> {
  const provider = args.config.providers.googleAds;
  const customerId = envValue(args.env, provider.accountIdEnv);
  const loginCustomerId = envValue(args.env, provider.loginCustomerIdEnv);
  const developerToken = envValue(args.env, provider.developerTokenEnv);
  const accessToken = envValue(args.env, provider.accessTokenEnv);
  if (!customerId || !developerToken || !accessToken) {
    throw new Error(
      '[ADS_LIVE_GOOGLE_ENV_MISSING] Google Ads live create requires customer id, developer token, and access token env refs.',
    );
  }
  const apiVersion = args.apiVersion ?? 'v24';
  const normalizedCustomerId = normalizeGoogleAdsCustomerId(customerId);
  const normalizedLoginCustomerId = loginCustomerId
    ? normalizeGoogleAdsCustomerId(loginCustomerId)
    : undefined;
  const commonHeaders = {
    authorization: `Bearer ${accessToken}`,
    'content-type': 'application/json',
    'developer-token': developerToken,
    ...(normalizedLoginCustomerId ? { 'login-customer-id': normalizedLoginCustomerId } : {}),
  };
  await assertGoogleAdsCustomerMutationAllowed({
    customerId: normalizedCustomerId,
    loginCustomerId: normalizedLoginCustomerId,
    developerToken,
    accessToken,
    env: args.env,
    fetcher: args.fetcher,
    apiVersion,
  });
  const suffix = Date.now().toString(36);
  const baseName = safeGoogleAdsName(args.candidate.name);
  const budgetResponse = await args.fetcher(
    `https://googleads.googleapis.com/${apiVersion}/customers/${normalizedCustomerId}/campaignBudgets:mutate`,
    {
      method: 'POST',
      headers: commonHeaders,
      body: JSON.stringify({
        operations: [
          {
            create: {
              name: `${baseName} Budget ${suffix}`,
              amountMicros: microsFromDailyBudgetAmount(
                args.candidate.budgetGuardrail.dailyBudgetAmount,
              ),
              deliveryMethod: 'STANDARD',
              explicitlyShared: false,
            },
          },
        ],
      }),
    },
  );
  const budgetBody = asRecord(
    await readProviderResponse(
      budgetResponse,
      'ADS_LIVE_GOOGLE_BUDGET_CREATE_FAILED',
      'Google Ads budget create',
    ),
  );
  const budgetResourceName = asRecord(asArray(budgetBody.results)[0]).resourceName;
  if (typeof budgetResourceName !== 'string' || !budgetResourceName) {
    throw new Error(
      '[ADS_LIVE_GOOGLE_BUDGET_CREATE_INVALID] Google Ads budget create returned no resource name.',
    );
  }
  const settings = args.candidate.googleSearchSettings;
  const campaignResponse = await args.fetcher(
    `https://googleads.googleapis.com/${apiVersion}/customers/${normalizedCustomerId}/campaigns:mutate`,
    {
      method: 'POST',
      headers: commonHeaders,
      body: JSON.stringify({
        operations: [
          {
            create: {
              name: `${baseName} ${suffix}`,
              status: 'PAUSED',
              advertisingChannelType: 'SEARCH',
              containsEuPoliticalAdvertising: 'DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING',
              campaignBudget: budgetResourceName,
              ...googleAdsCampaignBidding(args.candidate),
              networkSettings: {
                targetGoogleSearch: settings?.targetGoogleSearch ?? true,
                targetSearchNetwork: settings?.targetSearchNetwork ?? false,
                targetContentNetwork: settings?.targetContentNetwork ?? false,
                targetPartnerSearchNetwork: false,
              },
              ...(settings?.finalUrlSuffix ? { finalUrlSuffix: settings.finalUrlSuffix } : {}),
            },
          },
        ],
      }),
    },
  );
  const campaignBody = asRecord(
    await readProviderResponse(
      campaignResponse,
      'ADS_LIVE_GOOGLE_CAMPAIGN_CREATE_FAILED',
      'Google Ads campaign create',
    ),
  );
  const campaignResourceName = asRecord(asArray(campaignBody.results)[0]).resourceName;
  if (typeof campaignResourceName !== 'string' || !campaignResourceName) {
    throw new Error(
      '[ADS_LIVE_GOOGLE_CAMPAIGN_CREATE_INVALID] Google Ads campaign create returned no resource name.',
    );
  }
  const criteria = await createGoogleAdsCampaignCriteria({
    campaignResourceName,
    settings,
    buildout: args.candidate.googleSearchBuildout,
    fetcher: args.fetcher,
    apiVersion,
    customerId: normalizedCustomerId,
    headers: commonHeaders,
  });
  const adGroups = await createGoogleAdsAdGroups({
    campaignResourceName,
    buildout: args.candidate.googleSearchBuildout,
    fetcher: args.fetcher,
    apiVersion,
    customerId: normalizedCustomerId,
    headers: commonHeaders,
  });
  let keywordCount = 0;
  let adCount = 0;
  for (const adGroup of adGroups) {
    const buildoutAdGroup = args.candidate.googleSearchBuildout?.adGroups[adGroup.index];
    if (!buildoutAdGroup) continue;
    keywordCount += (
      await createGoogleAdsAdGroupKeywords({
        adGroupResourceName: adGroup.resourceName,
        adGroup: buildoutAdGroup,
        fetcher: args.fetcher,
        apiVersion,
        customerId: normalizedCustomerId,
        headers: commonHeaders,
      })
    ).length;
    await createGoogleAdsResponsiveSearchAd({
      adGroupResourceName: adGroup.resourceName,
      adGroup: buildoutAdGroup,
      origin: args.candidate.googleSearchBuildout?.finalUrlOrigin,
      fetcher: args.fetcher,
      apiVersion,
      customerId: normalizedCustomerId,
      headers: commonHeaders,
    });
    adCount += 1;
  }
  const assets = await createGoogleAdsCampaignAssets({
    campaignResourceName,
    buildout: args.candidate.googleSearchBuildout,
    fetcher: args.fetcher,
    apiVersion,
    customerId: normalizedCustomerId,
    headers: commonHeaders,
  });
  return {
    providerOperationId: campaignResourceName,
    message:
      `Google Ads paused Search campaign created with budget ${budgetResourceName}; ` +
      `${criteria.length} campaign criteria, ${adGroups.length} ad groups, ` +
      `${keywordCount} keywords, ${adCount} responsive search ads, and ${assets.length} assets.`,
  };
}

export async function executeGoogleAdsLiveOperation(
  options: MarketingAdsLiveProviderExecutionOptions,
): Promise<MarketingAdsLiveProviderExecutionResult> {
  if (options.operation.provider !== 'googleAds') {
    throw new Error(
      '[ADS_LIVE_GOOGLE_PROVIDER_INVALID] Google Ads executor received a non-Google operation.',
    );
  }
  if (options.operation.actionType === 'create_campaign') {
    if (!options.candidate) {
      throw new Error(
        '[ADS_LIVE_GOOGLE_CANDIDATE_REQUIRED] Google Ads campaign creation requires a reviewed candidate.',
      );
    }
    return createPausedGoogleAdsSearchCampaign({
      config: options.config,
      candidate: options.candidate,
      env: options.env,
      fetcher: options.fetch,
      apiVersion: options.apiVersion,
    });
  }
  if (options.operation.actionType !== 'pause_campaign') {
    throw new Error(
      `[ADS_LIVE_GOOGLE_ACTION_UNSUPPORTED] Google Ads live executor does not support ${options.operation.actionType}.`,
    );
  }
  const campaignId = options.candidate?.campaignIds[0];
  if (!campaignId) {
    throw new Error(
      '[ADS_LIVE_GOOGLE_CAMPAIGN_ID_REQUIRED] Google Ads pause requires a reviewed provider campaign id.',
    );
  }
  return pauseGoogleAdsCampaign({
    config: options.config,
    campaignId,
    env: options.env,
    fetcher: options.fetch,
    apiVersion: options.apiVersion,
  });
}
