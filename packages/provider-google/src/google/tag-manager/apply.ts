import { googleTagManagerContainerPath, type GoogleTagManagerApiClient } from './api-client';
import { readGoogleTagManagerRemoteSnapshot } from './remote-snapshot';
import type {
  GoogleTagManagerAppliedOperation,
  GoogleTagManagerApplyOptions,
  GoogleTagManagerApplyReceipt,
  GoogleTagManagerDesiredResource,
  GoogleTagManagerJsonObject,
  GoogleTagManagerParameterValue,
  GoogleTagManagerPlan,
  GoogleTagManagerPlanOperation,
  GoogleTagManagerRemoteResource,
  GoogleTagManagerRemoteSnapshot,
  GoogleTagManagerResourceKind,
  GoogleTagManagerWorkspace,
} from '@unisane/growth/contracts';

export type GoogleTagManagerProviderApplyOptions = GoogleTagManagerApplyOptions & {
  desiredResources: readonly GoogleTagManagerDesiredResource[];
  plan(remote: GoogleTagManagerRemoteSnapshot): GoogleTagManagerPlan;
};

const BUILT_IN_VARIABLE_SLUG_TO_TYPE: Record<string, string> = {
  page_url: 'pageUrl',
  page_path: 'pagePath',
  page_hostname: 'pageHostname',
  referrer: 'referrer',
  event: 'event',
  click_element: 'clickElement',
  click_classes: 'clickClasses',
  click_id: 'clickId',
  click_target: 'clickTarget',
  click_url: 'clickUrl',
  click_text: 'clickText',
  form_element: 'formElement',
  form_classes: 'formClasses',
  form_id: 'formId',
  form_target: 'formTarget',
  form_url: 'formUrl',
  form_text: 'formText',
  history_source: 'historySource',
  new_history_fragment: 'newHistoryFragment',
  old_history_fragment: 'oldHistoryFragment',
  new_history_state: 'newHistoryState',
  old_history_state: 'oldHistoryState',
  analytics_client_id: 'analyticsClientId',
  analytics_session_id: 'analyticsSessionId',
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

const VARIABLE_TYPE_TO_GTM_TYPE: Record<string, string> = {
  constant: 'c',
  data_layer: 'v',
  environment: 'e',
  lookup_table: 'smm',
};

const TRIGGER_TYPE_TO_GTM_TYPE: Record<string, string> = {
  all_pages: 'pageview',
  data_layer_event: 'customEvent',
  page_path: 'pageview',
  consent_initialization: 'consentInit',
};

const TAG_TYPE_TO_GTM_TYPE: Record<string, string> = {
  google_tag: 'googtag',
  ga4_pageview: 'gaawe',
  ga4_event: 'gaawe',
  google_ads_conversion_linker: 'gclidw',
  google_ads_conversion: 'awct',
  consent_default: 'html',
  clarity: 'cvt_MQDKZ',
  meta_pixel: 'html',
  custom_html: 'html',
};

type ResourceBinding = {
  remoteId: string;
  fingerprint?: string;
  path?: string;
  raw?: GoogleTagManagerJsonObject;
};

type ApplyState = {
  folderIdsBySlug: Map<string, ResourceBinding>;
  triggerIdsBySlug: Map<string, ResourceBinding>;
  remoteByKey: Map<string, GoogleTagManagerRemoteResource>;
};

function isRecord(value: unknown): value is GoogleTagManagerJsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringField(
  value: GoogleTagManagerJsonObject | undefined,
  key: string,
): string | undefined {
  const field = value?.[key];
  return typeof field === 'string' && field.length > 0 ? field : undefined;
}

function arrayField(
  value: GoogleTagManagerJsonObject | undefined,
  key: string,
): readonly unknown[] {
  const field = value?.[key];
  return Array.isArray(field) ? field : [];
}

function resourceKey(kind: GoogleTagManagerResourceKind, slug: string): string {
  return `${kind}:${slug}`;
}

function trimSlashes(value: string): string {
  return value.replace(/^\/+|\/+$/g, '');
}

function workspaceIdFromWorkspace(workspace: GoogleTagManagerWorkspace): string | undefined {
  if (workspace.workspaceId) return workspace.workspaceId;
  const path = workspace.path;
  const match = path?.match(/\/workspaces\/([^/]+)$/);
  return match?.[1];
}

function workspacePathFromWorkspace(args: {
  workspace: GoogleTagManagerWorkspace;
  accountId: string;
  containerId: string;
}): string {
  if (args.workspace.path) return args.workspace.path;
  const workspaceId = workspaceIdFromWorkspace(args.workspace);
  if (!workspaceId) {
    throw new Error(
      '[GTM_WORKSPACE_PATH_MISSING] GTM workspace did not include path or workspaceId.',
    );
  }
  return `${googleTagManagerContainerPath(args.accountId, args.containerId)}/workspaces/${workspaceId}`;
}

function timestampSegment(): string {
  return new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z');
}

async function ensureApplyWorkspace(args: {
  client: GoogleTagManagerApiClient;
  options: GoogleTagManagerApplyOptions;
}): Promise<GoogleTagManagerWorkspace> {
  const accountId = args.options.manifest.accountId;
  const containerId = args.options.manifest.containerId;
  if (args.options.workspaceId || args.options.workspaceName) {
    return args.client.resolveWorkspace({
      accountId,
      containerId,
      workspaceId: args.options.workspaceId,
      workspaceName: args.options.workspaceName,
    });
  }

  const environment = args.options.manifest.environments[args.options.environment];
  if (!environment) {
    throw new Error(
      `[GTM_ENVIRONMENT_UNKNOWN] Environment '${args.options.environment}' is not declared in the GTM manifest.`,
    );
  }

  return args.client.createWorkspace({
    accountId,
    containerId,
    name: `${environment.workspacePrefix}-${timestampSegment()}`,
    description:
      args.options.workspaceDescription ??
      `Unisane GTM apply workspace for ${args.options.manifest.appId}/${args.options.environment}`,
  });
}

function hasMergeConflicts(value: GoogleTagManagerJsonObject): boolean {
  return arrayField(value, 'mergeConflict').length > 0;
}

function assertNoMergeConflicts(value: GoogleTagManagerJsonObject, stage: string): void {
  if (!hasMergeConflicts(value)) return;
  throw new Error(
    `[GTM_WORKSPACE_CONFLICT] GTM workspace has merge conflicts after ${stage}. Resolve conflicts before applying.`,
  );
}

function parameterValue(
  value: GoogleTagManagerParameterValue,
  variableNameBySlug: Map<string, string>,
): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.join(',');
  if ('variable' in value) {
    const name = variableNameBySlug.get(value.variable) ?? value.variable;
    return `{{${name}}}`;
  }
  if ('secretRef' in value) return `{{${value.secretRef}}}`;
  return '';
}

