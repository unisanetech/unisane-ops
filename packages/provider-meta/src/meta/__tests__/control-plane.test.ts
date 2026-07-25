import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { FetchLike } from '@unisane/growth/marketing';
import { saveMarketingMetaAuthProfile } from '../auth.js';
import { buildMetaAdsInventory, buildMetaSetupStatus } from '../../cli/control-plane/model.js';

function graphResponse(value: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status >= 200 && status < 300 ? 'OK' : 'Error',
    json: async () => value,
    text: async () => JSON.stringify(value),
  } as Response;
}

async function writeMarketingConfig(cwd: string): Promise<void> {
  await mkdir(path.join(cwd, 'config'), { recursive: true });
  await writeFile(
    path.join(cwd, 'config', 'marketing.json'),
    `${JSON.stringify(
      {
        version: 1,
        platformId: 'true-resume',
        appId: 'true-resume',
        defaultEnvironment: 'production',
        providers: {
          metaAds: {
            state: 'configured',
            accountIdEnv: 'META_AD_ACCOUNT_ID',
            pixelIdEnv: 'META_PIXEL_ID',
          },
        },
      },
      null,
      2,
    )}\n`,
    'utf8',
  );
}

async function withMetaProfile(
  fn: (args: { cwd: string; authHome: string; fetch: FetchLike }) => Promise<void>,
): Promise<void> {
  const cwd = await mkdtemp(path.join(tmpdir(), 'unisane-meta-provider-cwd-'));
  const authHome = await mkdtemp(path.join(tmpdir(), 'unisane-meta-provider-auth-'));
  const fetch = async (input: string | URL | Request) => {
    const url = String(input);
    if (url.includes('/me/adaccounts')) {
      return graphResponse({
        data: [
          {
            id: 'act_123',
            account_id: '123',
            name: 'True Resume Ads',
            account_status: '1',
            currency: 'USD',
            timezone_name: 'Asia/Kolkata',
            business: { id: 'biz_1', name: 'True Resume' },
          },
        ],
      });
    }
    if (url.includes('/act_123/adspixels')) {
      return graphResponse({
        data: [{ id: 'pixel_1', name: 'True Resume Pixel', account_id: 'act_123' }],
      });
    }
    if (url.includes('/me/businesses')) {
      return graphResponse({
        data: [{ id: 'biz_1', name: 'True Resume' }],
      });
    }
    if (url.includes('/me/accounts')) {
      return graphResponse({
        data: [
          {
            id: 'page_1',
            name: 'True Resume',
            category: 'Software',
            instagram_business_account: {
              id: 'ig_1',
              username: 'trueresume',
              name: 'True Resume',
            },
          },
        ],
      });
    }
    return graphResponse({ error: { message: `Unexpected URL ${url}` } }, 404);
  };
  try {
    await writeMarketingConfig(cwd);
    await saveMarketingMetaAuthProfile({
      profile: 'true-resume',
      accessToken: 'meta-token',
      scopes: ['ads_read'],
      secretStore: 'file',
      runtime: { authHome, store: 'file', allowPlaintextStore: true },
    });
    await fn({ cwd, authHome, fetch: fetch as FetchLike });
  } finally {
    await rm(cwd, { recursive: true, force: true });
    await rm(authHome, { recursive: true, force: true });
  }
}

