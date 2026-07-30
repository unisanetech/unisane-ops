export type MarketingMetaConnectionStatus = {
  ok: boolean;
  connectionId: string;
  connected: boolean;
  scopes: readonly string[];
  credentialAvailable: boolean;
  expiresAt?: string;
  updatedAt?: string;
};

export function marketingMetaConnectionReady(
  status?: MarketingMetaConnectionStatus,
): status is MarketingMetaConnectionStatus & { connected: true } {
  if (!status?.connected || !status.credentialAvailable) return false;
  if (!status.expiresAt) return true;
  return Date.parse(status.expiresAt) > Date.now();
}
