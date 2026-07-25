import type { WebConversionEnvelope } from '../types';
import {
  resolveGoogleAdsConversionActionResourceName,
  normalizeGoogleAdsConversionActionConfig,
} from './config';
import type {
  GoogleAdsClickConversion,
  GoogleAdsConversionActionMap,
  GoogleAdsUnmappedEventBehavior,
  GoogleAdsWebConversionTransportConfig,
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

function readPropertyConsent(
  properties: Record<string, unknown> | undefined,
  keys: readonly string[],
): 'GRANTED' | 'DENIED' | 'UNSPECIFIED' | undefined {
  const value = readPropertyString(properties, keys)?.toUpperCase();
  if (value === 'GRANTED' || value === 'DENIED' || value === 'UNSPECIFIED') {
    return value;
  }
  return undefined;
}

function readGoogleAdsConversionAction(args: {
  event: string;
  conversionActions: GoogleAdsConversionActionMap;
  behavior: GoogleAdsUnmappedEventBehavior;
}): GoogleAdsConversionActionMap[string] | null {
  const action = args.conversionActions[args.event];
  if (action) return action;
  if (args.behavior === 'skip') return null;
  throw new Error(`Google Ads conversion action is not mapped for event "${args.event}".`);
}

function formatGoogleAdsDateTime(value: Date | string): string {
  if (typeof value === 'string') {
    const normalized = value.trim();
    if (!normalized) {
      throw new Error('Google Ads conversion date time must not be empty.');
    }
    return normalized;
  }

  const iso = value.toISOString();
  return `${iso.slice(0, 10)} ${iso.slice(11, 19)}+00:00`;
}

function hasGoogleAdsAttribution(conversion: GoogleAdsClickConversion): boolean {
  return Boolean(
    conversion.gclid ||
    conversion.gbraid ||
    conversion.wbraid ||
    (conversion.userIdentifiers && conversion.userIdentifiers.length > 0),
  );
}

function resolveUserIdentifiers(
  properties: Record<string, unknown> | undefined,
): GoogleAdsClickConversion['userIdentifiers'] {
  const hashedEmail = readPropertyString(properties, ['hashed_email', 'hashedEmail']);
  const hashedPhoneNumber = readPropertyString(properties, [
    'hashed_phone_number',
    'hashedPhoneNumber',
  ]);
  const identifiers = [
    ...(hashedEmail ? [{ hashedEmail }] : []),
    ...(hashedPhoneNumber ? [{ hashedPhoneNumber }] : []),
  ];
  return identifiers.length ? identifiers.slice(0, 5) : undefined;
}

export function mapWebConversionEnvelopeToGoogleAdsClickConversion(args: {
  envelope: WebConversionEnvelope;
  config: Pick<
    GoogleAdsWebConversionTransportConfig,
    | 'customerId'
    | 'conversionActions'
    | 'conversionEnvironment'
    | 'adUserDataConsent'
    | 'adPersonalizationConsent'
    | 'resolveConversionDateTime'
    | 'missingAttributionBehavior'
    | 'unmappedEventBehavior'
  >;
  now?: () => Date;
}): GoogleAdsClickConversion | null {
  const properties = args.envelope.properties as Record<string, unknown> | undefined;
  const action = readGoogleAdsConversionAction({
    event: args.envelope.event,
    conversionActions: args.config.conversionActions,
    behavior: args.config.unmappedEventBehavior ?? 'throw',
  });
  if (!action) return null;

  const actionConfig = normalizeGoogleAdsConversionActionConfig(action);
  const conversionDateTime = formatGoogleAdsDateTime(
    args.config.resolveConversionDateTime?.(args.envelope) ??
      readPropertyString(properties, [
        'conversion_date_time',
        'conversionDateTime',
        'occurred_at',
        'occurredAt',
      ]) ??
      args.now?.() ??
      new Date(),
  );
  const conversionValue = args.envelope.value ?? actionConfig.defaultValue;
  const currencyCode = args.envelope.currency ?? actionConfig.defaultCurrency;
  const adUserData = readPropertyConsent(properties, ['ad_user_data_consent', 'adUserDataConsent']);
  const adPersonalization = readPropertyConsent(properties, [
    'ad_personalization_consent',
    'adPersonalizationConsent',
  ]);
  const gclid = readPropertyString(properties, ['gclid']);
  const gbraid = readPropertyString(properties, ['gbraid']);
  const wbraid = readPropertyString(properties, ['wbraid']);
  const userIdentifiers = resolveUserIdentifiers(properties);
  const consent = {
    ...((adUserData ?? args.config.adUserDataConsent)
      ? { adUserData: adUserData ?? args.config.adUserDataConsent }
      : {}),
    ...((adPersonalization ?? args.config.adPersonalizationConsent)
      ? { adPersonalization: adPersonalization ?? args.config.adPersonalizationConsent }
      : {}),
  };

  const conversion: GoogleAdsClickConversion = {
    conversionAction: resolveGoogleAdsConversionActionResourceName({
      customerId: args.config.customerId,
      action: actionConfig,
    }),
    conversionDateTime,
    ...(typeof conversionValue === 'number' ? { conversionValue } : {}),
    ...(currencyCode ? { currencyCode } : {}),
    ...(args.envelope.transaction_id ? { orderId: args.envelope.transaction_id } : {}),
    ...(args.config.conversionEnvironment
      ? { conversionEnvironment: args.config.conversionEnvironment }
      : {}),
    ...(Object.keys(consent).length ? { consent } : {}),
    ...(gclid ? { gclid } : {}),
    ...(gbraid ? { gbraid } : {}),
    ...(wbraid ? { wbraid } : {}),
    ...(userIdentifiers ? { userIdentifiers } : {}),
  };

  if (!hasGoogleAdsAttribution(conversion)) {
    if ((args.config.missingAttributionBehavior ?? 'throw') === 'skip') {
      return null;
    }
    throw new Error(
      `Google Ads conversion "${args.envelope.event}" requires gclid, gbraid, wbraid, or userIdentifiers.`,
    );
  }

  return conversion;
}
