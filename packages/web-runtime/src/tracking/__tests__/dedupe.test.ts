import { describe, expect, it } from 'vitest';
import { createWebTrackingDedupeStore } from '../dedupe';

describe('web tracking dedupe store', () => {
  it('drops duplicate events inside the ttl window', () => {
    const dedupe = createWebTrackingDedupeStore();

    expect(dedupe.shouldDrop('event:checkout', 1000, 100)).toBe(false);
    expect(dedupe.shouldDrop('event:checkout', 1000, 500)).toBe(true);
    expect(dedupe.shouldDrop('event:checkout', 1000, 1201)).toBe(false);
  });
});
