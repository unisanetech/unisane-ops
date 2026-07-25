import type { WebConversionParams, WebConversionValue } from './types';

export function toSnakeCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[\s.-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

export function normalizeParamsToSnakeCase(
  params: WebConversionParams | undefined,
): Record<string, WebConversionValue> {
  if (!params) return {};

  const normalized: Record<string, WebConversionValue> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    normalized[toSnakeCase(key)] = value;
  }

  return normalized;
}
