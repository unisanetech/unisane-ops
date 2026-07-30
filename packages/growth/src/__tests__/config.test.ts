import { describe, expect, it } from 'vitest';
import { defineGrowthConfig, growthConfigContribution, type GrowthConfig } from '../config.js';

const input: GrowthConfig = {
  schemaVersion: 1 as const,
  adoptionMode: 'adopt-existing' as const,
  capabilities: ['seo', 'analytics'],
  environments: {
    production: {
      connections: {
        google: 'google-primary',
      },
      resources: [
        {
          provider: 'google',
          connection: 'google-primary',
          service: 'analytics',
          resourceType: 'property',
          resourceId: 'properties/123',
        },
      ],
    },
  },
  manifests: {
    events: 'ops/events.json',
  },
  runtime: {
    integration: 'existing' as const,
  },
  policy: {
    mutation: 'approval-required' as const,
    spend: 'approval-required' as const,
  },
};

describe('Growth config contribution', () => {
  it('publishes the exact root schema contribution', () => {
    expect(growthConfigContribution.namespace).toBe('growth');
    expect(growthConfigContribution.schema.parse(input)).toEqual(input);
  });

  it('rejects duplicate capabilities and mismatched connection references', () => {
    expect(() =>
      defineGrowthConfig({
        ...input,
        capabilities: ['seo', 'seo'],
      }),
    ).toThrow('Growth capabilities must be unique');
    expect(() =>
      defineGrowthConfig({
        ...input,
        environments: {
          production: {
            connections: input.environments.production!.connections,
            resources: [
              {
                ...input.environments.production!.resources[0]!,
                connection: 'google-secondary',
              },
            ],
          },
        },
      }),
    ).toThrow('does not use the selected google connection');
  });

  it('keeps audit-only adoption free of installing runtime selections', () => {
    expect(() =>
      defineGrowthConfig({
        ...input,
        adoptionMode: 'audit-only',
        runtime: {
          integration: 'web-runtime',
        },
      }),
    ).toThrow('Audit-only adoption cannot select an installing runtime integration');
  });
});
