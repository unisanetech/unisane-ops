import type { MetaCapiWebConversionTransportConfig } from './types';

export const DEFAULT_META_CAPI_API_VERSION = 'v25.0';

function normalizeRequiredString(value: string, fieldName: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`Meta CAPI web conversion ${fieldName} is required.`);
  }
  return normalized;
}

export function normalizeMetaCapiPixelId(pixelId: string): string {
  return normalizeRequiredString(pixelId, 'pixelId');
}

export function normalizeMetaCapiApiVersion(apiVersion: string | undefined): string {
  return (apiVersion?.trim() || DEFAULT_META_CAPI_API_VERSION).replace(/^\/+|\/+$/g, '');
}

export function validateMetaCapiWebConversionTransportConfig(
  config: MetaCapiWebConversionTransportConfig,
): void {
  normalizeMetaCapiPixelId(config.pixelId);
  if (Object.keys(config.eventNames).length === 0) {
    throw new Error('Meta CAPI web conversion eventNames must not be empty.');
  }
}
