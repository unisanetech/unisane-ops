import { describe, expect, it } from 'vitest';
import { normalizeWebConversionEnvelope } from '../conversion-envelope';
import { resolveWebConversionConfig } from '../config';

describe('web conversions envelope normalization', () => {
  const config = resolveWebConversionConfig({
    appId: 'data-entry-lm',
    defaultCurrency: 'usd',
    defaultProperties: {
      sourceOfTruth: 'billing_webhook',
    },
  });

  it('normalizes confirmed conversions into the canonical server envelope', () => {
    const envelope = normalizeWebConversionEnvelope({
      config,
      input: {
        name: 'SubscriptionActivated',
        scopeId: 'scope_123',
        userId: 'usr_123',
        eventId: 'evt_123',
        transactionId: 'sub_123',
        value: 299,
        items: [
          {
            itemId: 'plan_team',
            itemName: 'Team',
            itemCategory: 'subscription',
            price: 299,
            quantity: 1,
          },
        ],
        properties: {
          billingCycle: 'monthly',
          providerCustomerId: 'cus_123',
        },
      },
    });

    expect(envelope).toEqual({
      schema_version: 2,
      occurred_at: expect.any(String),
      event: 'subscription_activated',
      app_id: 'data-entry-lm',
      scope_id: 'scope_123',
      user_id: 'usr_123',
      event_id: 'evt_123',
      transaction_id: 'sub_123',
      value: 299,
      currency: 'USD',
      items: [
        {
          item_id: 'plan_team',
          item_name: 'Team',
          item_category: 'subscription',
          price: 299,
          quantity: 1,
        },
      ],
      properties: {
        source_of_truth: 'billing_webhook',
        billing_cycle: 'monthly',
        provider_customer_id: 'cus_123',
      },
    });
  });

  it('requires transaction ids for confirmed subscription and purchase families', () => {
    expect(() =>
      normalizeWebConversionEnvelope({
        config,
        input: {
          name: 'refund_issued',
          scopeId: 'scope_123',
          value: 49,
        },
      }),
    ).toThrow('Web conversion transactionId is required for "refund_issued".');
  });

  it('requires currency when a value is present and no default currency exists', () => {
    const configWithoutDefaultCurrency = resolveWebConversionConfig({
      appId: 'data-entry-lm',
    });

    expect(() =>
      normalizeWebConversionEnvelope({
        config: configWithoutDefaultCurrency,
        input: {
          name: 'contact_submit',
          scopeId: 'scope_123',
          value: 1,
        },
      }),
    ).toThrow('Web conversion currency is required when value is provided.');
  });
});
