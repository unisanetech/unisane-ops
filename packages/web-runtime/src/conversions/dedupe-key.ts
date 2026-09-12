import type { WebConversionEnvelope } from './types';

export function createWebConversionDedupeKey(envelope: WebConversionEnvelope): string {
  if (envelope.event_id) {
    return `event:${JSON.stringify([envelope.app_id, envelope.scope_id, envelope.event, envelope.event_id])}`;
  }

  if (envelope.transaction_id) {
    return `transaction:${envelope.app_id}:${envelope.scope_id}:${envelope.event}:${envelope.transaction_id}`;
  }

  return `scope:${envelope.app_id}:${envelope.scope_id}:${envelope.event}`;
}
