import type {
  GoogleTagManagerAccessTokenProvider,
  GoogleTagManagerJsonObject,
  GoogleTagManagerOAuthScope,
  GoogleTagManagerWorkspace,
} from '@unisane/growth/contracts';

export const GOOGLE_TAG_MANAGER_API_BASE_URL = 'https://tagmanager.googleapis.com';

export const GOOGLE_TAG_MANAGER_READONLY_SCOPE: GoogleTagManagerOAuthScope =
  'https://www.googleapis.com/auth/tagmanager.readonly';

export const GOOGLE_TAG_MANAGER_EDIT_CONTAINERS_SCOPE: GoogleTagManagerOAuthScope =
  'https://www.googleapis.com/auth/tagmanager.edit.containers';

export const GOOGLE_TAG_MANAGER_EDIT_CONTAINER_VERSIONS_SCOPE: GoogleTagManagerOAuthScope =
  'https://www.googleapis.com/auth/tagmanager.edit.containerversions';

export const GOOGLE_TAG_MANAGER_PUBLISH_SCOPE: GoogleTagManagerOAuthScope =
  'https://www.googleapis.com/auth/tagmanager.publish';

type FetchLike = typeof fetch;

type GoogleTagManagerApiListKey =
  | 'account'
  | 'container'
  | 'destination'
  | 'environment'
  | 'containerVersionHeader'
  | 'workspace'
  | 'builtInVariable'
  | 'client'
  | 'folder'
  | 'gtagConfig'
  | 'tag'
  | 'template'
  | 'transformation'
  | 'trigger'
  | 'userPermission'
  | 'variable'
  | 'zone';

export type GoogleTagManagerApiClientOptions = {
  accessToken: string | GoogleTagManagerAccessTokenProvider;
  baseUrl?: string;
  fetch?: FetchLike;
  rateLimitMs?: number;
};

export type GoogleTagManagerWorkspaceSelector = {
  accountId: string;
  containerId: string;
  workspaceId?: string;
  workspaceName?: string;
  workspaceNamePrefix?: string;
};

export class GoogleTagManagerApiError extends Error {
  readonly status: number;
  readonly responseBody: unknown;

  constructor(args: { status: number; message: string; responseBody: unknown }) {
    super(`[GTM_API_REQUEST_FAILED] ${args.status}: ${args.message}`);
    this.name = 'GoogleTagManagerApiError';
    this.status = args.status;
    this.responseBody = args.responseBody;
  }
}

function trimSlashes(value: string): string {
  return value.replace(/^\/+|\/+$/g, '');
}

