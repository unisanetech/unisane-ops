import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  metaCapabilityInventory,
  metaCapabilityInventorySchema,
  metaCapabilitySchema,
} from './capabilities.js';

describe('Meta source capability inventory', () => {
  it('keeps fixture proof separate from implementation and account readiness', () => {
    const inventory = metaCapabilityInventory();
    expect(inventory).toMatchObject({
      schemaVersion: 2,
      basis: 'source-inventory',
      accountReadiness: 'not-evaluated',
    });
    expect(
      inventory.capabilities.find((item) => item.id === 'meta.ads.campaign.pause'),
    ).toMatchObject({
      implementation: 'implemented',
      verification: 'fixture-proven',
      requirements: expect.arrayContaining(['human-approval', 'host-credential-binding']),
    });
    expect(
      inventory.capabilities.find((item) => item.id === 'meta.ads.campaign.create'),
    ).toMatchObject({ implementation: 'partial', verification: 'not-verified' });
    expect(inventory.capabilities.find((item) => item.id === 'meta.events.issues')).toMatchObject({
      implementation: 'not-implemented',
      verification: 'not-verified',
    });
    expect(inventory).not.toHaveProperty('mutationAvailable');
    expect(
      inventory.capabilities.every((item) => !('state' in item) && !('available' in item)),
    ).toBe(true);
  });

  it('references existing package-owned source and proof files', () => {
    for (const capability of metaCapabilityInventory().capabilities) {
      for (const reference of [
        ...capability.implementationReferences,
        ...capability.verificationReferences,
      ]) {
        const file = new URL(`../../${reference}`, import.meta.url);
        expect(existsSync(fileURLToPath(file)), `${capability.id}: ${reference}`).toBe(true);
      }
      for (const reference of capability.verificationReferences)
        expect(reference).toMatch(/\.test\.ts$/);
    }
  });

  it.each([
    { implementationReferences: [] },
    { verificationReferences: [] },
    { verificationReferences: ['src/meta/connect.ts'] },
    { implementation: 'not-implemented' },
    { verification: 'not-verified' },
    { verification: 'live-proven' },
    { available: true },
    { implementationReferences: ['../host.ts'] },
    { hostOperations: ['meta.read', 'meta.read'] },
  ])('rejects contradictory or unsupported claims %j', (change) => {
    const capability = metaCapabilityInventory().capabilities[0];
    expect(metaCapabilitySchema.safeParse({ ...capability, ...change }).success).toBe(false);
  });

  it('rejects duplicate IDs, empty inventory and unsupported account-readiness claims', () => {
    const inventory = metaCapabilityInventory();
    expect(
      metaCapabilityInventorySchema.safeParse({
        ...inventory,
        capabilities: [inventory.capabilities[0], inventory.capabilities[0]],
      }).success,
    ).toBe(false);
    expect(
      metaCapabilityInventorySchema.safeParse({ ...inventory, capabilities: [] }).success,
    ).toBe(false);
    expect(
      metaCapabilityInventorySchema.safeParse({ ...inventory, accountReadiness: 'ready' }).success,
    ).toBe(false);
    expect(
      metaCapabilityInventorySchema.safeParse({ ...inventory, schemaVersion: 1 }).success,
    ).toBe(false);
  });

  it('isolates returned objects so one caller cannot alter another inventory', () => {
    const expected = metaCapabilityInventory();
    const first = metaCapabilityInventory();
    first.capabilities[0]!.requirements.length = 0;
    first.capabilities[0]!.title = 'changed';
    first.capabilities.length = 0;
    expect(metaCapabilityInventory()).toEqual(expected);
  });
});
