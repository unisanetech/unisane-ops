export type GoogleAdsKeywordPlannerCredentials = {
  developerToken: string;
  customerId: string;
  loginCustomerId?: string;
  apiVersion: string;
};

export function normalizeCustomerId(value: string | undefined): string | undefined {
  const normalized = value?.replace(/-/g, '').trim();
  return normalized && normalized.length > 0 ? normalized : undefined;
}