function encodePathSegment(value: string): string {
  return encodeURIComponent(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringField(value: GoogleTagManagerJsonObject, key: string): string | undefined {
  const field = value[key];
  return typeof field === 'string' && field.length > 0 ? field : undefined;
}

function responseMessage(body: unknown, fallback: string): string {
  if (!isRecord(body)) return fallback;
  const error = body.error;
  if (isRecord(error) && typeof error.message === 'string') {
    return error.message;
  }
  if (typeof body.message === 'string') {
    return body.message;
  }
  return fallback;
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text.trim()) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export function googleTagManagerAccountPath(accountId: string): string {
  return `accounts/${encodePathSegment(accountId)}`;
}

export function googleTagManagerContainerPath(accountId: string, containerId: string): string {
  return `${googleTagManagerAccountPath(accountId)}/containers/${encodePathSegment(containerId)}`;
}

export function googleTagManagerWorkspacePath(args: {
  accountId: string;
  containerId: string;
  workspaceId: string;
}): string {
  return `${googleTagManagerContainerPath(args.accountId, args.containerId)}/workspaces/${encodePathSegment(
    args.workspaceId,
  )}`;
}

export function googleTagManagerContainerVersionPath(args: {
  accountId: string;
  containerId: string;
  versionId: string;
}): string {
  return `${googleTagManagerContainerPath(args.accountId, args.containerId)}/versions/${encodePathSegment(
    args.versionId,
  )}`;
}

export class GoogleTagManagerApiClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: FetchLike;
  private readonly accessToken: string | GoogleTagManagerAccessTokenProvider;
  private readonly rateLimitMs: number;
  private nextRequestAt = 0;
  private rateLimitQueue: Promise<void> = Promise.resolve();

  constructor(options: GoogleTagManagerApiClientOptions) {
    this.baseUrl = options.baseUrl ?? GOOGLE_TAG_MANAGER_API_BASE_URL;
    this.fetchImpl = options.fetch ?? fetch;
    this.accessToken = options.accessToken;
    this.rateLimitMs = options.rateLimitMs ?? 4_000;
  }

  async listAccounts(): Promise<readonly GoogleTagManagerJsonObject[]> {
    return this.listAll('accounts', 'account');
  }

  async listContainers(accountId: string): Promise<readonly GoogleTagManagerJsonObject[]> {
    return this.listAll(`${googleTagManagerAccountPath(accountId)}/containers`, 'container');
  }

  async listDestinations(args: {
    accountId: string;
    containerId: string;
  }): Promise<readonly GoogleTagManagerJsonObject[]> {
    return this.listAll(
      `${googleTagManagerContainerPath(args.accountId, args.containerId)}/destinations`,
      'destination',
    );
  }

  async listEnvironments(args: {
    accountId: string;
    containerId: string;
  }): Promise<readonly GoogleTagManagerJsonObject[]> {
    return this.listAll(
      `${googleTagManagerContainerPath(args.accountId, args.containerId)}/environments`,
      'environment',
    );
  }

  async listVersionHeaders(args: {
    accountId: string;
    containerId: string;
  }): Promise<readonly GoogleTagManagerJsonObject[]> {
    return this.listAll(
      `${googleTagManagerContainerPath(args.accountId, args.containerId)}/version_headers`,
      'containerVersionHeader',
    );
  }

  async getLiveVersion(args: {
    accountId: string;
    containerId: string;
  }): Promise<GoogleTagManagerJsonObject | null> {
    return this.requestJson(
      `${googleTagManagerContainerPath(args.accountId, args.containerId)}/versions:live`,
    );
  }

  async getContainerVersion(args: {
    accountId: string;
    containerId: string;
    versionId: string;
  }): Promise<GoogleTagManagerJsonObject> {
    return this.requestJson(
      googleTagManagerContainerVersionPath({
        accountId: args.accountId,
        containerId: args.containerId,
        versionId: args.versionId,
      }),
    );
  }

  async quickPreviewWorkspace(workspacePath: string): Promise<GoogleTagManagerJsonObject> {
    return this.requestJson(`${trimSlashes(workspacePath)}:quick_preview`, {
      method: 'POST',
    });
  }

  async createContainerVersion(args: {
    workspacePath: string;
    name: string;
    notes?: string;
  }): Promise<GoogleTagManagerJsonObject> {
    return this.requestJson(`${trimSlashes(args.workspacePath)}:create_version`, {
      method: 'POST',
      body: JSON.stringify({
        name: args.name,
        ...(args.notes ? { notes: args.notes } : {}),
      }),
    });
  }

  async publishContainerVersion(args: {
    accountId: string;
    containerId: string;
    versionId: string;
    fingerprint?: string;
  }): Promise<GoogleTagManagerJsonObject> {
    const versionPath = googleTagManagerContainerVersionPath({
      accountId: args.accountId,
      containerId: args.containerId,
      versionId: args.versionId,
    });
    const query = args.fingerprint ? `?fingerprint=${encodeURIComponent(args.fingerprint)}` : '';
    return this.requestJson(`${versionPath}:publish${query}`, {
      method: 'POST',
    });
  }

  async listWorkspaces(args: {
    accountId: string;
    containerId: string;
  }): Promise<readonly GoogleTagManagerWorkspace[]> {
    const workspaces = await this.listAll(
      `${googleTagManagerContainerPath(args.accountId, args.containerId)}/workspaces`,
      'workspace',
    );
    return workspaces.map((workspace) => workspace);
  }

  async resolveWorkspace(
    selector: GoogleTagManagerWorkspaceSelector,
  ): Promise<GoogleTagManagerWorkspace> {
    if (selector.workspaceId) {
      const path = googleTagManagerWorkspacePath({
        accountId: selector.accountId,
        containerId: selector.containerId,
        workspaceId: selector.workspaceId,
      });
      const workspace = await this.requestJson(path);
      return workspace;
    }

    const workspaces = await this.listWorkspaces(selector);
    const byExactName = selector.workspaceName
      ? workspaces.find((workspace) => workspace.name === selector.workspaceName)
      : undefined;
    if (byExactName) return byExactName;

    const byPrefix = selector.workspaceNamePrefix
      ? workspaces.filter((workspace) =>
          workspace.name?.startsWith(selector.workspaceNamePrefix ?? ''),
        )
      : [];
    if (byPrefix.length === 1 && byPrefix[0]) return byPrefix[0];

    if (
      !selector.workspaceName &&
      !selector.workspaceNamePrefix &&
      workspaces.length === 1 &&
      workspaces[0]
    ) {
      return workspaces[0];
    }

    const requested =
      selector.workspaceName ??
      selector.workspaceNamePrefix ??
      selector.workspaceId ??
      '<single workspace>';
    throw new Error(
      `[GTM_WORKSPACE_NOT_RESOLVED] Could not resolve GTM workspace '${requested}' in ${googleTagManagerContainerPath(
        selector.accountId,
        selector.containerId,
      )}. Pass --workspace-id or --workspace-name to disambiguate.`,
    );
  }

  async createWorkspace(args: {
    accountId: string;
    containerId: string;
    name: string;
    description?: string;
  }): Promise<GoogleTagManagerWorkspace> {
    return this.requestJson(
      `${googleTagManagerContainerPath(args.accountId, args.containerId)}/workspaces`,
      {
        method: 'POST',
        body: JSON.stringify({
          name: args.name,
          ...(args.description ? { description: args.description } : {}),
        }),
      },
    );
  }

  async syncWorkspace(workspacePath: string): Promise<GoogleTagManagerJsonObject> {
    return this.requestJson(`${trimSlashes(workspacePath)}:sync`, {
      method: 'POST',
    });
  }

  async getWorkspaceStatus(workspacePath: string): Promise<GoogleTagManagerJsonObject> {
    return this.requestJson(`${trimSlashes(workspacePath)}/status`);
  }

  async listFolders(workspacePath: string): Promise<readonly GoogleTagManagerJsonObject[]> {
    return this.listAll(`${trimSlashes(workspacePath)}/folders`, 'folder');
  }

  async listBuiltInVariables(
    workspacePath: string,
  ): Promise<readonly GoogleTagManagerJsonObject[]> {
    return this.listAll(`${trimSlashes(workspacePath)}/built_in_variables`, 'builtInVariable');
  }

  async listVariables(workspacePath: string): Promise<readonly GoogleTagManagerJsonObject[]> {
    return this.listAll(`${trimSlashes(workspacePath)}/variables`, 'variable');
  }

  async listTriggers(workspacePath: string): Promise<readonly GoogleTagManagerJsonObject[]> {
    return this.listAll(`${trimSlashes(workspacePath)}/triggers`, 'trigger');
  }

  async listTags(workspacePath: string): Promise<readonly GoogleTagManagerJsonObject[]> {
    return this.listAll(`${trimSlashes(workspacePath)}/tags`, 'tag');
  }

  async listClients(workspacePath: string): Promise<readonly GoogleTagManagerJsonObject[]> {
    return this.listAll(`${trimSlashes(workspacePath)}/clients`, 'client');
  }

  async listGtagConfigs(workspacePath: string): Promise<readonly GoogleTagManagerJsonObject[]> {
    return this.listAll(`${trimSlashes(workspacePath)}/gtag_config`, 'gtagConfig');
  }

  async listTemplates(workspacePath: string): Promise<readonly GoogleTagManagerJsonObject[]> {
    return this.listAll(`${trimSlashes(workspacePath)}/templates`, 'template');
  }

  async listTransformations(workspacePath: string): Promise<readonly GoogleTagManagerJsonObject[]> {
    return this.listAll(`${trimSlashes(workspacePath)}/transformations`, 'transformation');
  }

  async listZones(workspacePath: string): Promise<readonly GoogleTagManagerJsonObject[]> {
    return this.listAll(`${trimSlashes(workspacePath)}/zones`, 'zone');
  }

  async listUserPermissions(accountId: string): Promise<readonly GoogleTagManagerJsonObject[]> {
    return this.listAll(
      `${googleTagManagerAccountPath(accountId)}/user_permissions`,
      'userPermission',
    );
  }

  async createBuiltInVariables(args: {
    workspacePath: string;
    types: readonly string[];
  }): Promise<GoogleTagManagerJsonObject> {
    const query = args.types.map((type) => `type=${encodeURIComponent(type)}`).join('&');
    return this.requestJson(
      `${trimSlashes(args.workspacePath)}/built_in_variables${query ? `?${query}` : ''}`,
      {
        method: 'POST',
      },
    );
  }

  async createFolder(args: {
    workspacePath: string;
    body: GoogleTagManagerJsonObject;
  }): Promise<GoogleTagManagerJsonObject> {
    return this.createWorkspaceResource(args.workspacePath, 'folders', args.body);
  }

  async updateFolder(args: {
    path: string;
    body: GoogleTagManagerJsonObject;
    fingerprint?: string;
  }): Promise<GoogleTagManagerJsonObject> {
    return this.updateWorkspaceResource(args.path, args.body, args.fingerprint);
  }

  async createVariable(args: {
    workspacePath: string;
    body: GoogleTagManagerJsonObject;
  }): Promise<GoogleTagManagerJsonObject> {
    return this.createWorkspaceResource(args.workspacePath, 'variables', args.body);
  }

  async updateVariable(args: {
    path: string;
    body: GoogleTagManagerJsonObject;
    fingerprint?: string;
  }): Promise<GoogleTagManagerJsonObject> {
    return this.updateWorkspaceResource(args.path, args.body, args.fingerprint);
  }

  async createTrigger(args: {
    workspacePath: string;
    body: GoogleTagManagerJsonObject;
  }): Promise<GoogleTagManagerJsonObject> {
    return this.createWorkspaceResource(args.workspacePath, 'triggers', args.body);
  }

  async updateTrigger(args: {
    path: string;
    body: GoogleTagManagerJsonObject;
    fingerprint?: string;
  }): Promise<GoogleTagManagerJsonObject> {
    return this.updateWorkspaceResource(args.path, args.body, args.fingerprint);
  }

  async createTag(args: {
    workspacePath: string;
    body: GoogleTagManagerJsonObject;
  }): Promise<GoogleTagManagerJsonObject> {
    return this.createWorkspaceResource(args.workspacePath, 'tags', args.body);
  }

  async updateTag(args: {
    path: string;
    body: GoogleTagManagerJsonObject;
    fingerprint?: string;
  }): Promise<GoogleTagManagerJsonObject> {
    return this.updateWorkspaceResource(args.path, args.body, args.fingerprint);
  }

  async requestJson(apiPath: string, init: RequestInit = {}): Promise<GoogleTagManagerJsonObject> {
    await this.waitForRateLimit();
    const token = await this.resolveAccessToken();
    const url = new URL(`/tagmanager/v2/${trimSlashes(apiPath)}`, this.baseUrl);
    const headers = new Headers(init.headers);
    headers.set('authorization', `Bearer ${token}`);
    headers.set('accept', 'application/json');
    if (typeof init.body !== 'undefined' && !headers.has('content-type')) {
      headers.set('content-type', 'application/json');
    }

    const response = await this.fetchImpl(url, {
      ...init,
      headers,
    });
    const body = await parseResponseBody(response);

    if (!response.ok) {
      throw new GoogleTagManagerApiError({
        status: response.status,
        message: responseMessage(body, response.statusText),
        responseBody: body,
      });
    }

    if (!isRecord(body)) {
      return {};
    }

    return body;
  }

  private async listAll(
    apiPath: string,
    collectionKey: GoogleTagManagerApiListKey,
  ): Promise<readonly GoogleTagManagerJsonObject[]> {
    const items: GoogleTagManagerJsonObject[] = [];
    let pageToken: string | undefined;

    do {
      const pathWithQuery = pageToken
        ? `${trimSlashes(apiPath)}?pageToken=${encodeURIComponent(pageToken)}`
        : apiPath;
      const page = await this.requestJson(pathWithQuery);
      const pageItems = page[collectionKey];
      if (Array.isArray(pageItems)) {
        for (const item of pageItems) {
          if (isRecord(item)) {
            items.push(item);
          }
        }
      }
      pageToken = stringField(page, 'nextPageToken');
    } while (pageToken);

    return items;
  }

  private async createWorkspaceResource(
    workspacePath: string,
    collection: 'folders' | 'variables' | 'triggers' | 'tags',
    body: GoogleTagManagerJsonObject,
  ): Promise<GoogleTagManagerJsonObject> {
    return this.requestJson(`${trimSlashes(workspacePath)}/${collection}`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  private async updateWorkspaceResource(
    path: string,
    body: GoogleTagManagerJsonObject,
    fingerprint?: string,
  ): Promise<GoogleTagManagerJsonObject> {
    const query = fingerprint ? `?fingerprint=${encodeURIComponent(fingerprint)}` : '';
    return this.requestJson(`${trimSlashes(path)}${query}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  private async resolveAccessToken(): Promise<string> {
    const token =
      typeof this.accessToken === 'function' ? await this.accessToken() : this.accessToken;
    if (!token.trim()) {
      throw new Error('[GTM_ACCESS_TOKEN_EMPTY] Google Tag Manager access token is empty.');
    }
    return token;
  }

  private async waitForRateLimit(): Promise<void> {
    if (this.rateLimitMs <= 0) return;

    const previous = this.rateLimitQueue;
    let release!: () => void;
    this.rateLimitQueue = new Promise<void>((resolve) => {
      release = resolve;
    });

    await previous;
    const now = Date.now();
    const waitMs = Math.max(0, this.nextRequestAt - now);
    if (waitMs > 0) {
      await sleep(waitMs);
    }
    this.nextRequestAt = Date.now() + this.rateLimitMs;
    release();
  }
}

export function createGoogleTagManagerApiClient(
  options: GoogleTagManagerApiClientOptions,
): GoogleTagManagerApiClient {
  return new GoogleTagManagerApiClient(options);
}
