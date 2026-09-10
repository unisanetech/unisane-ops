export function selectGrowthEnvironment(
  environments: Record<string, unknown>,
  requested: unknown,
): string {
  if (typeof requested === 'string' && requested.trim()) {
    if (!(requested in environments)) {
      throw new Error(
        `[GROWTH_ENVIRONMENT_UNKNOWN] Growth environment '${requested}' is not configured.`,
      );
    }
    return requested;
  }
  const ids = Object.keys(environments);
  if (ids.length === 1) return ids[0];
  if ('development' in environments) return 'development';
  throw new Error(`[GROWTH_ENVIRONMENT_REQUIRED] Select one Growth environment: ${ids.join(', ')}`);
}
