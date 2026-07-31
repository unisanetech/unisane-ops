import type {
  MarketingConsoleConnectionState,
  MarketingConsoleStatus,
} from '@unisane/growth/console';

export function humanize(value: string): string {
  return value.replace(/[-_.]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function formatNumber(value: number): string {
  return value.toLocaleString();
}

export function formatCompactNumber(value: number): string {
  return Intl.NumberFormat(undefined, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Time not recorded';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function statusColor(
  status: MarketingConsoleStatus | MarketingConsoleConnectionState,
): 'success' | 'warning' | 'error' | 'info' {
  if (status === 'ready' || status === 'current') return 'success';
  if (status === 'warn' || status === 'syncing' || status === 'delayed') return 'warning';
  if (status === 'blocked' || status === 'failed' || status === 'expired-access') {
    return 'error';
  }
  return 'info';
}

export function healthStatusLabel(status: MarketingConsoleStatus): string {
  const labels: Record<MarketingConsoleStatus, string> = {
    ready: 'Healthy',
    warn: 'Needs review',
    blocked: 'Action required',
    missing: 'Not available',
  };
  return labels[status];
}

export function outcomeStatusLabel(status: MarketingConsoleStatus): string {
  const labels: Record<MarketingConsoleStatus, string> = {
    ready: 'Completed',
    warn: 'Completed — review',
    blocked: 'Failed',
    missing: 'Outcome unknown',
  };
  return labels[status];
}
