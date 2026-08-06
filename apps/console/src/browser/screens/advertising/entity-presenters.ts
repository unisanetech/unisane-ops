import type { MarketingConsoleAdvertisingEntity } from '@unisane/growth/console';
import { humanize } from '../../lib/format.js';

export function entityDeliveryLabel(value: string | undefined): string {
  return value ? humanize(value.toLowerCase()) : 'Not captured';
}

export function entityDeliveryColor(
  value: string | undefined,
): 'success' | 'warning' | 'error' | 'secondary' {
  if (!value) return 'secondary';
  const normalized = value.toLowerCase();
  if (/active|enabled|delivering/.test(normalized)) return 'success';
  if (/paused|pending|limited/.test(normalized)) return 'warning';
  if (/rejected|disapproved|error/.test(normalized)) return 'error';
  return 'secondary';
}

export function entityTypeLabel(entity: MarketingConsoleAdvertisingEntity): string {
  if (entity.level === 'adSet') return 'Ad set';
  if (entity.level === 'creative') return 'Creative';
  return 'Ad';
}
