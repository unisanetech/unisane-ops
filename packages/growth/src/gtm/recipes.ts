import type {
  GoogleTagManagerConsentType,
  GoogleTagManagerConsentValue,
  GoogleTagManagerParameterValue,
  GoogleTagManagerTag,
  GoogleTagManagerTrigger,
} from './contracts';

export function allPagesTrigger(
  args: {
    slug?: string;
    name?: string;
    folderSlug?: string;
  } = {},
): GoogleTagManagerTrigger {
  return {
    slug: args.slug ?? 'all_pages',
    name: args.name,
    folderSlug: args.folderSlug,
    type: 'all_pages',
  };
}

export function dataLayerEventTrigger(args: {
  slug: string;
  eventName: string;
  name?: string;
  folderSlug?: string;
}): GoogleTagManagerTrigger {
  return {
    slug: args.slug,
    name: args.name,
    folderSlug: args.folderSlug,
    type: 'data_layer_event',
    eventName: args.eventName,
  };
}

export function consentInitializationTrigger(
  args: {
    slug?: string;
    name?: string;
    folderSlug?: string;
  } = {},
): GoogleTagManagerTrigger {
  return {
    slug: args.slug ?? 'consent_initialization',
    name: args.name,
    folderSlug: args.folderSlug,
    type: 'consent_initialization',
  };
}

export function googleAnalytics4PageviewTag(args: {
  slug: string;
  measurementId: GoogleTagManagerParameterValue;
  triggerSlugs: readonly string[];
  name?: string;
  folderSlug?: string;
  requiredConsent?: readonly GoogleTagManagerConsentType[];
}): GoogleTagManagerTag {
  return {
    slug: args.slug,
    name: args.name,
    folderSlug: args.folderSlug,
    type: 'ga4_pageview',
    triggerSlugs: args.triggerSlugs,
    parameters: [{ key: 'measurementId', value: args.measurementId }],
    consent: {
      requiredConsent: args.requiredConsent ?? ['analytics_storage'],
    },
    vendorDomains: ['www.googletagmanager.com', 'www.google-analytics.com'],
  };
}

export function googleTag(args: {
  slug: string;
  tagId: GoogleTagManagerParameterValue;
  triggerSlugs: readonly string[];
  name?: string;
  folderSlug?: string;
  sendPageView?: boolean;
  requiredConsent?: readonly GoogleTagManagerConsentType[];
}): GoogleTagManagerTag {
  return {
    slug: args.slug,
    name: args.name,
    folderSlug: args.folderSlug,
    type: 'google_tag',
    triggerSlugs: args.triggerSlugs,
    parameters: [
      { key: 'tagId', value: args.tagId },
      ...(typeof args.sendPageView === 'boolean'
        ? [{ key: 'send_page_view', value: args.sendPageView ? 'true' : 'false' }]
        : []),
    ],
    consent: {
      requiredConsent: args.requiredConsent ?? ['analytics_storage'],
    },
    vendorDomains: ['www.googletagmanager.com', 'www.google-analytics.com'],
  };
}

export function googleAnalytics4EventTag(args: {
  slug: string;
  eventName: string;
  measurementId: GoogleTagManagerParameterValue;
  triggerSlugs: readonly string[];
  parameters?: readonly { key: string; value: GoogleTagManagerParameterValue }[];
  name?: string;
  folderSlug?: string;
  requiredConsent?: readonly GoogleTagManagerConsentType[];
}): GoogleTagManagerTag {
  return {
    slug: args.slug,
    name: args.name,
    folderSlug: args.folderSlug,
    type: 'ga4_event',
    triggerSlugs: args.triggerSlugs,
    parameters: [
      { key: 'eventName', value: args.eventName },
      { key: 'measurementId', value: args.measurementId },
      ...(args.parameters ?? []),
    ],
    consent: {
      requiredConsent: args.requiredConsent ?? ['analytics_storage'],
    },
    vendorDomains: ['www.googletagmanager.com', 'www.google-analytics.com'],
  };
}

export function microsoftClarityTag(args: {
  slug: string;
  projectId: GoogleTagManagerParameterValue;
  triggerSlugs: readonly string[];
  name?: string;
  folderSlug?: string;
  userId?: GoogleTagManagerParameterValue;
  sessionId?: GoogleTagManagerParameterValue;
  requiredConsent?: readonly GoogleTagManagerConsentType[];
}): GoogleTagManagerTag {
  return {
    slug: args.slug,
    name: args.name ?? 'Microsoft Clarity - Official',
    folderSlug: args.folderSlug,
    type: 'clarity',
    triggerSlugs: args.triggerSlugs,
    parameters: [
      { key: 'projectId', value: args.projectId },
      { key: 'sessionId', value: args.sessionId ?? { variable: 'analytics_session_id' } },
      { key: 'userId', value: args.userId ?? { variable: 'analytics_client_id' } },
    ],
    consent: {
      requiredConsent: args.requiredConsent ?? ['analytics_storage'],
    },
    vendorDomains: ['www.clarity.ms', 'c.clarity.ms'],
  };
}

