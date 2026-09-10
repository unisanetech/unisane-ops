import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { expect, it, vi } from 'vitest';
import { executeGoogleGoalOperation } from './google-goals.js';
const plan = {
  kind: 'unisane.marketing.google-ads-goals',
  version: 1,
  generatedAt: '2026-09-06T00:00:00Z',
  nonMutating: true,
  validateOnly: false,
  customerId: '123',
  operations: [],
  nextWorkflowStep: 'Review',
};
it('checks binding and live confirmation before resolving credentials', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'goal-host-'));
  const config = {
    schemaVersion: 1,
    project: { id: 'shop' },
    environments: { test: { production: false } },
    ops: {
      connections: { google: { provider: 'google', recordPath: '.unisane/google.json' } },
      targets: {},
      capabilities: {
        growth: {
          schemaVersion: 1,
          adoptionMode: 'adopt-existing',
          capabilities: ['advertising'],
          environments: {
            test: {
              connections: { google: 'google' },
              resources: [
                {
                  provider: 'google',
                  connection: 'google',
                  service: 'ads',
                  resourceType: 'customer',
                  resourceId: '123',
                },
              ],
            },
          },
          manifests: {},
          runtime: { integration: 'existing' },
          policy: { mutation: 'approval-required', spend: 'approval-required' },
        },
      },
    },
  };
  await writeFile(
    path.join(root, 'unisane.config.ts'),
    `export default ${JSON.stringify(config)};`,
  );
  const resolve = vi.fn(async () => {
    throw new Error('credential-boundary');
  });
  try {
    await expect(
      executeGoogleGoalOperation(
        root,
        { plan: { ...plan, customerId: '999' }, validateOnly: true },
        resolve,
      ),
    ).rejects.toThrow('TARGET_MISMATCH');
    await expect(
      executeGoogleGoalOperation(root, { plan, validateOnly: false }, resolve),
    ).rejects.toThrow('CONFIRM_REQUIRED');
    expect(resolve).not.toHaveBeenCalled();
    await expect(
      executeGoogleGoalOperation(root, { plan, validateOnly: true }, resolve),
    ).rejects.toThrow('credential-boundary');
    expect(resolve).toHaveBeenCalledWith(
      expect.objectContaining({ connection: 'google', environment: 'test', service: 'ads' }),
    );
    await expect(
      executeGoogleGoalOperation(
        root,
        { plan, validateOnly: false, accountConfirm: 'test:googleAds:123:conversion-goals' },
        resolve,
      ),
    ).rejects.toThrow('credential-boundary');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
