function normalizeOptionalString(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

export function normalizeWebConversionValue(value: number | undefined): number | undefined {
  if (value === undefined) return undefined;
  if (!Number.isFinite(value)) {
    throw new Error('Web conversion value must be a finite number.');
  }

  return value;
}

export function normalizeWebConversionCurrency(args: {
  currency?: string;
  defaultCurrency?: string;
  value?: number;
}): string | undefined {
  const currency = normalizeOptionalString(args.currency ?? args.defaultCurrency)?.toUpperCase();

  if (args.value !== undefined && !currency) {
    throw new Error('Web conversion currency is required when value is provided.');
  }

  return currency;
}
