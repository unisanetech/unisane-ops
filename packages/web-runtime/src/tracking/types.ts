export type WebTrackingScalar = string | number | boolean | null;
export type WebTrackingValue = WebTrackingScalar | readonly WebTrackingScalar[];
export type WebTrackingParams = Record<string, WebTrackingValue | undefined>;

export type WebTrackingConsentValue = 'granted' | 'denied';
export type WebTrackingConsentMode = 'default' | 'update';

export type WebTrackingConsentState = {
  adStorage: WebTrackingConsentValue;
  adUserData: WebTrackingConsentValue;
  adPersonalization: WebTrackingConsentValue;
  analyticsStorage: WebTrackingConsentValue;
  functionalityStorage: WebTrackingConsentValue;
  personalizationStorage: WebTrackingConsentValue;
  securityStorage: WebTrackingConsentValue;
};

export type WebTrackingAttributionState = {
  fbc?: string;
  fbp?: string;
  gclid?: string;
  gbraid?: string;
  wbraid?: string;
  msclkid?: string;
  ttclid?: string;
};

export type WebTrackingItem = Record<string, WebTrackingValue | undefined> & {
  itemId?: string;
  itemName?: string;
  itemCategory?: string;
  itemBrand?: string;
  itemVariant?: string;
  affiliation?: string;
  coupon?: string;
  discount?: number;
  index?: number;
  price?: number;
  quantity?: number;
};

export type WebTrackingEventInput = {
  name: string;
  eventId?: string;
  transactionId?: string;
  value?: number;
  currency?: string;
  items?: readonly WebTrackingItem[];
  params?: WebTrackingParams;
  dedupe?:
    | false
    | {
        key?: string;
        ttlMs?: number;
      };
};

export type WebTrackingPageViewInput = {
  eventId?: string;
  pageTitle?: string;
  pagePath?: string;
  pageLocation?: string;
  params?: WebTrackingParams;
};

export type WebTrackingGtmConfig = {
  containerId: string;
  dataLayerName?: string;
  auth?: string;
  preview?: string;
};

export type WebTrackingConfig = {
  appId: string;
  enabled: boolean;
  debug?: boolean;
  autoPageViews?: boolean;
  pageContext?: { includeQuery?: boolean; includeTitle?: boolean };
  defaultContext?: WebTrackingParams;
  gtm?: WebTrackingGtmConfig;
  consent?: {
    defaultState?: Partial<WebTrackingConsentState>;
  };
  dedupe?: {
    eventWindowMs?: number;
    pageViewWindowMs?: number;
  };
  attribution?: {
    enabled?: boolean;
    includeInPayload?: boolean;
    cookieDomain?: string;
    cookiePath?: string;
    cookieMaxAgeDays?: number;
  };
};

export type ResolvedWebTrackingConfig = {
  appId: string;
  enabled: boolean;
  debug: boolean;
  autoPageViews: boolean;
  pageContext?: { includeQuery?: boolean; includeTitle?: boolean };
  defaultContext: WebTrackingParams;
  gtm?: WebTrackingGtmConfig;
  consent: {
    defaultState: WebTrackingConsentState;
  };
  dedupe: {
    eventWindowMs: number;
    pageViewWindowMs: number;
  };
  attribution: {
    enabled: boolean;
    includeInPayload: boolean;
    cookieDomain?: string;
    cookiePath: string;
    cookieMaxAgeDays: number;
  };
};

export type WebTrackingPayload = Record<string, unknown> & {
  event: string;
};

export type WebTrackingTransport = {
  push: (payload: WebTrackingPayload) => void;
  setConsent?: (mode: WebTrackingConsentMode, state: WebTrackingConsentState) => void;
};

export type WebTrackingAttributionStore = {
  read: () => WebTrackingAttributionState;
  write: (state: WebTrackingAttributionState) => void;
  clear: () => void;
};

export type WebTrackingClient = {
  isEnabled: () => boolean;
  track: (input: WebTrackingEventInput) => void;
  trackPageView: (input?: WebTrackingPageViewInput) => void;
  setConsent: (
    update: Partial<WebTrackingConsentState>,
    mode?: WebTrackingConsentMode,
  ) => WebTrackingConsentState;
  getConsent: () => WebTrackingConsentState;
  captureAttribution: (search?: string) => WebTrackingAttributionState;
  getAttribution: () => WebTrackingAttributionState;
};
