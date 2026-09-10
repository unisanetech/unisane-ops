import { z } from 'zod';

export const MARKETING_META_ADS_READ_SCOPE = 'ads_read';

export const MARKETING_META_READ_SCOPE_ALLOWLIST = [
  MARKETING_META_ADS_READ_SCOPE,
  'instagram_basic',
  'pages_read_engagement',
  'pages_show_list',
  'public_profile',
  'read_insights',
] as const;

export const MARKETING_META_MUTATION_SCOPES = [
  'ads_management',
  'instagram_content_publish',
  'pages_manage_ads',
  'pages_manage_engagement',
  'pages_manage_metadata',
  'pages_manage_posts',
] as const;

export const marketingMetaConnectionServiceSchema = z.enum(['ads-insights', 'event-measurement']);
export type MarketingMetaConnectionService = z.infer<typeof marketingMetaConnectionServiceSchema>;

export const marketingMetaResourceTypeSchema = z.enum([
  'business',
  'ad-account',
  'pixel',
  'dataset',
  'page',
  'instagram-account',
]);
export type MarketingMetaResourceType = z.infer<typeof marketingMetaResourceTypeSchema>;

const isoTimestampSchema = z.string().datetime({ offset: true });
const safeIdentifierSchema = z.string().trim().min(1).max(300);

export const marketingMetaConnectionGrantSchema = z
  .object({
    service: marketingMetaConnectionServiceSchema,
    scopes: z.array(z.string().trim().min(1)).max(50),
    state: z.enum(['granted', 'missing', 'partial', 'revoked']),
    observedAt: isoTimestampSchema,
    expiresAt: isoTimestampSchema.optional(),
  })
  .strict();
export type MarketingMetaConnectionGrant = z.infer<typeof marketingMetaConnectionGrantSchema>;

export const marketingMetaConnectionResourceSchema = z
  .object({
    service: marketingMetaConnectionServiceSchema,
    resourceType: marketingMetaResourceTypeSchema,
    resourceId: safeIdentifierSchema,
    displayName: z.string().trim().min(1).max(300),
    state: z.enum(['selected', 'missing', 'ambiguous', 'inaccessible']),
    observedAt: isoTimestampSchema,
    parentResourceId: safeIdentifierSchema.optional(),
  })
  .strict();
export type MarketingMetaConnectionResource = z.infer<typeof marketingMetaConnectionResourceSchema>;

export const marketingMetaConnectionStatusSchema = z
  .object({
    schemaVersion: z.literal(1).optional(),
    ok: z.boolean().optional(),
    connectionId: safeIdentifierSchema,
    connected: z.boolean(),
    scopes: z.array(z.string().trim().min(1)).max(50),
    credentialAvailable: z.boolean(),
    credentialState: z.enum(['active', 'expired', 'revoked', 'missing']).optional(),
    expiresAt: isoTimestampSchema.optional(),
    updatedAt: isoTimestampSchema.optional(),
    lastVerifiedAt: isoTimestampSchema.optional(),
    grants: z.array(marketingMetaConnectionGrantSchema).max(20).optional(),
    resources: z.array(marketingMetaConnectionResourceSchema).max(100).optional(),
  })
  .strict();
export type MarketingMetaConnectionStatus = z.infer<typeof marketingMetaConnectionStatusSchema>;

export const marketingMetaConnectionReadinessStateSchema = z.enum([
  'ready',
  'invalid-evidence',
  'disconnected',
  'credential-missing',
  'credential-expired',
  'credential-revoked',
  'grant-missing',
  'grant-partial',
  'grant-expired',
  'scope-forbidden',
  'resource-missing',
  'resource-ambiguous',
  'resource-inaccessible',
]);
export type MarketingMetaConnectionReadinessState = z.infer<
  typeof marketingMetaConnectionReadinessStateSchema
>;

