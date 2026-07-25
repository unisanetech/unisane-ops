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

export type WebConversionEnvelope = {
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
  send: (envelope: WebConversionEnvelope) => Promise<void> | void;
};

export type WebConversionClient<TMap extends WebConversionEventMap = WebConversionEventMap> = {
  normalize: (input: WebConversionEventInput<TMap>) => WebConversionEnvelope;
  send: (input: WebConversionEventInput<TMap>) => Promise<WebConversionEnvelope>;
};
