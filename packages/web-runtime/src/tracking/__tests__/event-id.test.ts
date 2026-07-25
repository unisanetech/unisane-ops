import { describe, expect, it, vi } from 'vitest';
import { createWebTrackingEventId } from '../event-id';

describe('web tracking event id helper', () => {
  it('uses crypto.randomUUID when available', () => {
    const randomUUID = vi.fn(() => 'uuid-123');
    const originalCrypto = globalThis.crypto;

    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: { randomUUID },
    });

    expect(createWebTrackingEventId('checkout')).toBe('checkout_uuid-123');
    expect(randomUUID).toHaveBeenCalledTimes(1);

    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: originalCrypto,
    });
  });

  it('falls back to timestamp and random data when crypto is unavailable', () => {
    const originalCrypto = globalThis.crypto;
    const dateNow = vi.spyOn(Date, 'now').mockReturnValue(1700000000000);
    const mathRandom = vi.spyOn(Math, 'random').mockReturnValue(0.123456789);

    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: undefined,
    });

    const id = createWebTrackingEventId('evt');

    expect(id).toMatch(/^evt_l[a-z0-9]+_[a-z0-9]+$/);

    dateNow.mockRestore();
    mathRandom.mockRestore();
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: originalCrypto,
    });
  });
});
