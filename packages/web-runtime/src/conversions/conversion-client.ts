import { resolveWebConversionConfig } from './config';
import { normalizeWebConversionEnvelope } from './conversion-envelope';
import { sendConversionEvent } from './send-conversion-event';
import type {
  WebConversionClient,
  WebConversionConfig,
  WebConversionEventInput,
  WebConversionEventMap,
  WebConversionTransport,
} from './types';

type CreateConversionClientArgs = {
  config: WebConversionConfig;
  transport: WebConversionTransport;
};

export function createConversionClient<TMap extends WebConversionEventMap = WebConversionEventMap>(
  args: CreateConversionClientArgs,
): WebConversionClient<TMap> {
  const config = resolveWebConversionConfig(args.config);

  return {
    normalize(input: WebConversionEventInput<TMap>) {
      return normalizeWebConversionEnvelope({
        config,
        input,
      });
    },
    async send(input: WebConversionEventInput<TMap>) {
      return sendConversionEvent({
        config,
        transport: args.transport,
        input,
      });
    },
  };
}
