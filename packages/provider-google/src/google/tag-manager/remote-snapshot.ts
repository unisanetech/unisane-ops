import {
  googleTagManagerAccountPath,
  googleTagManagerContainerPath,
  type GoogleTagManagerApiClient,
} from './api-client';
import type {
  GoogleTagManagerApiSnapshot,
  GoogleTagManagerContainerManifest,
  GoogleTagManagerDesiredResource,
  GoogleTagManagerJsonObject,
  GoogleTagManagerReadSnapshotOptions,
  GoogleTagManagerRemoteResource,
  GoogleTagManagerRemoteSnapshot,
  GoogleTagManagerResourceKind,
} from '@unisane/growth/contracts';

export type GoogleTagManagerProviderReadSnapshotOptions = GoogleTagManagerReadSnapshotOptions & {
  desiredResources: readonly GoogleTagManagerDesiredResource[];
};

type FolderBinding = {
  folderId: string;
  slug: string;
};

type TriggerBinding = {
  triggerId: string;
  slug: string;
};

function customTemplateReference(
  tagType: string,
  templates: readonly GoogleTagManagerJsonObject[],
): GoogleTagManagerJsonObject | undefined {
  const templateId = tagType.match(/_(\d+)$/)?.[1];
  if (!templateId) return undefined;
  const template = templates.find((entry) => stringField(entry, 'templateId') === templateId);
  if (!template) return undefined;
  const gallery = isRecord(template.galleryReference) ? template.galleryReference : undefined;
  const host = stringField(gallery ?? {}, 'host');
  const owner = stringField(gallery ?? {}, 'owner');
  const repository = stringField(gallery ?? {}, 'repository');
  const version = stringField(gallery ?? {}, 'version');
  if (!host || !owner || !repository || !version) return undefined;
  return { tagType, templateId, host, owner, repository, version };
}

const BUILT_IN_VARIABLE_TYPE_TO_SLUG: Record<string, string> = {
  pageUrl: 'page_url',
  pagePath: 'page_path',
  pageHostname: 'page_hostname',
  referrer: 'referrer',
  event: 'event',
  clickElement: 'click_element',
  clickClasses: 'click_classes',
  clickId: 'click_id',
  clickTarget: 'click_target',
  clickUrl: 'click_url',
  clickText: 'click_text',
  formElement: 'form_element',
  formClasses: 'form_classes',
  formId: 'form_id',
  formTarget: 'form_target',
  formUrl: 'form_url',
  formText: 'form_text',
  historySource: 'history_source',
  newHistoryFragment: 'new_history_fragment',
  oldHistoryFragment: 'old_history_fragment',
  newHistoryState: 'new_history_state',
  oldHistoryState: 'old_history_state',
  analyticsClientId: 'analytics_client_id',
  analyticsSessionId: 'analytics_session_id',
};

const BUILT_IN_VARIABLE_SLUG_TO_NAME: Record<string, string> = {
  analytics_client_id: 'Analytics Client ID',
  analytics_session_id: 'Analytics Session ID',
  page_url: 'Page URL',
  page_path: 'Page Path',
  page_hostname: 'Page Hostname',
  referrer: 'Referrer',
  event: 'Event',
};

const TRIGGER_TYPE_TO_MANIFEST_TYPE: Record<string, string> = {
  pageview: 'all_pages',
  customEvent: 'data_layer_event',
  consentInit: 'consent_initialization',
};

const VARIABLE_TYPE_TO_MANIFEST_TYPE: Record<string, string> = {
  c: 'constant',
  v: 'data_layer',
  e: 'environment',
  smm: 'lookup_table',
};

function isRecord(value: unknown): value is GoogleTagManagerJsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringField(value: GoogleTagManagerJsonObject, key: string): string | undefined {
  const field = value[key];
  return typeof field === 'string' && field.length > 0 ? field : undefined;
}

function booleanField(value: GoogleTagManagerJsonObject, key: string): boolean | undefined {
  const field = value[key];
  return typeof field === 'boolean' ? field : undefined;
}

function arrayField(value: GoogleTagManagerJsonObject, key: string): readonly unknown[] {
  const field = value[key];
  return Array.isArray(field) ? field : [];
}

