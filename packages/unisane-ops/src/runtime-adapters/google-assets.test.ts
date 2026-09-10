import { mkdtemp, writeFile, rm, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { expect, it, vi } from 'vitest';
import { executeGoogleAssetOperation } from './google-assets.js';
it('previews without credentials and enforces host target, confirmation and request boundaries', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'asset-host-'));
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
  const ref = path.join(root, '.unisane/marketing/assets/provider-refs/test/googleAds');
  await mkdir(ref, { recursive: true });
  await writeFile(
    path.join(ref, 'hero.json'),
    JSON.stringify({ providerAssetId: 'customers/123/assets/5' }),
  );
  const resolve = vi.fn(async () => {
    throw new Error('credential-boundary');
  });
  const request = {
    kind: 'link',
    assetIds: ['hero'],
    campaignResourceName: 'customers/123/campaigns/4',
    fieldType: 'MARKETING_IMAGE',
  };
  try {
    expect((await executeGoogleAssetOperation(root, request, resolve)).dryRun).toBe(true);
    await expect(
      executeGoogleAssetOperation(root, { ...request, accessToken: 'rejected' }, resolve),
    ).rejects.toThrow();
    await expect(
      executeGoogleAssetOperation(
        root,
        { ...request, campaignResourceName: 'customers/999/campaigns/4', yes: true },
        resolve,
      ),
    ).rejects.toThrow('TARGET_MISMATCH');
    await expect(
      executeGoogleAssetOperation(root, { ...request, yes: true }, resolve),
    ).rejects.toThrow('CONFIRM_REQUIRED');
    const metaRoot = path.join(root, 'meta-preview');
    await mkdir(metaRoot);
    const metaConfig = structuredClone(config);
    metaConfig.ops.capabilities.growth.environments.test.resources = [];
    await writeFile(
      path.join(metaRoot, 'unisane.config.ts'),
      `export default ${JSON.stringify(metaConfig)};`,
    );
    await writeFile(
      path.join(metaRoot, 'plan.json'),
      JSON.stringify({
        kind: 'unisane.marketing.ads.asset-upload-plan',
        version: 1,
        platformId: 'shop',
        appId: 'shop',
        generatedAt: '2026-09-06T00:00:00Z',
        nonMutating: true,
        provider: 'metaAds',
        registryPath: 'registry.json',
        checks: [],
        operations: [
          {
            id: 'meta-hero',
            assetId: 'hero',
            provider: 'metaAds',
            assetType: 'image',
            sourceLocalPath: 'hero.png',
            sourceSha256: 'a'.repeat(64),
            mutation: 'upload_asset',
          },
        ],
      }),
    );
    expect(
      (
        await executeGoogleAssetOperation(
          metaRoot,
          { kind: 'upload', planPath: 'plan.json' },
          resolve,
        )
      ).dryRun,
    ).toBe(true);
    await expect(
      executeGoogleAssetOperation(
        metaRoot,
        { kind: 'upload', planPath: 'plan.json', yes: true },
        resolve,
      ),
    ).rejects.toThrow('META_ASSET_CREDENTIAL_CALLBACK_REQUIRED');
    const productionRoot = path.join(root, 'production-fixture');
    await mkdir(productionRoot);
    await writeFile(
      path.join(productionRoot, 'unisane.config.ts'),
      `export default ${JSON.stringify({ ...config, environments: { test: { production: true } } })};`,
    );
    await expect(
      executeGoogleAssetOperation(
        productionRoot,
        { ...request, yes: true, accountConfirm: 'test:googleAds:123:ads-assets-link' },
        resolve,
      ),
    ).rejects.toThrow('SHARED_APPROVAL_REQUIRED');
    expect(resolve).not.toHaveBeenCalled();
    await expect(
      executeGoogleAssetOperation(
        root,
        { ...request, yes: true, accountConfirm: 'test:googleAds:123:ads-assets-link' },
        resolve,
      ),
    ).rejects.toThrow('credential-boundary');
    expect(resolve).toHaveBeenCalledWith(
      expect.objectContaining({ connection: 'google', environment: 'test', service: 'ads' }),
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
