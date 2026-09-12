import type { WebConversionDeliveryReceipt } from '../conversions/delivery/subscriber';
import type { TrackingObservationAdapter } from './adapter';

/** Reuse the existing hashed observation contract consumed by Growth ingestion. */
export function createConversionReceiptObservationRecorder(adapter: TrackingObservationAdapter) {
  return async (receipt: WebConversionDeliveryReceipt): Promise<void> => {
    await adapter.record({
      observationId: JSON.stringify([receipt.deliveryKey, receipt.attemptId]),
      logicalEventId: JSON.stringify([
        receipt.binding.projectId,
        receipt.binding.environment,
        receipt.binding.appId,
        receipt.binding.scopeId,
        receipt.eventName,
        receipt.eventId,
      ]),
      eventId: receipt.eventId,
      eventName: receipt.eventName,
      occurredAt: receipt.occurredAt,
      outcome: receipt.outcome,
      attempt: receipt.attempt,
      receivedAt: receipt.recordedAt,
      ...receipt.evidence,
      diagnostics: {
        ...(receipt.durationMs <= 300000 ? { latencyMs: receipt.durationMs } : {}),
        ...(receipt.code ? { messageCode: receipt.code } : {}),
      },
      consent: {
        state: receipt.consentPurpose === 'analytics' ? (receipt.analytics ?? 'unknown') : receipt.advertising,
        categories: [receipt.consentPurpose === 'analytics' ? 'analytics' : 'ads'],
        ...(receipt.outcome === 'suppressed'
          ? { suppressionReasonCode: receipt.code ?? 'conversion_suppressed' }
          : {}),
      },
      ...(receipt.providerReference
        ? {
            providerReference: {
              provider: receipt.binding.provider,
              resourceType: 'conversion-receipt',
              resourceId: receipt.providerReference,
            },
          }
        : {}),
    });
  };
}