function findParameterValue(
  parameters: readonly unknown[],
  key: string,
): string | number | boolean | readonly string[] | undefined {
  for (const parameter of parameters) {
    if (!isRecord(parameter)) continue;
    if (parameter.key !== key) continue;
    const value = parameter.value;
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      (Array.isArray(value) && value.every((item) => typeof item === 'string'))
    ) {
      return value;
    }
  }
  return undefined;
}

function normalizeParameters(
  parameters: readonly unknown[],
): readonly { key: string; value: unknown }[] {
  return parameters.flatMap((parameter) => {
    if (!isRecord(parameter)) return [];
    const key = stringField(parameter, 'key');
    if (!key) return [];
    return [
      {
        key,
        value: parameter.value,
      },
    ];
  });
}

function desiredPayload(
  resource: GoogleTagManagerDesiredResource | undefined,
): GoogleTagManagerJsonObject | undefined {
  return isRecord(resource?.payload) ? resource.payload : undefined;
}

function normalizeVariableParameters(args: {
  type: string;
  parameters: readonly unknown[];
}): readonly { key: string; value: unknown }[] {
  return args.parameters
    .flatMap((parameter) => {
      if (!isRecord(parameter)) return [];
      const key = stringField(parameter, 'key');
      if (!key) return [];
      const parameterType = stringField(parameter, 'type');
      const rawValue = parameter.value;
      const value =
        parameterType === 'boolean' && (rawValue === 'true' || rawValue === 'false')
          ? rawValue === 'true'
          : parameterType === 'integer' &&
              typeof rawValue === 'string' &&
              /^-?\d+$/.test(rawValue)
            ? Number.parseInt(rawValue, 10)
            : rawValue;
      return [
        {
          key: args.type === 'data_layer' && key === 'name' ? 'dataLayerName' : key,
          value,
        },
      ];
    })
    .sort(byParameterKey);
}

function byParameterKey(left: { key: string }, right: { key: string }): number {
  return left.key.localeCompare(right.key);
}

function variableReference(value: unknown, variableSlugByName: Map<string, string>): unknown {
  if (typeof value !== 'string') return value;
  const match = value.match(/^\{\{(.+)}}$/);
  if (!match?.[1]) return value;
  const variable = variableSlugByName.get(match[1]);
  return variable ? { variable } : value;
}

function renderedParameterValue(value: unknown, variableSlugByName: Map<string, string>): unknown {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value) && value.every((item) => typeof item === 'string')) {
    return value.join(',');
  }
  if (!isRecord(value)) return value;
  if (typeof value.variable === 'string') {
    const variableName =
      [...variableSlugByName.entries()].find(([, slug]) => slug === value.variable)?.[0] ??
      value.variable;
    return `{{${variableName}}}`;
  }
  if (typeof value.secretRef === 'string') return `{{${value.secretRef}}}`;
  return value;
}

function desiredParameterValue(args: {
  desiredParameters: readonly unknown[];
  key: string;
  remoteValue: unknown;
  variableSlugByName: Map<string, string>;
}): unknown {
  for (const parameter of args.desiredParameters) {
    if (!isRecord(parameter) || parameter.key !== args.key) continue;
    if (renderedParameterValue(parameter.value, args.variableSlugByName) === args.remoteValue) {
      return parameter.value;
    }
  }
  return variableReference(args.remoteValue, args.variableSlugByName);
}

function mapParameterValue(
  parameterMap: readonly unknown[],
  key: string,
  variableSlugByName: Map<string, string>,
): unknown {
  for (const entry of parameterMap) {
    if (!isRecord(entry)) continue;
    if (entry.key === key) return variableReference(entry.value, variableSlugByName);
  }
  return undefined;
}

function normalizeGa4EventSettingsTable(args: {
  parameter: GoogleTagManagerJsonObject;
  variableSlugByName: Map<string, string>;
}): readonly { key: string; value: unknown }[] {
  return arrayField(args.parameter, 'list').flatMap((entry) => {
    if (!isRecord(entry)) return [];
    const map = arrayField(entry, 'map');
    const key = mapParameterValue(map, 'parameter', args.variableSlugByName);
    if (typeof key !== 'string' || key.length === 0) return [];
    return [{ key, value: mapParameterValue(map, 'parameterValue', args.variableSlugByName) }];
  });
}

