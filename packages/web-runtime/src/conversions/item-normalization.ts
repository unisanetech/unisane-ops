import { normalizeParamsToSnakeCase } from './snake-case';
import type { WebConversionItem } from './types';
import { normalizeWebConversionValue } from './value-normalization';

export function normalizeWebConversionItem(item: WebConversionItem): Record<string, unknown> {
  const normalized = normalizeParamsToSnakeCase(item);

  if (typeof normalized.price === 'number') {
    const price = normalizeWebConversionValue(normalized.price);
    if (price !== undefined) {
      normalized.price = price;
    }
  }

  if (typeof normalized.quantity === 'number') {
    const quantity = normalizeWebConversionValue(normalized.quantity);
    if (quantity !== undefined) {
      normalized.quantity = quantity;
    }
  }

  return normalized;
}

export function normalizeWebConversionItems(
  items: readonly WebConversionItem[] | undefined,
): readonly Record<string, unknown>[] | undefined {
  if (!items?.length) return undefined;
  return items.map(normalizeWebConversionItem);
}
