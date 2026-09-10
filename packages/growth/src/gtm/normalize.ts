import { stableJson } from './stable-json';
import { consentDefaultHtml } from './tag-html';
import type {
  GoogleTagManagerContainerManifest,
  GoogleTagManagerDesiredResource,
  GoogleTagManagerFolder,
  GoogleTagManagerTag,
  GoogleTagManagerTrigger,
  GoogleTagManagerVariable,
} from './contracts';

function bySlug<T extends { slug: string }>(left: T, right: T): number {
  return left.slug.localeCompare(right.slug);
}

function byParameterKey(left: { key: string }, right: { key: string }): number {
  return left.key.localeCompare(right.key);
}

function displayName(
  namespace: string,
  fallbackFamily: string,
  resource: { slug: string; name?: string },
): string {
  return resource.name ?? `${namespace} ${fallbackFamily} ${resource.slug}`;
}

function folderResource(
  manifest: GoogleTagManagerContainerManifest,
  folder: GoogleTagManagerFolder,
): GoogleTagManagerDesiredResource {
  return {
    kind: 'folder',
    slug: folder.slug,
    name: folder.name,
    payload: {
      name: folder.name,
      slug: folder.slug,
    },
  };
}

function builtInVariableResource(slug: string): GoogleTagManagerDesiredResource {
  return {
    kind: 'built_in_variable',
    slug,
    name: slug,
    payload: {
      slug,
      enabled: true,
    },
  };
}

function variableResource(
  manifest: GoogleTagManagerContainerManifest,
  variable: GoogleTagManagerVariable,
): GoogleTagManagerDesiredResource {
  return {
    kind: 'variable',
    slug: variable.slug,
    name: displayName(manifest.namespace, 'variable', variable),
    payload: {
      name: displayName(manifest.namespace, 'variable', variable),
      type: variable.type,
      folderSlug: variable.folderSlug,
      parameters: [...(variable.parameters ?? [])].sort(byParameterKey),
    },
  };
}

function triggerResource(
  manifest: GoogleTagManagerContainerManifest,
  trigger: GoogleTagManagerTrigger,
): GoogleTagManagerDesiredResource {
  return {
    kind: 'trigger',
    slug: trigger.slug,
    name: displayName(manifest.namespace, 'trigger', trigger),
    payload: {
      name: displayName(manifest.namespace, 'trigger', trigger),
      type: trigger.type,
      folderSlug: trigger.folderSlug,
      eventName: trigger.eventName,
      filters: trigger.filters ?? [],
    },
  };
}

function tagResource(
  manifest: GoogleTagManagerContainerManifest,
  tag: GoogleTagManagerTag,
): GoogleTagManagerDesiredResource {
  const parameters = [...(tag.parameters ?? [])].sort(byParameterKey);
  return {
    kind: 'tag',
    slug: tag.slug,
    name: displayName(manifest.namespace, 'tag', tag),
    payload: {
      name: displayName(manifest.namespace, 'tag', tag),
      type: tag.type,
      folderSlug: tag.folderSlug,
      triggerSlugs: [...tag.triggerSlugs].sort(),
      parameters,
      ...(tag.rawParameters ? { rawParameters: tag.rawParameters } : {}),
      ...(tag.template ? { template: tag.template } : {}),
      ...(tag.tagFiringOption ? { tagFiringOption: tag.tagFiringOption } : {}),
      ...(tag.type === 'consent_default'
        ? { implementationHtml: consentDefaultHtml(parameters) }
        : {}),
      consent: tag.consent,
      vendorDomains: tag.vendorDomains ?? [],
      dedupeStrategy: tag.dedupeStrategy,
      paused: tag.paused ?? false,
    },
  };
}

export function normalizeGoogleTagManagerManifest(
  manifest: GoogleTagManagerContainerManifest,
): GoogleTagManagerContainerManifest {
  return {
    ...manifest,
    folders: [...(manifest.folders ?? [])].sort(bySlug),
    builtInVariables: [...(manifest.builtInVariables ?? [])].sort(),
    variables: [...(manifest.variables ?? [])].sort(bySlug),
    builtInTriggers: [...(manifest.builtInTriggers ?? [])].sort(bySlug),
    triggers: [...(manifest.triggers ?? [])].sort(bySlug),
    tags: [...(manifest.tags ?? [])].sort(bySlug),
  };
}

export function getGoogleTagManagerDesiredResources(
  manifest: GoogleTagManagerContainerManifest,
): readonly GoogleTagManagerDesiredResource[] {
  const normalized = normalizeGoogleTagManagerManifest(manifest);
  return [
    ...(normalized.folders ?? []).map((folder) => folderResource(normalized, folder)),
    ...(normalized.builtInVariables ?? []).map((variable) => builtInVariableResource(variable)),
    ...(normalized.variables ?? []).map((variable) => variableResource(normalized, variable)),
    ...(normalized.triggers ?? []).map((trigger) => triggerResource(normalized, trigger)),
    ...(normalized.tags ?? []).map((tag) => tagResource(normalized, tag)),
  ];
}

export function desiredResourceHash(resource: GoogleTagManagerDesiredResource): string {
  return stableJson(resource.payload);
}
