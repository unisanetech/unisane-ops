import { createNoopWebTrackingClient } from './noop-client';
import type {
  WebTrackingClient,
  WebTrackingConsentMode,
  WebTrackingConsentState,
  WebTrackingEventInput,
  WebTrackingPageViewInput,
} from './types';

let currentWebTrackingClient: WebTrackingClient = createNoopWebTrackingClient();

export function setGlobalWebTrackingClient(client: WebTrackingClient): void {
  currentWebTrackingClient = client;
}

export function resetGlobalWebTrackingClient(): void {
  currentWebTrackingClient = createNoopWebTrackingClient();
}

export function getWebTrackingClient(): WebTrackingClient {
  return currentWebTrackingClient;
}

export function trackWebEvent(input: WebTrackingEventInput): void {
  currentWebTrackingClient.track(input);
}

export function trackWebPageView(input?: WebTrackingPageViewInput): void {
  currentWebTrackingClient.trackPageView(input);
}

export function updateWebTrackingConsent(
  update: Partial<WebTrackingConsentState>,
  mode?: WebTrackingConsentMode,
): WebTrackingConsentState {
  return currentWebTrackingClient.setConsent(update, mode);
}
