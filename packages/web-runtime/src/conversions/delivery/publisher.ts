import { normalizeWebConversionEnvelope } from '../conversion-envelope';
import { resolveWebConversionConfig } from '../config';
import type { WebConversionConfig, WebConversionEventInput } from '../types';
import {
  createWebConversionDeliveryKey,
  WEB_CONVERSION_DELIVERY_EVENT,
  webConversionDeliverySchema,
  type WebConversionDelivery,
  type WebConversionDeliveryBinding,
} from './contract';

/** Accepts EventRuntime.publishReliable.bind(runtime); the host retains its transaction type. */
export function createReliableConversionPublisher<TTransaction>(args: {
  config: WebConversionConfig;
  binding: WebConversionDeliveryBinding;
  publishReliable: (
    type: string,
    payload: WebConversionDelivery,
    options: {
      source: string;
      transaction: TTransaction;
      dedupeKey: string;
      idempotencyKey: string;
    },
  ) => Promise<void>;
}) {
  const config = resolveWebConversionConfig(args.config);
  return {
    async publish(
      input: WebConversionEventInput,
      options: { transaction: TTransaction },
    ): Promise<WebConversionDelivery> {
      if (!input.eventId?.trim() && !input.transactionId?.trim())
        throw new Error('Reliable conversions require a stable eventId or transactionId.');
      if (!input.occurredAt)
        throw new Error('Reliable conversions require the business occurrence time.');
      if (options.transaction == null)
        throw new Error('Reliable conversions require the business transaction.');
      const delivery = webConversionDeliverySchema.parse({
        version: 1,
        binding: args.binding,
        envelope: normalizeWebConversionEnvelope({ config, input }),
      });
      await args.publishReliable(WEB_CONVERSION_DELIVERY_EVENT, delivery, {
        source: args.config.appId,
        transaction: options.transaction,
        dedupeKey: createWebConversionDeliveryKey(delivery),
        idempotencyKey: createWebConversionDeliveryKey(delivery),
      });
      return delivery;
    },
  };
}
