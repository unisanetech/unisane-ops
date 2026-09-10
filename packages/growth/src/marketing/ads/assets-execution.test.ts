import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { expect, it, vi } from 'vitest';
import { marketingExecutionContextSchema } from '../schema/execution-context.js';
import {
  writeMarketingAdsAssetUploadReceipt,
  writeMarketingGoogleAdsCampaignAssetLinkReceipt,
} from './assets.js';
const config = marketingExecutionContextSchema.parse({
  version: 1,
  platformId: 'shop',
  appId: 'shop',
  defaultEnvironment: 'test',
  paths: {},
});
const time = new Date('2026-09-06T00:00:00Z');
function workspace() {
  const cwd = mkdtempSync(path.join(tmpdir(), 'asset-domain-'));
  const bytes = Buffer.from('fixture-image');
  writeFileSync(path.join(cwd, 'hero.png'), bytes);
  writeFileSync(
    path.join(cwd, 'plan.json'),
    JSON.stringify({
      kind: 'unisane.marketing.ads.asset-upload-plan',
      version: 1,
      platformId: 'shop',
      appId: 'shop',
      generatedAt: time.toISOString(),
      nonMutating: true,
      provider: 'googleAds',
      registryPath: 'registry.json',
      checks: [],
      operations: [
        {
          id: 'upload-hero',
          assetId: 'hero',
          provider: 'googleAds',
          assetType: 'image',
          sourceLocalPath: 'hero.png',
          sourceSha256: createHash('sha256').update(bytes).digest('hex'),
          mutation: 'upload_asset',
        },
      ],
    }),
  );
  const ref = path.join(cwd, '.unisane/marketing/assets/provider-refs/test/googleAds');
  mkdirSync(ref, { recursive: true });
  writeFileSync(
    path.join(ref, 'hero.json'),
    JSON.stringify({ providerAssetId: 'customers/123/assets/5' }),
  );
  return cwd;
}
it('previews linking without credentials and rejects foreign resource refs before dispatch', async () => {
  const cwd = workspace();
  try {
    const provider = vi.fn(async () => ({
      providerResourceNames: ['customers/123/campaignAssets/4~5~2'],
    }));
    const options = {
      cwd,
      assetIds: ['hero'],
      campaignResourceName: 'customers/123/campaigns/4',
      customerId: '123',
      now: time,
      provider,
    };
    expect((await writeMarketingGoogleAdsCampaignAssetLinkReceipt(config, options)).dryRun).toBe(
      true,
    );
    expect(provider).not.toHaveBeenCalled();
    await expect(
      writeMarketingGoogleAdsCampaignAssetLinkReceipt(config, {
        ...options,
        customerId: '999',
        yes: true,
      }),
    ).rejects.toThrow();
    expect(provider).not.toHaveBeenCalled();
    expect(
      (await writeMarketingGoogleAdsCampaignAssetLinkReceipt(config, { ...options, yes: true }))
        .receipt.operationResults[0]?.status,
    ).toBe('sent');
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
it('requires an injected uploader and blocks changed reviewed bytes', async () => {
  const cwd = workspace();
  try {
    const options = {
      cwd,
      planPath: 'plan.json',
      now: time,
      accountConfirm: 'test:googleAds:123:ads-assets-upload',
      providerCredentials: { googleAds: { accountId: '123' } },
    };
    const preview = await writeMarketingAdsAssetUploadReceipt(config, options);
    expect(preview.ok).toBe(true);
    const live = {
      ...options,
      yes: true,
      receiptPath: preview.path!,
      approvalRef: 'review-1',
      operationConfirm: 'live-assets:test:upload-hero:review-1',
      liveExecutorMode: 'api' as const,
    };
    expect((await writeMarketingAdsAssetUploadReceipt(config, live)).receipt.blockers).toContain(
      'provider_uploader_missing:googleAds',
    );
    const upload = vi.fn(async () => ({
      providerAssetId: 'customers/123/assets/5',
      message: 'Acknowledged',
    }));
    writeFileSync(path.join(cwd, 'hero.png'), 'changed');
    const changed = await writeMarketingAdsAssetUploadReceipt(config, {
      ...live,
      providerUploaders: { googleAds: upload },
    });
    expect(changed.ok).toBe(false);
    expect(changed.receipt.operationResults[0]?.message).toContain('SOURCE_CHANGED');
    expect(upload).not.toHaveBeenCalled();
    writeFileSync(path.join(cwd, 'hero.png'), 'fixture-image');
    expect(
      (
        await writeMarketingAdsAssetUploadReceipt(config, {
          ...live,
          providerUploaders: { googleAds: upload },
        })
      ).ok,
    ).toBe(true);
    expect(upload).toHaveBeenCalledOnce();
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
