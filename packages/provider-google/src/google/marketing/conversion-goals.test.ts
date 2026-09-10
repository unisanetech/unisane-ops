import { expect, it, vi } from 'vitest';
import { marketingGoogleAdsGoalPlanSchema } from '@unisane/growth/contracts';
import { createGoogleAdsGoalProvider } from './conversion-goals.js';
const plan = marketingGoogleAdsGoalPlanSchema.parse({
  kind: 'unisane.marketing.google-ads-goals',
  version: 1,
  generatedAt: '2026-09-06T00:00:00Z',
  nonMutating: true,
  validateOnly: false,
  customerId: '123',
  operations: [
    {
      conversionId: 'purchase',
      sourceEventId: 'purchase',
      actionName: 'Purchase',
      category: 'PURCHASE',
      primaryForGoal: true,
      lifecycle: 'purchase',
      reportingGoal: 'revenue',
      status: 'planned',
      intent: 'create_or_update_conversion_action',
      message: 'Planned',
    },
  ],
  nextWorkflowStep: 'Review',
});
const response = (value: unknown) => new Response(JSON.stringify(value));
function fixture(...values: unknown[]) {
  const fetcher = vi.fn<typeof fetch>();
  values.forEach((v) => fetcher.mockResolvedValueOnce(response(v)));
  return {
    fetcher,
    provider: createGoogleAdsGoalProvider({
      accessToken: 'fixture-secret',
      developerToken: 'fixture-developer',
      fetch: fetcher,
    }),
  };
}
it('keeps validation nonmutating and maps explicit create and update receipts', async () => {
  const validation = fixture([], {});
  expect((await validation.provider.apply(plan, true)).operations[0]?.status).toBe('validated');
  expect(JSON.parse(String(validation.fetcher.mock.calls[1]?.[1]?.body)).validateOnly).toBe(true);
  const created = fixture([], { results: [{ resourceName: 'customers/123/conversionActions/9' }] });
  expect((await created.provider.apply(plan, false)).operations[0]).toMatchObject({
    status: 'created',
    resourceName: 'customers/123/conversionActions/9',
  });
  const updated = fixture(
    [
      {
        results: [
          {
            conversionAction: {
              name: 'Purchase',
              resourceName: 'customers/123/conversionActions/9',
            },
          },
        ],
      },
    ],
    { results: [{ resourceName: 'customers/123/conversionActions/9' }] },
  );
  expect((await updated.provider.apply(plan, false)).operations[0]?.status).toBe('updated');
  expect(
    JSON.parse(String(updated.fetcher.mock.calls[1]?.[1]?.body)).operations[0].updateMask,
  ).toBe('status,primary_for_goal');
});
it('rejects ambiguous or malformed inventory before mutation and incomplete live receipts', async () => {
  const action = {
    conversionAction: { name: 'Purchase', resourceName: 'customers/123/conversionActions/9' },
  };
  const duplicate = fixture([{ results: [action, action] }]);
  await expect(duplicate.provider.apply(plan, false)).rejects.toThrow('AMBIGUOUS');
  expect(duplicate.fetcher).toHaveBeenCalledOnce();
  await expect(fixture({}).provider.apply(plan, false)).rejects.toThrow('INVENTORY_INVALID');
  await expect(fixture([{ results: {} }]).provider.apply(plan, false)).rejects.toThrow(
    'INVENTORY_INVALID',
  );
  await expect(fixture([], {}).provider.apply(plan, false)).rejects.toThrow('OUTCOME_UNKNOWN');
});
it('does not expose provider error bodies', async () => {
  const { provider, fetcher } = fixture();
  fetcher.mockResolvedValueOnce(new Response('fixture-secret', { status: 403 }));
  const error = await provider.apply(plan, true).catch((e) => e);
  expect(error.message).toContain('HTTP 403');
  expect(error.message).not.toContain('fixture-secret');
});

it('redacts transport and JSON failures without replaying a mutation', async () => {
  const { provider, fetcher } = fixture([]);
  fetcher.mockRejectedValueOnce(new Error('fixture-secret'));
  const transport = await provider.apply(plan, false).catch((error) => error);
  expect(transport.message).toContain('TRANSPORT_UNKNOWN');
  expect(transport.message).not.toContain('fixture-secret');
  expect(fetcher).toHaveBeenCalledTimes(2);
  const malformed = fixture([]);
  malformed.fetcher.mockResolvedValueOnce(new Response('fixture-secret'));
  const parse = await malformed.provider.apply(plan, false).catch((error) => error);
  expect(parse.message).toContain('RESPONSE_INVALID');
  expect(parse.message).not.toContain('fixture-secret');
  expect(malformed.fetcher).toHaveBeenCalledTimes(2);
});
