export {
  DEFAULT_GOOGLE_ADS_API_VERSION,
  normalizeGoogleAdsApiVersion,
  normalizeGoogleAdsCustomerId,
  normalizeGoogleAdsConversionActionConfig,
  resolveGoogleAdsConversionActionResourceName,
  validateGoogleAdsWebConversionTransportConfig,
} from './config';
export {
  GoogleAdsWebConversionUploadError,
  uploadGoogleAdsClickConversions,
} from './google-ads-http-client';
export { mapWebConversionEnvelopeToGoogleAdsClickConversion } from './google-ads-payload';
export {
  createGoogleAdsWebConversionTransport,
  sendGoogleAdsWebConversion,
} from './send-google-ads-conversion';
export {
  hashGoogleAdsEmail,
  hashGoogleAdsPhoneNumber,
  normalizeGoogleAdsEmail,
  normalizeGoogleAdsPhoneNumber,
} from './user-identifiers';
export type {
  GoogleAdsAccessTokenProvider,
  GoogleAdsClickConversion,
  GoogleAdsConsent,
  GoogleAdsConsentStatus,
  GoogleAdsConversionActionConfig,
  GoogleAdsConversionActionMap,
  GoogleAdsConversionEnvironment,
  GoogleAdsHttpClient,
  GoogleAdsHttpResponse,
  GoogleAdsMissingAttributionBehavior,
  GoogleAdsUnmappedEventBehavior,
  GoogleAdsUploadClickConversionsRequest,
  GoogleAdsUploadClickConversionsResponse,
  GoogleAdsUserIdentifier,
  GoogleAdsWebConversionTransport,
  GoogleAdsWebConversionTransportConfig,
} from './types';
