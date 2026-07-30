import type { GrowthProviderCommandOperation } from '../provider-runtime.js';

export async function executeGrowthTestProviderCommand(
  operation: GrowthProviderCommandOperation,
  input: unknown,
): Promise<unknown> {
  void input;
  throw new Error(`[GROWTH_TEST_PROVIDER_OPERATION_UNKNOWN] Unsupported operation '${operation}'.`);
}