function normalizeSettingsTable(args: {
  parameter: GoogleTagManagerJsonObject;
  variableSlugByName: Map<string, string>;
}): readonly { key: string; value: unknown }[] {
  return normalizeGa4EventSettingsTable(args);
}

function normalizeTagParameters(args: {
  type: string;
  parameters: readonly unknown[];
  variableSlugByName: Map<string, string>;
  desiredParameters?: readonly unknown[];
}): readonly { key: string; value: unknown }[] {
  const desiredParameters = args.desiredParameters ?? [];
  return args.parameters
    .flatMap((parameter) => {
      if (!isRecord(parameter)) return [];
      const key = stringField(parameter, 'key');
      if (!key) return [];
      if (
        (args.type === 'ga4_pageview' || args.type === 'ga4_event') &&
        key === 'measurementIdOverride'
      ) {
        return [
          {
            key: 'measurementId',
            value: desiredParameterValue({
              desiredParameters,
              key: 'measurementId',
              remoteValue: parameter.value,
              variableSlugByName: args.variableSlugByName,
            }),
          },
        ];
      }
      if (args.type === 'ga4_pageview' && key === 'eventName' && parameter.value === 'page_view') {
        return [];
      }
      if (args.type === 'google_ads_conversion' && key === 'conversionValue') {
        return [
          {
            key: 'value',
            value: desiredParameterValue({
              desiredParameters,
              key: 'value',
              remoteValue: parameter.value,
              variableSlugByName: args.variableSlugByName,
            }),
          },
        ];
      }
      if (args.type === 'google_ads_conversion' && key === 'currencyCode') {
        return [
          {
            key: 'currency',
            value: desiredParameterValue({
              desiredParameters,
              key: 'currency',
              remoteValue: parameter.value,
              variableSlugByName: args.variableSlugByName,
            }),
          },
        ];
      }
      if (args.type === 'ga4_event' && key === 'eventSettingsTable') {
        return normalizeGa4EventSettingsTable({
          parameter,
          variableSlugByName: args.variableSlugByName,
        });
      }
      if (args.type === 'google_tag' && key === 'configSettingsTable') {
        return normalizeSettingsTable({
          parameter,
          variableSlugByName: args.variableSlugByName,
        });
      }
      return [
        {
          key,
          value: desiredParameterValue({
            desiredParameters,
            key,
            remoteValue: parameter.value,
            variableSlugByName: args.variableSlugByName,
          }),
        },
      ];
    })
    .sort(byParameterKey);
}

function normalizeConsentSettings(value: unknown): GoogleTagManagerJsonObject | undefined {
  if (!isRecord(value)) return undefined;
  const consentStatus = stringField(value, 'consentStatus');
  if (consentStatus === 'notNeeded') {
    return { noAdditionalConsentRequired: true };
  }
  if (consentStatus !== 'needed') return undefined;
  const consentType = value.consentType;
  if (!isRecord(consentType)) return undefined;
  const requiredConsent = arrayField(consentType, 'list').flatMap((entry) => {
    if (!isRecord(entry)) return [];
    const consent = stringField(entry, 'value');
    return consent ? [consent] : [];
  });
  return requiredConsent.length > 0 ? { requiredConsent } : undefined;
}

function desiredByName(
  desired: readonly GoogleTagManagerDesiredResource[],
  kind: GoogleTagManagerResourceKind,
): Map<string, GoogleTagManagerDesiredResource> {
  return new Map(
    desired
      .filter((resource) => resource.kind === kind)
      .map((resource) => [resource.name, resource]),
  );
}

function desiredBySlug(
  desired: readonly GoogleTagManagerDesiredResource[],
  kind: GoogleTagManagerResourceKind,
): Map<string, GoogleTagManagerDesiredResource> {
  return new Map(
    desired
      .filter((resource) => resource.kind === kind)
      .map((resource) => [resource.slug, resource]),
  );
}

function inferSlugFromNamespacedName(args: {
  namespace: string;
  kind: 'variable' | 'trigger' | 'tag';
  name: string;
}): string | undefined {
  const safePrefix = `${args.namespace} ${args.kind} `;
  if (args.name.startsWith(safePrefix)) return args.name.slice(safePrefix.length);
  const legacyPrefix = `${args.namespace}:${args.kind}:`;
  return args.name.startsWith(legacyPrefix) ? args.name.slice(legacyPrefix.length) : undefined;
}

