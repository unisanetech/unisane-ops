export type WebTrackingDedupeStore = {
  shouldDrop: (key: string, ttlMs: number, now: number) => boolean;
};

export function createWebTrackingDedupeStore(): WebTrackingDedupeStore {
  const seen = new Map<string, number>();

  return {
    shouldDrop(key, ttlMs, now) {
      const previous = seen.get(key);
      if (previous !== undefined && now - previous < ttlMs) {
        return true;
      }

      seen.set(key, now);

      for (const [entryKey, timestamp] of seen.entries()) {
        if (now - timestamp >= ttlMs * 2) {
          seen.delete(entryKey);
        }
      }

      return false;
    },
  };
}
