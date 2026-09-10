import {
  marketingMetaConnectionResourceSchema,
  type MarketingMetaConnectionResource,
} from '@unisane/growth/marketing';
import type {
  MetaConnectionDiscoveryResult,
  MetaDiscoveredResource,
} from './connection-discovery.js';

export type MarketingMetaResourceType = MarketingMetaConnectionResource['resourceType'];
export type MetaResourceChoice = Pick<MetaDiscoveredResource, 'resourceType' | 'resourceId'>;
export interface MetaResourcePromptInput {
  projectId: string;
  environmentId: string;
  service: 'ads-insights' | 'event-measurement';
  candidates: readonly MetaDiscoveredResource[];
  complete: boolean;
}
export interface MetaResourcePrompt {
  isAvailable(): boolean;
  choose(input: MetaResourcePromptInput): Promise<MetaResourceChoice | null>;
}

export async function guideMetaResourceSelection(input: {
  projectId: string;
  environmentId: string;
  requiredServices: readonly string[];
  discovery: MetaConnectionDiscoveryResult;
  previous: readonly MarketingMetaConnectionResource[];
  selections: ReadonlyMap<MarketingMetaResourceType, string>;
  interactive: boolean;
  prompt: MetaResourcePrompt;
}): Promise<Map<MarketingMetaResourceType, string>> {
  const selections = new Map(input.selections);
  // Validate explicit selections before presenting any additional choices.
  selectionResources({ ...input, selections });
  if (!input.interactive || !input.prompt.isAvailable()) return selections;
  for (const service of ['ads-insights', 'event-measurement'] as const) {
    if (!input.requiredServices.includes(service)) continue;
    const types: MarketingMetaResourceType[] =
      service === 'ads-insights' ? ['ad-account'] : ['pixel', 'dataset'];
    if (types.some((type) => selectedId(selections, input.previous, type))) continue;
    const candidates = [
      ...new Map(
        input.discovery.resources
          .filter(
            (resource) =>
              types.includes(resource.resourceType) && resource.services.includes(service),
          )
          .map((resource) => [`${resource.resourceType}:${resource.resourceId}`, resource]),
      ).values(),
    ];
    if (!candidates.length) continue;
    const complete =
      !input.discovery.resourceLimitReached &&
      input.discovery.areas.every((area) => area.state === 'ready' && !area.truncated);
    const choice = await input.prompt.choose({
      projectId: input.projectId,
      environmentId: input.environmentId,
      service,
      candidates,
      complete,
    });
    if (choice === null)
      throw new Error(
        '[META_RESOURCE_SELECTION_CANCELLED] Meta connection was cancelled before saving changes.',
      );
    const offered = candidates.find(
      (candidate) =>
        candidate.resourceType === choice.resourceType &&
        candidate.resourceId === choice.resourceId,
    );
    if (!offered)
      throw new Error(
        '[META_RESOURCE_SELECTION_INVALID] Select one of the resources offered for this service.',
      );
    selections.set(offered.resourceType, offered.resourceId);
  }
  return selections;
}

function selectedId(
  selections: ReadonlyMap<MarketingMetaResourceType, string>,
  previous: readonly MarketingMetaConnectionResource[],
  resourceType: MarketingMetaResourceType,
): string | undefined {
  const explicit = selections.get(resourceType);
  if (explicit) return explicit;
  const prior = [
    ...new Set(
      previous
        .filter(
          (resource) => resource.resourceType === resourceType && resource.state === 'selected',
        )
        .map((resource) => resource.resourceId),
    ),
  ];
  if (prior.length > 1)
    throw new Error(
      '[META_RESOURCE_SELECTION_AMBIGUOUS] Multiple previous resources are selected; provide an exact resource flag.',
    );
  return prior[0];
}