function parameterType(value: GoogleTagManagerParameterValue): string {
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'integer';
  if (Array.isArray(value)) return 'list';
  return 'template';
}

function parameter(args: {
  key: string;
  value: GoogleTagManagerParameterValue;
  variableNameBySlug: Map<string, string>;
}): GoogleTagManagerJsonObject {
  return {
    type: parameterType(args.value),
    key: args.key,
    value: parameterValue(args.value, args.variableNameBySlug),
  };
}

function tagParameterKey(type: string, key: string): string {
  if ((type === 'ga4_pageview' || type === 'ga4_event') && key === 'measurementId') {
    return 'measurementIdOverride';
  }
  if (type === 'google_ads_conversion' && key === 'value') return 'conversionValue';
  if (type === 'google_ads_conversion' && key === 'currency') return 'currencyCode';
  return key;
}

function parameterValueByKey(
  parameters: readonly { key: string; value: GoogleTagManagerParameterValue }[],
  key: string,
): GoogleTagManagerParameterValue | undefined {
  return parameters.find((entry) => entry.key === key)?.value;
}

function metaPixelHtml(args: {
  parameters: readonly { key: string; value: GoogleTagManagerParameterValue }[];
  variableNameBySlug: Map<string, string>;
}): string {
  const pixelId = parameterValueByKey(args.parameters, 'pixelId');
  const eventName = parameterValueByKey(args.parameters, 'eventName');
  const eventId = parameterValueByKey(args.parameters, 'eventId');
  const normalizedEventName = typeof eventName === 'string' && eventName ? eventName : 'PageView';
  const eventOptions =
    typeof eventId === 'undefined'
      ? ''
      : `, {}, {eventID: ${JSON.stringify(parameterValue(eventId, args.variableNameBySlug))}}`;
  return [
    '<script>',
    '!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?',
    'n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;',
    "n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;",
    't.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}',
    "(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');",
    `fbq('init', ${JSON.stringify(parameterValue(pixelId ?? '', args.variableNameBySlug))});`,
    `fbq('track', ${JSON.stringify(normalizedEventName)}${eventOptions});`,
    '</script>',
  ].join('\n');
}

