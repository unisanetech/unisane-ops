import type { MarketingConsoleState } from '@unisane/growth/console';

export type AdvertisingCampaign =
  MarketingConsoleState['advertising']['combined']['campaigns'][number];

export function campaignDeliveryValue(campaign: AdvertisingCampaign): string {
  return campaign.deliveryStatus ?? campaign.primaryStatus ?? campaign.servingStatus ?? 'unknown';
}

export function campaignCodeLabel(value: string): string {
  const label = value.toLowerCase().replace(/[-_.]+/g, ' ');
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function campaignDeliveryLabel(value: string): string {
  const normalized = value.toUpperCase();
  if (normalized === 'ACTIVE' || normalized === 'ENABLED' || normalized === 'ELIGIBLE') {
    return 'Active';
  }
  if (normalized === 'PAUSED') return 'Paused';
  if (normalized === 'SERVING') return 'Serving';
  if (normalized === 'NOT_SERVING') return 'Not serving';
  if (normalized === 'LIMITED') return 'Limited';
  if (normalized === 'REMOVED') return 'Removed';
  if (normalized === 'ENDED') return 'Ended';
  if (normalized === 'PENDING') return 'Scheduled';
  if (normalized === 'UNKNOWN') return 'Status unavailable';
  return campaignCodeLabel(value);
}

function campaignReasonLabel(value: string): string {
  const normalized = value.toUpperCase();
  if (normalized === 'HAS_ADS_DISAPPROVED') return 'Some ads are disapproved';
  if (normalized === 'BUDGET_CONSTRAINED' || normalized === 'LIMITED_BY_BUDGET') {
    return 'Limited by budget';
  }
  const label = campaignCodeLabel(value).replace(/^Campaign /, '');
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function campaignDeliveryDetail(campaign: AdvertisingCampaign): string {
  const delivery = campaignDeliveryValue(campaign).toUpperCase();
  const supportingStates = [campaign.primaryStatus, campaign.servingStatus]
    .filter((value): value is string => Boolean(value))
    .filter((value) => value.toUpperCase() !== delivery && value.toUpperCase() !== 'UNKNOWN')
    .filter(
      (value) =>
        !(
          delivery === 'PAUSED' && ['SERVING', 'ENABLED', 'ELIGIBLE'].includes(value.toUpperCase())
        ),
    )
    .map(campaignDeliveryLabel);
  const reasons = campaign.primaryStatusReasons
    .filter((reason) => reason.toUpperCase() !== 'UNKNOWN')
    .filter((reason) => !(delivery === 'PAUSED' && reason.toUpperCase() === 'CAMPAIGN_PAUSED'))
    .map(campaignReasonLabel);
  const deliveryContext =
    delivery === 'PAUSED' ? ['Not serving until the campaign is enabled'] : [];
  const details = [...new Set([...deliveryContext, ...supportingStates, ...reasons])];
  if (details.length) return details.join(' · ');
  if (delivery === 'ACTIVE' || delivery === 'ENABLED' || delivery === 'ELIGIBLE') {
    return 'Available to serve';
  }
  if (delivery === 'REMOVED') return 'No longer available for delivery';
  return `${campaign.providerLabel} did not report another delivery reason`;
}

export function campaignDeliveryColor(
  campaign: AdvertisingCampaign,
): 'success' | 'warning' | 'error' | 'secondary' {
  const delivery = campaignDeliveryValue(campaign).toUpperCase();
  if (['ACTIVE', 'ENABLED', 'ELIGIBLE', 'SERVING'].includes(delivery)) return 'success';
  if (['LIMITED', 'PENDING'].includes(delivery)) return 'warning';
  if (delivery === 'NOT_SERVING') return 'error';
  return 'secondary';
}
