import type {
  GoogleAdsConversionActionConfig,
  GoogleAdsWebConversionTransportConfig,
} from './types';

export const DEFAULT_GOOGLE_ADS_API_VERSION = 'v21';

function normalizeRequiredString(value: string, fieldName: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`Google Ads web conversion ${fieldName} is required.`);
  }
  return normalized;
}

export function normalizeGoogleAdsCustomerId(customerId: string): string {
  return normalizeRequiredString(customerId, 'customerId').replace(/-/g, '');
}

export function normalizeGoogleAdsApiVersion(apiVersion: string | undefined): string {
  return (apiVersion?.trim() || DEFAULT_GOOGLE_ADS_API_VERSION).replace(/^\/+|\/+$/g, '');
}

export function normalizeGoogleAdsConversionActionConfig(
  value: GoogleAdsConversionActionConfig | string,
): GoogleAdsConversionActionConfig {
  if (typeof value === 'string') {
    return value.includes('/conversionActions/')
      ? { conversionActionResourceName: value }
      : { conversionActionId: value };
  }
  return value;
}

export function resolveGoogleAdsConversionActionResourceName(args: {
  customerId: string;
  action: GoogleAdsConversionActionConfig | string;
}): string {
  const action = normalizeGoogleAdsConversionActionConfig(args.action);
  if (action.conversionActionResourceName) {
    return normalizeRequiredString(
      action.conversionActionResourceName,
      'conversionActionResourceName',
    );
  }
  if (action.conversionActionId) {
    return `customers/${normalizeGoogleAdsCustomerId(args.customerId)}/conversionActions/${normalizeRequiredString(
      action.conversionActionId,
      'conversionActionId',
    )}`;
  }
  throw new Error(
    'Google Ads conversion action requires conversionActionId or conversionActionResourceName.',
  );
}

export function validateGoogleAdsWebConversionTransportConfig(
  config: GoogleAdsWebConversionTransportConfig,
): void {
  normalizeGoogleAdsCustomerId(config.customerId);
  normalizeRequiredString(config.developerToken, 'developerToken');
  if (Object.keys(config.conversionActions).length === 0) {
    throw new Error('Google Ads web conversion conversionActions must not be empty.');
  }
}
