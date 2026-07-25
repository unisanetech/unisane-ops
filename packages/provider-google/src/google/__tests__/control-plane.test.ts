import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { saveGoogleAuthProfile } from '../auth.js';
import {
  applyGoogleApisPlan,
  buildGoogleApisInventory,
  buildGoogleApisPlan,
  buildGoogleProductsInventory,
  buildGoogleSetupStatus,
  type GoogleProviderCliOptions,
} from '../control-plane/model.js';

function jsonResponse(value: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status >= 200 && status < 300 ? 'OK' : 'Error',
    text: async () => JSON.stringify(value),
  } as Response;
}

async function withSavedProfile(
  fn: (args: {
    cwd: string;
    authHome: string;
    options: GoogleProviderCliOptions;
    calls: string[];
  }) => Promise<void>,
): Promise<void> {
  const cwd = await mkdtemp(path.join(tmpdir(), 'unisane-google-provider-cwd-'));
  const authHome = await mkdtemp(path.join(tmpdir(), 'unisane-google-provider-auth-'));
  const calls: string[] = [];
  const fetch = async (input: string | URL) => {
    const url = String(input);
    calls.push(url);
    if (url === 'https://oauth2.googleapis.com/token') {
      return jsonResponse({
        access_token: 'access-token',
        scope:
          'https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/tagmanager.readonly https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/webmasters.readonly https://www.googleapis.com/auth/adwords',
        expires_in: 3600,
      });
    }
    if (url.includes('cloudresourcemanager.googleapis.com')) {
      return jsonResponse({
        projectId: 'true-resume-prod',
        projectNumber: '123',
        name: 'True Resume',
        lifecycleState: 'ACTIVE',
      });
    }
    if (url.includes('serviceusage.googleapis.com') && url.includes(':enable')) {
      return jsonResponse({ name: 'operations/enable-analyticsdata' });
    }
    if (url.includes('tagmanager.googleapis.com/tagmanager/v2/accounts/123/containers')) {
      return jsonResponse({
        container: [
          {
            accountId: '123',
            containerId: '456',
            publicId: 'GTM-M4TMS2HF',
            name: 'trueresume.io',
            path: 'accounts/123/containers/456',
          },
        ],
      });
    }
    if (url.includes('tagmanager.googleapis.com/tagmanager/v2/accounts')) {
      return jsonResponse({
        account: [{ accountId: '123', name: 'True Resume', path: 'accounts/123' }],
      });
    }
    if (url.includes('analyticsadmin.googleapis.com')) {
      return jsonResponse({
        accountSummaries: [
          {
            account: 'accounts/1',
            displayName: 'True Resume',
            propertySummaries: [{ property: 'properties/14929949155', displayName: 'True Resume' }],
          },
        ],
      });
    }
    if (url.includes('www.googleapis.com/webmasters')) {
      return jsonResponse({
        siteEntry: [{ siteUrl: 'sc-domain:trueresume.io', permissionLevel: 'siteOwner' }],
      });
    }
    if (url.includes('googleads.googleapis.com')) {
      return jsonResponse({ resourceNames: ['customers/9876543210'] });
    }
    if (url.includes('serviceusage.googleapis.com')) {
      return jsonResponse({
        services: [
          {
            name: 'projects/true-resume-prod/services/serviceusage.googleapis.com',
            state: 'ENABLED',
            config: { title: 'Service Usage API' },
          },
          {
            name: 'projects/true-resume-prod/services/cloudresourcemanager.googleapis.com',
            state: 'ENABLED',
            config: { title: 'Cloud Resource Manager API' },
          },
        ],
      });
    }
    return jsonResponse({ error: { message: `Unexpected URL ${url}` } }, 404);
  };
  try {
    await saveGoogleAuthProfile({
      profile: 'true-resume',
      clientId: 'client-id',
      clientSecret: 'client-secret',
      refreshToken: 'refresh-token',
      scopes: [
        'https://www.googleapis.com/auth/cloud-platform',
        'https://www.googleapis.com/auth/tagmanager.readonly',
        'https://www.googleapis.com/auth/analytics.readonly',
        'https://www.googleapis.com/auth/webmasters.readonly',
        'https://www.googleapis.com/auth/adwords',
      ],
      secretStore: 'file',
      runtime: { authHome, store: 'file', allowPlaintextStore: true },
    });
    await fn({
      cwd,
      authHome,
      calls,
      options: {
        cwd,
        authHome,
        store: 'file',
        allowPlaintextStore: true,
        profile: 'true-resume',
        project: 'true-resume-prod',
        app: 'true-resume',
        env: 'production',
        fetch,
      },
    });
  } finally {
    await rm(cwd, { recursive: true, force: true });
    await rm(authHome, { recursive: true, force: true });
  }
}

