export { defineWebConversionConfig, resolveWebConversionConfig } from './config';
export {
  DEFAULT_TRANSACTION_REQUIRED_CONVERSION_EVENTS,
  isTransactionIdRequiredForWebConversionEvent,
  normalizeWebConversionEventName,
} from './conversion-event-map';
export { createConversionClient } from './conversion-client';
export { normalizeWebConversionEnvelope } from './conversion-envelope';
export { createWebConversionDedupeKey } from './dedupe-key';
export { createWebConversionEventId, normalizeWebConversionEventId } from './event-id';
export { normalizeWebConversionItem, normalizeWebConversionItems } from './item-normalization';
export { sendConversionEvent } from './send-conversion-event';
export {
  createWebConversionTransactionId,
  normalizeWebConversionTransactionId,
} from './transaction-id';
export { normalizeWebConversionCurrency, normalizeWebConversionValue } from './value-normalization';
export type {
  ResolvedWebConversionConfig,
  WebConversionClient,
  WebConversionConfig,
  WebConversionEnvelope,
  WebConversionEventInput,
  WebConversionEventMap,
  WebConversionItem,
  WebConversionParams,
  WebConversionScalar,
  WebConversionTransport,
  WebConversionValue,
} from './types';

export type {
  WebConversionConsent,
  WebConversionAnalyticsContext,
  WebConversionCustomer,
  WebConversionReceipt,
  WebConversionSendContext,
} from './types';
export * from './delivery/index';
