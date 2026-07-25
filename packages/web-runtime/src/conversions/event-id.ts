function randomSegment(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().replace(/-/g, '');
  }

  return Math.random().toString(36).slice(2, 14);
}

export function createWebConversionEventId(prefix = 'conv'): string {
  return `${prefix}_${randomSegment()}`;
}

export function normalizeWebConversionEventId(eventId: string | undefined): string | undefined {
  const normalized = eventId?.trim();
  return normalized ? normalized : undefined;
}
