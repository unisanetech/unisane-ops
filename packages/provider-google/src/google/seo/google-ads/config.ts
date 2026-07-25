export type GoogleAdsKeywordPlannerCredentials = {
  developerToken: string;
  clientId: string;
  clientSecret: string;
  refreshToken?: string;
  customerId: string;
  loginCustomerId?: string;
  apiVersion: string;
};

const clientIdEnvNames = ['GOOGLE_ADS_CLIENT_ID', 'GOOGLE_OAUTH_CLIENT_ID', 'GOOGLE_CLIENT_ID'];
const clientSecretEnvNames = [
  'GOOGLE_ADS_CLIENT_SECRET',
  'GOOGLE_OAUTH_CLIENT_SECRET',
  'GOOGLE_CLIENT_SECRET',
];

export function readGoogleAdsKeywordPlannerCredentials(
  env: Record<string, string | undefined>,
  options: { requireRefreshToken?: boolean } = {},
): GoogleAdsKeywordPlannerCredentials {
  const requireRefreshToken = options.requireRefreshToken !== false;
  const apiVersion = env.GOOGLE_ADS_API_VERSION?.trim() || 'v24';
  const credentials = {
    developerToken: env.GOOGLE_ADS_DEVELOPER_TOKEN?.trim(),
    clientId: readFirstEnvValue(env, clientIdEnvNames),
    clientSecret: readFirstEnvValue(env, clientSecretEnvNames),
    refreshToken: env.GOOGLE_ADS_REFRESH_TOKEN?.trim(),
    customerId: normalizeCustomerId(env.GOOGLE_ADS_CUSTOMER_ID),
    loginCustomerId: normalizeCustomerId(env.GOOGLE_ADS_LOGIN_CUSTOMER_ID),
    apiVersion,
  };
  const missing = [
    ['GOOGLE_ADS_DEVELOPER_TOKEN', credentials.developerToken],
    [formatEnvFallback(clientIdEnvNames), credentials.clientId],
    [formatEnvFallback(clientSecretEnvNames), credentials.clientSecret],
    ...(requireRefreshToken
      ? ([['GOOGLE_ADS_REFRESH_TOKEN', credentials.refreshToken]] as const)
      : []),
    ['GOOGLE_ADS_CUSTOMER_ID', credentials.customerId],
  ]
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing Google Ads Keyword Planner env: ${missing.join(', ')}.`);
  }

  return credentials as GoogleAdsKeywordPlannerCredentials;
}

export function normalizeCustomerId(value: string | undefined): string | undefined {
  const normalized = value?.replace(/-/g, '').trim();
  return normalized && normalized.length > 0 ? normalized : undefined;
}

function readFirstEnvValue(
  env: Record<string, string | undefined>,
  names: readonly string[],
): string | undefined {
  for (const name of names) {
    const value = env[name]?.trim();
    if (value) return value;
  }
  return undefined;
}

function formatEnvFallback(names: readonly string[]): string {
  return names.join(' or ');
}
