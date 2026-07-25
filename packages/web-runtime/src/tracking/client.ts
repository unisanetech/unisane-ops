import { mergeWebTrackingAttributionFromSearch } from './attribution';
import { resolveWebTrackingConfig } from './config';
import { createWebTrackingDedupeStore } from './dedupe';
import {
  normalizeWebTrackingEventPayload,
  normalizeWebTrackingPageViewPayload,
} from './event-payload';
import type {
  WebTrackingAttributionStore,
  WebTrackingClient,
  WebTrackingConfig,
  WebTrackingEventInput,
  WebTrackingPageViewInput,
  WebTrackingTransport,
} from './types';

type CreateWebTrackingClientArgs = {
  config: WebTrackingConfig;
  transport?: WebTrackingTransport;
  attributionStore?: WebTrackingAttributionStore;
  now?: () => number;
  getPageContext?: () => Pick<WebTrackingPageViewInput, 'pageLocation' | 'pagePath' | 'pageTitle'>;
};

function createEventDedupeKey(input: WebTrackingEventInput): string | null {
  if (input.eventId) {
    return `event_id:${input.eventId}`;
  }

  if (input.dedupe === false) {
    return null;
  }

  if (input.dedupe?.key) {
    return `custom:${input.dedupe.key}`;
  }

  if (input.transactionId) {
    return `transaction:${input.name}:${input.transactionId}`;
  }

  return null;
}

function createPageViewDedupeKey(
  input: WebTrackingPageViewInput | undefined,
  fallbackPath?: string,
): string {
  return `page_view:${input?.pagePath ?? fallbackPath ?? 'unknown'}`;
}

export function createWebTrackingClient(args: CreateWebTrackingClientArgs): WebTrackingClient {
  const resolvedConfig = resolveWebTrackingConfig(args.config);
  const now = args.now ?? (() => Date.now());
  const transport = args.transport;
  const dedupe = createWebTrackingDedupeStore();
  let consent = { ...resolvedConfig.consent.defaultState };
  let attribution = args.attributionStore?.read() ?? {};

  return {
    isEnabled() {
      return resolvedConfig.enabled;
    },
    track(input) {
      if (!resolvedConfig.enabled || !transport) return;

      const dedupeKey = createEventDedupeKey(input);
      const ttlMs = typeof input.dedupe === 'object' ? input.dedupe.ttlMs : undefined;
      if (
        dedupeKey &&
        dedupe.shouldDrop(dedupeKey, ttlMs ?? resolvedConfig.dedupe.eventWindowMs, now())
      ) {
        return;
      }

      transport.push(
        normalizeWebTrackingEventPayload({
          config: resolvedConfig,
          input,
          pageContext: args.getPageContext?.(),
          attribution,
        }),
      );
    },
    trackPageView(input) {
      if (!resolvedConfig.enabled || !transport) return;

      const fallbackPageContext = args.getPageContext?.();
      const dedupeKey = createPageViewDedupeKey(input, fallbackPageContext?.pagePath);
      if (dedupe.shouldDrop(dedupeKey, resolvedConfig.dedupe.pageViewWindowMs, now())) {
        return;
      }

      transport.push(
        normalizeWebTrackingPageViewPayload({
          config: resolvedConfig,
          input,
          attribution,
          fallbackPageContext,
        }),
      );
    },
    setConsent(update, mode = 'update') {
      consent = { ...consent, ...update };
      transport?.setConsent?.(mode, consent);
      return { ...consent };
    },
    getConsent() {
      return { ...consent };
    },
    captureAttribution(search) {
      if (!resolvedConfig.attribution.enabled) {
        return { ...attribution };
      }

      attribution = mergeWebTrackingAttributionFromSearch({
        current: {
          ...args.attributionStore?.read(),
          ...attribution,
        },
        search,
        now: now(),
      });

      args.attributionStore?.write(attribution);
      return { ...attribution };
    },
    getAttribution() {
      return { ...attribution };
    },
  };
}
