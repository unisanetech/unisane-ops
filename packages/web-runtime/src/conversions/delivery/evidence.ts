import type { WebConversionEvidence } from '../types';

/** Describe only fields actually mapped into the request. Never retain their values. */
export function describeConversionRequest(input: {
  customer: Partial<Record<keyof WebConversionEvidence['customerFields'], unknown>>;
  transport: Partial<Record<keyof WebConversionEvidence['transportFields'], unknown>>;
  parameters: Record<string, unknown>;
  value?: number;
  currency?: string;
  hasItems?: boolean;
}): WebConversionEvidence {
  return {
    customerFields: Object.fromEntries(
      Object.entries(input.customer).map(([key, value]) => [
        key,
        value === undefined ? 'absent' : 'hashed',
      ]),
    ),
    transportFields: Object.fromEntries(
      Object.entries(input.transport).map(([key, value]) => [
        key,
        value === undefined ? 'absent' : 'present',
      ]),
    ),
    commerce: {
      value:
        input.value === undefined
          ? 'absent'
          : Number.isFinite(input.value) && input.value >= 0
            ? 'valid'
            : 'invalid',
      currency:
        input.currency === undefined
          ? 'absent'
          : /^[A-Z]{3}$/.test(input.currency)
            ? 'valid'
            : 'invalid',
      catalog: input.hasItems ? 'present' : 'not-applicable',
    },
    parameterEvidence: Object.fromEntries(
      Object.entries(input.parameters)
        .filter(([, value]) => value !== undefined && value !== null)
        .slice(0, 64)
        .map(([key, value]) => [
          key,
          {
            state: 'present',
            type: Array.isArray(value)
              ? 'array'
              : typeof value === 'string'
                ? 'string'
                : typeof value === 'number'
                  ? 'number'
                  : typeof value === 'boolean'
                    ? 'boolean'
                    : 'object',
          },
        ]),
    ),
  };
}