function htmlParameters(args: {
  type: string;
  sourceParameters: readonly { key: string; value: GoogleTagManagerParameterValue }[];
  variableNameBySlug: Map<string, string>;
  implementationHtml?: string;
}): readonly GoogleTagManagerJsonObject[] | undefined {
  if (args.type === 'consent_default') {
    if (!args.implementationHtml) {
      throw new Error(
        '[GTM_CONSENT_HTML_MISSING] consent_default desired state requires implementationHtml.',
      );
    }
    return [
      conditionParameter('html', args.implementationHtml),
      conditionParameter('supportDocumentWrite', 'false'),
    ];
  }
  if (args.type === 'meta_pixel') {
    return [
      conditionParameter(
        'html',
        metaPixelHtml({
          parameters: args.sourceParameters,
          variableNameBySlug: args.variableNameBySlug,
        }),
      ),
      conditionParameter('supportDocumentWrite', 'false'),
    ];
  }
  if (args.type !== 'custom_html') return undefined;
  const html = parameterValueByKey(args.sourceParameters, 'html');
  if (typeof html !== 'string' || html.length === 0) {
    throw new Error('[GTM_CUSTOM_HTML_MISSING] custom_html tags must declare an html parameter.');
  }
  return [conditionParameter('html', html), conditionParameter('supportDocumentWrite', 'false')];
}

function tableParameter(args: {
  key: string;
  entries: readonly { key: string; value: GoogleTagManagerParameterValue }[];
  variableNameBySlug: Map<string, string>;
}): GoogleTagManagerJsonObject {
  return {
    type: 'list',
    key: args.key,
    list: args.entries.map((entry) => ({
      type: 'map',
      map: [
        conditionParameter('parameter', entry.key),
        conditionParameter('parameterValue', parameterValue(entry.value, args.variableNameBySlug)),
      ],
    })),
  };
}

function listParameter(key: string, values: readonly string[]): GoogleTagManagerJsonObject {
  return {
    type: 'list',
    key,
    list: values.map((value) => ({
      type: 'template',
      value,
    })),
  };
}

function conditionParameter(key: string, value: string): GoogleTagManagerJsonObject {
  return {
    type: 'template',
    key,
    value,
  };
}

function consentSettings(consent: unknown): GoogleTagManagerJsonObject | undefined {
  if (!isRecord(consent)) return undefined;
  if (consent.noAdditionalConsentRequired === true) {
    return { consentStatus: 'notNeeded' };
  }
  const requiredConsent = arrayField(consent, 'requiredConsent').filter(
    (entry): entry is string => typeof entry === 'string' && entry.length > 0,
  );
  if (requiredConsent.length === 0) return undefined;
  return {
    consentStatus: 'needed',
    consentType: listParameter('consentType', requiredConsent),
  };
}

