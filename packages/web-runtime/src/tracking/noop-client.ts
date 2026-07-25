import type {
  WebTrackingAttributionState,
  WebTrackingClient,
  WebTrackingConsentState,
} from './types';
import { createDefaultWebTrackingConsentState } from './consent';

const EMPTY_ATTRIBUTION_STATE: WebTrackingAttributionState = {};
const DEFAULT_CONSENT = createDefaultWebTrackingConsentState();

export function createNoopWebTrackingClient(): WebTrackingClient {
  let consent = { ...DEFAULT_CONSENT };

  return {
    isEnabled() {
      return false;
    },
    track() {},
    trackPageView() {},
    setConsent(update: Partial<WebTrackingConsentState>) {
      consent = { ...consent, ...update };
      return { ...consent };
    },
    getConsent() {
      return { ...consent };
    },
    captureAttribution() {
      return { ...EMPTY_ATTRIBUTION_STATE };
    },
    getAttribution() {
      return { ...EMPTY_ATTRIBUTION_STATE };
    },
  };
}