export function selectionResources(input: {
  selections: ReadonlyMap<MarketingMetaResourceType, string>;
  discovery: MetaConnectionDiscoveryResult;
  previous: readonly MarketingMetaConnectionResource[];
}): MarketingMetaConnectionResource[] {
  const byType = new Map<MarketingMetaResourceType, typeof input.discovery.resources>();
  for (const resource of input.discovery.resources) {
    byType.set(resource.resourceType, [...(byType.get(resource.resourceType) ?? []), resource]);
  }
  for (const [resourceType, resourceId] of input.selections) {
    if (!(byType.get(resourceType) ?? []).some((resource) => resource.resourceId === resourceId)) {
      throw new Error(
        `[META_RESOURCE_SELECTION_UNKNOWN] '${resourceId}' is not an accessible discovered ${resourceType}.`,
      );
    }
  }
  const observedAt = input.discovery.observedAt;
  const selected: MarketingMetaConnectionResource[] = [];
  const addSelected = (
    resourceType: MarketingMetaResourceType,
    service: 'ads-insights' | 'event-measurement',
  ) => {
    const resourceId = selectedId(input.selections, input.previous, resourceType);
    if (!resourceId) return false;
    const resource = (byType.get(resourceType) ?? []).find(
      (candidate) => candidate.resourceId === resourceId && candidate.services.includes(service),
    );
    if (!resource) {
      const previous = input.previous.find(
        (candidate) =>
          candidate.resourceType === resourceType &&
          candidate.resourceId === resourceId &&
          candidate.service === service,
      );
      if (previous) {
        selected.push({ ...previous, state: 'inaccessible', observedAt });
        return true;
      }
      return false;
    }
    selected.push(
      marketingMetaConnectionResourceSchema.parse({
        service,
        resourceType,
        resourceId: resource.resourceId,
        displayName: resource.displayName,
        state: 'selected',
        observedAt,
        ...(resource.parentResourceId ? { parentResourceId: resource.parentResourceId } : {}),
      }),
    );
    return true;
  };

  const adAccountSelected = addSelected('ad-account', 'ads-insights');
  if (!adAccountSelected) {
    for (const resource of (byType.get('ad-account') ?? []).slice(0, 100)) {
      selected.push(
        marketingMetaConnectionResourceSchema.parse({
          service: 'ads-insights',
          resourceType: 'ad-account',
          resourceId: resource.resourceId,
          displayName: resource.displayName,
          state: 'ambiguous',
          observedAt,
        }),
      );
    }
  }
  const pixelSelected = addSelected('pixel', 'event-measurement');
  const datasetSelected = addSelected('dataset', 'event-measurement');
  const eventSelected = pixelSelected || datasetSelected;
  if (!eventSelected) {
    for (const resource of [...(byType.get('pixel') ?? []), ...(byType.get('dataset') ?? [])].slice(
      0,
      Math.max(0, 100 - selected.length),
    )) {
      selected.push(
        marketingMetaConnectionResourceSchema.parse({
          service: 'event-measurement',
          resourceType: resource.resourceType,
          resourceId: resource.resourceId,
          displayName: resource.displayName,
          state: 'ambiguous',
          observedAt,
          ...(resource.parentResourceId ? { parentResourceId: resource.parentResourceId } : {}),
        }),
      );
    }
  }
  for (const resourceType of ['business', 'page', 'instagram-account'] as const) {
    const resourceId = input.selections.get(resourceType);
    if (!resourceId) continue;
    const resource = (byType.get(resourceType) ?? []).find(
      (candidate) => candidate.resourceId === resourceId,
    )!;
    const service = resource.services.includes('event-measurement')
      ? 'event-measurement'
      : 'ads-insights';
    selected.push(
      marketingMetaConnectionResourceSchema.parse({
        service,
        resourceType,
        resourceId,
        displayName: resource.displayName,
        state: 'selected',
        observedAt,
        ...(resource.parentResourceId ? { parentResourceId: resource.parentResourceId } : {}),
      }),
    );
  }
  return selected.slice(0, 100);
}
