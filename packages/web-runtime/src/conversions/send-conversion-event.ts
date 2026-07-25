import { resolveWebConversionConfig } from './config';
import { normalizeWebConversionEnvelope } from './conversion-envelope';
import type {
  WebConversionConfig,
  WebConversionEnvelope,
  WebConversionEventInput,
  WebConversionEventMap,
  WebConversionTransport,
} from './types';

export async function sendConversionEvent<TMap extends WebConversionEventMap>(args: {
  config: WebConversionConfig;
  transport: WebConversionTransport;
  input: WebConversionEventInput<TMap>;
}): Promise<WebConversionEnvelope> {
  const envelope = normalizeWebConversionEnvelope({
    config: resolveWebConversionConfig(args.config),
    input: args.input,
  });

  await args.transport.send(envelope);
  return envelope;
}