function pathForResource(args: {
  workspacePath: string;
  kind: GoogleTagManagerResourceKind;
  remote: GoogleTagManagerRemoteResource;
}): string {
  const rawPath = stringField(args.remote.raw, 'path');
  if (rawPath) return rawPath;
  const collectionByKind: Record<
    Exclude<GoogleTagManagerResourceKind, 'built_in_variable'>,
    string
  > = {
    folder: 'folders',
    variable: 'variables',
    trigger: 'triggers',
    tag: 'tags',
  };
  if (args.kind === 'built_in_variable') {
    throw new Error(
      '[GTM_BUILT_IN_VARIABLE_UPDATE_UNSUPPORTED] Built-in variables do not support update.',
    );
  }
  return `${trimSlashes(args.workspacePath)}/${collectionByKind[args.kind]}/${encodeURIComponent(args.remote.remoteId)}`;
}

function remoteBinding(resource: GoogleTagManagerRemoteResource): ResourceBinding {
  return {
    remoteId: resource.remoteId,
    fingerprint: resource.fingerprint,
    path: stringField(resource.raw, 'path'),
    raw: resource.raw,
  };
}

function buildApplyState(snapshot: GoogleTagManagerRemoteSnapshot): ApplyState {
  const remoteByKey = new Map(
    snapshot.resources.map((resource) => [resourceKey(resource.kind, resource.slug), resource]),
  );
  const folderIdsBySlug = new Map<string, ResourceBinding>();
  const triggerIdsBySlug = new Map<string, ResourceBinding>();
  for (const resource of snapshot.resources) {
    if (resource.kind === 'folder') folderIdsBySlug.set(resource.slug, remoteBinding(resource));
    if (resource.kind === 'trigger') triggerIdsBySlug.set(resource.slug, remoteBinding(resource));
  }
  return {
    folderIdsBySlug,
    triggerIdsBySlug,
    remoteByKey,
  };
}

function desiredPayload(resource: GoogleTagManagerDesiredResource): GoogleTagManagerJsonObject {
  if (!isRecord(resource.payload)) {
    throw new Error(
      `[GTM_DESIRED_PAYLOAD_INVALID] Desired ${resource.kind}:${resource.slug} payload must be an object.`,
    );
  }
  return resource.payload;
}

function folderIdForSlug(state: ApplyState, folderSlug: unknown): string | undefined {
  if (typeof folderSlug !== 'string') return undefined;
  const binding = state.folderIdsBySlug.get(folderSlug);
  if (!binding) {
    throw new Error(
      `[GTM_FOLDER_BINDING_MISSING] Folder '${folderSlug}' must exist before dependent resources can be applied.`,
    );
  }
  return binding.remoteId;
}

function lowerFolder(resource: GoogleTagManagerDesiredResource): GoogleTagManagerJsonObject {
  const payload = desiredPayload(resource);
  const name = stringField(payload, 'name');
  if (!name)
    throw new Error(`[GTM_FOLDER_NAME_MISSING] Folder '${resource.slug}' is missing a name.`);
  return { name };
}

function lowerVariable(args: {
  resource: GoogleTagManagerDesiredResource;
  state: ApplyState;
  variableNameBySlug: Map<string, string>;
}): GoogleTagManagerJsonObject {
  const payload = desiredPayload(args.resource);
  const type = stringField(payload, 'type');
  const name = stringField(payload, 'name');
  if (!type || !name) {
    throw new Error(
      `[GTM_VARIABLE_PAYLOAD_INVALID] Variable '${args.resource.slug}' is missing type or name.`,
    );
  }
  const parameters = arrayField(payload, 'parameters').flatMap((entry) => {
    if (!isRecord(entry) || typeof entry.key !== 'string') return [];
    const key = type === 'data_layer' && entry.key === 'dataLayerName' ? 'name' : entry.key;
    return [
      parameter({
        key,
        value: entry.value as GoogleTagManagerParameterValue,
        variableNameBySlug: args.variableNameBySlug,
      }),
    ];
  });
  return {
    name,
    type: VARIABLE_TYPE_TO_GTM_TYPE[type] ?? type,
    ...(parameters.length > 0 ? { parameter: parameters } : {}),
    ...(folderIdForSlug(args.state, payload.folderSlug)
      ? { parentFolderId: folderIdForSlug(args.state, payload.folderSlug) }
      : {}),
  };
}

