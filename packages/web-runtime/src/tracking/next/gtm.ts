'use client';

import { createBrowserCookieAttributionStore } from '../attribution';
import { normalizeConsentTransportState } from '../consent';
import type {
  WebTrackingConsentMode,
  WebTrackingConsentState,
  WebTrackingGtmConfig,
  WebTrackingPayload,
  WebTrackingTransport,
} from '../types';

type BrowserWindowLike = Window &
  typeof globalThis & {
    [key: string]: unknown;
    gtag?: (...args: unknown[]) => void;
  };

function ensureDataLayer(windowObject: BrowserWindowLike, dataLayerName: string): unknown[] {
  const existing = windowObject[dataLayerName];
  if (Array.isArray(existing)) {
    return existing;
  }

  const queue: unknown[] = [];
  windowObject[dataLayerName] = queue;
  return queue;
}

function ensureGtag(windowObject: BrowserWindowLike, dataLayerName: string): void {
  if (typeof windowObject.gtag === 'function') {
    return;
  }

  windowObject.gtag = (...args: unknown[]) => {
    ensureDataLayer(windowObject, dataLayerName).push(args);
  };
}

export function buildGtmScriptUrl(config: WebTrackingGtmConfig): string {
  const url = new URL('https://www.googletagmanager.com/gtm.js');
  url.searchParams.set('id', config.containerId);
  if (config.dataLayerName && config.dataLayerName !== 'dataLayer') {
    url.searchParams.set('l', config.dataLayerName);
  }
  if (config.auth) {
    url.searchParams.set('gtm_auth', config.auth);
  }
  if (config.preview) {
    url.searchParams.set('gtm_preview', config.preview);
    url.searchParams.set('gtm_cookies_win', 'x');
  }
  return url.toString();
}

function serializeInlineScriptString(value: string): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

export function buildGtmBootstrapScript(config: WebTrackingGtmConfig): string {
  const dataLayerName = config.dataLayerName ?? 'dataLayer';
  const bootstrapKey = `${dataLayerName}:${config.containerId}`;

  return [
    '(function(w,l,k){',
    'w[l]=w[l]||[];',
    'w.__unisaneGtmBootstrap=w.__unisaneGtmBootstrap||{};',
    'if(w.__unisaneGtmBootstrap[k])return;',
    'w.__unisaneGtmBootstrap[k]=true;',
    "w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});",
    `})(window,${serializeInlineScriptString(dataLayerName)},${serializeInlineScriptString(bootstrapKey)});`,
  ].join('');
}

export function createBrowserGtmTransport(args: {
  gtm: WebTrackingGtmConfig;
  debug?: boolean;
}): WebTrackingTransport {
  const dataLayerName = args.gtm.dataLayerName ?? 'dataLayer';

  return {
    push(payload: WebTrackingPayload) {
      if (typeof window === 'undefined') return;
      const browserWindow = window as BrowserWindowLike;
      ensureDataLayer(browserWindow, dataLayerName).push(payload);

      if (args.debug) {
        console.debug('[web-tracking] push', payload);
      }
    },
    setConsent(mode: WebTrackingConsentMode, state: WebTrackingConsentState) {
      if (typeof window === 'undefined') return;
      const browserWindow = window as BrowserWindowLike;
      ensureDataLayer(browserWindow, dataLayerName);
      ensureGtag(browserWindow, dataLayerName);
      browserWindow.gtag?.('consent', mode, normalizeConsentTransportState(state));

      if (args.debug) {
        console.debug('[web-tracking] consent', { mode, state });
      }
    },
  };
}

export { createBrowserCookieAttributionStore };

export function getBrowserPageContext(): {
  pageLocation?: string;
  pagePath?: string;
  pageTitle?: string;
} {
  if (typeof window === 'undefined') {
    return {};
  }

  return {
    pageLocation: window.location.href,
    pagePath: `${window.location.pathname}${window.location.search}`,
    ...(typeof document !== 'undefined' ? { pageTitle: document.title } : {}),
  };
}
