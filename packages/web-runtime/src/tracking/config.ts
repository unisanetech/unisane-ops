import { createDefaultWebTrackingConsentState } from './consent';
import type { ResolvedWebTrackingConfig, WebTrackingConfig } from './types';

const DEFAULT_EVENT_WINDOW_MS = 1000;
const DEFAULT_PAGEVIEW_WINDOW_MS = 1200;
const DEFAULT_COOKIE_MAX_AGE_DAYS = 90;

export function defineWebTrackingConfig(config: WebTrackingConfig): WebTrackingConfig {
  return config;
}

export function resolveWebTrackingConfig(config: WebTrackingConfig): ResolvedWebTrackingConfig {
  return {
    appId: config.appId,
    enabled: config.enabled,
    debug: config.debug ?? false,
    autoPageViews: config.autoPageViews ?? true,
    ...(config.pageContext ? { pageContext: { ...config.pageContext } } : {}),
    defaultContext: config.defaultContext ?? {},
    ...(config.gtm ? { gtm: config.gtm } : {}),
    consent: {
      defaultState: createDefaultWebTrackingConsentState(config.consent?.defaultState),
    },
    dedupe: {
      eventWindowMs: config.dedupe?.eventWindowMs ?? DEFAULT_EVENT_WINDOW_MS,
      pageViewWindowMs: config.dedupe?.pageViewWindowMs ?? DEFAULT_PAGEVIEW_WINDOW_MS,
    },
    attribution: {
      enabled: config.attribution?.enabled ?? true,
      includeInPayload: config.attribution?.includeInPayload ?? true,
      ...(config.attribution?.cookieDomain
        ? { cookieDomain: config.attribution.cookieDomain }
        : {}),
      cookiePath: config.attribution?.cookiePath ?? '/',
      cookieMaxAgeDays: config.attribution?.cookieMaxAgeDays ?? DEFAULT_COOKIE_MAX_AGE_DAYS,
    },
  };
}
