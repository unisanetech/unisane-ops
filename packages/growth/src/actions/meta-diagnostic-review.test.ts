import { expect, it, vi } from 'vitest';
import { createMetaDiagnosticReviewAction } from './meta-diagnostic-review.js';
const binding = {
  projectId: 'store',
  environmentId: 'production',
  connectionId: 'meta',
  datasetId: '123',
};
const context = {
  requestId: 'test',
  scopeId: 'store',
  projectId: 'store',
  environmentId: 'production',
  principal: { kind: 'user' as const, id: 'test' },
  requestedAt: '2026-09-06T00:00:00Z',
};
it('rejects another environment before loading diagnostic evidence', async () => {
  const load = vi.fn();
  const action = createMetaDiagnosticReviewAction({
    resolveBinding: async () => binding,
    load,
    now: () => new Date(context.requestedAt),
  });
  await expect(action.execute({}, { ...context, environmentId: 'other' })).rejects.toThrow(
    'target mismatch',
  );
  expect(load).not.toHaveBeenCalled();
});
it('rejects invalid limits before resolving the event source', async () => {
  const resolveBinding = vi.fn();
  const action = createMetaDiagnosticReviewAction({
    resolveBinding,
    load: vi.fn(),
    now: () => new Date(context.requestedAt),
  });
  await expect(action.execute({ limit: 21 }, context)).rejects.toThrow();
  expect(resolveBinding).not.toHaveBeenCalled();
});
