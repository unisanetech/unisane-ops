import type { MetaCapiWebConversionTransportConfig } from './types';

export { META_GRAPH_API_VERSION as DEFAULT_META_CAPI_API_VERSION } from '../../contracts/provider-api-versions';
import { META_GRAPH_API_VERSION } from '../../contracts/provider-api-versions';

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
  return (apiVersion?.trim() || META_GRAPH_API_VERSION).replace(/^\/+|\/+$/g, '');
}

export function validateMetaCapiWebConversionTransportConfig(
  config: MetaCapiWebConversionTransportConfig,
): void {
  normalizeMetaCapiPixelId(config.pixelId);
  const timeoutMs = config.timeoutMs ?? 10000;
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 60000) {
    throw new Error('Meta CAPI timeoutMs must be between 1 and 60000.');
  }
  if (Object.keys(config.eventNames).length === 0) {
    throw new Error('Meta CAPI web conversion eventNames must not be empty.');
  }
}
