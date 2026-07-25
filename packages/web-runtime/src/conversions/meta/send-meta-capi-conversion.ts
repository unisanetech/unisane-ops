import type { WebConversionEnvelope, WebConversionTransport } from '../types';
import { mapWebConversionEnvelopeToMetaCapiEvent } from './meta-capi-payload';
import { uploadMetaCapiEvents } from './meta-capi-http-client';
import type { MetaCapiWebConversionTransportConfig } from './types';

export async function sendMetaCapiWebConversion(args: {
  config: MetaCapiWebConversionTransportConfig;
  envelope: WebConversionEnvelope;
}): Promise<void> {
  const event = mapWebConversionEnvelopeToMetaCapiEvent({
    envelope: args.envelope,
    config: args.config,
  });
  if (!event) return;

  await uploadMetaCapiEvents({
    config: args.config,
    request: {
      data: [event],
      ...(args.config.testEventCode ? { test_event_code: args.config.testEventCode } : {}),
      ...(args.config.partnerAgent ? { partner_agent: args.config.partnerAgent } : {}),
      ...(args.config.dataProcessingOptions?.length
        ? { data_processing_options: args.config.dataProcessingOptions }
        : {}),
      ...(typeof args.config.dataProcessingOptionsCountry === 'number'
        ? { data_processing_options_country: args.config.dataProcessingOptionsCountry }
        : {}),
      ...(typeof args.config.dataProcessingOptionsState === 'number'
        ? { data_processing_options_state: args.config.dataProcessingOptionsState }
        : {}),
    },
  });
}

export function createMetaCapiWebConversionTransport(
  config: MetaCapiWebConversionTransportConfig,
): WebConversionTransport {
  return {
    async send(envelope) {
      await sendMetaCapiWebConversion({ config, envelope });
    },
  };
}
