import type { WebConversionEvidence, WebConversionReceipt, WebConversionTransport } from '../types';
import { WebConversionDeliveryError } from './error';
import {
  createWebConversionDeliveryKey,
  webConversionDeliverySchema,
  type WebConversionDelivery,
  type WebConversionDeliveryBinding,
} from './contract';

export type WebConversionDeliveryReceipt = {
  deliveryKey: string;
  binding: WebConversionDeliveryBinding;
  eventId: string;
  eventName: string;
  occurredAt: string;
  recordedAt: string;
  startedAt: string;
  durationMs: number;
  attempt: number;
  evidence?: WebConversionEvidence;
  attemptId: string;
  outcome: 'accepted' | 'suppressed' | 'rejected' | 'unknown';
  code?: string;
  providerReference?: string;
  acceptedCount?: number;
  advertising: 'granted' | 'denied' | 'unknown';
  analytics?: 'granted' | 'denied' | 'unknown';
  consentPurpose?: 'analytics' | 'advertising';
};

export type WebConversionDeliveryContext = { attempt: number; signal?: AbortSignal };

export function createConversionDeliverySubscriber(args: {
  binding: WebConversionDeliveryBinding;
  transport: WebConversionTransport;
  /** Resolve current permissions/withdrawal using host data; do not infer permission from identifier presence. */
  isDeliveryAllowed: (delivery: WebConversionDelivery) => boolean | Promise<boolean>;
  recordReceipt: (receipt: WebConversionDeliveryReceipt) => Promise<void>;
  maxEventAgeMs?: number;
  now?: () => Date;
  createAttemptId?: () => string;
}) {
  const now = args.now ?? (() => new Date());
  return async (input: unknown, context: WebConversionDeliveryContext): Promise<void> => {
    if (!Number.isInteger(context?.attempt) || context.attempt < 1 || context.attempt > 10000) {
      throw new WebConversionDeliveryError(
        'conversion_attempt_missing',
        'permanent',
        'Pass the durable worker attempt number to the conversion subscriber.',
      );
    }
    const started = now();
    const delivery = webConversionDeliverySchema.parse(input);
    if (
      Object.keys(args.binding).some(
        (key) =>
          args.binding[key as keyof WebConversionDeliveryBinding] !==
          delivery.binding[key as keyof WebConversionDeliveryBinding],
      )
    ) {
      throw new WebConversionDeliveryError(
        'conversion_binding_mismatch',
        'permanent',
        'Conversion destination binding does not match this subscriber.',
      );
    }
    if (
      args.transport.destination?.provider !== args.binding.provider ||
      args.transport.destination.destinationId !== args.binding.destinationId
    ) {
      throw new WebConversionDeliveryError(
        'conversion_transport_binding_mismatch',
        'permanent',
        'Transport is not bound to the requested provider destination.',
      );
    }
    const consentPurpose = args.transport.consentPurpose ?? 'advertising';
    const base = {
      consentPurpose,
      analytics: delivery.envelope.consent.analytics,
      deliveryKey: createWebConversionDeliveryKey(delivery),
      binding: delivery.binding,
      eventId: delivery.envelope.event_id,
      eventName: delivery.envelope.event,
      occurredAt: delivery.envelope.occurred_at,
      attempt: context.attempt,
      startedAt: started.toISOString(),
      attemptId: args.createAttemptId?.() ?? globalThis.crypto.randomUUID(),
      advertising: delivery.envelope.consent.advertising,
    };
    let receipt: WebConversionDeliveryReceipt;
    let failure: WebConversionDeliveryError | undefined;
    try {
      const age = now().getTime() - Date.parse(delivery.envelope.occurred_at);
      if (args.maxEventAgeMs !== undefined && age > args.maxEventAgeMs) {
        throw new WebConversionDeliveryError(
          'conversion_too_old',
          'permanent',
          'Conversion exceeds the configured destination delivery window.',
        );
      }
      if (age < -60000)
        throw new WebConversionDeliveryError(
          'conversion_time_invalid',
          'permanent',
          'Conversion occurrence time is in the future.',
        );
      let result: WebConversionReceipt | void;
      if (
        delivery.envelope.consent[consentPurpose] !== 'granted' ||
        !(await args.isDeliveryAllowed(delivery))
      ) {
        result = {
          status: 'skipped',
          provider: args.binding.provider,
          reason: `${consentPurpose}_not_permitted`,
        };
      } else {
        result = await args.transport.send(delivery.envelope, context);
        if (!result)
          throw new WebConversionDeliveryError(
            'conversion_receipt_missing',
            'uncertain',
            'Transport did not return a delivery receipt.',
          );
        if (result.provider !== args.binding.provider)
          throw new WebConversionDeliveryError(
            'conversion_receipt_provider_mismatch',
            'uncertain',
            'Transport returned a receipt for a different provider.',
          );
      }
      receipt = {
        ...base,
        recordedAt: now().toISOString(),
        durationMs: Math.max(0, now().getTime() - started.getTime()),
        outcome: result.status === 'accepted' ? 'accepted' : 'suppressed',
        advertising:
          result.reason === 'advertising_not_permitted' && base.advertising === 'granted'
            ? 'denied'
            : base.advertising,
        analytics: result.reason === 'analytics_not_permitted' ? 'denied' : base.analytics,
        code: result.reason,
        acceptedCount: result.acceptedCount,
        evidence: result.evidence,
        providerReference: result.providerReference,
      };
    } catch (error) {
      failure =
        error instanceof WebConversionDeliveryError
          ? error
          : new WebConversionDeliveryError(
              'conversion_delivery_unconfirmed',
              'uncertain',
              'Conversion delivery could not be confirmed.',
            );
      receipt = {
        ...base,
        recordedAt: now().toISOString(),
        durationMs: Math.max(0, now().getTime() - started.getTime()),
        outcome: failure.kind === 'permanent' ? 'rejected' : 'unknown',
        code: failure.code,
        evidence: failure.evidence,
      };
    }
    // Persist evidence before acknowledging the outbox. A crash here retries the same event ID.
    await args.recordReceipt(receipt);
    if (failure && failure.kind !== 'permanent') throw failure;
  };
}
