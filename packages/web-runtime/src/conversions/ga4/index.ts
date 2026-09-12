import { WebConversionDeliveryError, withConversionDeadline } from '../delivery/error';
import { parseConversionRetryAfter } from '../delivery/retry';
import type { WebConversionEnvelope, WebConversionTransport } from '../types';

export type Ga4ConversionConfig = {
  measurementId: string;
  apiSecret: () => string | Promise<string>;
  eventNames: Readonly<Record<string, string>>;
  httpClient?: typeof fetch;
  timeoutMs?: number;
  validateOnly?: boolean;
  now?: () => Date;
};

/** Only explicit, confirmed fields enter GA4. No arbitrary properties, URLs or matching data. */
export function mapGa4Conversion(config: Ga4ConversionConfig, event: WebConversionEnvelope) {
  const name = config.eventNames[event.event];
  if (!name || event.consent?.analytics !== 'granted' || !event.analytics) return null;
  const { clientId, sessionId, capturedAt } = event.analytics;
  const at = Date.parse(event.occurred_at ?? '');
  const now = (config.now?.() ?? new Date()).getTime();
  if (!/^\d{1,20}\.\d{1,20}$/.test(clientId) || !event.event_id || event.event_id.length > 100 ||
      !Number.isFinite(at) || !Number.isFinite(Date.parse(capturedAt)))
    throw new WebConversionDeliveryError('ga4_identity_invalid', 'permanent', 'GA4 requires the original event and browser analytics identity.');
  if (now - at >= 72 * 60 * 60_000 || at > now + 60_000)
    throw new WebConversionDeliveryError('ga4_event_time_invalid', 'permanent', 'GA4 event is outside its original-time delivery window.');
  if (name === 'purchase' && (!event.transaction_id || event.transaction_id.length > 100 ||
      !Number.isFinite(event.value) || event.value! <= 0 || !/^[A-Z]{3}$/.test(event.currency ?? '')))
    throw new WebConversionDeliveryError('ga4_purchase_invalid', 'permanent', 'A GA4 purchase requires its transaction ID and confirmed positive money.');
  // A subscription renewal must not be attributed to the original checkout session months later.
  const sessionAge = at - Date.parse(capturedAt);
  const currentSession = sessionId && /^\d{1,20}$/.test(sessionId) && sessionAge >= -60_000 && sessionAge <= 24 * 60 * 60_000;
  return {
    client_id: clientId,
    timestamp_micros: at * 1000,
    validation_behavior: 'ENFORCE_RECOMMENDATIONS',
    consent: {
      ad_user_data: event.consent.advertising === 'granted' ? 'GRANTED' : 'DENIED',
      ad_personalization: event.consent.advertising === 'granted' ? 'GRANTED' : 'DENIED',
    },
    events: [{ name, params: {
      event_id: event.event_id,
      ...(currentSession ? { session_id: sessionId } : {}),
      ...(name === 'purchase' ? { transaction_id: event.transaction_id, value: event.value, currency: event.currency } : {}),
    } }],
  };
}

export function createGa4ConversionTransport(config: Ga4ConversionConfig): WebConversionTransport {
  if (!/^G-[A-Z0-9]+$/.test(config.measurementId) || !Object.keys(config.eventNames).length ||
      Object.values(config.eventNames).some(name => !/^[A-Za-z][A-Za-z0-9_]{0,39}$/.test(name)))
    throw new Error('GA4 requires a measurement ID and explicit event mappings.');
  if (config.timeoutMs !== undefined && (!Number.isInteger(config.timeoutMs) || config.timeoutMs < 1 || config.timeoutMs > 60000))
    throw new Error('GA4 timeoutMs must be between 1 and 60000.');
  return {
    consentPurpose: 'analytics',
    destination: { provider: 'ga4', destinationId: config.measurementId },
    async send(event, context) {
      const payload = mapGa4Conversion(config, event);
      if (!payload) return { status: 'skipped', provider: 'ga4', reason: 'analytics_context_or_mapping_unavailable' };
      return withConversionDeadline(async signal => {
        let response: Response;
        try {
          const secret = await config.apiSecret();
          if (!secret.trim()) throw new Error('missing secret');
          const url = new URL(`https://www.google-analytics.com/${config.validateOnly ? 'debug/' : ''}mp/collect`);
          url.searchParams.set('measurement_id', config.measurementId);
          url.searchParams.set('api_secret', secret);
          response = await (config.httpClient ?? fetch)(url.toString(), {
            method: 'POST', signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
          });
        } catch {
          // Never propagate the credential-bearing URL or raw provider error.
          throw new WebConversionDeliveryError('ga4_delivery_unconfirmed', 'uncertain', 'GA4 delivery could not be confirmed.');
        }
        if (!response.ok)
          throw new WebConversionDeliveryError(`ga4_http_${response.status}`,
            [408, 429].includes(response.status) || response.status >= 500 ? 'retryable' : 'permanent',
            'GA4 request was not accepted.', parseConversionRetryAfter(response.headers.get('retry-after')));
        if (config.validateOnly) {
          let result: { validationMessages?: unknown[] };
          try { result = await response.json(); } catch {
            throw new WebConversionDeliveryError('ga4_validation_unconfirmed', 'uncertain', 'GA4 validation response was unavailable.');
          }
          if (!Array.isArray(result.validationMessages) || result.validationMessages.length)
            throw new WebConversionDeliveryError('ga4_validation_failed', 'permanent', 'GA4 rejected the validation payload.');
          return { status: 'skipped', provider: 'ga4', reason: 'validation_only' };
        }
        // GA4 returns 2xx even for some rejected payloads; this is not report-ingestion proof.
        return { status: 'accepted', provider: 'ga4', reason: 'http_acknowledged' };
      }, config.timeoutMs ?? 10000, context?.signal);
    },
  };
}
