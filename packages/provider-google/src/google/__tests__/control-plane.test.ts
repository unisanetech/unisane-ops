import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { runWithGoogleProviderCommandContext } from '../../cli/runtime.js';
import {
  applyGoogleApisPlan,
  buildGoogleApisInventory,
  buildGoogleApisPlan,
  buildGoogleProductsInventory,
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

async function withConnectionRuntime(
  fn: (args: { cwd: string; options: GoogleProviderCliOptions; calls: string[] }) => Promise<void>,
): Promise<void> {
  const cwd = await mkdtemp(path.join(tmpdir(), 'unisane-google-provider-cwd-'));
  const calls: string[] = [];
  const fetch = async (input: string | URL) => {
    const url = String(input);
    calls.push(url);
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
    await runWithGoogleProviderCommandContext(
      {
        cwd,
        runtime: {
          resolveBinding: async () => ({ accessToken: 'access-token' }),
        },
      },
      () =>
        fn({
          cwd,
          calls,
          options: {
            cwd,
            connection: 'google-primary',
            project: 'true-resume-prod',
            environment: 'production',
            fetch,
          },
        }),
    );
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
}

describe('google provider control plane', () => {
  it('builds Google API inventory and plan artifacts from official API responses', async () => {
    await withConnectionRuntime(async ({ options }) => {
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
    await withConnectionRuntime(async ({ cwd, options, calls }) => {
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

  it('discovers connected Google products and reports guarded Ads access honestly', async () => {
    await withConnectionRuntime(async ({ options }) => {
      const inventory = await buildGoogleProductsInventory({
        ...options,
        output: '.unisane/provider/google/production/inventory/products/latest.json',
      });

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
        expect.objectContaining({
          type: 'googleAdsDeveloperToken',
          id: 'google-ads-developer-access',
          state: 'missing',
        }),
      );
      expect(inventory.artifact?.relativePath).toBe(
        '.unisane/provider/google/production/inventory/products/latest.json',
      );
    });
  });
});
