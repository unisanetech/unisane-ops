import { describe, expect, it } from 'vitest';
import {
  allPagesTrigger,
  dataLayerEventTrigger,
  defineGoogleTagManagerContainer,
  evaluateGoogleTagManagerPolicies,
  getGoogleTagManagerDesiredResources,
  googleAnalytics4PageviewTag,
  planGoogleTagManagerChanges,
  validateGoogleTagManagerManifest,
  type GoogleTagManagerContainerManifest,
} from '../index.js';

function manifest(
  overrides: Partial<GoogleTagManagerContainerManifest> = {},
): GoogleTagManagerContainerManifest {
  return defineGoogleTagManagerContainer({
    appId: 'example',
    accountId: '123',
    containerId: 'GTM-123',
    namespace: 'example',
    environments: {
      staging: {
        workspacePrefix: 'example-staging',
        publishPolicy: 'never',
        allowedVendorDomains: ['www.googletagmanager.com', 'www.google-analytics.com'],
      },
    },
    builtInVariables: ['page_path'],
    variables: [
      {
        slug: 'measurement_id',
        type: 'constant',
        parameters: [{ key: 'value', value: 'G-TEST' }],
      },
    ],
    triggers: [
      allPagesTrigger(),
      dataLayerEventTrigger({ slug: 'purchase', eventName: 'purchase' }),
    ],
    tags: [
      googleAnalytics4PageviewTag({
        slug: 'pageview',
        measurementId: { variable: 'measurement_id' },
        triggerSlugs: ['all_pages'],
      }),
    ],
    ...overrides,
  });
}

describe('Growth GTM domain', () => {
  it('validates manifests and policy without a provider dependency', () => {
    const value = manifest();
    expect(validateGoogleTagManagerManifest(value)).toEqual({ ok: true, issues: [] });
    expect(evaluateGoogleTagManagerPolicies({ manifest: value, environment: 'staging' })).toEqual({
      ok: true,
      issues: [],
    });
  });

  it('builds deterministic provider-neutral desired state and plans', () => {
    const value = manifest();
    const desired = getGoogleTagManagerDesiredResources(value);
    const plan = planGoogleTagManagerChanges({
      manifest: value,
      remote: {
        containerPath: 'accounts/123/containers/GTM-123',
        resources: [],
      },
    });

    expect(desired.length).toBeGreaterThan(0);
    expect(plan.operations).toHaveLength(desired.length);
    expect(plan.operations.every((operation) => operation.type === 'create_resource')).toBe(true);
  });

  it('fails broken cross-resource references before remote execution', () => {
    const value = manifest({
      tags: [
        googleAnalytics4PageviewTag({
          slug: 'pageview',
          measurementId: { variable: 'missing' },
          triggerSlugs: ['missing'],
        }),
      ],
    });
    const result = validateGoogleTagManagerManifest(value);

    expect(result.ok).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain('unknown_trigger');
    expect(result.issues.map((issue) => issue.code)).toContain('unknown_parameter_variable');
  });
});
