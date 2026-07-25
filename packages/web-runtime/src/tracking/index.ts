export {
  createBrowserCookieAttributionStore,
  mergeWebTrackingAttributionFromSearch,
  readWebTrackingAttributionFromCookies,
} from './attribution';
export { createWebTrackingClient } from './client';
export { defineWebTrackingConfig, resolveWebTrackingConfig } from './config';
export { createDefaultWebTrackingConsentState, normalizeConsentTransportState } from './consent';
export { createWebTrackingDedupeStore } from './dedupe';
export { createWebTrackingEventId } from './event-id';
export {
  normalizeWebTrackingEventPayload,
  normalizeWebTrackingPageViewPayload,
} from './event-payload';
export {
  getWebTrackingClient,
  trackWebEvent,
  trackWebPageView,
  updateWebTrackingConsent,
} from './global-client';
export type {
  ResolvedWebTrackingConfig,
  WebTrackingAttributionState,
  WebTrackingAttributionStore,
  WebTrackingClient,
  WebTrackingConfig,
  WebTrackingConsentMode,
  WebTrackingConsentState,
  WebTrackingConsentValue,
  WebTrackingEventInput,
  WebTrackingGtmConfig,
  WebTrackingItem,
  WebTrackingPageViewInput,
  WebTrackingParams,
  WebTrackingPayload,
  WebTrackingScalar,
  WebTrackingTransport,
  WebTrackingValue,
} from './types';
