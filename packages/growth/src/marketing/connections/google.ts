import type { MarketingReportProvider } from '../schema/report.js';

export const MARKETING_GOOGLE_ADS_SCOPE = 'https://www.googleapis.com/auth/adwords';
export const MARKETING_GOOGLE_ANALYTICS_SCOPE =
  'https://www.googleapis.com/auth/analytics.readonly';
export const MARKETING_GOOGLE_SEARCH_CONSOLE_SCOPE =
  'https://www.googleapis.com/auth/webmasters.readonly';
export const MARKETING_GOOGLE_TAG_MANAGER_SCOPE =
  'https://www.googleapis.com/auth/tagmanager.readonly';

export const MARKETING_GOOGLE_AUTH_SCOPES = [
  MARKETING_GOOGLE_TAG_MANAGER_SCOPE,
  MARKETING_GOOGLE_ADS_SCOPE,
  MARKETING_GOOGLE_ANALYTICS_SCOPE,
  MARKETING_GOOGLE_SEARCH_CONSOLE_SCOPE,
] as const;

export type MarketingGoogleConnectionStatus = {
  connectionId: string;
  connected: boolean;
  scopes: readonly string[];
  credentialAvailable: boolean;
  error?: string;
};

export function requiredMarketingGoogleScope(
  provider: MarketingReportProvider,
): string | undefined {
  if (provider === 'googleAds') return MARKETING_GOOGLE_ADS_SCOPE;
  if (provider === 'ga4') return MARKETING_GOOGLE_ANALYTICS_SCOPE;
  if (provider === 'searchConsole') return MARKETING_GOOGLE_SEARCH_CONSOLE_SCOPE;
  return undefined;
}

export function marketingGoogleConnectionReadyForProvider(
  status: MarketingGoogleConnectionStatus | undefined,
  provider: MarketingReportProvider,
): boolean {
  const requiredScope = requiredMarketingGoogleScope(provider);
  if (!requiredScope || !status?.connected || !status.credentialAvailable) return false;
  return status.scopes.includes(requiredScope);
}
