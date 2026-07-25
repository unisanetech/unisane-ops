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
  const eventId =
    normalizeWebConversionEventId(args.input.eventId) ??
    createWebConversionEventId(args.config.appId);
  const transactionId = normalizeWebConversionTransactionId(args.input.transactionId);

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
