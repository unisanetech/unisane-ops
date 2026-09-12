import { WebConversionDeliveryError, withConversionDeadline } from '../delivery/error';
import { parseConversionRetryAfter } from '../delivery/retry';
import type { WebConversionEnvelope, WebConversionTransport } from '../types';

const endpoint = 'https://datamanager.googleapis.com/v1';
export type GoogleDataManagerConfig = {
  customerId: string;
  loginCustomerId?: string;
  conversionActions: Readonly<Record<string, string>>;
  accessToken: () => string | Promise<string>;
  httpClient?: typeof fetch;
  timeoutMs?: number;
  validateOnly?: boolean;
};
const identifier = (value: string) => {
  const normalized = value.replace(/-/g, '').trim();
  if (!/^\d+$/.test(normalized)) throw new Error('Google Data Manager requires a numeric account/action ID.');
  return normalized;
};

export function mapGoogleDataManagerEvent(config: GoogleDataManagerConfig, event: WebConversionEnvelope) {
  const action = config.conversionActions[event.event];
  if (event.consent?.advertising !== 'granted' || !action) return null;
  if (!event.event_id || !event.occurred_at || !Number.isFinite(Date.parse(event.occurred_at)))
    throw new WebConversionDeliveryError('google_event_identity_invalid', 'permanent', 'Original event identity and occurrence time are required.');
  const adIdentifiers = Object.fromEntries(['gclid', 'gbraid', 'wbraid'].flatMap((key) => {
    const value = event.properties?.[key];
    return typeof value === 'string' && value.trim() ? [[key, value.trim()]] : [];
  }));
  const userIdentifiers = [
    ['emailAddress', event.customer?.hashedEmail], ['phoneNumber', event.customer?.hashedPhone],
  ].flatMap(([key, value]) => {
    if (!value) return [];
    if (!/^[a-f0-9]{64}$/.test(value))
      throw new WebConversionDeliveryError('google_user_hash_invalid', 'permanent', 'Matching data requires normalized SHA-256 hashes.');
    return [{ [key!]: value }];
  });
  if (!Object.keys(adIdentifiers).length && !userIdentifiers.length) return null;
  if (event.value !== undefined && (!Number.isFinite(event.value) || event.value < 0 || !/^[A-Z]{3}$/.test(event.currency ?? '')))
    throw new WebConversionDeliveryError('google_event_money_invalid', 'permanent', 'Conversion money requires a nonnegative value and currency.');
  return {
    destinations: [{
      operatingAccount: { accountType: 'GOOGLE_ADS', accountId: identifier(config.customerId) },
      ...(config.loginCustomerId ? { loginAccount: { accountType: 'GOOGLE_ADS', accountId: identifier(config.loginCustomerId) } } : {}),
      productDestinationId: identifier(action),
    }],
    events: [{
      transactionId: event.transaction_id ?? event.event_id,
      eventTimestamp: new Date(event.occurred_at).toISOString(), eventSource: 'WEB',
      ...(Object.keys(adIdentifiers).length ? { adIdentifiers } : {}),
      ...(userIdentifiers.length ? { userData: { userIdentifiers } } : {}),
      ...(event.value !== undefined ? { conversionValue: event.value, currency: event.currency } : {}),
    }],
    consent: { adUserData: 'CONSENT_GRANTED', adPersonalization: 'CONSENT_GRANTED' },
    ...(userIdentifiers.length ? { encoding: 'HEX' } : {}),
    ...(config.validateOnly ? { validateOnly: true } : {}),
  };
}

async function request(config: GoogleDataManagerConfig, path: string, body: unknown, parent?: AbortSignal) {
  return withConversionDeadline(async (signal) => {
    let response: Response;
    try {
      const token = await config.accessToken();
      if (!token.trim()) throw new Error('missing credential');
      response = await (config.httpClient ?? fetch)(`${endpoint}/${path}`, {
        method: body === undefined ? 'GET' : 'POST', signal,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
    } catch {
      throw new WebConversionDeliveryError('google_data_manager_unconfirmed', 'uncertain', 'Google conversion delivery could not be confirmed.');
    }
    if (!response.ok) {
      const transient = [401, 408, 409, 429].includes(response.status) || response.status >= 500;
      throw new WebConversionDeliveryError(`google_data_manager_http_${response.status}`, transient ? 'retryable' : 'permanent',
        'Google conversion request was not accepted.', parseConversionRetryAfter(response.headers.get('retry-after')));
    }
    try { return await response.json() as Record<string, unknown>; }
    catch { throw new WebConversionDeliveryError('google_data_manager_response_invalid', 'uncertain', 'Google returned an unconfirmed conversion response.'); }
  }, config.timeoutMs ?? 10000, parent);
}

export function createGoogleDataManagerTransport(config: GoogleDataManagerConfig): WebConversionTransport {
  const customerId = identifier(config.customerId);
  for (const action of Object.values(config.conversionActions)) identifier(action);
  if (!Object.keys(config.conversionActions).length) throw new Error('Google conversion actions are required.');
  if (config.timeoutMs !== undefined && (!Number.isInteger(config.timeoutMs) || config.timeoutMs < 1 || config.timeoutMs > 60000))
    throw new Error('Google timeoutMs must be between 1 and 60000.');
  return {
    destination: { provider: 'google_ads', destinationId: customerId },
    async send(envelope, context) {
      const payload = mapGoogleDataManagerEvent(config, envelope);
      if (!payload) return { status: 'skipped', provider: 'google_ads', reason: 'consent_mapping_or_matching_unavailable' };
      const result = await request(config, 'events:ingest', payload, context?.signal);
      if (config.validateOnly) return { status: 'skipped', provider: 'google_ads', reason: 'validation_only' };
      if (typeof result.requestId !== 'string' || !result.requestId.trim())
        throw new WebConversionDeliveryError('google_data_manager_receipt_missing', 'uncertain', 'Google did not return its request identity.');
      // This acknowledges ingestion only. Request status and Ads attribution are separate evidence.
      return { status: 'accepted', provider: 'google_ads', providerReference: result.requestId,
        reason: Array.isArray(result.fieldWarnings) && result.fieldWarnings.length ? 'ingestion_received_with_warnings' : 'ingestion_received' };
    },
  };
}

/** Read-only reconciliation of the request ID stored in a delivery receipt. */
export async function readGoogleDataManagerRequestStatus(config: GoogleDataManagerConfig, requestId: string) {
  if (!requestId.trim()) throw new Error('Google request ID is required.');
  const result = await request(config, `requestStatus:retrieve?requestId=${encodeURIComponent(requestId)}`, undefined);
  if (!Array.isArray(result.requestStatusPerDestination))
    throw new WebConversionDeliveryError('google_status_invalid', 'uncertain', 'Google request status is unavailable.');
  return result.requestStatusPerDestination as Array<{
    destination: { operatingAccount: { accountId: string }; productDestinationId: string };
    requestStatus: 'SUCCESS' | 'PROCESSING' | 'FAILED' | 'PARTIAL_SUCCESS' | 'REQUEST_STATUS_UNKNOWN';
    errorInfo?: { errorCounts: Array<{ reason: string; recordCount: string }> };
    warningInfo?: { warningCounts: Array<{ reason: string; recordCount: string }> };
  }>;
}
