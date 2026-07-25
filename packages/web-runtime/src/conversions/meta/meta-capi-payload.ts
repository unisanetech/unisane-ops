import type { WebConversionEnvelope } from '../types';
import { hashMetaCapiExternalId } from './user-data';
import type {
  MetaCapiEvent,
  MetaCapiEventNameMap,
  MetaCapiUnmappedEventBehavior,
  MetaCapiUserData,
  MetaCapiWebConversionTransportConfig,
} from './types';

function readPropertyString(
  properties: Record<string, unknown> | undefined,
  keys: readonly string[],
): string | undefined {
  if (!properties) return undefined;
  for (const key of keys) {
    const value = properties[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }
  return undefined;
}

function readMetaCapiEventName(args: {
  event: string;
  eventNames: MetaCapiEventNameMap;
  behavior: MetaCapiUnmappedEventBehavior;
}): string | null {
  const eventName = args.eventNames[args.event]?.trim();
  if (eventName) return eventName;
  if (args.behavior === 'skip') return null;
  throw new Error(`Meta CAPI event name is not mapped for event "${args.event}".`);
}

function resolveEventTime(value: Date | number | string | undefined): number {
  if (value instanceof Date) return Math.floor(value.getTime() / 1000);
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value > 1_000_000_000_000 ? Math.floor(value / 1000) : Math.floor(value);
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) return Math.floor(parsed / 1000);
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return resolveEventTime(numeric);
  }
  return Math.floor(Date.now() / 1000);
}

function resolveEventSourceUrl(
  envelope: WebConversionEnvelope,
  config: Pick<MetaCapiWebConversionTransportConfig, 'eventSourceUrl'>,
  properties: Record<string, unknown> | undefined,
): string | undefined {
  if (typeof config.eventSourceUrl === 'function') return config.eventSourceUrl(envelope);
  if (typeof config.eventSourceUrl === 'string' && config.eventSourceUrl.trim()) {
    return config.eventSourceUrl.trim();
  }
  return readPropertyString(properties, ['event_source_url', 'eventSourceUrl', 'page_location']);
}

function resolveUserData(
  envelope: WebConversionEnvelope,
  properties: Record<string, unknown> | undefined,
): MetaCapiUserData {
  const hashedEmail = readPropertyString(properties, ['hashed_email', 'hashedEmail']);
  const hashedPhoneNumber = readPropertyString(properties, [
    'hashed_phone_number',
    'hashedPhoneNumber',
  ]);
  const clientIpAddress = readPropertyString(properties, ['client_ip_address', 'clientIpAddress']);
  const clientUserAgent = readPropertyString(properties, [
    'client_user_agent',
    'clientUserAgent',
    'user_agent',
    'userAgent',
  ]);
  const fbc = readPropertyString(properties, ['fbc']);
  const fbp = readPropertyString(properties, ['fbp']);

  return {
    ...(hashedEmail ? { em: [hashedEmail] } : {}),
    ...(hashedPhoneNumber ? { ph: [hashedPhoneNumber] } : {}),
    ...(envelope.user_id ? { external_id: [hashMetaCapiExternalId(envelope.user_id)] } : {}),
    ...(clientIpAddress ? { client_ip_address: clientIpAddress } : {}),
    ...(clientUserAgent ? { client_user_agent: clientUserAgent } : {}),
    ...(fbc ? { fbc } : {}),
    ...(fbp ? { fbp } : {}),
  };
}

function hasMetaCapiAttribution(userData: MetaCapiUserData): boolean {
  return Boolean(
    userData.fbc ||
    userData.fbp ||
    userData.client_ip_address ||
    userData.client_user_agent ||
    (userData.external_id && userData.external_id.length > 0) ||
    (userData.em && userData.em.length > 0) ||
    (userData.ph && userData.ph.length > 0),
  );
}

function resolveContentIds(
  items: readonly Record<string, unknown>[] | undefined,
): string[] | undefined {
  if (!items?.length) return undefined;
  const ids = items
    .map((item) => item.itemId)
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0);
  return ids.length ? ids : undefined;
}

export function mapWebConversionEnvelopeToMetaCapiEvent(args: {
  envelope: WebConversionEnvelope;
  config: Pick<
    MetaCapiWebConversionTransportConfig,
    | 'eventNames'
    | 'actionSource'
    | 'eventSourceUrl'
    | 'missingAttributionBehavior'
    | 'unmappedEventBehavior'
    | 'resolveEventTime'
  >;
}): MetaCapiEvent | null {
  const properties = args.envelope.properties as Record<string, unknown> | undefined;
  const eventName = readMetaCapiEventName({
    event: args.envelope.event,
    eventNames: args.config.eventNames,
    behavior: args.config.unmappedEventBehavior ?? 'throw',
  });
  if (!eventName) return null;

  const userData = resolveUserData(args.envelope, properties);
  if (!hasMetaCapiAttribution(userData)) {
    if ((args.config.missingAttributionBehavior ?? 'throw') === 'skip') {
      return null;
    }
    throw new Error(`Meta CAPI event "${args.envelope.event}" requires user_data attribution.`);
  }

  const contentIds = resolveContentIds(args.envelope.items);
  const customData = {
    ...(typeof args.envelope.value === 'number' ? { value: args.envelope.value } : {}),
    ...(args.envelope.currency ? { currency: args.envelope.currency } : {}),
    ...(args.envelope.transaction_id ? { order_id: args.envelope.transaction_id } : {}),
    ...(contentIds ? { content_ids: contentIds, content_type: 'product' } : {}),
    ...(args.envelope.items?.length ? { contents: [...args.envelope.items] } : {}),
    ...(args.envelope.items?.length ? { num_items: args.envelope.items.length } : {}),
  };

  return {
    event_name: eventName,
    event_time: resolveEventTime(
      args.config.resolveEventTime?.(args.envelope) ??
        readPropertyString(properties, ['event_time', 'eventTime', 'occurred_at', 'occurredAt']),
    ),
    event_id: args.envelope.event_id,
    action_source: args.config.actionSource ?? 'website',
    ...(resolveEventSourceUrl(args.envelope, args.config, properties)
      ? { event_source_url: resolveEventSourceUrl(args.envelope, args.config, properties) }
      : {}),
    user_data: userData,
    ...(Object.keys(customData).length ? { custom_data: customData } : {}),
  };
}