export type MarketingMetaConnectionServiceAssessment = {
  service: MarketingMetaConnectionService;
  ready: boolean;
  state: MarketingMetaConnectionReadinessState;
  issues: string[];
  selectedResources: MarketingMetaConnectionResource[];
};

export type MarketingMetaConnectionAssessment = {
  ready: boolean;
  state: MarketingMetaConnectionReadinessState;
  issues: string[];
  services: MarketingMetaConnectionServiceAssessment[];
};

const requiredScopes: Record<MarketingMetaConnectionService, readonly string[]> = {
  'ads-insights': [MARKETING_META_ADS_READ_SCOPE],
  'event-measurement': [MARKETING_META_ADS_READ_SCOPE],
};

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}

function isExpired(timestamp: string | undefined, now: Date): boolean {
  return Boolean(timestamp && Date.parse(timestamp) <= now.getTime());
}

function selectedResourcesForService(
  status: MarketingMetaConnectionStatus,
  service: MarketingMetaConnectionService,
): MarketingMetaConnectionResource[] {
  return (status.resources ?? []).filter(
    (resource) => resource.service === service && resource.state === 'selected',
  );
}

function resourceAssessment(
  status: MarketingMetaConnectionStatus,
  service: MarketingMetaConnectionService,
): Pick<MarketingMetaConnectionServiceAssessment, 'state' | 'issues' | 'selectedResources'> {
  const serviceResources = (status.resources ?? []).filter(
    (resource) => resource.service === service,
  );
  const selectedResources = selectedResourcesForService(status, service);
  if (serviceResources.some((resource) => resource.state === 'ambiguous')) {
    return {
      state: 'resource-ambiguous',
      issues: [`Meta ${service} resource discovery is ambiguous; select exact resource IDs.`],
      selectedResources,
    };
  }
  if (serviceResources.some((resource) => resource.state === 'inaccessible')) {
    return {
      state: 'resource-inaccessible',
      issues: [`A selected Meta ${service} resource is no longer accessible.`],
      selectedResources,
    };
  }
  if (service === 'ads-insights') {
    const adAccounts = selectedResources.filter(
      (resource) => resource.resourceType === 'ad-account',
    );
    if (adAccounts.length !== 1) {
      return {
        state: adAccounts.length > 1 ? 'resource-ambiguous' : 'resource-missing',
        issues: [
          adAccounts.length > 1
            ? 'More than one Meta ad account is selected for ads insights.'
            : 'Select exactly one Meta ad account for ads insights.',
        ],
        selectedResources,
      };
    }
  } else {
    const eventSources = selectedResources.filter(
      (resource) => resource.resourceType === 'pixel' || resource.resourceType === 'dataset',
    );
    const counts = new Map<MarketingMetaResourceType, number>();
    eventSources.forEach((resource) =>
      counts.set(resource.resourceType, (counts.get(resource.resourceType) ?? 0) + 1),
    );
    if ([...counts.values()].some((count) => count > 1)) {
      return {
        state: 'resource-ambiguous',
        issues: ['More than one Meta Pixel or dataset of the same type is selected.'],
        selectedResources,
      };
    }
    if (eventSources.length === 0) {
      return {
        state: 'resource-missing',
        issues: ['Select one exact Meta Pixel or dataset for event measurement.'],
        selectedResources,
      };
    }
  }
  return { state: 'ready', issues: [], selectedResources };
}

