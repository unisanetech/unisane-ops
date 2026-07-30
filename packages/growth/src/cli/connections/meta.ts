import { executeGrowthProviderCommand } from '../provider-runtime.js';

export function resolveGrowthMetaConnectionToken(input: {
  connection?: string;
  environment?: string;
}): Promise<string> {
  return executeGrowthProviderCommand('meta.connection.resolve-token', input);
}
