import type { WebTrackingConsentState, WebTrackingConsentValue } from './types';

const DEFAULT_CONSENT_VALUE: WebTrackingConsentValue = 'denied';

export function createDefaultWebTrackingConsentState(
  overrides: Partial<WebTrackingConsentState> = {},
): WebTrackingConsentState {
  return {
    adStorage: DEFAULT_CONSENT_VALUE,
    adUserData: DEFAULT_CONSENT_VALUE,
    adPersonalization: DEFAULT_CONSENT_VALUE,
    analyticsStorage: 'granted',
    functionalityStorage: 'granted',
    personalizationStorage: DEFAULT_CONSENT_VALUE,
    securityStorage: 'granted',
    ...overrides,
  };
}

export function normalizeConsentTransportState(
  state: WebTrackingConsentState,
): Record<string, string> {
  return {
    ad_storage: state.adStorage,
    ad_user_data: state.adUserData,
    ad_personalization: state.adPersonalization,
    analytics_storage: state.analyticsStorage,
    functionality_storage: state.functionalityStorage,
    personalization_storage: state.personalizationStorage,
    security_storage: state.securityStorage,
  };
}
