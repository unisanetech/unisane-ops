import { describe, expect, it } from 'vitest';
import { createWebConversionDedupeKey } from '../dedupe-key';
import { createTestConversionClient } from '../testing/create-test-conversion-client';

describe('web conversions testing and dedupe helpers', () => {
  it('prefers event ids when creating dedupe keys', () => {
    expect(
      createWebConversionDedupeKey({
        event: 'subscription_renewed',
        app_id: 'data-entry-lm',
        scope_id: 'scope_123',
        event_id: 'evt_123',
        transaction_id: 'sub_123',
      }),
    ).toBe('event:evt_123');
  });

  it('falls back to stable transaction identity when event ids are not available', () => {
    expect(
      createWebConversionDedupeKey({
        event: 'subscription_renewed',
        app_id: 'data-entry-lm',
        scope_id: 'scope_123',
        event_id: '',
        transaction_id: 'sub_123',
      }),
    ).toBe('transaction:data-entry-lm:scope_123:subscription_renewed:sub_123');
  });

  it('ships a package-level test client for route and webhook proof', async () => {
    const { client, recorder } = createTestConversionClient({
      config: {
        appId: 'data-entry-lm',
        defaultCurrency: 'USD',
      },
    });

    await client.send({
      name: 'subscription_canceled',
      scopeId: 'scope_123',
      transactionId: 'sub_123',
      properties: {
        cancellationReason: 'user_request',
      },
    });

    expect(recorder.events).toHaveLength(1);
    expect(recorder.events[0]?.properties).toEqual({
      cancellation_reason: 'user_request',
    });
  });
});
