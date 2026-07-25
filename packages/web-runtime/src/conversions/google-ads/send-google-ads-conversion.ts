import type { WebConversionEnvelope, WebConversionTransport } from '../types';
import { mapWebConversionEnvelopeToGoogleAdsClickConversion } from './google-ads-payload';
import { uploadGoogleAdsClickConversions } from './google-ads-http-client';
import type { GoogleAdsWebConversionTransportConfig } from './types';

export async function sendGoogleAdsWebConversion(args: {
  config: GoogleAdsWebConversionTransportConfig;
  envelope: WebConversionEnvelope;
}): Promise<void> {
  const conversion = mapWebConversionEnvelopeToGoogleAdsClickConversion({
    envelope: args.envelope,
    config: args.config,
  });
  if (!conversion) return;

  await uploadGoogleAdsClickConversions({
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
  });
}

export function createGoogleAdsWebConversionTransport(
  config: GoogleAdsWebConversionTransportConfig,
): WebConversionTransport {
  return {
    async send(envelope) {
      await sendGoogleAdsWebConversion({ config, envelope });
    },
  };
}
