import { resolveMarketingGoogleAccessToken } from '../marketing/auth/google.js';
import { executeGrowthProviderCommand } from '../../provider-runtime.js';

type SeoGoogleAuthOptions = {
  accessTokenEnv: string;
  authProfile?: string;
  platform?: string;
  requiredScope: string;
};

export async function resolveSeoGoogleAccessToken(
  options: SeoGoogleAuthOptions,
): Promise<string | undefined> {
  if (process.env[options.accessTokenEnv]?.trim()) {
    return process.env[options.accessTokenEnv]?.trim();
  }

  const profile = options.authProfile ?? options.platform;
  if (!profile) return undefined;

  try {
    return await resolveMarketingGoogleAccessToken({
      accessTokenEnv: options.accessTokenEnv,
      authProfile: profile,
      requiredScope: options.requiredScope,
    });
  } catch (marketingError) {
    try {
      return await executeGrowthProviderCommand<string>('google.auth.resolve-token', {
        accessTokenEnv: options.accessTokenEnv,
        authProfile: profile,
        requiredScope: options.requiredScope,
        namespace: 'google',
      });
    } catch {
      throw marketingError;
    }
  }
}
