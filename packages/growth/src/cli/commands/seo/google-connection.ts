import {
  resolveGrowthGoogleConnectionCredentials,
  resolveGrowthGoogleConnectionToken,
  type GrowthGoogleConnectionCredentials,
  type GrowthGoogleService,
} from '../../connections/google.js';

type SeoGoogleConnectionOptions = {
  connection?: string;
  environment?: string;
  service: GrowthGoogleService;
  requiredScope: string;
};

export function resolveSeoGoogleConnectionToken(
  options: SeoGoogleConnectionOptions,
): Promise<string> {
  return resolveGrowthGoogleConnectionToken(options);
}

export function resolveSeoGoogleConnectionCredentials(
  options: SeoGoogleConnectionOptions,
): Promise<GrowthGoogleConnectionCredentials> {
  return resolveGrowthGoogleConnectionCredentials(options);
}