function resourceFingerprint(resource: GoogleTagManagerJsonObject): string | undefined {
  return stringField(resource, 'fingerprint');
}

function remoteId(resource: GoogleTagManagerJsonObject, idField: string): string {
  return (
    stringField(resource, idField) ??
    stringField(resource, 'path') ??
    stringField(resource, 'name') ??
    '<unknown>'
  );
}

function folderSlug(args: {
  folder: GoogleTagManagerJsonObject;
  desiredFoldersByName: Map<string, GoogleTagManagerDesiredResource>;
}): string {
  const name = stringField(args.folder, 'name') ?? '<unnamed-folder>';
  return (
    args.desiredFoldersByName.get(name)?.slug ?? name.toLowerCase().replace(/[^a-z0-9]+/g, '_')
  );
}

function buildFolderBindings(
  folders: readonly GoogleTagManagerJsonObject[],
  desiredFoldersByName: Map<string, GoogleTagManagerDesiredResource>,
): readonly FolderBinding[] {
  return folders.flatMap((folder) => {
    const folderId = stringField(folder, 'folderId');
    if (!folderId) return [];
    return [
      {
        folderId,
        slug: folderSlug({ folder, desiredFoldersByName }),
      },
    ];
  });
}

function buildTriggerBindings(args: {
  triggers: readonly GoogleTagManagerJsonObject[];
  namespace: string;
  desiredTriggersByName: Map<string, GoogleTagManagerDesiredResource>;
}): readonly TriggerBinding[] {
  return args.triggers.flatMap((trigger) => {
    const triggerId = stringField(trigger, 'triggerId');
    const name = stringField(trigger, 'name') ?? '<unnamed-trigger>';
    if (!triggerId) return [];
    const desiredResource = args.desiredTriggersByName.get(name);
    const inferredSlug =
      desiredResource?.slug ??
      inferSlugFromNamespacedName({ namespace: args.namespace, kind: 'trigger', name });
    return [{ triggerId, slug: inferredSlug ?? triggerId }];
  });
}

function folderSlugForResource(
  resource: GoogleTagManagerJsonObject,
  folderBindings: readonly FolderBinding[],
): string | undefined {
  const parentFolderId = stringField(resource, 'parentFolderId');
  if (!parentFolderId) return undefined;
  return folderBindings.find((folder) => folder.folderId === parentFolderId)?.slug;
}

function triggerSlugForId(triggerId: string, triggerBindings: readonly TriggerBinding[]): string {
  return triggerBindings.find((trigger) => trigger.triggerId === triggerId)?.slug ?? triggerId;
}

function managedByDesired(
  desiredResource: GoogleTagManagerDesiredResource | undefined,
  inferredSlug: string | undefined,
): boolean {
  return Boolean(desiredResource || inferredSlug);
}

function remoteFolderResource(args: {
  folder: GoogleTagManagerJsonObject;
  desiredFoldersByName: Map<string, GoogleTagManagerDesiredResource>;
}): GoogleTagManagerRemoteResource {
  const name = stringField(args.folder, 'name') ?? '<unnamed-folder>';
  const desiredResource = args.desiredFoldersByName.get(name);
  const slug = desiredResource?.slug ?? folderSlug(args);
  return {
    kind: 'folder',
    slug,
    remoteId: remoteId(args.folder, 'folderId'),
    fingerprint: resourceFingerprint(args.folder),
    managed: Boolean(desiredResource),
    raw: args.folder,
    payload: {
      name,
      slug,
    },
  };
}

function remoteBuiltInVariableResource(args: {
  variable: GoogleTagManagerJsonObject;
  desiredBuiltInsBySlug: Map<string, GoogleTagManagerDesiredResource>;
}): GoogleTagManagerRemoteResource {
  const type =
    stringField(args.variable, 'type') ?? stringField(args.variable, 'name') ?? '<unknown>';
  const slug = BUILT_IN_VARIABLE_TYPE_TO_SLUG[type] ?? type;
  return {
    kind: 'built_in_variable',
    slug,
    remoteId: type,
    managed: args.desiredBuiltInsBySlug.has(slug),
    raw: args.variable,
    payload: {
      slug,
      enabled: true,
    },
  };
}

