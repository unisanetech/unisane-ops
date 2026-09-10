import { expect, it, vi } from 'vitest';
import { marketingConversionRegistrySchema } from '../schema/conversion-registry.js';
import {
  applyMarketingGoogleAdsGoals,
  buildMarketingGoogleAdsGoalPlan,
} from './google-ads-goals.js';
import type { MarketingGoogleAdsGoalPlan } from './contracts.js';

const registry = marketingConversionRegistrySchema.parse({
  version: 1,
  platformId: 'shop',
  conversions: [
    {
      id: 'purchase',
      name: 'Purchase',
      owner: 'shop',
      sourceEventId: 'purchase',
      lifecycle: 'purchase',
      goal: 'purchase',
      confirmationSource: 'server',
      eventIdRule: 'event-id',
      dedupeRule: 'event-id',
      reportingGoal: 'revenue',
      mappings: {
        googleAds: { conversionActionName: 'Purchase', category: 'PURCHASE', primary: true },
      },
    },
  ],
});
const validate = (plan: MarketingGoogleAdsGoalPlan): MarketingGoogleAdsGoalPlan => ({
  ...plan,
  validateOnly: true,
  nonMutating: true,
  operations: plan.operations.map((operation) => ({ ...operation, status: 'validated' })),
});
it('plans from the canonical registry without a provider and requires an execution mode', async () => {
  const plan = buildMarketingGoogleAdsGoalPlan({
    registry,
    accountId: '123-456',
    now: new Date('2026-09-06T00:00:00Z'),
  });
  expect(plan).toMatchObject({
    customerId: '123456',
    nonMutating: true,
    operations: [{ actionName: 'Purchase', status: 'planned' }],
  });
  const apply = vi.fn(async (plan: MarketingGoogleAdsGoalPlan) => validate(plan));
  await expect(
    applyMarketingGoogleAdsGoals(registry, { accountId: '123', provider: { apply } }),
  ).rejects.toThrow('MODE_REQUIRED');
  expect(apply).not.toHaveBeenCalled();
  expect(
    await applyMarketingGoogleAdsGoals(registry, {
      accountId: '123',
      validateOnly: true,
      provider: { apply },
    }),
  ).toMatchObject({ validateOnly: true, nonMutating: true });
});
it('rejects provider results for another target, mode or operation', async () => {
  for (const change of [{ customerId: '999' }, { nonMutating: false }, { operations: [] }]) {
    await expect(
      applyMarketingGoogleAdsGoals(registry, {
        accountId: '123',
        validateOnly: true,
        provider: { apply: async (plan) => ({ ...validate(plan), ...change }) },
      }),
    ).rejects.toThrow('RESULT_MISMATCH');
  }
});
