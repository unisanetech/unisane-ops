import type { MetaCapability } from './schema.js';

// Provider facts only. Host operation references do not grant availability or permission.
const implemented: readonly MetaCapability[] = [
  {
    id: 'meta.connection.local-custody',
    family: 'connection',
    title: 'Local credential custody',
    effect: 'offline',
    implementation: 'implemented',
    implementationReferences: [
      'src/meta/local-credential-store.ts',
      'src/meta/local-credential-resolver.ts',
    ],
    verification: 'fixture-proven',
    verificationReferences: [
      'src/meta/local-credential-store.test.ts',
      'src/meta/local-credential-resolver.test.ts',
    ],
    hostOperations: [],
    requirements: ['host-credential-binding', 'live-verification'],
    summary: 'Context-bound macOS Keychain storage and callback-only credential resolution.',
    nextStep:
      'Verify custody and recovery on the selected host; this inventory does not inspect credentials.',
  },
  {
    id: 'meta.connection.lifecycle',
    family: 'connection',
    title: 'Connect and recover access',
    effect: 'read-network',
    implementation: 'implemented',
    implementationReferences: [
      'src/meta/connect.ts',
      'src/meta/disconnect.ts',
      'src/meta/connection-lifecycle.ts',
    ],
    verification: 'fixture-proven',
    verificationReferences: ['src/meta/connect.test.ts'],
    hostOperations: [],
    requirements: ['host-credential-binding', 'live-verification'],
    summary:
      'System-user connect, refresh, rotation and local disconnect; browser OAuth is not covered.',
    nextStep:
      'Use the canonical lifecycle and verify selected identity, grants and recovery on a real account.',
  },
  {
    id: 'meta.connection.discovery',
    family: 'connection',
    title: 'Discover Meta resources',
    effect: 'read-network',
    implementation: 'implemented',
    implementationReferences: ['src/meta/connection-discovery.ts'],
    verification: 'fixture-proven',
    verificationReferences: ['src/meta/connection-discovery.test.ts'],
    hostOperations: ['meta.connection.discover'],
    requirements: ['canonical-connection', 'host-credential-binding', 'live-verification'],
    summary:
      'Bounded identity, grants, business, ad-account, Pixel, dataset, Page and Instagram discovery.',
    nextStep:
      'Verify discovery with the selected account and explicitly resolve ambiguous resources.',
  },
  {
    id: 'meta.connection.resource-selection',
    family: 'connection',
    title: 'Select account and event resources',
    effect: 'offline',
    implementation: 'implemented',
    implementationReferences: [
      'src/meta/connection-lifecycle.ts',
      'src/meta/connection.ts',
      'src/meta/connection-resource-selection.ts',
      'src/meta/terminal-resource-prompt.ts',
    ],
    verification: 'fixture-proven',
    verificationReferences: [
      'src/meta/connection.test.ts',
      'src/meta/connect.test.ts',
      'src/meta/connection-resource-selection.test.ts',
      'src/meta/terminal-resource-prompt.test.ts',
    ],
    hostOperations: [],
    requirements: ['canonical-connection', 'selected-resources', 'live-verification'],
    summary:
      'Validated connection metadata, explicit flags and guided terminal account/event-source selection; no automatic selection.',
    nextStep:
      'Bind intended resources through connect/refresh; selection does not prove event delivery.',
  },
  {
    id: 'meta.ads.reporting',
    family: 'advertising',
    title: 'Advertising reports',
    effect: 'read-network',
    implementation: 'implemented',
    implementationReferences: ['src/meta/marketing/report-pull.ts'],
    verification: 'fixture-proven',
    verificationReferences: ['src/meta/marketing/__tests__/marketing-provider.test.ts'],
    hostOperations: ['meta.marketing.pull-report'],
    requirements: [
      'canonical-connection',
      'selected-resources',
      'host-credential-binding',
      'live-verification',
    ],
    summary:
      'Account, campaign, ad-set, ad, creative and device report paths with bounded transport.',
    nextStep: 'Verify the requested report, window and account permissions against real evidence.',
  },
  {
    id: 'meta.ads.campaign.pause',
    family: 'advertising',
    title: 'Pause one campaign',
    effect: 'write-network',
    implementation: 'implemented',
    implementationReferences: ['src/meta/marketing/live-ads-executor.ts'],
    verification: 'fixture-proven',
    verificationReferences: ['src/meta/marketing/campaign-control.test.ts'],
    hostOperations: ['growth.campaign.pause'],
    requirements: [
      'canonical-connection',
      'selected-resources',
      'host-credential-binding',
      'human-approval',
      'durable-mutation-state',
      'live-verification',
    ],
    summary: 'Exact provider pause transport exists; it does not grant execution authority.',
    nextStep:
      'Use shared campaign plan/review/approve/apply/verify. Configure SQLite before automated or production writes; live acceptance remains pending.',
  },
  {
    id: 'meta.ads.campaign.verify',
    family: 'advertising',
    title: 'Read campaign status',
    effect: 'read-network',
    implementation: 'implemented',
    implementationReferences: ['src/meta/marketing/live-ads-executor.ts'],
    verification: 'fixture-proven',
    verificationReferences: ['src/meta/marketing/campaign-control.test.ts'],
    hostOperations: ['growth.campaign.pause'],
    requirements: [
      'canonical-connection',
      'selected-resources',
      'host-credential-binding',
      'live-verification',
    ],
    summary: 'Provider status read distinguishes paused, active and unknown.',
    nextStep:
      'Use shared campaign verification for the recorded run; provider acceptance remains distinct from business outcomes.',
  },
  {
    id: 'meta.ads.campaign.create',
    family: 'advertising',
    title: 'Create a paused campaign',
    effect: 'write-network',
    implementation: 'partial',
    implementationReferences: [
      'src/meta/marketing/live-ads-executor.ts',
      'src/meta/marketing/campaign-input.ts',
    ],
    verification: 'not-verified',
    verificationReferences: [],
    hostOperations: ['meta.marketing.execute-live'],
    requirements: [
      'canonical-connection',
      'selected-resources',
      'host-credential-binding',
      'human-approval',
      'durable-mutation-state',
      'live-verification',
    ],
    summary:
      'Limited campaign/ad-set/creative/ad creation exists; complete creation and recovery are not proven.',
    nextStep:
      'Complete reviewed inputs, partial-creation recovery and host execution before live verification.',
  },
  {
    id: 'meta.ads.assets.upload',
    family: 'advertising',
    title: 'Upload creative assets',
    effect: 'write-network',
    implementation: 'partial',
    implementationReferences: ['src/meta/marketing/asset-uploader.ts'],
    verification: 'fixture-proven',
    verificationReferences: ['src/meta/marketing/__tests__/marketing-provider.test.ts'],
    hostOperations: ['meta.marketing.upload-asset'],
    requirements: [
      'canonical-connection',
      'selected-resources',
      'host-credential-binding',
      'human-approval',
      'live-verification',
    ],
    summary:
      'Image upload has fixture coverage; complete asset and host delivery remains incomplete.',
    nextStep:
      'Compose approved host execution and verify supported asset processing with the selected account.',
  },
];