function remoteVariableResource(args: {
  variable: GoogleTagManagerJsonObject;
  namespace: string;
  folderBindings: readonly FolderBinding[];
  desiredVariablesByName: Map<string, GoogleTagManagerDesiredResource>;
}): GoogleTagManagerRemoteResource {
  const name = stringField(args.variable, 'name') ?? '<unnamed-variable>';
  const desiredResource = args.desiredVariablesByName.get(name);
  const desiredType = stringField(desiredPayload(desiredResource) ?? {}, 'type');
  const rawType = stringField(args.variable, 'type') ?? '<unknown>';
  const type = desiredType ?? VARIABLE_TYPE_TO_MANIFEST_TYPE[rawType] ?? rawType;
  const inferredSlug =
    desiredResource?.slug ??
    inferSlugFromNamespacedName({ namespace: args.namespace, kind: 'variable', name });
  const slug = inferredSlug ?? remoteId(args.variable, 'variableId');
  return {
    kind: 'variable',
    slug,
    remoteId: remoteId(args.variable, 'variableId'),
    fingerprint: resourceFingerprint(args.variable),
    managed: managedByDesired(desiredResource, inferredSlug),
    raw: args.variable,
    payload: {
      name,
      type,
      folderSlug: folderSlugForResource(args.variable, args.folderBindings),
      parameters: normalizeVariableParameters({
        type,
        parameters: arrayField(args.variable, 'parameter'),
      }),
    },
  };
}

function customEventName(trigger: GoogleTagManagerJsonObject): string | undefined {
  const customEventFilters = arrayField(trigger, 'customEventFilter');
  for (const filter of customEventFilters) {
    if (!isRecord(filter)) continue;
    const parameters = arrayField(filter, 'parameter');
    const firstArg = findParameterValue(parameters, 'arg0');
    const secondArg = findParameterValue(parameters, 'arg1');
    if (firstArg === '{{_event}}' && typeof secondArg === 'string') {
      return secondArg;
    }
  }
  return undefined;
}

function remoteTriggerResource(args: {
  trigger: GoogleTagManagerJsonObject;
  namespace: string;
  folderBindings: readonly FolderBinding[];
  desiredTriggersByName: Map<string, GoogleTagManagerDesiredResource>;
}): GoogleTagManagerRemoteResource {
  const name = stringField(args.trigger, 'name') ?? '<unnamed-trigger>';
  const desiredResource = args.desiredTriggersByName.get(name);
  const inferredSlug =
    desiredResource?.slug ??
    inferSlugFromNamespacedName({ namespace: args.namespace, kind: 'trigger', name });
  const type = stringField(args.trigger, 'type') ?? '<unknown>';
  const slug = inferredSlug ?? remoteId(args.trigger, 'triggerId');
  return {
    kind: 'trigger',
    slug,
    remoteId: remoteId(args.trigger, 'triggerId'),
    fingerprint: resourceFingerprint(args.trigger),
    managed: managedByDesired(desiredResource, inferredSlug),
    raw: args.trigger,
    payload: {
      name,
      type: TRIGGER_TYPE_TO_MANIFEST_TYPE[type] ?? type,
      folderSlug: folderSlugForResource(args.trigger, args.folderBindings),
      eventName: type === 'customEvent' ? customEventName(args.trigger) : undefined,
      filters: normalizeParameters(arrayField(args.trigger, 'filter')),
    },
  };
}

