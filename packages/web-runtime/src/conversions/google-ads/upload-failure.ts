import type { ConversionFailureKind } from '../delivery/error';

const retryable = new Set(['TOO_RECENT_EVENT', 'TOO_RECENT_CONVERSION_ACTION', 'TOO_RECENT_CALL']);
const permanent = new Set([
  'UNPARSEABLE_GCLID',
  'CONVERSION_PRECEDES_EVENT',
  'EXPIRED_EVENT',
  'UNAUTHORIZED_CUSTOMER',
  'DUPLICATE_ORDER_ID',
  'ORDER_ID_ALREADY_IN_USE',
  'CLICK_CONVERSION_ALREADY_EXISTS',
  'INVALID_CUSTOMER_FOR_CLICK',
  'INVALID_USER_IDENTIFIER',
  'UNSUPPORTED_USER_IDENTIFIER',
  'GBRAID_WBRAID_BOTH_SET',
  'UNPARSEABLE_WBRAID',
  'UNPARSEABLE_GBRAID',
  'CUSTOMER_DATA_POLICY_PROHIBITS_ENHANCED_CONVERSIONS',
  'CUSTOMER_NOT_ACCEPTED_CUSTOMER_DATA_TERMS',
  'ORDER_ID_CONTAINS_PII',
  'CUSTOMER_NOT_ENABLED_ENHANCED_CONVERSIONS_FOR_LEADS',
  'NO_CONVERSION_ACTION_FOUND',
  'INVALID_CONVERSION_ACTION_TYPE',
  'CONVERSION_NOT_COMPLIANT_WITH_ATT_POLICY',
]);
function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

/** Classify only recognized structured codes. Unknown responses remain uncertain. */
export function classifyGoogleAdsUploadFailure(
  body: unknown,
  partial: boolean,
): {
  kind: ConversionFailureKind;
  retryAfterMs?: number;
} {
  const result = record(body);
  const status = record(partial ? result.partialFailureError : result.error);
  const codes: string[] = [];
  for (const detail of Array.isArray(status.details) ? status.details : []) {
    const errors = record(detail).errors;
    if (!Array.isArray(errors)) continue;
    for (const error of errors) {
      const code = record(record(error).errorCode);
      const entries = Object.entries(code);
      for (const [group, value] of entries) {
        codes.push(
          group === 'conversionUploadError' && typeof value === 'string' ? value : 'UNKNOWN',
        );
      }
      if (!entries.length) codes.push('UNKNOWN');
    }
  }
  // A mixed batch can have accepted rows; do not turn it into a terminal all-row rejection.
  if (
    partial &&
    Array.isArray(result.results) &&
    result.results.some((value) => Object.keys(record(value)).length)
  ) {
    return { kind: 'uncertain' };
  }
  if (codes.length && codes.every((code) => permanent.has(code))) return { kind: 'permanent' };
  if (codes.length && codes.every((code) => retryable.has(code))) {
    return { kind: 'retryable', retryAfterMs: 6 * 60 * 60 * 1000 };
  }
  return { kind: 'uncertain' };
}