function lowerTrigger(args: {
  resource: GoogleTagManagerDesiredResource;
  state: ApplyState;
  variableNameBySlug: Map<string, string>;
}): GoogleTagManagerJsonObject {
  const payload = desiredPayload(args.resource);
  const type = stringField(payload, 'type');
  const name = stringField(payload, 'name');
  if (!type || !name) {
    throw new Error(
      `[GTM_TRIGGER_PAYLOAD_INVALID] Trigger '${args.resource.slug}' is missing type or name.`,
    );
  }
  const body: GoogleTagManagerJsonObject = {
    name,
    type: TRIGGER_TYPE_TO_GTM_TYPE[type] ?? type,
    ...(folderIdForSlug(args.state, payload.folderSlug)
      ? { parentFolderId: folderIdForSlug(args.state, payload.folderSlug) }
      : {}),
  };
  if (type === 'data_layer_event') {
    const eventName = stringField(payload, 'eventName');
    if (!eventName) {
      throw new Error(
        `[GTM_TRIGGER_EVENT_MISSING] Data-layer trigger '${args.resource.slug}' is missing eventName.`,
      );
    }
    body.customEventFilter = [
      {
        type: 'equals',
        parameter: [
          conditionParameter('arg0', '{{_event}}'),
          conditionParameter('arg1', eventName),
        ],
      },
    ];
  }
  const filters = arrayField(payload, 'filters').flatMap((entry) => {
    if (!isRecord(entry) || typeof entry.key !== 'string') return [];
    return [
      {
        type: 'equals',
        parameter: [
          conditionParameter('arg0', entry.key),
          conditionParameter(
            'arg1',
            parameterValue(entry.value as GoogleTagManagerParameterValue, args.variableNameBySlug),
          ),
        ],
      },
    ];
  });
  if (filters.length > 0) body.filter = filters;
  return body;
}

function lowerTag(args: {
  resource: GoogleTagManagerDesiredResource;
  state: ApplyState;
  variableNameBySlug: Map<string, string>;
}): GoogleTagManagerJsonObject {
  const payload = desiredPayload(args.resource);
  const type = stringField(payload, 'type');
  const name = stringField(payload, 'name');
  if (!type || !name) {
    throw new Error(
      `[GTM_TAG_PAYLOAD_INVALID] Tag '${args.resource.slug}' is missing type or name.`,
    );
  }
  const triggerSlugs = arrayField(payload, 'triggerSlugs').filter(
    (slug): slug is string => typeof slug === 'string',
  );
  const firingTriggerId = triggerSlugs.map((slug) => {
    const binding = args.state.triggerIdsBySlug.get(slug);
    if (!binding) {
      throw new Error(
        `[GTM_TRIGGER_BINDING_MISSING] Trigger '${slug}' must exist before tag '${args.resource.slug}' can be applied.`,
      );
    }
    return binding.remoteId;
  });
  const sourceParameters = arrayField(payload, 'parameters').flatMap((entry) => {
    if (!isRecord(entry) || typeof entry.key !== 'string') return [];
    return [{ key: entry.key, value: entry.value as GoogleTagManagerParameterValue }];
  });
  const renderedHtmlParameters = htmlParameters({
    type,
    sourceParameters,
    variableNameBySlug: args.variableNameBySlug,
    implementationHtml: stringField(payload, 'implementationHtml'),
  });
  const eventSettingParameters: { key: string; value: GoogleTagManagerParameterValue }[] = [];
  const configSettingParameters: { key: string; value: GoogleTagManagerParameterValue }[] = [];
  const parameters = renderedHtmlParameters
    ? [...renderedHtmlParameters]
    : sourceParameters.flatMap((entry) => {
        if (type === 'google_tag' && entry.key !== 'tagId') {
          configSettingParameters.push(entry);
          return [];
        }
        if (type === 'ga4_event' && entry.key !== 'eventName' && entry.key !== 'measurementId') {
          eventSettingParameters.push(entry);
          return [];
        }
        return [
          parameter({
            key: tagParameterKey(type, entry.key),
            value: entry.value,
            variableNameBySlug: args.variableNameBySlug,
          }),
        ];
      });
  if (type === 'ga4_pageview' && !parameters.some((entry) => entry.key === 'eventName')) {
    parameters.push(conditionParameter('eventName', 'page_view'));
  }
  if (type === 'ga4_event' && eventSettingParameters.length > 0) {
    parameters.push(
      tableParameter({
        key: 'eventSettingsTable',
        entries: eventSettingParameters,
        variableNameBySlug: args.variableNameBySlug,
      }),
    );
  }
  if (type === 'google_tag' && configSettingParameters.length > 0) {
    parameters.push(
      tableParameter({
        key: 'configSettingsTable',
        entries: configSettingParameters,
        variableNameBySlug: args.variableNameBySlug,
      }),
    );
  }
  const tagConsentSettings = consentSettings(payload.consent);
  return {
    name,
    type: TAG_TYPE_TO_GTM_TYPE[type] ?? type,
    ...(parameters.length > 0 ? { parameter: parameters } : {}),
    ...(firingTriggerId.length > 0 ? { firingTriggerId } : {}),
    ...(folderIdForSlug(args.state, payload.folderSlug)
      ? { parentFolderId: folderIdForSlug(args.state, payload.folderSlug) }
      : {}),
    ...(tagConsentSettings ? { consentSettings: tagConsentSettings } : {}),
    paused: payload.paused === true,
  };
}

