import { expect, it } from 'vitest';
import { gtmTrackingSetupAction } from './generate.js';
import { gtmTrackingSetupInputSchema } from './contracts.js';
import { getGoogleTagManagerDesiredResources } from '../normalize.js';
const input = {
  projectId: 'shop',
  appId: 'storefront',
  environment: 'test',
  accountId: '1',
  containerId: '2',
  namespace: 'shop',
  workspacePrefix: 'test',
  consentDefaults: {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  },
  ga4MeasurementId: 'G-TEST123',
  metaPixelId: '123',
  events: [
    {
      slug: 'purchase',
      sourceEvent: 'order_completed',
      eventIdPath: 'tracking.event_id',
      ga4EventName: 'purchase',
      metaEventName: 'Purchase',
      valuePath: 'ecommerce.value',
      currencyPath: 'ecommerce.currency',
      transactionIdPath: 'ecommerce.transaction_id',
      googleAds: { conversionId: '1234', conversionLabel: 'test_label' },
    },
  ],
} as const;
const context = {
  requestId: 'setup',
  scopeId: 'shop',
  projectId: 'shop',
  environmentId: 'test',
  principal: { kind: 'user' as const, id: 'operator' },
  requestedAt: '2026-09-06T00:00:00Z',
};
it('generates deterministic proposals with explicit observations, consent and channel identifiers', async () => {
  const parsed = gtmTrackingSetupInputSchema.parse(input);
  const result = await gtmTrackingSetupAction.execute(parsed, context);
  expect(result.revision).toBe((await gtmTrackingSetupAction.execute(parsed, context)).revision);
  expect(result.manifest.appId).toBe('storefront');
  expect(result.projectId).toBe('shop');
  expect(result.trackingVerified).toBe(false);
  expect(result.diagnosis.issues.filter((issue) => issue.severity === 'error')).toEqual([]);
  expect(
    result.manifest.tags?.find((tag) => tag.slug === 'ga4_configuration')?.parameters,
  ).toContainEqual({ key: 'send_page_view', value: 'false' });
  const meta = result.manifest.tags?.find((tag) => tag.slug === 'meta_purchase');
  expect(meta?.parameters).toContainEqual({
    key: 'currency',
    value: { variable: 'purchase_currency' },
  });
  expect(meta?.consent?.requiredConsent).toContain('ad_user_data');
  const ads = result.manifest.tags?.find((tag) => tag.slug === 'ads_purchase');
  expect(ads?.parameters).toContainEqual({
    key: 'orderId',
    value: { variable: 'purchase_transaction_id' },
  });
  expect(ads?.parameters).toContainEqual({
    key: 'conversionLabel',
    value: { variable: 'purchase_ads_label' },
  });
  expect(result.requiredObservations[0]?.event).toBe('order_completed');
  expect(getGoogleTagManagerDesiredResources(result.manifest).length).toBeGreaterThan(10);
});
it('rejects invented purchase values, duplicate sources, absent destinations and foreign targets', async () => {
  const invalid = { ...input, events: [{ ...input.events[0], currencyPath: undefined }] };
  expect(gtmTrackingSetupInputSchema.safeParse(invalid).success).toBe(false);
  expect(
    gtmTrackingSetupInputSchema.safeParse({ ...input, events: [input.events[0], input.events[0]] })
      .success,
  ).toBe(false);
  expect(gtmTrackingSetupInputSchema.safeParse({ ...input, metaPixelId: undefined }).success).toBe(
    false,
  );
  await expect(
    gtmTrackingSetupAction.execute(gtmTrackingSetupInputSchema.parse(input), {
      ...context,
      projectId: 'foreign',
    }),
  ).rejects.toThrow('GTM_SETUP_TARGET_MISMATCH');
});
