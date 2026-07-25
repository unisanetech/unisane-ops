import { describe, expect, it } from 'vitest';
import { createDefaultWebTrackingConsentState, normalizeConsentTransportState } from '../consent';

describe('web tracking consent helpers', () => {
  it('builds the default consent state with optional overrides', () => {
    expect(
      createDefaultWebTrackingConsentState({
        adStorage: 'granted',
        personalizationStorage: 'granted',
      }),
    ).toEqual({
      adStorage: 'granted',
      adUserData: 'denied',
      adPersonalization: 'denied',
      analyticsStorage: 'granted',
      functionalityStorage: 'granted',
      personalizationStorage: 'granted',
      securityStorage: 'granted',
    });
  });

  it('normalizes consent state into transport keys', () => {
    expect(
      normalizeConsentTransportState({
        adStorage: 'denied',
        adUserData: 'granted',
        adPersonalization: 'denied',
        analyticsStorage: 'granted',
        functionalityStorage: 'granted',
        personalizationStorage: 'denied',
        securityStorage: 'granted',
      }),
    ).toEqual({
      ad_storage: 'denied',
      ad_user_data: 'granted',
      ad_personalization: 'denied',
      analytics_storage: 'granted',
      functionality_storage: 'granted',
      personalization_storage: 'denied',
      security_storage: 'granted',
    });
  });
});
