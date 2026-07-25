import type { MarketingConfig } from '../schema/marketing-config.js';
import type { FetchLike } from '../providers/api-pull-types.js';

export type MarketingGoogleAdsApiSetupStatus = 'pass' | 'warn' | 'error' | 'skip';

export type MarketingGoogleAdsApiCustomer = {
  id: string;
  resourceName?: string;
  descriptiveName?: string;
  currencyCode?: string;
  timeZone?: string;
  manager?: boolean;
  testAccount?: boolean;
  status?: string;
  apiStatus: MarketingGoogleAdsApiSetupStatus;
  message: string;
};

export type MarketingGoogleAdsApiSetupReport = {
  kind: 'unisane.marketing.google-ads-api-setup';
  version: 1;
  nonMutating: true;
  generatedAt: string;
  ok: boolean;
  status: MarketingGoogleAdsApiSetupStatus;
  message: string;
  configuredCustomerId?: string;
  loginCustomerId?: string;
  accessibleCustomerIds: string[];
  customers: MarketingGoogleAdsApiCustomer[];
  nextActions: string[];
};

export type MarketingGoogleAdsApiSetupOptions = {
  accessToken: string;
  accountId?: string;
  managerCustomerId?: string;
  env?: Record<string, string | undefined>;
  fetch?: FetchLike;
  apiVersion?: string;
  now?: Date;
};

export type MarketingGoogleAdsTestClientCreateResult = {
  kind: 'unisane.marketing.google-ads-test-client-create';
  version: 1;
  nonMutating: boolean;
  generatedAt: string;
  ok: boolean;
  managerCustomerId: string;
  customerId?: string;
  resourceName?: string;
  descriptiveName: string;
  currencyCode: string;
  timeZone: string;
  validateOnly: boolean;
  message: string;
};

export type MarketingGoogleAdsTestClientCreateOptions = {
  accessToken: string;
  managerCustomerId: string;
  descriptiveName: string;
  currencyCode: string;
  timeZone: string;
  validateOnly?: boolean;
  env?: Record<string, string | undefined>;
  fetch?: FetchLike;
  apiVersion?: string;
  now?: Date;
};

type GoogleAdsApiError = {
  code?: string;
  status?: number;
  statusText?: string;
  message: string;
};