function serviceAssessment(
  status: MarketingMetaConnectionStatus,
  service: MarketingMetaConnectionService,
  now: Date,
): MarketingMetaConnectionServiceAssessment {
  const grant = status.grants?.find((candidate) => candidate.service === service);
  const effectiveScopes = unique([...status.scopes, ...(grant?.scopes ?? [])]);
  const forbidden = effectiveScopes.filter(
    (scope) =>
      (MARKETING_META_MUTATION_SCOPES as readonly string[]).includes(scope) ||
      !(MARKETING_META_READ_SCOPE_ALLOWLIST as readonly string[]).includes(scope),
  );
  if (forbidden.length > 0) {
    return {
      service,
      ready: false,
      state: 'scope-forbidden',
      issues: [
        `Meta ${service} includes scopes outside the approved read-only allowlist: ${forbidden.join(', ')}.`,
      ],
      selectedResources: selectedResourcesForService(status, service),
    };
  }
  if (grant?.state === 'revoked' || grant?.state === 'missing' || !grant) {
    return {
      service,
      ready: false,
      state: 'grant-missing',
      issues: [`Meta ${service} does not have a current recorded grant.`],
      selectedResources: selectedResourcesForService(status, service),
    };
  }
  if (grant.state === 'partial') {
    return {
      service,
      ready: false,
      state: 'grant-partial',
      issues: [`Meta ${service} has only partial access.`],
      selectedResources: selectedResourcesForService(status, service),
    };
  }
  if (isExpired(grant.expiresAt, now)) {
    return {
      service,
      ready: false,
      state: 'grant-expired',
      issues: [`Meta ${service} access has expired.`],
      selectedResources: selectedResourcesForService(status, service),
    };
  }
  const missingScopes = requiredScopes[service].filter((scope) => !effectiveScopes.includes(scope));
  if (missingScopes.length > 0) {
    return {
      service,
      ready: false,
      state: 'grant-partial',
      issues: [`Meta ${service} is missing required read scopes: ${missingScopes.join(', ')}.`],
      selectedResources: selectedResourcesForService(status, service),
    };
  }
  const resources = resourceAssessment(status, service);
  return {
    service,
    ready: resources.state === 'ready',
    ...resources,
  };
}

export function assessMarketingMetaConnection(
  input: unknown,
  options: {
    now?: Date;
    requiredServices?: readonly MarketingMetaConnectionService[];
  } = {},
): MarketingMetaConnectionAssessment {
  const parsed = marketingMetaConnectionStatusSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ready: false,
      state: 'invalid-evidence',
      issues: ['Meta connection evidence does not match the strict normalized contract.'],
      services: [],
    };
  }
  const status = parsed.data;
  const requiredServices = unique(
    options.requiredServices ?? ['ads-insights', 'event-measurement'],
  ) as MarketingMetaConnectionService[];
  if (!status.connected) {
    return {
      ready: false,
      state: 'disconnected',
      issues: ['Meta is not connected; historical evidence may remain but new reads must stop.'],
      services: [],
    };
  }
  const credentialState =
    status.credentialState ?? (status.credentialAvailable ? 'active' : 'missing');
  if (!status.credentialAvailable || credentialState === 'missing') {
    return {
      ready: false,
      state: 'credential-missing',
      issues: ['The host reports no active credential for this Meta connection.'],
      services: [],
    };
  }
  if (credentialState === 'revoked') {
    return {
      ready: false,
      state: 'credential-revoked',
      issues: ['The host reports that this Meta connection credential was revoked.'],
      services: [],
    };
  }
  const now = options.now ?? new Date();
  if (credentialState === 'expired' || isExpired(status.expiresAt, now)) {
    return {
      ready: false,
      state: 'credential-expired',
      issues: ['The host reports that this Meta connection credential has expired.'],
      services: [],
    };
  }
  const services = requiredServices.map((service) => serviceAssessment(status, service, now));
  const firstFailure = services.find((service) => !service.ready);
  return {
    ready: !firstFailure,
    state: firstFailure?.state ?? 'ready',
    issues: services.flatMap((service) => service.issues),
    services,
  };
}

export function marketingMetaConnectionReady(
  status: MarketingMetaConnectionStatus | undefined,
  now = new Date(),
): status is MarketingMetaConnectionStatus & { connected: true } {
  return assessMarketingMetaConnection(status, {
    now,
    requiredServices: ['ads-insights'],
  }).ready;
}
