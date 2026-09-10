import { expect, it } from 'vitest';
import { googleTagManagerDiagnosisAction } from '../diagnosis.js';
import { planGoogleTagManagerChanges } from '../plan.js';
const manifest = {
  appId: 'shop',
  accountId: '1',
  containerId: '2',
  namespace: 'shop',
  environments: { test: { workspacePrefix: 'test' } },
};
const context = {
  requestId: 'test',
  scopeId: 'shop',
  projectId: 'shop',
  environmentId: 'test',
  principal: { kind: 'user' as const, id: 'test' },
  requestedAt: '2026-09-06T00:00:00Z',
};
const remote = {
  containerPath: 'accounts/1/containers/2',
  resources: [
    { kind: 'tag' as const, slug: 'old', remoteId: '1', payload: { paused: true }, managed: true },
  ],
};
it('does not repeat pauses and preserves unmanaged resources', () => {
  expect(planGoogleTagManagerChanges({ manifest, remote }).operations).toEqual([]);
  expect(
    planGoogleTagManagerChanges({
      manifest,
      remote: { ...remote, resources: [{ ...remote.resources[0]!, managed: false }] },
    }).operations[0]?.type,
  ).toBe('retain_unmanaged_resource');
});
it('rejects foreign snapshots and duplicate normalized identities', () => {
  expect(() =>
    planGoogleTagManagerChanges({
      manifest,
      remote: { ...remote, containerPath: 'accounts/other/containers/2' },
    }),
  ).toThrow('TARGET_MISMATCH');
  expect(() =>
    planGoogleTagManagerChanges({
      manifest,
      remote: { ...remote, resources: [...remote.resources, ...remote.resources] },
    }),
  ).toThrow('AMBIGUOUS');
});
it('marks missing snapshot and site delivery unverified and binds the action target', async () => {
  const result = await googleTagManagerDiagnosisAction.execute(
    { projectId: 'shop', manifest, environment: 'test' },
    context,
  );
  expect(result).toMatchObject({
    readyToPlan: false,
    trackingVerified: false,
    evidence: 'missing',
  });
  expect(result.issues.some((issue) => issue.code === 'snapshot_missing')).toBe(true);
  await expect(
    googleTagManagerDiagnosisAction.execute(
      { projectId: 'shop', manifest, environment: 'test' },
      { ...context, projectId: 'other' },
    ),
  ).rejects.toThrow('TARGET_MISMATCH');
});