describe('meta provider control plane', () => {
  it('reports Meta setup status through shared control-plane models', async () => {
    await withMetaProfile(async ({ cwd, authHome }) => {
      const report = await buildMetaSetupStatus({
        cwd,
        authHome,
        store: 'file',
        allowPlaintextStore: true,
        profile: 'true-resume',
      });

      expect(report.authProfile.status).toBe('ready');
      expect(report.setupStatus.checks).toContainEqual(
        expect.objectContaining({ id: 'meta.review', status: 'blocked' }),
      );
      expect(report.envReport.entries).toContainEqual(
        expect.objectContaining({ name: 'META_AD_ACCOUNT_ID', kind: 'provider-resource-ref' }),
      );
    });
  });

  it('builds read-only Meta ad account and pixel inventory artifacts', async () => {
    await withMetaProfile(async ({ cwd, authHome, fetch }) => {
      const inventory = await buildMetaAdsInventory(
        {
          cwd,
          authHome,
          store: 'file',
          allowPlaintextStore: true,
          profile: 'true-resume',
          output: '.unisane/provider/meta/production/inventory/ads/latest.json',
        },
        { fetch, env: { META_AD_ACCOUNT_ID: 'act_123' } },
      );

      expect(inventory.resources).toContainEqual(
        expect.objectContaining({
          type: 'adAccount',
          id: 'act_123',
          title: 'True Resume Ads',
        }),
      );
      expect(inventory.resources).toContainEqual(
        expect.objectContaining({
          type: 'pixel',
          id: 'pixel_1',
          parentId: 'act_123',
        }),
      );
      expect(inventory.resources).toContainEqual(
        expect.objectContaining({
          type: 'business',
          id: 'biz_1',
          title: 'True Resume',
        }),
      );
      expect(inventory.resources).toContainEqual(
        expect.objectContaining({
          type: 'page',
          id: 'page_1',
          title: 'True Resume',
        }),
      );
      expect(inventory.resources).toContainEqual(
        expect.objectContaining({
          type: 'instagramActor',
          id: 'ig_1',
          parentId: 'page_1',
        }),
      );
      expect(inventory.artifact?.relativePath).toBe(
        '.unisane/provider/meta/production/inventory/ads/latest.json',
      );
    });
  });

  it('keeps optional Meta social inventory failures as warnings', async () => {
    await withMetaProfile(async ({ cwd, authHome }) => {
      const fetch = async (input: string | URL | Request) => {
        const url = String(input);
        if (url.includes('/me/adaccounts')) {
          return graphResponse({
            data: [
              {
                id: 'act_123',
                account_id: '123',
                name: 'True Resume Ads',
                account_status: '1',
              },
            ],
          });
        }
        if (url.includes('/act_123/adspixels')) {
          return graphResponse({ data: [] });
        }
        if (url.includes('/me/businesses') || url.includes('/me/accounts')) {
          return graphResponse({ error: { message: 'Missing permission' } }, 403);
        }
        return graphResponse({ error: { message: `Unexpected URL ${url}` } }, 404);
      };

      const inventory = await buildMetaAdsInventory(
        {
          cwd,
          authHome,
          store: 'file',
          allowPlaintextStore: true,
          profile: 'true-resume',
        },
        { fetch: fetch as FetchLike, env: { META_AD_ACCOUNT_ID: 'act_123' } },
      );

      expect(inventory.resources).toContainEqual(
        expect.objectContaining({ type: 'adAccount', id: 'act_123' }),
      );
      expect(inventory.warnings).toContainEqual(
        expect.stringContaining('Meta business inventory skipped'),
      );
      expect(inventory.warnings).toContainEqual(
        expect.stringContaining('Meta page/Instagram inventory skipped'),
      );
    });
  });

  it('marks missing Meta token profiles as not ready without printing secrets', async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), 'unisane-meta-provider-missing-cwd-'));
    const authHome = await mkdtemp(path.join(tmpdir(), 'unisane-meta-provider-missing-auth-'));
    try {
      await writeMarketingConfig(cwd);
      const report = await buildMetaSetupStatus({
        cwd,
        authHome,
        store: 'file',
        allowPlaintextStore: true,
        profile: 'true-resume',
      });

      expect(report.authProfile.status).toBe('missing');
      expect(report.setupStatus.ready).toBe(false);
      expect(report.setupStatus.nextActions).toContainEqual(
        expect.objectContaining({ id: 'meta.auth.save' }),
      );
    } finally {
      await rm(cwd, { recursive: true, force: true });
      await rm(authHome, { recursive: true, force: true });
    }
  });
});
