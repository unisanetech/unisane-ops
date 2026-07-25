import { createWebTrackingEventId } from './event-id';
import { normalizeParamsToSnakeCase, toSnakeCase } from './snake-case';
import type {
  ResolvedWebTrackingConfig,
  WebTrackingAttributionState,
  WebTrackingEventInput,
  WebTrackingItem,
  WebTrackingPageViewInput,
  WebTrackingPayload,
} from './types';

function normalizeItem(item: WebTrackingItem): Record<string, unknown> {
  return normalizeParamsToSnakeCase(item);
}

function normalizeItems(
  items: readonly WebTrackingItem[] | undefined,
): readonly Record<string, unknown>[] | undefined {
  if (!items?.length) return undefined;
  return items.map(normalizeItem);
}

function mergePayloadContext(
  baseContext: Record<string, unknown>,
  eventParams: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...baseContext,
    ...eventParams,
  };
}

export function normalizeWebTrackingEventPayload(args: {
  config: ResolvedWebTrackingConfig;
  input: WebTrackingEventInput;
  pageContext?: Pick<WebTrackingPageViewInput, 'pageLocation' | 'pagePath' | 'pageTitle'>;
  attribution?: WebTrackingAttributionState;
}): WebTrackingPayload {
  const { config, input, pageContext, attribution } = args;
  const payload: WebTrackingPayload = {
    event: toSnakeCase(input.name),
    app_id: config.appId,
    event_id: input.eventId ?? createWebTrackingEventId(config.appId),
    ...mergePayloadContext(
      normalizeParamsToSnakeCase(config.defaultContext),
      normalizeParamsToSnakeCase(input.params),
    ),
  };

  if (pageContext?.pageTitle) payload.page_title = pageContext.pageTitle;
  if (pageContext?.pagePath) payload.page_path = pageContext.pagePath;
  if (pageContext?.pageLocation) payload.page_location = pageContext.pageLocation;
  if (input.transactionId) payload.transaction_id = input.transactionId;
  if (input.value !== undefined) payload.value = input.value;
  if (input.currency) payload.currency = input.currency;

  const items = normalizeItems(input.items);
  if (items) payload.items = items;

  if (config.attribution.includeInPayload && attribution) {
    if (attribution.fbc) payload.fbc = attribution.fbc;
    if (attribution.fbp) payload.fbp = attribution.fbp;
    if (attribution.gclid) payload.gclid = attribution.gclid;
    if (attribution.gbraid) payload.gbraid = attribution.gbraid;
    if (attribution.wbraid) payload.wbraid = attribution.wbraid;
    if (attribution.msclkid) payload.msclkid = attribution.msclkid;
    if (attribution.ttclid) payload.ttclid = attribution.ttclid;
  }

  return payload;
}

export function normalizeWebTrackingPageViewPayload(args: {
  config: ResolvedWebTrackingConfig;
  input?: WebTrackingPageViewInput;
  attribution?: WebTrackingAttributionState;
  fallbackPageContext?: Pick<WebTrackingPageViewInput, 'pageLocation' | 'pagePath' | 'pageTitle'>;
}): WebTrackingPayload {
  const { input, fallbackPageContext } = args;
  const pageContext = {
    pageTitle: input?.pageTitle ?? fallbackPageContext?.pageTitle,
    pagePath: input?.pagePath ?? fallbackPageContext?.pagePath,
    pageLocation: input?.pageLocation ?? fallbackPageContext?.pageLocation,
  };

  return normalizeWebTrackingEventPayload({
    config: args.config,
    input: {
      name: 'page_view',
      eventId: input?.eventId,
      params: input?.params,
    },
    pageContext,
    attribution: args.attribution,
  });
}