function normalizeCustomerId(value: string | undefined): string | undefined {
  const normalized = value?.replaceAll('-', '').trim();
  return normalized || undefined;
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function optionalBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function customerIdFromResource(resourceName: string): string {
  return resourceName.replace(/^customers\//, '');
}

function customerIdFromCreatedResource(resourceName: string | undefined): string | undefined {
  return resourceName?.match(/^customers\/(\d+)$/)?.[1];
}

function parseGoogleAdsError(value: string): GoogleAdsApiError {
  try {
    const parsed = JSON.parse(value) as unknown;
    const body = asRecord(Array.isArray(parsed) ? parsed[0] : parsed);
    const error = asRecord(body.error);
    const details = asArray(error.details);
    const googleAdsFailure = details
      .map(asRecord)
      .find((detail) => detail.googleAdsFailure || detail.errors);
    const failureRecord = asRecord(googleAdsFailure?.googleAdsFailure ?? googleAdsFailure);
    const errors = asArray(failureRecord.errors);
    const firstError = asRecord(errors[0]);
    const errorCode = asRecord(firstError.errorCode);
    const code =
      Object.values(errorCode)
        .map((entry) => (typeof entry === 'string' ? entry : undefined))
        .find((entry): entry is string => Boolean(entry)) ?? optionalString(error.status);
    return { code, message: optionalString(error.message) ?? value.slice(0, 300) };
  } catch {
    return { message: value.slice(0, 300) };
  }
}

async function readGoogleAdsResponse(response: Response): Promise<unknown> {
  if (response.ok) return response.json();
  let body = '';
  try {
    body = await response.text();
  } catch {
    body = '';
  }
  const parsed = parseGoogleAdsError(body);
  const error = new Error(
    parsed.code ? `${parsed.code}: ${parsed.message}` : parsed.message,
  ) as Error & { googleAdsApiError?: GoogleAdsApiError };
  error.googleAdsApiError = {
    ...parsed,
    status: response.status,
    statusText: response.statusText,
  };
  throw error;
}

function googleAdsApiError(error: unknown): GoogleAdsApiError | undefined {
  if (!(error instanceof Error)) return undefined;
  return (error as Error & { googleAdsApiError?: GoogleAdsApiError }).googleAdsApiError;
}

function headers(input: {
  accessToken: string;
  developerToken: string;
  loginCustomerId?: string;
}): Record<string, string> {
  return {
    authorization: `Bearer ${input.accessToken}`,
    'content-type': 'application/json',
    'developer-token': input.developerToken,
    ...(input.loginCustomerId ? { 'login-customer-id': input.loginCustomerId } : {}),
  };
}

async function listAccessibleCustomers(input: {
  fetch: FetchLike;
  apiVersion: string;
  accessToken: string;
  developerToken: string;
}): Promise<string[]> {
  const value = asRecord(
    await readGoogleAdsResponse(
      await input.fetch(
        `https://googleads.googleapis.com/${input.apiVersion}/customers:listAccessibleCustomers`,
        {
          method: 'GET',
          headers: {
            authorization: `Bearer ${input.accessToken}`,
            'developer-token': input.developerToken,
          },
        },
      ),
    ),
  );
  return asArray(value.resourceNames)
    .map(optionalString)
    .filter((entry): entry is string => Boolean(entry))
    .map(customerIdFromResource);
}

function customerFromRow(entry: unknown, fallbackId: string): MarketingGoogleAdsApiCustomer {
  const row = asRecord(entry);
  const customer = asRecord(row.customer);
  return {
    id: optionalString(customer.id) ?? fallbackId,
    resourceName: optionalString(customer.resourceName),
    descriptiveName: optionalString(customer.descriptiveName),
    currencyCode: optionalString(customer.currencyCode),
    timeZone: optionalString(customer.timeZone),
    manager: optionalBoolean(customer.manager),
    testAccount: optionalBoolean(customer.testAccount),
    status: optionalString(customer.status),
    apiStatus: 'pass',
    message: 'Customer metadata query succeeded.',
  };
}

function customerClientFromRow(entry: unknown): MarketingGoogleAdsApiCustomer | undefined {
  const row = asRecord(entry);
  const customerClient = asRecord(row.customerClient);
  const id = optionalString(customerClient.id);
  if (!id) return undefined;
  return {
    id,
    resourceName: optionalString(customerClient.clientCustomer),
    descriptiveName: optionalString(customerClient.descriptiveName),
    currencyCode: optionalString(customerClient.currencyCode),
    timeZone: optionalString(customerClient.timeZone),
    manager: optionalBoolean(customerClient.manager),
    testAccount: optionalBoolean(customerClient.testAccount),
    status: optionalString(customerClient.status),
    apiStatus: 'pass',
    message: 'Manager customer_client query succeeded.',
  };
}

async function queryCustomer(input: {
  fetch: FetchLike;
  apiVersion: string;
  accessToken: string;
  developerToken: string;
  customerId: string;
  loginCustomerId?: string;
}): Promise<MarketingGoogleAdsApiCustomer> {
  try {
    const value = asArray(
      await readGoogleAdsResponse(
        await input.fetch(
          `https://googleads.googleapis.com/${input.apiVersion}/customers/${input.customerId}/googleAds:searchStream`,
          {
            method: 'POST',
            headers: headers(input),
            body: JSON.stringify({
              query:
                'SELECT customer.id, customer.resource_name, customer.descriptive_name, customer.currency_code, customer.time_zone, customer.manager, customer.test_account, customer.status FROM customer',
            }),
          },
        ),
      ),
    );
    const result = asArray(asRecord(value[0]).results)[0];
    return customerFromRow(result, input.customerId);
  } catch (error) {
    const apiError = googleAdsApiError(error);
    return {
      id: input.customerId,
      apiStatus: apiError?.code === 'DEVELOPER_TOKEN_NOT_APPROVED' ? 'warn' : 'error',
      message: apiError?.code
        ? `${apiError.code}: ${apiError.message}`
        : error instanceof Error
          ? error.message
          : 'Unknown Google Ads customer query error.',
    };
  }
}

async function queryManagerHierarchy(input: {
  fetch: FetchLike;
  apiVersion: string;
  accessToken: string;
  developerToken: string;
  managerCustomerId: string;
}): Promise<MarketingGoogleAdsApiCustomer[]> {
  try {
    const value = asArray(
      await readGoogleAdsResponse(
        await input.fetch(
          `https://googleads.googleapis.com/${input.apiVersion}/customers/${input.managerCustomerId}/googleAds:searchStream`,
          {
            method: 'POST',
            headers: headers({ ...input, loginCustomerId: input.managerCustomerId }),
            body: JSON.stringify({
              query:
                'SELECT customer_client.id, customer_client.client_customer, customer_client.descriptive_name, customer_client.currency_code, customer_client.time_zone, customer_client.manager, customer_client.test_account, customer_client.status FROM customer_client',
            }),
          },
        ),
      ),
    );
    return asArray(asRecord(value[0]).results)
      .map(customerClientFromRow)
      .filter((entry): entry is MarketingGoogleAdsApiCustomer => Boolean(entry));
  } catch {
    return [];
  }
}

function uniqueCustomers(
  customers: MarketingGoogleAdsApiCustomer[],
): MarketingGoogleAdsApiCustomer[] {
  const byId = new Map<string, MarketingGoogleAdsApiCustomer>();
  for (const customer of customers) {
    const existing = byId.get(customer.id);
    if (!existing || existing.apiStatus !== 'pass') byId.set(customer.id, customer);
  }
  return [...byId.values()].sort((left, right) => left.id.localeCompare(right.id));
}

function buildNextActions(input: {
  providerAccountEnv?: string;
  configuredCustomerId?: string;
  loginCustomerId?: string;
  customers: MarketingGoogleAdsApiCustomer[];
  target?: MarketingGoogleAdsApiCustomer;
}): string[] {
  const actions: string[] = [];
  const testAccounts = input.customers.filter((customer) => customer.testAccount);
  const tokenAppearsTestOnly = input.customers.some((customer) =>
    customer.message.includes('DEVELOPER_TOKEN_NOT_APPROVED'),
  );
  if (
    tokenAppearsTestOnly ||
    (input.target?.apiStatus === 'warn' &&
      input.target.message.includes('DEVELOPER_TOKEN_NOT_APPROVED'))
  ) {
    if (testAccounts[0] && input.providerAccountEnv) {
      actions.push(
        `Set ${input.providerAccountEnv} to test customer ${testAccounts[0].id} for immediate API proof.`,
      );
    } else {
      actions.push(
        'Use or create a Google Ads test client under the developer-token manager account for immediate API proof.',
      );
    }
    actions.push(
      'Wait for Basic Access before using this developer token with production Google Ads customers.',
    );
  } else if (input.target?.apiStatus === 'pass' && input.target.testAccount) {
    actions.push(
      'Run a read-only Google Ads API pull against this test customer, then add guarded paused-first create/update flows.',
    );
  } else if (input.target?.apiStatus === 'pass') {
    actions.push(
      'Production customer API read succeeded; keep live mutations behind dry-run receipts and explicit confirmations.',
    );
  } else if (testAccounts[0] && input.providerAccountEnv) {
    actions.push(
      `Set ${input.providerAccountEnv} to test customer ${testAccounts[0].id} and rerun this setup verifier.`,
    );
  } else {
    actions.push(
      'Run marketing setup discover-google, then choose a test customer or wait for Basic Access.',
    );
  }
  if (!input.loginCustomerId) {
    actions.push(
      'Set the login customer id only when accessing a client through a manager account; direct admin access does not need it.',
    );
  }
  return actions;
}

export async function verifyMarketingGoogleAdsApiSetup(
  config: MarketingConfig,
  options: MarketingGoogleAdsApiSetupOptions,
): Promise<MarketingGoogleAdsApiSetupReport> {
  const env = options.env ?? process.env;
  const fetcher = options.fetch ?? fetch;
  const apiVersion = options.apiVersion ?? 'v22';
  const provider = config.providers.googleAds;
  const generatedAt = (options.now ?? new Date()).toISOString();
  if (provider.state === 'disabled') {
    return {
      kind: 'unisane.marketing.google-ads-api-setup',
      version: 1,
      nonMutating: true,
      generatedAt,
      ok: true,
      status: 'skip',
      message: 'Google Ads provider is disabled.',
      accessibleCustomerIds: [],
      customers: [],
      nextActions: ['Enable Google Ads in the marketing config before running Ads API setup.'],
    };
  }
  const developerToken = provider.developerTokenEnv
    ? env[provider.developerTokenEnv]?.trim()
    : undefined;
  if (!developerToken) {
    return {
      kind: 'unisane.marketing.google-ads-api-setup',
      version: 1,
      nonMutating: true,
      generatedAt,
      ok: false,
      status: 'error',
      message: provider.developerTokenEnv
        ? `${provider.developerTokenEnv} is required for Google Ads API setup.`
        : 'Google Ads developer token env name is not configured.',
      accessibleCustomerIds: [],
      customers: [],
      nextActions: ['Set the Google Ads developer token env value, then rerun ads setup google.'],
    };
  }
  const configuredCustomerId = normalizeCustomerId(
    options.accountId ?? (provider.accountIdEnv ? env[provider.accountIdEnv] : undefined),
  );
  const loginCustomerId = normalizeCustomerId(
    options.managerCustomerId ??
      (provider.loginCustomerIdEnv ? env[provider.loginCustomerIdEnv] : undefined),
  );
  const accessibleCustomerIds = await listAccessibleCustomers({
    fetch: fetcher,
    apiVersion,
    accessToken: options.accessToken,
    developerToken,
  });
  const idsToQuery = new Set(accessibleCustomerIds);
  if (configuredCustomerId) idsToQuery.add(configuredCustomerId);
  if (loginCustomerId) idsToQuery.add(loginCustomerId);
  const directCustomers = await Promise.all(
    [...idsToQuery].map((customerId) =>
      queryCustomer({
        fetch: fetcher,
        apiVersion,
        accessToken: options.accessToken,
        developerToken,
        customerId,
        loginCustomerId,
      }),
    ),
  );
  const managerCustomers = loginCustomerId
    ? await queryManagerHierarchy({
        fetch: fetcher,
        apiVersion,
        accessToken: options.accessToken,
        developerToken,
        managerCustomerId: loginCustomerId,
      })
    : [];
  const customers = uniqueCustomers([...directCustomers, ...managerCustomers]);
  const target = configuredCustomerId
    ? customers.find((customer) => customer.id === configuredCustomerId)
    : undefined;
  const failedTarget = target && target.apiStatus !== 'pass';
  const status: MarketingGoogleAdsApiSetupStatus = failedTarget
    ? target.apiStatus
    : configuredCustomerId && !target
      ? 'error'
      : 'pass';
  const message = failedTarget
    ? `Configured Google Ads customer ${configuredCustomerId} is not API-ready: ${target.message}`
    : configuredCustomerId && target
      ? `Configured Google Ads customer ${configuredCustomerId} is API-readable${target.testAccount ? ' and is a test account' : ''}.`
      : `Found ${accessibleCustomerIds.length} accessible Google Ads customer id${accessibleCustomerIds.length === 1 ? '' : 's'}.`;
  return {
    kind: 'unisane.marketing.google-ads-api-setup',
    version: 1,
    nonMutating: true,
    generatedAt,
    ok: status !== 'error',
    status,
    message,
    configuredCustomerId,
    loginCustomerId,
    accessibleCustomerIds,
    customers,
    nextActions: buildNextActions({
      providerAccountEnv: provider.accountIdEnv,
      configuredCustomerId,
      loginCustomerId,
      customers,
      target,
    }),
  };
}

export async function createMarketingGoogleAdsTestClient(
  config: MarketingConfig,
  options: MarketingGoogleAdsTestClientCreateOptions,
): Promise<MarketingGoogleAdsTestClientCreateResult> {
  const env = options.env ?? process.env;
  const fetcher = options.fetch ?? fetch;
  const apiVersion = options.apiVersion ?? 'v22';
  const provider = config.providers.googleAds;
  const generatedAt = (options.now ?? new Date()).toISOString();
  const managerCustomerId = normalizeCustomerId(options.managerCustomerId);
  if (!managerCustomerId) {
    throw new Error('[GOOGLE_ADS_MANAGER_CUSTOMER_ID_REQUIRED] Manager customer id is required.');
  }
  const developerToken = provider.developerTokenEnv
    ? env[provider.developerTokenEnv]?.trim()
    : undefined;
  if (!developerToken) {
    throw new Error(
      provider.developerTokenEnv
        ? `[GOOGLE_ADS_DEVELOPER_TOKEN_REQUIRED] ${provider.developerTokenEnv} is required.`
        : '[GOOGLE_ADS_DEVELOPER_TOKEN_ENV_REQUIRED] Google Ads developer token env name is not configured.',
    );
  }
  const validateOnly = Boolean(options.validateOnly);
  const response = await fetcher(
    `https://googleads.googleapis.com/${apiVersion}/customers/${managerCustomerId}:createCustomerClient`,
    {
      method: 'POST',
      headers: headers({
        accessToken: options.accessToken,
        developerToken,
        loginCustomerId: managerCustomerId,
      }),
      body: JSON.stringify({
        validateOnly,
        customerClient: {
          descriptiveName: options.descriptiveName,
          currencyCode: options.currencyCode,
          timeZone: options.timeZone,
        },
      }),
    },
  );
  const value = asRecord(await readGoogleAdsResponse(response));
  const resourceName = optionalString(value.resourceName);
  const customerId = customerIdFromCreatedResource(resourceName);
  return {
    kind: 'unisane.marketing.google-ads-test-client-create',
    version: 1,
    nonMutating: validateOnly,
    generatedAt,
    ok: validateOnly || Boolean(customerId),
    managerCustomerId,
    customerId,
    resourceName,
    descriptiveName: options.descriptiveName,
    currencyCode: options.currencyCode,
    timeZone: options.timeZone,
    validateOnly,
    message: validateOnly
      ? 'Google Ads test client create request validated.'
      : customerId
        ? `Created Google Ads client customer ${customerId}.`
        : 'Google Ads create request completed, but no customer id was returned.',
  };
}
