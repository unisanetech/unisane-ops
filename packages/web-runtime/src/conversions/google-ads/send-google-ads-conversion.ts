import { describeGoogleAdsConversion } from './evidence';
import { WebConversionDeliveryError } from '../delivery/error';
import type { WebConversionEnvelope, WebConversionTransport, WebConversionReceipt } from '../types';
import { mapWebConversionEnvelopeToGoogleAdsClickConversion } from './google-ads-payload';
import { uploadGoogleAdsClickConversions } from './google-ads-http-client';
import type { GoogleAdsWebConversionTransportConfig } from './types';

export async function sendGoogleAdsWebConversion(args: {
  config: GoogleAdsWebConversionTransportConfig;
  envelope: WebConversionEnvelope;
  signal?: AbortSignal;
}): Promise<WebConversionReceipt> {
  let conversion: ReturnType<typeof mapWebConversionEnvelopeToGoogleAdsClickConversion>;
  try {
    conversion = mapWebConversionEnvelopeToGoogleAdsClickConversion({
      envelope: args.envelope,
      config: args.config,
    });
  } catch {
    throw new WebConversionDeliveryError(
      'google_ads_payload_invalid',
      'permanent',
      'Conversion payload or destination mapping is invalid.',
    );
  }
  if (!conversion)
    return { status: 'skipped', provider: 'google-ads', reason: 'consent_or_mapping_unavailable' };

  const evidence = describeGoogleAdsConversion(conversion);
  const response = await uploadGoogleAdsClickConversions({
    signal: args.signal,
    config: args.config,
    request: {
      conversions: [conversion],
      partialFailure: args.config.partialFailure ?? true,
      ...(typeof args.config.validateOnly === 'boolean'
        ? { validateOnly: args.config.validateOnly }
        : {}),
      ...(typeof args.config.debugEnabled === 'boolean'
        ? { debugEnabled: args.config.debugEnabled }
        : {}),
    },
  }).catch((error: unknown) => {
    if (error instanceof WebConversionDeliveryError) error.evidence = evidence;
    throw error;
  });
  return args.config.validateOnly
    ? { status: 'skipped', provider: 'google-ads', reason: 'validation_only', evidence }
    : {
        status: 'accepted',
        provider: 'google-ads',
        acceptedCount: response.results?.length,
        evidence,
      };
}

export function createGoogleAdsWebConversionTransport(
  config: GoogleAdsWebConversionTransportConfig,
): WebConversionTransport {
  return {
    destination: {
      provider: 'google-ads',
      destinationId: config.customerId.replace(/-/g, '').trim(),
    },
    async send(envelope, context) {
      return sendGoogleAdsWebConversion({
        signal: context?.signal,
        config,
        envelope,
      });
    },
  };
}
