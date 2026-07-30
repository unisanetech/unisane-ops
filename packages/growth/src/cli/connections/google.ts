import { executeGrowthProviderCommand } from '../provider-runtime.js';

export type GrowthGoogleService =
  | 'project-administration'
  | 'search-console'
  | 'analytics'
  | 'tag-manager'
  | 'ads';

export type GrowthGoogleConnectionCredentials = {
  accessToken: string;
  developerToken?: string;
};

export function resolveGrowthGoogleConnectionCredentials(input: {
  service: GrowthGoogleService;
  connection?: string;
  environment?: string;
  requiredScope?: string;
}): Promise<GrowthGoogleConnectionCredentials> {
  return executeGrowthProviderCommand('google.connection.resolve-credentials', input);
}

export function resolveGrowthGoogleConnectionToken(input: {
  service: GrowthGoogleService;
  connection?: string;
  environment?: string;
  requiredScope?: string;
}): Promise<string> {
  return resolveGrowthGoogleConnectionCredentials(input).then(
    (credentials) => credentials.accessToken,
  );
}