function lowerResource(args: {
  resource: GoogleTagManagerDesiredResource;
  state: ApplyState;
  variableNameBySlug: Map<string, string>;
}): GoogleTagManagerJsonObject {
  if (args.resource.kind === 'folder') return lowerFolder(args.resource);
  if (args.resource.kind === 'variable') return lowerVariable(args);
  if (args.resource.kind === 'trigger') return lowerTrigger(args);
  if (args.resource.kind === 'tag') return lowerTag(args);
  throw new Error(
    `[GTM_RESOURCE_KIND_UNSUPPORTED] ${args.resource.kind} cannot be lowered as a mutable body.`,
  );
}

function bindingFromResponse(args: {
  kind: GoogleTagManagerResourceKind;
  response: GoogleTagManagerJsonObject;
  fallbackRemoteId: string;
}): ResourceBinding {
  const idFieldByKind: Partial<Record<GoogleTagManagerResourceKind, string>> = {
    folder: 'folderId',
    variable: 'variableId',
    trigger: 'triggerId',
    tag: 'tagId',
  };
  const idField = idFieldByKind[args.kind];
  return {
    remoteId: (idField ? stringField(args.response, idField) : undefined) ?? args.fallbackRemoteId,
    fingerprint: stringField(args.response, 'fingerprint'),
    path: stringField(args.response, 'path'),
    raw: args.response,
  };
}

async function executeCreate(args: {
  client: GoogleTagManagerApiClient;
  workspacePath: string;
  operation: GoogleTagManagerPlanOperation;
  desired: GoogleTagManagerDesiredResource;
  state: ApplyState;
  variableNameBySlug: Map<string, string>;
}): Promise<GoogleTagManagerAppliedOperation> {
  if (args.operation.kind === 'built_in_variable') {
    const type = BUILT_IN_VARIABLE_SLUG_TO_TYPE[args.operation.slug] ?? args.operation.slug;
    await args.client.createBuiltInVariables({
      workspacePath: args.workspacePath,
      types: [type],
    });
    return {
      type: args.operation.type,
      kind: args.operation.kind,
      slug: args.operation.slug,
      remoteId: type,
    };
  }

  const body = lowerResource({
    resource: args.desired,
    state: args.state,
    variableNameBySlug: args.variableNameBySlug,
  });
  const response =
    args.operation.kind === 'folder'
      ? await args.client.createFolder({ workspacePath: args.workspacePath, body })
      : args.operation.kind === 'variable'
        ? await args.client.createVariable({ workspacePath: args.workspacePath, body })
        : args.operation.kind === 'trigger'
          ? await args.client.createTrigger({ workspacePath: args.workspacePath, body })
          : await args.client.createTag({ workspacePath: args.workspacePath, body });
  const binding = bindingFromResponse({
    kind: args.operation.kind,
    response,
    fallbackRemoteId: args.operation.remoteId ?? args.operation.slug,
  });
  if (args.operation.kind === 'folder')
    args.state.folderIdsBySlug.set(args.operation.slug, binding);
  if (args.operation.kind === 'trigger')
    args.state.triggerIdsBySlug.set(args.operation.slug, binding);
  return {
    type: args.operation.type,
    kind: args.operation.kind,
    slug: args.operation.slug,
    remoteId: binding.remoteId,
    fingerprint: binding.fingerprint,
    path: binding.path,
  };
}

