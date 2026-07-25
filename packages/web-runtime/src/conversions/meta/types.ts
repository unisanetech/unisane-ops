import type { WebConversionEnvelope, WebConversionTransport } from '../types';

export type MetaCapiActionSource =
  | 'website'
  | 'app'
  | 'phone_call'
  | 'chat'
  | 'physical_store'
  | 'system_generated'
  | 'business_messaging'
  | 'other';

export type MetaCapiMissingAttributionBehavior = 'throw' | 'skip';
export type MetaCapiUnmappedEventBehavior = 'throw' | 'skip';

export type MetaCapiAccessTokenProvider = () => Promise<string> | string;

export type MetaCapiHttpResponse = {
  ok: boolean;
  status: number;
  json?: () => Promise<unknown>;
  text?: () => Promise<string>;
};

export type MetaCapiHttpClient = (
  url: string,
  init: {
    method: 'POST';
    headers: Record<string, string>;
    body: string;
  },
) => Promise<MetaCapiHttpResponse>;

export type MetaCapiEventNameMap = Record<string, string>;

export type MetaCapiUserData = {
  em?: string[];
  ph?: string[];
  external_id?: string[];
  client_ip_address?: string;
  client_user_agent?: string;
  fbc?: string;
  fbp?: string;
};

export type MetaCapiCustomData = {
  value?: number;
  currency?: string;
  order_id?: string;
  content_ids?: string[];
  contents?: Array<Record<string, unknown>>;
  num_items?: number;
  content_type?: string;
  [key: string]: unknown;
};

export type MetaCapiEvent = {
  event_name: string;
  event_time: number;
  event_id?: string;
  action_source: MetaCapiActionSource;
  event_source_url?: string;
  user_data: MetaCapiUserData;
  custom_data?: MetaCapiCustomData;
};

export type MetaCapiEventsRequest = {
  data: MetaCapiEvent[];
  test_event_code?: string;
  partner_agent?: string;
  data_processing_options?: string[];
  data_processing_options_country?: number;
  data_processing_options_state?: number;
};

export type MetaCapiEventsResponse = {
  events_received?: number;
  messages?: unknown[];
  fbtrace_id?: string;
};

export type MetaCapiWebConversionTransportConfig = {
  pixelId: string;
  accessTokenProvider: MetaCapiAccessTokenProvider;
  eventNames: MetaCapiEventNameMap;
  apiVersion?: string;
  actionSource?: MetaCapiActionSource;
  eventSourceUrl?: string | ((envelope: WebConversionEnvelope) => string | undefined);
  testEventCode?: string;
  partnerAgent?: string;
  missingAttributionBehavior?: MetaCapiMissingAttributionBehavior;
  unmappedEventBehavior?: MetaCapiUnmappedEventBehavior;
  resolveEventTime?: (envelope: WebConversionEnvelope) => Date | number | string;
  dataProcessingOptions?: string[];
  dataProcessingOptionsCountry?: number;
  dataProcessingOptionsState?: number;
  httpClient?: MetaCapiHttpClient;
};

export type MetaCapiWebConversionTransport = WebConversionTransport;
