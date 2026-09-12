import type { MarketingTrackingObservation } from '../contracts/tracking-observation';

export type WebConversionScalar = string | number | boolean | null;
export type WebConversionValue = WebConversionScalar | readonly WebConversionScalar[];
export type WebConversionParams = Record<string, WebConversionValue | undefined>;
export type WebConversionEventMap = Record<string, WebConversionParams | undefined>;

export type WebConversionItem = Record<string, WebConversionValue | undefined> & {
  itemId?: string;
  itemName?: string;
  itemBrand?: string;
  itemCategory?: string;
  itemVariant?: string;
  affiliation?: string;
  coupon?: string;
  discount?: number;
  index?: number;
  price?: number;
  quantity?: number;
};

type WebConversionEventName<TMap extends WebConversionEventMap> =
  Extract<keyof TMap, string> extends never ? string : Extract<keyof TMap, string>;

type WebConversionEventProperties<
  TMap extends WebConversionEventMap,
  TName extends string,
> = TName extends keyof TMap
  ? TMap[TName] extends WebConversionParams
    ? TMap[TName]
    : WebConversionParams
  : WebConversionParams;

export type WebConversionEventInput<
  TMap extends WebConversionEventMap = WebConversionEventMap,
  TName extends string = WebConversionEventName<TMap>,
> = {
  name: TName;
  scopeId: string;
  userId?: string;
  eventId?: string;
  occurredAt?: string;
  consent?: WebConversionConsent;
  customer?: WebConversionCustomer;
  analytics?: WebConversionAnalyticsContext;
  transactionId?: string;
  value?: number;
  currency?: string;
  items?: readonly WebConversionItem[];
  properties?: WebConversionEventProperties<TMap, TName>;
};

export type WebConversionConfig = {
  appId: string;
  debug?: boolean;
  defaultCurrency?: string;
  defaultProperties?: WebConversionParams;
  transactionIdRequiredEvents?: readonly string[];
};

export type ResolvedWebConversionConfig = {
  appId: string;
  debug: boolean;
  defaultCurrency?: string;
  defaultProperties: Record<string, WebConversionValue>;
  transactionIdRequiredEvents: readonly string[];
};

/** Hashes must be normalized for the bound destination. Meta and Google phone hashes differ. */
export type WebConversionCustomer = {
  hashedEmail?: string;
  hashedPhone?: string;
  hashedFirstName?: string;
  hashedLastName?: string;
  hashedCity?: string;
  hashedRegion?: string;
  hashedPostalCode?: string;
  hashedCountry?: string;
  hashedExternalId?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
  fbp?: string;
  fbc?: string;
  sourceUrl?: string;
};
export type WebConversionAnalyticsContext = {
  clientId: string;
  sessionId?: string;
  capturedAt: string;
};
export type WebConversionConsent = {
  analytics?: 'granted' | 'denied' | 'unknown';
  advertising: 'granted' | 'denied' | 'unknown';
  capturedAt: string;
};
/** Evidence describes the mapped provider request; it never contains matching values. */
export type WebConversionEvidence = Pick<
  MarketingTrackingObservation,
  'customerFields' | 'transportFields' | 'commerce' | 'parameterEvidence'
>;
export type WebConversionReceipt = {
  evidence?: WebConversionEvidence;
  status: 'accepted' | 'skipped';
  provider: string;
  acceptedCount?: number;
  providerReference?: string;
  reason?: string;
};
export type WebConversionSendContext = { signal?: AbortSignal };

export type WebConversionEnvelope = {
  schema_version?: 2;
  occurred_at?: string;
  consent?: WebConversionConsent;
  customer?: WebConversionCustomer;
  analytics?: WebConversionAnalyticsContext;
  event: string;
  app_id: string;
  scope_id: string;
  event_id: string;
  user_id?: string;
  transaction_id?: string;
  value?: number;
  currency?: string;
  items?: readonly Record<string, unknown>[];
  properties?: Record<string, WebConversionValue>;
};

export type WebConversionTransport = {
  consentPurpose?: 'analytics' | 'advertising';
  destination?: { provider: string; destinationId: string };
  send: (
    envelope: WebConversionEnvelope,
    context?: WebConversionSendContext,
  ) => Promise<WebConversionReceipt | void> | WebConversionReceipt | void;
};

export type WebConversionClient<TMap extends WebConversionEventMap = WebConversionEventMap> = {
  normalize: (input: WebConversionEventInput<TMap>) => WebConversionEnvelope;
  send: (input: WebConversionEventInput<TMap>) => Promise<WebConversionEnvelope>;
};