export function googleAdsConversionLinkerTag(args: {
  slug: string;
  triggerSlugs: readonly string[];
  name?: string;
  folderSlug?: string;
  enableCrossDomain?: GoogleTagManagerParameterValue;
  linkerDomains?: GoogleTagManagerParameterValue;
}): GoogleTagManagerTag {
  return {
    slug: args.slug,
    name: args.name,
    folderSlug: args.folderSlug,
    type: 'google_ads_conversion_linker',
    triggerSlugs: args.triggerSlugs,
    parameters: [
      ...(typeof args.enableCrossDomain !== 'undefined'
        ? [{ key: 'enableCrossDomain', value: args.enableCrossDomain }]
        : []),
      ...(typeof args.linkerDomains !== 'undefined'
        ? [{ key: 'linkerDomains', value: args.linkerDomains }]
        : []),
    ],
    consent: {
      requiredConsent: ['ad_storage'],
    },
    vendorDomains: ['www.googletagmanager.com', 'www.googleadservices.com'],
  };
}

export function googleAdsConversionTag(args: {
  slug: string;
  conversionId: GoogleTagManagerParameterValue;
  conversionLabel: GoogleTagManagerParameterValue;
  triggerSlugs: readonly string[];
  value?: GoogleTagManagerParameterValue;
  currency?: GoogleTagManagerParameterValue;
  name?: string;
  folderSlug?: string;
  dedupeStrategy?: GoogleTagManagerTag['dedupeStrategy'];
  paused?: boolean;
}): GoogleTagManagerTag {
  return {
    slug: args.slug,
    name: args.name,
    folderSlug: args.folderSlug,
    type: 'google_ads_conversion',
    triggerSlugs: args.triggerSlugs,
    parameters: [
      { key: 'conversionId', value: args.conversionId },
      { key: 'conversionLabel', value: args.conversionLabel },
      ...(typeof args.value !== 'undefined' ? [{ key: 'value', value: args.value }] : []),
      ...(typeof args.currency !== 'undefined' ? [{ key: 'currency', value: args.currency }] : []),
    ],
    consent: {
      requiredConsent: ['ad_storage', 'ad_user_data', 'ad_personalization'],
    },
    vendorDomains: ['www.googletagmanager.com', 'www.googleadservices.com'],
    dedupeStrategy: args.dedupeStrategy,
    paused: args.paused,
  };
}

export function consentDefaultTag(args: {
  slug?: string;
  triggerSlugs?: readonly string[];
  defaults: Partial<Record<GoogleTagManagerConsentType, GoogleTagManagerConsentValue>>;
  name?: string;
  folderSlug?: string;
}): GoogleTagManagerTag {
  return {
    slug: args.slug ?? 'consent_defaults',
    name: args.name,
    folderSlug: args.folderSlug,
    type: 'consent_default',
    triggerSlugs: args.triggerSlugs ?? ['consent_initialization'],
    parameters: Object.entries(args.defaults).flatMap(([key, value]) =>
      value ? [{ key, value }] : [],
    ),
    consent: {
      noAdditionalConsentRequired: true,
    },
  };
}

export function metaPixelEventTag(args: {
  slug: string;
  pixelId: string;
  eventName: string;
  triggerSlugs: readonly string[];
  eventId: GoogleTagManagerParameterValue;
  value?: GoogleTagManagerParameterValue;
  currency?: GoogleTagManagerParameterValue;
}): GoogleTagManagerTag {
  return {
    slug: args.slug,
    type: 'meta_pixel',
    triggerSlugs: args.triggerSlugs,
    parameters: [
      { key: 'pixelId', value: args.pixelId },
      { key: 'eventName', value: args.eventName },
      { key: 'eventId', value: args.eventId },
      ...(args.value === undefined ? [] : [{ key: 'value', value: args.value }]),
      ...(args.currency === undefined ? [] : [{ key: 'currency', value: args.currency }]),
    ],
    consent: { requiredConsent: ['ad_storage', 'ad_user_data', 'ad_personalization'] },
    vendorDomains: ['connect.facebook.net', 'www.facebook.com'],
  };
}
