import { describe, expect, it } from 'vitest';
import { createConversionClient } from '../conversion-client';
import { createConversionRecorder } from '../testing/conversion-recorder';

describe('web conversions client', () => {
  it('dispatches confirmed conversion envelopes through the injected transport', async () => {
    const recorder = createConversionRecorder();
    const client = createConversionClient({
      config: {
        appId: 'data-entry-lm',
        defaultCurrency: 'USD',
      },
      transport: recorder.transport,
    });

    const envelope = await client.send({
      name: 'purchase_completed',
      scopeId: 'scope_123',
      transactionId: 'ord_123',
      value: 149,
      items: [
        {
          itemId: 'plan_pro',
          itemName: 'Pro',
          price: 149,
          quantity: 1,
        },
      ],
    });

    expect(recorder.events).toHaveLength(1);
    expect(recorder.events[0]).toEqual(envelope);
    expect(recorder.events[0]).toMatchObject({
      event: 'purchase_completed',
      transaction_id: 'ord_123',
      currency: 'USD',
    });
  });
});