function remoteTagResource(args: {
  tag: GoogleTagManagerJsonObject;
  namespace: string;
  folderBindings: readonly FolderBinding[];
  triggerBindings: readonly TriggerBinding[];
  variableSlugByName: Map<string, string>;
  desiredTagsByName: Map<string, GoogleTagManagerDesiredResource>;
  templates: readonly GoogleTagManagerJsonObject[];
}): GoogleTagManagerRemoteResource {
  const name = stringField(args.tag, 'name') ?? '<unnamed-tag>';
  const desiredResource = args.desiredTagsByName.get(name);
  const desired = desiredPayload(desiredResource);
  const desiredType = stringField(desired ?? {}, 'type');
  const rawType = stringField(args.tag, 'type') ?? '<unknown>';
  const type = desiredType ?? rawType;
  const inferredSlug =
    desiredResource?.slug ??
    inferSlugFromNamespacedName({ namespace: args.namespace, kind: 'tag', name });
  const slug = inferredSlug ?? remoteId(args.tag, 'tagId');
  const consent = normalizeConsentSettings(args.tag.consentSettings);
  const desiredParameters = arrayField(desired ?? {}, 'parameters');
  const customTemplate = desiredType === 'custom_template';
  const parameters =
    customTemplate
      ? []
      : desiredType === 'consent_default' || desiredType === 'meta_pixel'
      ? normalizeParameters(desiredParameters)
      : normalizeTagParameters({
          type,
          parameters: arrayField(args.tag, 'parameter'),
          variableSlugByName: args.variableSlugByName,
          desiredParameters,
        });
  const htmlParameter = findParameterValue(arrayField(args.tag, 'parameter'), 'html');
  return {
    kind: 'tag',
    slug,
    remoteId: remoteId(args.tag, 'tagId'),
    fingerprint: resourceFingerprint(args.tag),
    managed: managedByDesired(desiredResource, inferredSlug),
    raw: args.tag,
    payload: {
      name,
      type,
      folderSlug: folderSlugForResource(args.tag, args.folderBindings),
      triggerSlugs: arrayField(args.tag, 'firingTriggerId')
        .filter((item): item is string => typeof item === 'string')
        .map((triggerId) => triggerSlugForId(triggerId, args.triggerBindings)),
      parameters,
      ...(customTemplate
        ? {
            rawParameters: arrayField(args.tag, 'parameter'),
            template:
              customTemplateReference(rawType, args.templates) ??
              (isRecord(desired?.template) ? desired.template : undefined),
          }
        : {}),
      ...(stringField(args.tag, 'tagFiringOption')
        ? { tagFiringOption: stringField(args.tag, 'tagFiringOption') }
        : {}),
      ...(desiredType === 'consent_default' && typeof htmlParameter === 'string'
        ? { implementationHtml: htmlParameter }
        : {}),
      ...(consent ? { consent } : {}),
      ...(Array.isArray(desired?.vendorDomains) ? { vendorDomains: desired.vendorDomains } : {}),
      ...(desired?.dedupeStrategy ? { dedupeStrategy: desired.dedupeStrategy } : {}),
      paused: booleanField(args.tag, 'paused') ?? false,
    },
  };
}

export function normalizeGoogleTagManagerApiSnapshot(args: {
  manifest: GoogleTagManagerContainerManifest;
  snapshot: GoogleTagManagerApiSnapshot;
  desiredResources: readonly GoogleTagManagerDesiredResource[];
}): GoogleTagManagerRemoteSnapshot {
  const desired = args.desiredResources;
  const desiredFoldersByName = desiredByName(desired, 'folder');
  const desiredBuiltInsBySlug = desiredBySlug(desired, 'built_in_variable');
  const desiredVariablesByName = desiredByName(desired, 'variable');
  const desiredTriggersByName = desiredByName(desired, 'trigger');
  const desiredTagsByName = desiredByName(desired, 'tag');
  const variableSlugByName = new Map([
    ...desired
      .filter((resource) => resource.kind === 'variable')
      .map((resource) => [resource.name, resource.slug] as const),
    ...(args.manifest.builtInVariables ?? []).map(
      (slug) => [BUILT_IN_VARIABLE_SLUG_TO_NAME[slug] ?? slug, slug] as const,
    ),
  ]);
  const folderBindings = buildFolderBindings(args.snapshot.resources.folders, desiredFoldersByName);
  const triggerBindings = [
    ...buildTriggerBindings({
      triggers: args.snapshot.resources.triggers,
      namespace: args.manifest.namespace,
      desiredTriggersByName,
    }),
    ...(args.manifest.builtInTriggers ?? []).map((trigger) => ({
      triggerId: trigger.triggerId,
      slug: trigger.slug,
    })),
  ];
  const templates = args.snapshot.extended?.templates ?? [];

  return {
    containerPath: args.snapshot.containerPath,
    workspacePath: args.snapshot.workspacePath,
    pulledAt: args.snapshot.pulledAt,
    raw: args.snapshot,
    resources: [
      ...args.snapshot.resources.folders.map((folder) =>
        remoteFolderResource({
          folder,
          desiredFoldersByName,
        }),
      ),
      ...args.snapshot.resources.builtInVariables.map((variable) =>
        remoteBuiltInVariableResource({
          variable,
          desiredBuiltInsBySlug,
        }),
      ),
      ...args.snapshot.resources.variables.map((variable) =>
        remoteVariableResource({
          variable,
          namespace: args.manifest.namespace,
          folderBindings,
          desiredVariablesByName,
        }),
      ),
      ...args.snapshot.resources.triggers.map((trigger) =>
        remoteTriggerResource({
          trigger,
          namespace: args.manifest.namespace,
          folderBindings,
          desiredTriggersByName,
        }),
      ),
      ...args.snapshot.resources.tags.map((tag) =>
        remoteTagResource({
          tag,
          namespace: args.manifest.namespace,
          folderBindings,
          triggerBindings,
          variableSlugByName,
          desiredTagsByName,
          templates,
        }),
      ),
    ],
  };
}