type MissingCapability = Pick<
  MetaCapability,
  'id' | 'family' | 'title' | 'effect' | 'summary' | 'nextStep' | 'requirements'
>;
const missing: readonly MissingCapability[] = [
  {
    id: 'meta.connection.browser-oauth',
    family: 'connection',
    title: 'Browser OAuth',
    effect: 'read-network',
    summary: 'Browser OAuth onboarding is not implemented.',
    nextStep: 'Implement provider OAuth and host custody; retain the system-user flow.',
    requirements: ['provider-api-verification', 'live-verification'],
  },
  {
    id: 'meta.account.settings',
    family: 'advertising',
    title: 'Account settings management',
    effect: 'write-network',
    summary: 'Resource discovery is not a complete account-settings editing workflow.',
    nextStep: 'Inventory supported settings and access, then add reviewed actions.',
    requirements: ['provider-api-verification', 'live-verification'],
  },
  {
    id: 'meta.ads.campaign.edit',
    family: 'advertising',
    title: 'Campaign and ad editing',
    effect: 'write-network',
    summary:
      'Complete resume, budget, schedule, targeting and creative-edit workflows are missing.',
    nextStep: 'Implement supported settings with plans, approval, recovery and verification.',
    requirements: ['provider-api-verification', 'live-verification'],
  },
  {
    id: 'meta.ads.audiences',
    family: 'advertising',
    title: 'Audiences and exclusions',
    effect: 'write-network',
    summary: 'Complete custom/lookalike audience management is not implemented.',
    nextStep: 'Verify access and implement supported audience and exclusion workflows.',
    requirements: ['provider-api-verification', 'live-verification'],
  },
  {
    id: 'meta.events.delivery-observations',
    family: 'measurement',
    title: 'Application event-delivery evidence',
    effect: 'offline',
    summary:
      'Growth and Web Runtime own observation foundations; Meta evidence requires adopter integration.',
    nextStep:
      'Ingest normalized browser/server/CAPI/outbox observations through the existing Growth contract.',
    requirements: ['adopter-observations', 'live-verification'],
  },
  {
    id: 'meta.events.test-events',
    family: 'measurement',
    title: 'Live event verification',
    effect: 'read-network',
    summary: 'Complete browser/server receipt and deduplication verification is not established.',
    nextStep: 'Complete adopter evidence and perform authorized real-account event verification.',
    requirements: ['adopter-observations', 'provider-api-verification', 'live-verification'],
  },
  {
    id: 'meta.events.match-quality',
    family: 'measurement',
    title: 'Event Match Quality',
    effect: 'read-network',
    summary: 'Provider match-quality acquisition is not implemented; scores must not be inferred.',
    nextStep: 'Verify supported API access or use explicit imported provider evidence.',
    requirements: ['provider-api-verification', 'live-verification'],
  },
  {
    id: 'meta.events.issues',
    family: 'measurement',
    title: 'Event issues and recommendations',
    effect: 'read-network',
    summary:
      'Events Manager-style provider issue and recommendation acquisition is not implemented.',
    nextStep: 'Verify field/API availability and implement diagnostics or labelled imports.',
    requirements: ['provider-api-verification', 'live-verification'],
  },
  {
    id: 'meta.catalogs.manage',
    family: 'catalog',
    title: 'Catalog synchronization and diagnostics',
    effect: 'write-network',
    summary:
      'Complete catalog ingestion, synchronization, disapproval and catalog-ad workflows are missing.',
    nextStep: 'Use a portable Growth catalog projection and verify supported provider operations.',
    requirements: ['provider-api-verification', 'live-verification'],
  },
];

export const metaCapabilityCatalog: readonly MetaCapability[] = [
  ...implemented,
  ...missing.map(
    (entry): MetaCapability => ({
      ...entry,
      implementation: 'not-implemented',
      implementationReferences: [],
      verification: 'not-verified',
      verificationReferences: [],
      hostOperations: [],
    }),
  ),
];
