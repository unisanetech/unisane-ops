import { isIP } from 'node:net';
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
  throw new Error('Meta conversion requires a recorded occurrence time.');
}

function resolveEventSourceUrl(
  envelope: WebConversionEnvelope,
  config: Pick<MetaCapiWebConversionTransportConfig, 'eventSourceUrl'>,
  properties: Record<string, unknown> | undefined,
): string | undefined {
  if (envelope.customer?.sourceUrl) return envelope.customer.sourceUrl;
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

  const customer = envelope.customer;
  const result: MetaCapiUserData = {};
  const hashes = {
    em: customer?.hashedEmail ?? hashedEmail,
    ph: customer?.hashedPhone ?? hashedPhoneNumber,
    fn: customer?.hashedFirstName,
    ln: customer?.hashedLastName,
    ct: customer?.hashedCity,
    st: customer?.hashedRegion,
    zp: customer?.hashedPostalCode,
    country: customer?.hashedCountry,
    external_id:
      customer?.hashedExternalId ??
      (envelope.user_id ? hashMetaCapiExternalId(envelope.user_id) : undefined),
  };
  for (const [key, value] of Object.entries(hashes)) {
    if (!value) continue;
    if (!/^[a-f0-9]{64}$/i.test(value)) throw new Error(`Meta CAPI ${key} must be SHA-256 hashed.`);
    result[key as keyof typeof hashes] = [value.toLowerCase()];
  }
  const ip = customer?.clientIpAddress ?? clientIpAddress;
  if (ip) {
    if (!isIP(ip)) throw new Error('Meta CAPI client IP is invalid.');
    result.client_ip_address = ip;
  }
  const agent = customer?.clientUserAgent ?? clientUserAgent;
  if (agent) result.client_user_agent = agent;
  for (const [key, value] of [
    ['fbp', customer?.fbp ?? fbp],
    ['fbc', customer?.fbc ?? fbc],
  ] as const) {
    if (!value) continue;
    if (!/^fb\.\d+\.\d+\.[A-Za-z0-9_-]+$/.test(value) || value.length > 512) {
      throw new Error(`Meta CAPI ${key} is invalid.`);
    }
    result[key] = value;
  }
  return result;
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

function resolveContents(items: readonly Record<string, unknown>[] | undefined) {
  if (!items?.length) return undefined;
  return items.map((item) => {
    const id = item.item_id;
    const quantity = item.quantity ?? 1;
    if (
      typeof id !== 'string' ||
      !id.trim() ||
      typeof quantity !== 'number' ||
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      throw new Error('Meta CAPI items require a catalog item_id and positive integer quantity.');
    }
    if (
      item.price !== undefined &&
      (typeof item.price !== 'number' || !Number.isFinite(item.price) || item.price < 0)
    ) {
      throw new Error('Meta CAPI item price is invalid.');
    }
    return { id, quantity, ...(item.price !== undefined ? { item_price: item.price } : {}) };
  });
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
  if (args.envelope.consent?.advertising !== 'granted') return null;
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

  const contents = resolveContents(args.envelope.items);
  const contentIds = contents?.map((item) => item.id);
  const customData = {
    ...(typeof args.envelope.value === 'number' ? { value: args.envelope.value } : {}),
    ...(args.envelope.currency ? { currency: args.envelope.currency } : {}),
    ...(args.envelope.transaction_id ? { order_id: args.envelope.transaction_id } : {}),
    ...(contentIds ? { content_ids: contentIds, content_type: 'product' } : {}),
    ...(contents ? { contents } : {}),
    ...(contents ? { num_items: contents.reduce((total, item) => total + item.quantity, 0) } : {}),
  };

  const sourceUrl = resolveEventSourceUrl(args.envelope, args.config, properties);
  if ((args.config.actionSource ?? 'website') === 'website') {
    if (!sourceUrl) throw new Error('Website conversions require a source URL.');
    const url = new URL(sourceUrl);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password)
      throw new Error('Conversion source URL is invalid.');
  }
  return {
    event_name: eventName,
    event_time: resolveEventTime(
      args.envelope.occurred_at ??
        args.config.resolveEventTime?.(args.envelope) ??
        readPropertyString(properties, ['event_time', 'eventTime', 'occurred_at', 'occurredAt']),
    ),
    event_id: args.envelope.event_id,
    action_source: args.config.actionSource ?? 'website',
    ...(sourceUrl ? { event_source_url: sourceUrl } : {}),
    user_data: userData,
    ...(Object.keys(customData).length ? { custom_data: customData } : {}),
  };
}
