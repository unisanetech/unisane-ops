import {
  isTransactionIdRequiredForWebConversionEvent,
  normalizeWebConversionEventName,
} from './conversion-event-map';
import { createWebConversionEventId, normalizeWebConversionEventId } from './event-id';
import { normalizeWebConversionItems } from './item-normalization';
import { normalizeParamsToSnakeCase } from './snake-case';
import { normalizeWebConversionTransactionId } from './transaction-id';
import type {
  ResolvedWebConversionConfig,
  WebConversionEnvelope,
  WebConversionEventInput,
  WebConversionEventMap,
  WebConversionParams,
  WebConversionValue,
} from './types';
import { normalizeWebConversionCurrency, normalizeWebConversionValue } from './value-normalization';

function normalizeRequiredString(value: string, fieldName: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`Web conversion ${fieldName} is required.`);
  }

  return normalized;
}

function normalizeOptionalString(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function normalizeWebConversionProperties(args: {
  defaultProperties: Record<string, WebConversionValue>;
  properties: WebConversionParams | undefined;
}): Record<string, WebConversionValue> | undefined {
  const properties = {
    ...args.defaultProperties,
    ...normalizeParamsToSnakeCase(args.properties),
  };

  return Object.keys(properties).length ? properties : undefined;
}

export function normalizeWebConversionEnvelope<TMap extends WebConversionEventMap>(args: {
  config: ResolvedWebConversionConfig;
  input: WebConversionEventInput<TMap>;
}): WebConversionEnvelope {
  const event = normalizeWebConversionEventName(args.input.name);
  const scopeId = normalizeRequiredString(args.input.scopeId, 'scopeId');
  const userId = normalizeOptionalString(args.input.userId);
  const transactionId = normalizeWebConversionTransactionId(args.input.transactionId);
  const eventId =
    normalizeWebConversionEventId(args.input.eventId) ??
    (transactionId
      ? `transaction:${JSON.stringify([args.config.appId, scopeId, event, transactionId])}`
      : createWebConversionEventId(args.config.appId));
  const occurredAt = args.input.occurredAt ?? new Date().toISOString();
  if (!Number.isFinite(Date.parse(occurredAt)))
    throw new Error('Web conversion occurredAt must be a valid timestamp.');
  if (args.input.consent && !Number.isFinite(Date.parse(args.input.consent.capturedAt))) {
    throw new Error('Web conversion consent capturedAt must be a valid timestamp.');
  }

  if (
    isTransactionIdRequiredForWebConversionEvent(event, args.config.transactionIdRequiredEvents) &&
    !transactionId
  ) {
    throw new Error(`Web conversion transactionId is required for "${event}".`);
  }

  const value = normalizeWebConversionValue(args.input.value);
  const currency = normalizeWebConversionCurrency({
    currency: args.input.currency,
    defaultCurrency: args.config.defaultCurrency,
    value,
  });
  const items = normalizeWebConversionItems(args.input.items);
  const properties = normalizeWebConversionProperties({
    defaultProperties: args.config.defaultProperties,
    properties: args.input.properties,
  });

  return {
    schema_version: 2,
    occurred_at: new Date(occurredAt).toISOString(),
    ...(args.input.consent ? { consent: { ...args.input.consent } } : {}),
    ...(args.input.customer ? { customer: { ...args.input.customer } } : {}),
    ...(args.input.analytics ? { analytics: { ...args.input.analytics } } : {}),
    event,
    app_id: args.config.appId,
    scope_id: scopeId,
    event_id: eventId,
    ...(userId ? { user_id: userId } : {}),
    ...(transactionId ? { transaction_id: transactionId } : {}),
    ...(value !== undefined ? { value } : {}),
    ...(currency ? { currency } : {}),
    ...(items ? { items } : {}),
    ...(properties ? { properties } : {}),
  };
}
