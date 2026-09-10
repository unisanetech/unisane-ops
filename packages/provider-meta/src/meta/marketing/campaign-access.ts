import type { FetchLike } from '@unisane/growth/contracts';
import { META_CAMPAIGN_CONTROL_API_VERSION } from '../api-version.js';

export async function readBoundMetaCampaign(input: {
  accountId: string;
  campaignId: string;
  accessToken: string;
  fetch: FetchLike;
}) {
  const accountId = input.accountId.replace(/^act_/, '');
  if (!/^\d+$/.test(accountId) || !/^\d+$/.test(input.campaignId))
    throw new Error('[META_CAMPAIGN_TARGET_INVALID] Select numeric campaign and account IDs.');
  try {
    const response = await input.fetch(
      `https://graph.facebook.com/${META_CAMPAIGN_CONTROL_API_VERSION}/${input.campaignId}?fields=id,account_id,status`,
      {
        headers: { authorization: `Bearer ${input.accessToken}` },
        signal: AbortSignal.timeout(30_000),
      },
    );
    if (!response.ok) throw new Error('unavailable');
    const value: unknown = await response.json();
    if (!value || typeof value !== 'object') throw new Error('invalid');
    const record = value as Record<string, unknown>;
    if (record.id !== input.campaignId || record.account_id !== accountId)
      throw new Error('identity');
    return record.status === 'PAUSED'
      ? ('paused' as const)
      : record.status === 'ACTIVE'
        ? ('active' as const)
        : ('unknown' as const);
  } catch {
    throw new Error(
      '[META_CAMPAIGN_EVIDENCE_UNAVAILABLE] Could not verify campaign identity and account. Refresh connection access and retry the read.',
    );
  }
}
