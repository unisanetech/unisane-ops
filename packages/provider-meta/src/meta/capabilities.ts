import { metaCapabilityCatalog } from './capabilities/catalog.js';
import {
  metaCapabilityInventorySchema,
  type MetaCapabilityInventory,
} from './capabilities/schema.js';

export * from './capabilities/schema.js';

/** Static provider facts only: never evaluates account readiness or authorizes execution. */
export function metaCapabilityInventory(): MetaCapabilityInventory {
  return metaCapabilityInventorySchema.parse({
    schemaVersion: 2,
    provider: 'meta',
    basis: 'source-inventory',
    accountReadiness: 'not-evaluated',
    capabilities: metaCapabilityCatalog,
  });
}
