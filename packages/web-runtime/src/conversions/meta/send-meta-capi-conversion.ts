import { describeMetaConversion } from './evidence';
import { WebConversionDeliveryError } from '../delivery/error';
import type {
  WebConversionEnvelope,
  WebConversionTransport,
  WebConversionReceipt,
  WebConversionSendContext,
} from '../types';
import { mapWebConversionEnvelopeToMetaCapiEvent } from './meta-capi-payload';
import { uploadMetaCapiEvents } from './meta-capi-http-client';
import type { MetaCapiWebConversionTransportConfig } from './types';

export async function sendMetaCapiWebConversion(args: {
  config: MetaCapiWebConversionTransportConfig;
  envelope: WebConversionEnvelope;
  signal?: AbortSignal;
}): Promise<WebConversionReceipt> {
  let event: ReturnType<typeof mapWebConversionEnvelopeToMetaCapiEvent>;
  try {
    event = mapWebConversionEnvelopeToMetaCapiEvent({
      envelope: args.envelope,
      config: args.config,
    });
  } catch {
    throw new WebConversionDeliveryError(
      'meta_payload_invalid',
      'permanent',
      'Conversion payload or destination mapping is invalid.',
    );
  }
  if (!event)
    return { status: 'skipped', provider: 'meta', reason: 'consent_or_mapping_unavailable' };

  const evidence = describeMetaConversion(event);
  const response = await uploadMetaCapiEvents({
    signal: args.signal,
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
  }).catch((error: unknown) => {
    if (error instanceof WebConversionDeliveryError) error.evidence = evidence;
    throw error;
  });
  return {
    evidence,
    status: 'accepted',
    provider: 'meta',
    acceptedCount: response.events_received,
    providerReference: response.fbtrace_id,
  };
}

export function createMetaCapiWebConversionTransport(
  config: MetaCapiWebConversionTransportConfig,
): WebConversionTransport {
  return {
    destination: { provider: 'meta', destinationId: config.pixelId.trim() },
    async send(envelope, context?: WebConversionSendContext) {
      return sendMetaCapiWebConversion({
        signal: context?.signal,
        config,
        envelope,
      });
    },
  };
}
