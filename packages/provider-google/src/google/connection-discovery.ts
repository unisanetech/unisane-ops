import {
  listGoogleAdsAccessibleCustomers,
  listGoogleAnalyticsProperties,
  listGoogleSearchConsoleSites,
  listGoogleTagManagerAccounts,
  listGoogleTagManagerContainers,
  type GoogleControlPlaneFetch,
} from './control-plane/client.js';
import type { GoogleConnectionService, GoogleResourceSelection } from './connection.js';

export type GoogleResourceDiscoveryIssue = {
  service: GoogleConnectionService;
  state: 'missing' | 'ambiguous' | 'inaccessible';
  code: string;
  message: string;
};

export type GoogleResourceDiscoveryResult = {
  resources: GoogleResourceSelection[];
  issues: GoogleResourceDiscoveryIssue[];
};

function candidates(
  service: GoogleConnectionService,
  resources: ReadonlyArray<{
    resourceType: GoogleResourceSelection['resourceType'];
    resourceId: string;
    displayName: string;
  }>,
  observedAt: string,
): GoogleResourceDiscoveryResult {
  if (resources.length === 0) {
    return {
      resources: [],
      issues: [
        {
          service,
          state: 'missing',
          code: `google.resource.${service}.missing`,
          message: `No accessible Google ${service} resource was found.`,
        },
      ],
    };
  }
  const state = resources.length === 1 ? 'selected' : 'ambiguous';
  return {
    resources: resources.map((resource) => ({
      service,
      ...resource,
      state,
      observedAt,
    })),
    issues:
      state === 'selected'
        ? []
        : [
            {
              service,
              state: 'ambiguous',
              code: `google.resource.${service}.ambiguous`,
              message: `${resources.length} Google ${service} resources are accessible; select one explicitly.`,
            },
          ],
  };
}

async function discoverService(input: {
  accessToken: string;
  service: GoogleConnectionService;
  observedAt: string;
  developerToken?: string;
  fetch?: GoogleControlPlaneFetch;
}): Promise<GoogleResourceDiscoveryResult> {
  try {
    if (input.service === 'project-administration') {
      return { resources: [], issues: [] };
    }
    if (input.service === 'search-console') {
      const sites = await listGoogleSearchConsoleSites(input);
      return candidates(
        input.service,
        sites.map((site) => ({
          resourceType: 'site',
          resourceId: site.siteUrl,
          displayName: site.siteUrl,
        })),
        input.observedAt,
      );
    }
    if (input.service === 'analytics') {
      const properties = await listGoogleAnalyticsProperties(input);
      return candidates(
        input.service,
        properties.map((property) => ({
          resourceType: 'property',
          resourceId: property.propertyId,
          displayName: property.displayName ?? property.property,
        })),
        input.observedAt,
      );
    }
    if (input.service === 'tag-manager') {
      const accounts = await listGoogleTagManagerAccounts(input);
      const containers = (
        await Promise.all(
          accounts.map((account) =>
            listGoogleTagManagerContainers({
              ...input,
              accountId: account.accountId,
            }),
          ),
        )
      ).flat();
      return candidates(
        input.service,
        containers.map((container) => ({
          resourceType: 'container',
          resourceId: container.containerId,
          displayName: container.name ?? container.publicId ?? container.containerId,
        })),
        input.observedAt,
      );
    }
    if (!input.developerToken) {
      return {
        resources: [],
        issues: [
          {
            service: 'ads',
            state: 'inaccessible',
            code: 'google.resource.ads.developer-access-required',
            message:
              'Google Ads resource discovery requires approved developer access on this connection.',
          },
        ],
      };
    }
    const customers = await listGoogleAdsAccessibleCustomers({
      ...input,
      developerToken: input.developerToken,
    });
    return candidates(
      input.service,
      customers.map((customer) => ({
        resourceType: 'customer',
        resourceId: customer.customerId,
        displayName: customer.customerId,
      })),
      input.observedAt,
    );
  } catch (error) {
    return {
      resources: [],
      issues: [
        {
          service: input.service,
          state: 'inaccessible',
          code: `google.resource.${input.service}.inaccessible`,
          message:
            error instanceof Error ? error.message : `Google ${input.service} discovery failed.`,
        },
      ],
    };
  }
}

export async function discoverGoogleConnectionResources(input: {
  accessToken: string;
  services: readonly GoogleConnectionService[];
  explicitResources?: readonly GoogleResourceSelection[];
  developerToken?: string;
  observedAt?: string;
  fetch?: GoogleControlPlaneFetch;
}): Promise<GoogleResourceDiscoveryResult> {
  const observedAt = input.observedAt ?? new Date().toISOString();
  const explicit = input.explicitResources ?? [];
  const discovered = await Promise.all(
    input.services.map(async (service) => {
      const selected = explicit.filter((resource) => resource.service === service);
      if (selected.length > 0) return { resources: selected, issues: [] };
      return discoverService({
        accessToken: input.accessToken,
        service,
        observedAt,
        ...(input.developerToken ? { developerToken: input.developerToken } : {}),
        ...(input.fetch ? { fetch: input.fetch } : {}),
      });
    }),
  );
  return {
    resources: discovered.flatMap((result) => result.resources),
    issues: discovered.flatMap((result) => result.issues),
  };
}
