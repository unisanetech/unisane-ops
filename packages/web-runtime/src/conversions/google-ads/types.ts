import type { WebConversionEnvelope, WebConversionTransport } from '../types';

export type GoogleAdsConsentStatus = 'GRANTED' | 'DENIED' | 'UNSPECIFIED';
export type GoogleAdsConversionEnvironment = 'WEB' | 'APP';
export type GoogleAdsMissingAttributionBehavior = 'throw' | 'skip';
export type GoogleAdsUnmappedEventBehavior = 'throw' | 'skip';

export type GoogleAdsAccessTokenProvider = () => Promise<string> | string;

export type GoogleAdsHttpResponse = {
  ok: boolean;
  status: number;
  headers?: { get(name: string): string | null };
  json?: () => Promise<unknown>;
  text?: () => Promise<string>;
};

export type GoogleAdsHttpClient = (
  url: string,
  init: {
    method: 'POST';
    headers: Record<string, string>;
    body: string;
    signal?: AbortSignal;
  },
) => Promise<GoogleAdsHttpResponse>;

export type GoogleAdsConversionActionConfig = {
  conversionActionId?: string;
  conversionActionResourceName?: string;
  defaultValue?: number;
  defaultCurrency?: string;
};

export type GoogleAdsConversionActionMap = Record<string, GoogleAdsConversionActionConfig | string>;

export type GoogleAdsWebConversionTransportConfig = {
  customerId: string;
  developerToken: string;
  accessTokenProvider: GoogleAdsAccessTokenProvider;
  conversionActions: GoogleAdsConversionActionMap;
  apiVersion?: string;
  loginCustomerId?: string;
  validateOnly?: boolean;
  debugEnabled?: boolean;
  partialFailure?: boolean;
  conversionEnvironment?: GoogleAdsConversionEnvironment;
  missingAttributionBehavior?: GoogleAdsMissingAttributionBehavior;
  unmappedEventBehavior?: GoogleAdsUnmappedEventBehavior;
  adUserDataConsent?: GoogleAdsConsentStatus;
  adPersonalizationConsent?: GoogleAdsConsentStatus;
  resolveConversionDateTime?: (envelope: WebConversionEnvelope) => Date | string;
  httpClient?: GoogleAdsHttpClient;
  timeoutMs?: number;
};

export type GoogleAdsUserIdentifier = {
  hashedEmail?: string;
  hashedPhoneNumber?: string;
};

export type GoogleAdsConsent = {
  adUserData?: GoogleAdsConsentStatus;
  adPersonalization?: GoogleAdsConsentStatus;
};

export type GoogleAdsClickConversion = {
  gclid?: string;
  gbraid?: string;
  wbraid?: string;
  conversionAction: string;
  conversionDateTime: string;
  conversionValue?: number;
  currencyCode?: string;
  orderId?: string;
  conversionEnvironment?: GoogleAdsConversionEnvironment;
  consent?: GoogleAdsConsent;
  userIdentifiers?: GoogleAdsUserIdentifier[];
};

export type GoogleAdsUploadClickConversionsRequest = {
  conversions: GoogleAdsClickConversion[];
  partialFailure: boolean;
  validateOnly?: boolean;
  debugEnabled?: boolean;
};

export type GoogleAdsUploadClickConversionsResponse = {
  partialFailureError?: unknown;
  results?: unknown[];
  jobId?: string;
};

export type GoogleAdsWebConversionTransport = WebConversionTransport;
