import { toSnakeCase } from './snake-case';

export const DEFAULT_TRANSACTION_REQUIRED_CONVERSION_EVENTS = Object.freeze([
  'purchase_completed',
  'subscription_activated',
  'subscription_renewed',
  'subscription_canceled',
  'refund_issued',
]);

export function normalizeWebConversionEventName(name: string): string {
  return toSnakeCase(name);
}

export function isTransactionIdRequiredForWebConversionEvent(
  name: string,
  requiredEvents: readonly string[] = DEFAULT_TRANSACTION_REQUIRED_CONVERSION_EVENTS,
): boolean {
  const normalizedName = normalizeWebConversionEventName(name);
  return requiredEvents.some(
    (eventName) => normalizeWebConversionEventName(eventName) === normalizedName,
  );
}
