function randomSegment(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().replace(/-/g, '');
  }

  return Math.random().toString(36).slice(2, 14);
}

export function createWebConversionTransactionId(prefix = 'txn'): string {
  return `${prefix}_${randomSegment()}`;
}

export function normalizeWebConversionTransactionId(
  transactionId: string | undefined,
): string | undefined {
  const normalized = transactionId?.trim();
  return normalized ? normalized : undefined;
}
