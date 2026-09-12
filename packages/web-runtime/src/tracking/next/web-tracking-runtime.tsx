'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Script from 'next/script.js';
import { usePathname, useSearchParams } from 'next/navigation.js';
import { createWebTrackingClient } from '../client';
import {
  getWebTrackingClient,
  resetGlobalWebTrackingClient,
  setGlobalWebTrackingClient,
} from '../global-client';
import type { WebTrackingClient, WebTrackingConfig } from '../types';
import {
  buildGtmBootstrapScript,
  buildGtmScriptUrl,
  createBrowserCookieAttributionStore,
  createBrowserGtmTransport,
  getBrowserPageContext,
} from './gtm';

export function WebTrackingRuntime({ config }: { config: WebTrackingConfig }) {
  return (
    <Suspense fallback={null}>
      <WebTrackingRuntimeInner key={JSON.stringify(config)} config={config} />
    </Suspense>
  );
}

function WebTrackingRuntimeInner({ config }: { config: WebTrackingConfig }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams?.toString() ?? '';
  const clientRef = useRef<WebTrackingClient | null>(null);
  const initializedRef = useRef(false);
  const [canLoadGtm, setCanLoadGtm] = useState(false);

  if (clientRef.current === null) {
    clientRef.current = createWebTrackingClient({
      config,
      transport:
        config.enabled && config.gtm
          ? createBrowserGtmTransport({
              gtm: config.gtm,
              debug: config.debug,
            })
          : undefined,
      attributionStore: createBrowserCookieAttributionStore({
        ...(config.attribution?.cookieDomain ? { domain: config.attribution.cookieDomain } : {}),
        path: config.attribution?.cookiePath,
        maxAgeDays: config.attribution?.cookieMaxAgeDays,
      }),
      getPageContext: getBrowserPageContext,
    });
  }

  useEffect(() => {
    if (!clientRef.current) return;
    const client = clientRef.current;
    setGlobalWebTrackingClient(client);
    return () => {
      if (getWebTrackingClient() === client) resetGlobalWebTrackingClient();
    };
  }, []);

  useEffect(() => {
    if (!clientRef.current || initializedRef.current) return;
    initializedRef.current = true;
    clientRef.current.setConsent(config.consent?.defaultState ?? {}, 'default');
    clientRef.current.captureAttribution(search);
    if (config.enabled && config.gtm?.containerId) {
      setCanLoadGtm(true);
    }
  }, [config.consent?.defaultState, config.enabled, config.gtm?.containerId, search]);

  useEffect(() => {
    if (!clientRef.current) return;
    clientRef.current.captureAttribution(search);
    if (config.autoPageViews === false) return;
    clientRef.current.trackPageView({
      pagePath: pathname ? `${pathname}${search ? `?${search}` : ''}` : undefined,
    });
  }, [config.autoPageViews, pathname, search]);

  if (!config.enabled || !config.gtm?.containerId || !canLoadGtm) {
    return null;
  }

  return (
    <>
      <Script
        id={`unisane-web-tracking-gtm-bootstrap-${config.appId}`}
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: buildGtmBootstrapScript(config.gtm) }}
      />
      <Script
        id={`unisane-web-tracking-gtm-${config.appId}`}
        src={buildGtmScriptUrl(config.gtm)}
        strategy="afterInteractive"
      />
    </>
  );
}
