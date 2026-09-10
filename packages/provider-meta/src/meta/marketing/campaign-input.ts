/** Validate reviewed campaign inputs before creating any provider resource. */
export function resolveMetaCampaignDestination(origin: string | undefined, value: string): string {
  const destination = value.trim();
  const invalid = () =>
    new Error(
      '[ADS_LIVE_META_DESTINATION_INVALID] Provide an HTTP(S) destination, or a relative path with an explicit HTTP(S) origin; credentials are not allowed in URLs.',
    );
  if (!destination || destination.startsWith('//') || destination.includes('\\')) throw invalid();
  try {
    const absolute = /^[a-z][a-z0-9+.-]*:/i.test(destination);
    let base: URL | undefined;
    if (!absolute) {
      if (!origin?.trim()) throw invalid();
      base = new URL(origin.trim());
      if (
        !['http:', 'https:'].includes(base.protocol) ||
        base.username ||
        base.password ||
        base.pathname !== '/' ||
        base.search ||
        base.hash
      )
        throw invalid();
    }
    const url = new URL(destination, base);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password)
      throw invalid();
    return url.toString();
  } catch {
    // Never echo an invalid URL: it may contain embedded credentials.
    throw invalid();
  }
}

export function metaCampaignDailyBudget(value: number | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new Error(
      '[ADS_LIVE_META_BUDGET_REQUIRED] Meta campaign creation requires an explicit positive daily budget.',
    );
  }
  const amount = Math.round(value * 100);
  if (!Number.isSafeInteger(amount) || amount < 1) {
    throw new Error(
      '[ADS_LIVE_META_BUDGET_INVALID] The daily budget cannot be represented as a positive safe integer in provider budget units.',
    );
  }
  return amount;
}
