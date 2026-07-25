export type MarketingMetaAuthProfileStatus = {
  ok: boolean;
  profile: string;
  authHome: string;
  configured: boolean;
  scopes: readonly string[];
  secretStore?: 'keychain' | 'file';
  accessTokenStored: boolean;
  expiresAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export function marketingMetaAuthReady(
  status?: MarketingMetaAuthProfileStatus,
): status is MarketingMetaAuthProfileStatus & { configured: true } {
  if (!status?.configured || !status.accessTokenStored) return false;
  if (!status.expiresAt) return true;
  return Date.parse(status.expiresAt) > Date.now();
}
