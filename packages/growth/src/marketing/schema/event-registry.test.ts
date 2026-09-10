import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadMarketingRegistries } from '../registry/load-registries.js';
import { marketingExecutionContextSchema } from './execution-context.js';
import { marketingEventRegistrySchema, migrateMarketingEventRegistryV1 } from './event-registry.js';

const baseEvent = {
  id: 'purchase-confirmed',
  name: 'purchase_confirmed',
  owner: 'sample',
  lifecycle: 'purchase',
  requiredProperties: [
    { name: 'transactionId', type: 'string' },
    { name: 'value', type: 'number' },
    { name: 'currency', type: 'string' },
  ],
  consent: { required: true, categories: ['analytics', 'ads'] },
  eventIdRule: 'stable id for one logical purchase',
  logicalEventIdRule: 'stable order correlation',
  transactionIdRule: 'order id',
  valueRule: 'order total',
  currencyRule: 'order currency',
  dedupeRule: 'browser and server share one event id',
  mappings: {},
} as const;

const legacyRegistry = {
  version: 1,
  platformId: 'sample',
  events: [
    {
      id: 'lead-created',
      name: 'lead_created',
      owner: 'sample',
      source: 'browser',
      lifecycle: 'lead',
      requiredProperties: [],
      consent: { required: true, categories: ['analytics'] },
      eventIdRule: 'one browser event id',
      mappings: {},
    },
    {
      id: 'purchase-confirmed',
      name: 'purchase_confirmed',
      owner: 'sample',
      source: 'server',
      lifecycle: 'purchase',
      requiredProperties: [],
      consent: { required: true, categories: ['analytics', 'ads'] },
      eventIdRule: 'one server event id',
      transactionIdRule: 'order id',
      dedupeRule: 'order id',
      mappings: {},
    },
  ],
} as const;

describe('marketing event registry v2', () => {
  it('models a browser-and-server event with explicit per-channel emitters', () => {
    const registry = marketingEventRegistrySchema.parse({
      version: 2,
      platformId: 'sample',
      events: [
        {
          ...baseEvent,
          deliveryExpectation: 'browser-and-server',
          expectedEmitters: { browser: ['meta-pixel'], server: ['meta-capi'] },
        },
      ],
    });

    expect(registry.events[0]).toMatchObject({
      deliveryExpectation: 'browser-and-server',
      expectedEmitters: { browser: ['meta-pixel'], server: ['meta-capi'] },
    });
  });

  it('rejects contradictory delivery and emitter declarations', () => {
    const result = marketingEventRegistrySchema.safeParse({
      version: 2,
      platformId: 'sample',
      events: [
        {
          ...baseEvent,
          deliveryExpectation: 'server-only',
          expectedEmitters: { browser: ['meta-pixel'], server: ['meta-capi'] },
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it('requires a dedupe rule for browser-and-server delivery', () => {
    const result = marketingEventRegistrySchema.safeParse({
      version: 2,
      platformId: 'sample',
      events: [
        {
          ...baseEvent,
          dedupeRule: undefined,
          deliveryExpectation: 'browser-and-server',
          expectedEmitters: {},
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it('migrates version 1 once without inventing emitter expectations', () => {
    const migrated = migrateMarketingEventRegistryV1(legacyRegistry);

    expect(migrated).toMatchObject({
      version: 2,
      events: [
        {
          id: 'lead-created',
          deliveryExpectation: 'browser-only',
          expectedEmitters: {},
          logicalEventIdRule: 'one browser event id',
        },
        {
          id: 'purchase-confirmed',
          deliveryExpectation: 'server-only',
          expectedEmitters: {},
          logicalEventIdRule: 'order id',
          canonicalCorrelationRule: 'order id',
        },
      ],
    });
    expect(marketingEventRegistrySchema.safeParse(legacyRegistry).success).toBe(false);
  });

  it('rejects version 1 during ordinary registry loading', async () => {
    const cwd = mkdtempSync(path.join(tmpdir(), 'unisane-growth-event-registry-'));
    try {
      writeFileSync(path.join(cwd, 'events.json'), JSON.stringify(legacyRegistry));
      writeFileSync(
        path.join(cwd, 'conversions.json'),
        JSON.stringify({ version: 1, platformId: 'sample', conversions: [] }),
      );
      const config = marketingExecutionContextSchema.parse({
        version: 1,
        platformId: 'sample',
        appId: 'sample-app',
        paths: { eventRegistry: 'events.json', conversionRegistry: 'conversions.json' },
      });

      await expect(loadMarketingRegistries(config, { cwd })).rejects.toThrow(
        '[MARKETING_EVENT_REGISTRY_V1_RETIRED]',
      );
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });
});
