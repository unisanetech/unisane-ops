import { WebConversionDeliveryError } from './error';

/** HTTP delta-seconds or HTTP-date; invalid/negative values never become a delay. */
export function parseConversionRetryAfter(
  value: string | null | undefined,
  now = Date.now(),
): number | undefined {
  if (!value?.trim()) return undefined;
  const text = value.trim();
  const delay = /^\d+$/.test(text)
    ? Number(text) * 1000
    : /[A-Za-z]{3},/.test(text)
      ? Date.parse(text) - now
      : NaN;
  return Number.isSafeInteger(delay) && delay >= 0 ? delay : undefined;
}

/** Unwrap Core's aggregate subscriber errors while preserving its existing backoff. */
export function resolveConversionRetryDelayMs(error: unknown, defaultDelayMs: number): number {
  const pending: unknown[] = [error];
  const seen = new Set<unknown>();
  let delay = defaultDelayMs;
  while (pending.length && seen.size < 100) {
    const item = pending.pop();
    if (seen.has(item)) continue;
    seen.add(item);
    if (
      item instanceof WebConversionDeliveryError &&
      item.kind !== 'permanent' &&
      Number.isSafeInteger(item.retryAfterMs) &&
      (item.retryAfterMs ?? -1) >= 0
    ) {
      delay = Math.max(delay, item.retryAfterMs!);
    }
    if (item instanceof AggregateError) pending.push(...item.errors.slice(0, 100));
    if (item instanceof Error && item.cause) pending.push(item.cause);
  }
  return Math.min(delay, 24 * 60 * 60 * 1000);
}