describe('google provider control plane', () => {
  it('reports missing project and auth as actionable setup status', async () => {
    const authHome = await mkdtemp(path.join(tmpdir(), 'unisane-google-provider-empty-auth-'));
    try {
      const report = await buildGoogleSetupStatus({
        cwd: process.cwd(),
        authHome,
        store: 'file',
        allowPlaintextStore: true,
        profile: 'true-resume',
      });

      expect(report.projectId).toBeNull();
      expect(report.setupStatus.ready).toBe(false);
      expect(report.setupStatus.checks).toContainEqual(
        expect.objectContaining({ id: 'google.project', status: 'fail' }),
      );
      expect(report.setupStatus.nextActions).toContainEqual(
        expect.objectContaining({ id: 'google.auth.login', owner: 'developer' }),
      );
      expect(report.envReport.entries).toContainEqual(
        expect.objectContaining({ name: 'GOOGLE_CLOUD_PROJECT', configured: false }),
      );
    } finally {
      await rm(authHome, { recursive: true, force: true });
    }
  });

  it('builds Google API inventory and plan artifacts from official API responses', async () => {
    await withSavedProfile(async ({ options }) => {
      const inventory = await buildGoogleApisInventory({
        ...options,
        output: '.unisane/provider/google/production/inventory/apis/latest.json',
      });
      const plan = await buildGoogleApisPlan({
        ...options,
        inventory: inventory.artifact?.relativePath,
        output: '.unisane/provider/google/production/plans/apis/latest.json',
      });

      expect(inventory.projectId).toBe('true-resume-prod');
      expect(inventory.resources).toContainEqual(
        expect.objectContaining({ type: 'api', id: 'serviceusage.googleapis.com' }),
      );
      expect(inventory.artifact?.relativePath).toBe(
        '.unisane/provider/google/production/inventory/apis/latest.json',
      );
      expect(plan.summary.create).toBeGreaterThan(0);
      expect(plan.actions).toContainEqual(
        expect.objectContaining({
          id: 'google.api.analyticsdata.googleapis.com',
          type: 'create',
          risk: 'low',
        }),
      );
    });
  });

  it('applies only reviewed Google API enablement plans and writes receipts', async () => {
    await withSavedProfile(async ({ cwd, options, calls }) => {
      const plan = await buildGoogleApisPlan(options);
      const planPath = path.join(cwd, 'google-plan.json');
      await writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');

      await expect(applyGoogleApisPlan({ ...options, plan: 'google-plan.json' })).rejects.toThrow(
        'CONTROL_PLANE_REVIEWED_PLAN_REQUIRED',
      );

      const receipt = await applyGoogleApisPlan({
        ...options,
        plan: 'google-plan.json',
        yes: true,
        receiptOutput: '.unisane/provider/google/production/receipts/apis/latest.json',
        productionConfirm: 'production:true-resume-prod:google-apis-apply',
      });

      expect(receipt.status).toBe('succeeded');
      expect(receipt.enabledServices.length).toBeGreaterThan(0);
      expect(receipt.artifact?.relativePath).toBe(
        '.unisane/provider/google/production/receipts/apis/latest.json',
      );
      expect(calls.some((url) => url.includes(':enable'))).toBe(true);
    });
  });

  it('discovers Google product handoff resources for GTM, GA4, Search Console, and Ads', async () => {
    await withSavedProfile(async ({ options }) => {
      const inventory = await buildGoogleProductsInventory(
        {
          ...options,
          developerTokenEnv: 'GOOGLE_ADS_DEVELOPER_TOKEN',
          output: '.unisane/provider/google/production/inventory/products/latest.json',
        },
        { env: { GOOGLE_ADS_DEVELOPER_TOKEN: 'developer-token' } },
      );

      expect(inventory.requiredScopes).toContain(
        'https://www.googleapis.com/auth/tagmanager.readonly',
      );
      expect(inventory.resources).toContainEqual(
        expect.objectContaining({
          type: 'gtmContainer',
          id: '456',
          metadata: expect.objectContaining({ publicId: 'GTM-M4TMS2HF' }),
        }),
      );
      expect(inventory.resources).toContainEqual(
        expect.objectContaining({ type: 'ga4Property', id: '14929949155' }),
      );
      expect(inventory.resources).toContainEqual(
        expect.objectContaining({ type: 'searchConsoleSite', id: 'sc-domain:trueresume.io' }),
      );
      expect(inventory.resources).toContainEqual(
        expect.objectContaining({ type: 'googleAdsCustomer', id: '9876543210' }),
      );
      expect(inventory.artifact?.relativePath).toBe(
        '.unisane/provider/google/production/inventory/products/latest.json',
      );
    });
  });
});