async function executeUpdate(args: {
  client: GoogleTagManagerApiClient;
  workspacePath: string;
  operation: GoogleTagManagerPlanOperation;
  desired: GoogleTagManagerDesiredResource;
  remote: GoogleTagManagerRemoteResource;
  state: ApplyState;
  variableNameBySlug: Map<string, string>;
}): Promise<GoogleTagManagerAppliedOperation> {
  const body = lowerResource({
    resource: args.desired,
    state: args.state,
    variableNameBySlug: args.variableNameBySlug,
  });
  const path = pathForResource({
    workspacePath: args.workspacePath,
    kind: args.operation.kind,
    remote: args.remote,
  });
  const response =
    args.operation.kind === 'folder'
      ? await args.client.updateFolder({ path, body, fingerprint: args.operation.fingerprint })
      : args.operation.kind === 'variable'
        ? await args.client.updateVariable({ path, body, fingerprint: args.operation.fingerprint })
        : args.operation.kind === 'trigger'
          ? await args.client.updateTrigger({ path, body, fingerprint: args.operation.fingerprint })
          : await args.client.updateTag({ path, body, fingerprint: args.operation.fingerprint });
  const binding = bindingFromResponse({
    kind: args.operation.kind,
    response,
    fallbackRemoteId: args.operation.remoteId ?? args.operation.slug,
  });
  if (args.operation.kind === 'folder')
    args.state.folderIdsBySlug.set(args.operation.slug, binding);
  if (args.operation.kind === 'trigger')
    args.state.triggerIdsBySlug.set(args.operation.slug, binding);
  return {
    type: args.operation.type,
    kind: args.operation.kind,
    slug: args.operation.slug,
    remoteId: binding.remoteId,
    fingerprint: binding.fingerprint,
    path: binding.path ?? path,
  };
}

async function executePauseTag(args: {
  client: GoogleTagManagerApiClient;
  workspacePath: string;
  operation: GoogleTagManagerPlanOperation;
  remote: GoogleTagManagerRemoteResource;
}): Promise<GoogleTagManagerAppliedOperation> {
  if (!args.remote.raw) {
    throw new Error(
      `[GTM_TAG_RAW_MISSING] Cannot pause tag '${args.operation.slug}' without raw GTM tag data.`,
    );
  }
  const path = pathForResource({
    workspacePath: args.workspacePath,
    kind: 'tag',
    remote: args.remote,
  });
  const response = await args.client.updateTag({
    path,
    body: {
      ...args.remote.raw,
      paused: true,
    },
    fingerprint: args.operation.fingerprint,
  });
  return {
    type: args.operation.type,
    kind: args.operation.kind,
    slug: args.operation.slug,
    remoteId: stringField(response, 'tagId') ?? args.operation.remoteId,
    fingerprint: stringField(response, 'fingerprint'),
    path: stringField(response, 'path') ?? path,
  };
}