export async function readGoogleTagManagerApiSnapshot(args: {
  client: GoogleTagManagerApiClient;
  options: GoogleTagManagerReadSnapshotOptions;
}): Promise<GoogleTagManagerApiSnapshot> {
  const environment = args.options.manifest.environments[args.options.environment];
  if (!environment) {
    throw new Error(
      `[GTM_ENVIRONMENT_UNKNOWN] Environment '${args.options.environment}' is not declared in the GTM manifest.`,
    );
  }

  const accountId = args.options.manifest.accountId;
  const containerId = args.options.manifest.containerId;
  const accountPath = googleTagManagerAccountPath(accountId);
  const containerPath = googleTagManagerContainerPath(accountId, containerId);
  const workspace = await args.client.resolveWorkspace({
    accountId,
    containerId,
    workspaceId: args.options.workspaceId,
    workspaceName: args.options.workspaceName,
    workspaceNamePrefix: environment.workspacePrefix,
  });
  const workspacePath =
    stringField(workspace, 'path') ??
    (stringField(workspace, 'workspaceId')
      ? `${containerPath}/workspaces/${stringField(workspace, 'workspaceId')}`
      : undefined);

  if (!workspacePath) {
    throw new Error(
      '[GTM_WORKSPACE_PATH_MISSING] Resolved GTM workspace did not include path or workspaceId.',
    );
  }

  const folders = await args.client.listFolders(workspacePath);
  const builtInVariables = await args.client.listBuiltInVariables(workspacePath);
  const variables = await args.client.listVariables(workspacePath);
  const triggers = await args.client.listTriggers(workspacePath);
  const tags = await args.client.listTags(workspacePath);

  const snapshot: GoogleTagManagerApiSnapshot = {
    accountId,
    containerId,
    accountPath,
    containerPath,
    workspacePath,
    workspace,
    pulledAt: new Date().toISOString(),
    resources: {
      folders,
      builtInVariables,
      variables,
      triggers,
      tags,
    },
  };

  if (!args.options.includeExtendedResources) {
    return snapshot;
  }

  return {
    ...snapshot,
    extended: {
      workspaces: await args.client.listWorkspaces({ accountId, containerId }),
      destinations: await args.client.listDestinations({ accountId, containerId }),
      environments: await args.client.listEnvironments({ accountId, containerId }),
      versionHeaders: await args.client.listVersionHeaders({ accountId, containerId }),
      liveVersion: await args.client.getLiveVersion({ accountId, containerId }),
      clients: await args.client.listClients(workspacePath),
      gtagConfigs: await args.client.listGtagConfigs(workspacePath),
      templates: await args.client.listTemplates(workspacePath),
      transformations: await args.client.listTransformations(workspacePath),
      zones: await args.client.listZones(workspacePath),
      ...(args.options.includeUserPermissions
        ? { userPermissions: await args.client.listUserPermissions(accountId) }
        : {}),
    },
  };
}

export async function readGoogleTagManagerRemoteSnapshot(args: {
  client: GoogleTagManagerApiClient;
  options: GoogleTagManagerProviderReadSnapshotOptions;
}): Promise<GoogleTagManagerRemoteSnapshot> {
  const snapshot = await readGoogleTagManagerApiSnapshot(args);
  return normalizeGoogleTagManagerApiSnapshot({
    manifest: args.options.manifest,
    snapshot,
    desiredResources: args.options.desiredResources,
  });
}
