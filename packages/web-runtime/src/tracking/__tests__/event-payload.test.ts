import { describe, expect, it } from 'vitest';
import {
  normalizeWebTrackingEventPayload,
  normalizeWebTrackingPageViewPayload,
} from '../event-payload';
import { resolveWebTrackingConfig } from '../config';

describe('web tracking payload normalization', () => {
  const config = resolveWebTrackingConfig({
    appId: 'data-entry-lm',
    enabled: true,
    defaultContext: {
      surface: 'public',
    },
  });

  it('normalizes event payloads into GTM-friendly fields', () => {
    const payload = normalizeWebTrackingEventPayload({
      config,
      input: {
        name: 'LandingPrimaryCtaClicked',
        eventId: 'evt_primary',
        transactionId: 'txn_123',
        value: 49,
        currency: 'USD',
        params: {
          authState: 'anonymous',
          ctaLabel: 'try_free',
        },
        items: [
          {
            itemId: 'plan_free',
            itemName: 'Free',
            quantity: 1,
          },
        ],
      },
      pageContext: {
        pagePath: '/',
        pageLocation: 'https://www.dataentrylm.com/',
        pageTitle: 'DataEntryLM',
      },
      attribution: {
        gclid: 'gclid-123',
        fbc: 'fb.1.123.fbclid',
      },
    });

    expect(payload).toMatchObject({
      event: 'landing_primary_cta_clicked',
      event_id: 'evt_primary',
      transaction_id: 'txn_123',
      value: 49,
      currency: 'USD',
      surface: 'public',
      auth_state: 'anonymous',
      cta_label: 'try_free',
      page_path: '/',
      page_location: 'https://www.dataentrylm.com/',
      page_title: 'DataEntryLM',
      gclid: 'gclid-123',
      fbc: 'fb.1.123.fbclid',
    });

    expect(payload.items).toEqual([
      {
        item_id: 'plan_free',
        item_name: 'Free',
        quantity: 1,
      },
    ]);
  });

  it('normalizes page views with browser context', () => {
    const payload = normalizeWebTrackingPageViewPayload({
      config,
      input: {
        pagePath: '/pricing',
      },
      fallbackPageContext: {
        pageTitle: 'Pricing',
        pageLocation: 'https://www.dataentrylm.com/pricing',
      },
    });

    expect(payload).toMatchObject({
      event: 'page_view',
      app_id: 'data-entry-lm',
      page_path: '/pricing',
      page_location: 'https://www.dataentrylm.com/pricing',
      page_title: 'Pricing',
    });
  });
});