export async function applyGoogleTagManagerPlan(args: {
  client: GoogleTagManagerApiClient;
  options: GoogleTagManagerProviderApplyOptions;
}): Promise<GoogleTagManagerApplyReceipt> {
  const accountId = args.options.manifest.accountId;
  const containerId = args.options.manifest.containerId;
  const workspace = await ensureApplyWorkspace(args);
  const workspacePath = workspacePathFromWorkspace({ workspace, accountId, containerId });
  const syncStatus = await args.client.syncWorkspace(workspacePath);
  assertNoMergeConflicts(syncStatus, 'sync');
  const workspaceId = workspaceIdFromWorkspace(workspace);
  const remote = await readGoogleTagManagerRemoteSnapshot({
    client: args.client,
    options: {
      manifest: args.options.manifest,
      environment: args.options.environment,
      workspaceId,
      workspaceName: workspace.name,
      desiredResources: args.options.desiredResources,
    },
  });
  const plan = args.options.plan(remote);
  const desiredByKey = new Map(
    args.options.desiredResources.map((resource) => [
      resourceKey(resource.kind, resource.slug),
      resource,
    ]),
  );
  const variableNameBySlug = new Map([
    ...args.options.desiredResources
      .filter((resource) => resource.kind === 'variable')
      .map((resource) => [resource.slug, resource.name] as const),
    ...(args.options.manifest.builtInVariables ?? []).map(
      (slug) => [slug, BUILT_IN_VARIABLE_SLUG_TO_NAME[slug] ?? slug] as const,
    ),
  ]);
  const state = buildApplyState(remote);
  const appliedOperations: GoogleTagManagerAppliedOperation[] = [];
  const skippedOperations: GoogleTagManagerAppliedOperation[] = [];

  for (const operation of plan.operations) {
    const key = resourceKey(operation.kind, operation.slug);
    if (operation.type === 'retain_unmanaged_resource') {
      skippedOperations.push({
        type: operation.type,
        kind: operation.kind,
        slug: operation.slug,
        remoteId: operation.remoteId,
        fingerprint: operation.fingerprint,
        skipped: true,
      });
      continue;
    }

    if (operation.type === 'create_resource') {
      const desired = desiredByKey.get(key);
      if (!desired)
        throw new Error(`[GTM_DESIRED_RESOURCE_MISSING] Missing desired resource for ${key}.`);
      appliedOperations.push(
        await executeCreate({
          client: args.client,
          workspacePath,
          operation,
          desired,
          state,
          variableNameBySlug,
        }),
      );
      continue;
    }

    if (operation.type === 'update_resource') {
      const desired = desiredByKey.get(key);
      const remoteResource = state.remoteByKey.get(key);
      if (!desired)
        throw new Error(`[GTM_DESIRED_RESOURCE_MISSING] Missing desired resource for ${key}.`);
      if (!remoteResource)
        throw new Error(`[GTM_REMOTE_RESOURCE_MISSING] Missing remote resource for ${key}.`);
      appliedOperations.push(
        await executeUpdate({
          client: args.client,
          workspacePath,
          operation,
          desired,
          remote: remoteResource,
          state,
          variableNameBySlug,
        }),
      );
      continue;
    }

    if (operation.type === 'pause_tag') {
      const remoteResource = state.remoteByKey.get(key);
      if (!remoteResource)
        throw new Error(`[GTM_REMOTE_RESOURCE_MISSING] Missing remote resource for ${key}.`);
      appliedOperations.push(
        await executePauseTag({
          client: args.client,
          workspacePath,
          operation,
          remote: remoteResource,
        }),
      );
    }
  }

  const workspaceStatus = await args.client.getWorkspaceStatus(workspacePath);
  assertNoMergeConflicts(workspaceStatus, 'apply');

  return {
    appId: args.options.manifest.appId,
    environment: args.options.environment,
    accountId,
    containerId,
    containerPath: googleTagManagerContainerPath(accountId, containerId),
    workspacePath,
    workspaceName: workspace.name,
    appliedAt: new Date().toISOString(),
    operationCount: plan.operations.length,
    appliedOperations,
    skippedOperations,
    syncStatus,
    workspaceStatus,
    plan,
  };
}
