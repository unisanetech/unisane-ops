import type { GrowthConfig } from '../../config.js';
import {
  marketingExecutionContextSchema,
  type MarketingExecutionContext,
} from '../schema/execution-context.js';

export interface GrowthExecutionProjectContext {
  projectRoot: string;
  configPath: string;
  projectId: string;
  environments: Record<string, { production: boolean }>;
  growth: GrowthConfig;
}

function defaultEnvironment(context: GrowthExecutionProjectContext): string {
  const ids = Object.keys(context.growth.environments);
  if (ids.length === 1) return ids[0]!;
  if (ids.includes('production')) return 'production';
  if (ids.includes('development')) return 'development';
  return ids[0]!;
}

function hasGoogleResource(
  config: GrowthConfig,
  service: GrowthConfig['environments'][string]['resources'][number]['service'],
): boolean {
  return Object.values(config.environments).some((environment) =>
    environment.resources.some(
      (resource) => resource.provider === 'google' && resource.service === service,
    ),
  );
}

export function deriveMarketingExecutionContext(
  context: GrowthExecutionProjectContext,
): MarketingExecutionContext {
  const growth = context.growth;
  const providerState = (service: string) =>
    hasGoogleResource(growth, service) ? ('connected' as const) : ('selected' as const);

  return marketingExecutionContextSchema.parse({
    version: 1,
    platformId: context.projectId,
    appId: context.projectId,
    defaultEnvironment: defaultEnvironment(context),
    environments: Object.fromEntries(
      Object.entries(growth.environments).map(([environmentId, environment]) => {
        const selected = (service: string, resourceType: string) =>
          environment.resources.find(
            (resource) =>
              resource.provider === 'google' &&
              resource.service === service &&
              resource.resourceType === resourceType,
          )?.resourceId;
        return [
          environmentId,
          {
            production: context.environments[environmentId]?.production ?? false,
            gtmContainerId: selected('tag-manager', 'container'),
            ga4PropertyId: selected('analytics', 'property'),
          },
        ];
      }),
    ),
    paths: {
      gtmManifest: growth.runtime.manifest ?? 'ops/growth/tag-manager.ts',
      webTrackingConfig: growth.manifests.events ?? 'ops/growth/events.json',
      webConversionsConfig: growth.manifests.conversions ?? 'ops/growth/conversions.json',
      eventRegistry: growth.manifests.events ?? 'ops/growth/events.json',
      conversionRegistry: growth.manifests.conversions ?? 'ops/growth/conversions.json',
      sourceRoots: ['src'],
      seoRoot: growth.manifests.research ?? 'ops/growth/research',
      marketingRoot: 'ops/growth',
      analyticsRoot: 'ops/growth/analytics',
    },
    providers: {
      googleAds: { state: providerState('ads') },
      metaAds: {
        state: growth.capabilities.includes('advertising') ? 'selected' : 'disabled',
      },
      ga4: { state: providerState('analytics') },
      searchConsole: { state: providerState('search-console') },
    },
    attributionStore: { state: 'selected' },
    requiredEnv: [],
  });
}
