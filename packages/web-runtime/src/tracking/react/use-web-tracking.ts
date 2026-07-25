'use client';

import {
  getWebTrackingClient,
  trackWebEvent,
  trackWebPageView,
  updateWebTrackingConsent,
} from '../global-client';
import type {
  WebTrackingClient,
  WebTrackingConsentMode,
  WebTrackingConsentState,
  WebTrackingEventInput,
  WebTrackingPageViewInput,
} from '../types';
import { useOptionalWebTrackingClientContext } from './context';

const FALLBACK_CLIENT: WebTrackingClient = {
  isEnabled() {
    return getWebTrackingClient().isEnabled();
  },
  track(input: WebTrackingEventInput) {
    trackWebEvent(input);
  },
  trackPageView(input?: WebTrackingPageViewInput) {
    trackWebPageView(input);
  },
  setConsent(update: Partial<WebTrackingConsentState>, mode?: WebTrackingConsentMode) {
    return updateWebTrackingConsent(update, mode);
  },
  getConsent() {
    return getWebTrackingClient().getConsent();
  },
  captureAttribution(search?: string) {
    return getWebTrackingClient().captureAttribution(search);
  },
  getAttribution() {
    return getWebTrackingClient().getAttribution();
  },
};

export function useWebTracking(): WebTrackingClient {
  const client = useOptionalWebTrackingClientContext();
  return client ?? FALLBACK_CLIENT;
}
