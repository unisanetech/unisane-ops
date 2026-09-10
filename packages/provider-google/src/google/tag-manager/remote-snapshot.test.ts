import { describe, expect, it, vi } from 'vitest';
import { getGoogleTagManagerDesiredResources } from '@unisane/growth/gtm';
import {
  normalizeGoogleTagManagerApiSnapshot,
  readGoogleTagManagerApiSnapshot,
} from './remote-snapshot.js';

function client() {
  return {
    resolveWorkspace: vi.fn(async () => ({ path: 'accounts/1/containers/2/workspaces/3' })),
    listFolders: vi.fn(async () => []),
    listBuiltInVariables: vi.fn(async () => []),
    listVariables: vi.fn(async () => []),
    listTriggers: vi.fn(async () => []),
    listTags: vi.fn(async () => []),
    listWorkspaces: vi.fn(async () => []),
    listDestinations: vi.fn(async () => []),
    listEnvironments: vi.fn(async () => []),
    listVersionHeaders: vi.fn(async () => []),
    getLiveVersion: vi.fn(async () => null),
    listClients: vi.fn(async () => []),
    listGtagConfigs: vi.fn(async () => []),
    listTemplates: vi.fn(async () => []),
    listTransformations: vi.fn(async () => []),
    listZones: vi.fn(async () => []),
    listUserPermissions: vi.fn(async () => [{ path: 'accounts/1/user_permissions/1' }]),
  };
}

function options(includeUserPermissions = false) {
  return {
    manifest: {
      appId: 'shop',
      accountId: '1',
      containerId: '2',
      namespace: 'test',
      environments: { local: { workspacePrefix: 'Default Workspace' } },
    },
    environment: 'local',
    workspaceId: '3',
    includeExtendedResources: true,
    includeUserPermissions,
  };
}

describe('extended GTM snapshots', () => {
  it('remain read-only scoped unless user-permission inventory is explicitly requested', async () => {
    const api = client();
    const snapshot = await readGoogleTagManagerApiSnapshot({
      client: api as never,
      options: options() as never,
    });

    expect(api.listTemplates).toHaveBeenCalledOnce();
    expect(api.listUserPermissions).not.toHaveBeenCalled();
    expect(snapshot.extended?.userPermissions).toBeUndefined();
  });

  it('reads user permissions only behind the explicit elevated option', async () => {
    const api = client();
    const snapshot = await readGoogleTagManagerApiSnapshot({
      client: api as never,
      options: options(true) as never,
    });

    expect(api.listUserPermissions).toHaveBeenCalledWith('1');
    expect(snapshot.extended?.userPermissions).toHaveLength(1);
  });

  it('preserves nested custom-template parameters and verifies the pinned Gallery version', () => {
    const manifest = {
      appId: 'shop',
      accountId: '1',
      containerId: '2',
      namespace: 'test',
      environments: { local: { workspacePrefix: 'Default Workspace' } },
      builtInTriggers: [{ slug: 'all_pages_builtin', triggerId: '2147479553' }],
      tags: [
        {
          slug: 'meta_page_view',
          name: 'Meta PageView',
          type: 'custom_template',
          triggerSlugs: ['all_pages_builtin'],
          template: {
            tagType: 'cvt_2_7',
            templateId: '7',
            host: 'github.com',
            owner: 'facebookarchive',
            repository: 'facebook-pixel',
            version: 'abc123',
          },
          rawParameters: [
            {
              type: 'list',
              key: 'advancedMatchingList',
              list: [
                {
                  type: 'map',
                  map: [
                    { type: 'template', key: 'name', value: 'country' },
                    { type: 'template', key: 'value', value: '{{Country}}' },
                  ],
                },
              ],
            },
          ],
          approval: { customTemplate: true },
        },
      ],
    } as const;
    const desired = getGoogleTagManagerDesiredResources(manifest);
    const normalized = normalizeGoogleTagManagerApiSnapshot({
      manifest,
      desiredResources: desired,
      snapshot: {
        accountId: '1',
        containerId: '2',
        accountPath: 'accounts/1',
        containerPath: 'accounts/1/containers/2',
        workspacePath: 'accounts/1/containers/2/workspaces/3',
        pulledAt: '2026-09-03T00:00:00.000Z',
        resources: {
          folders: [],
          builtInVariables: [],
          variables: [],
          triggers: [],
          tags: [
            {
              tagId: '10',
              name: 'Meta PageView',
              type: 'cvt_2_7',
              firingTriggerId: ['2147479553'],
              parameter: manifest.tags[0].rawParameters,
            },
          ],
        },
        extended: {
          templates: [
            {
              templateId: '7',
              galleryReference: {
                host: 'github.com',
                owner: 'facebookarchive',
                repository: 'facebook-pixel',
                version: 'abc123',
              },
            },
          ],
        },
      },
    });
    const tag = normalized.resources.find((resource) => resource.kind === 'tag');

    expect(tag?.payload).toMatchObject({
      type: 'custom_template',
      triggerSlugs: ['all_pages_builtin'],
      template: { templateId: '7', version: 'abc123' },
      rawParameters: [{ type: 'list', key: 'advancedMatchingList' }],
    });
  });

  it('normalizes GTM integer and boolean variable parameters to manifest value types', () => {
    const manifest = {
      appId: 'shop',
      accountId: '1',
      containerId: '2',
      namespace: 'test',
      environments: { local: { workspacePrefix: 'Default Workspace' } },
      variables: [
        {
          slug: 'event_id',
          name: 'Event ID',
          type: 'data_layer',
          parameters: [
            { key: 'dataLayerName', value: 'event_id' },
            { key: 'dataLayerVersion', value: 2 },
            { key: 'setDefaultValue', value: false },
          ],
        },
      ],
    } as const;
    const normalized = normalizeGoogleTagManagerApiSnapshot({
      manifest,
      desiredResources: getGoogleTagManagerDesiredResources(manifest),
      snapshot: {
        accountId: '1',
        containerId: '2',
        accountPath: 'accounts/1',
        containerPath: 'accounts/1/containers/2',
        workspacePath: 'accounts/1/containers/2/workspaces/3',
        pulledAt: '2026-09-03T00:00:00.000Z',
        resources: {
          folders: [],
          builtInVariables: [],
          triggers: [],
          tags: [],
          variables: [
            {
              variableId: '12',
              name: 'Event ID',
              type: 'v',
              parameter: [
                { type: 'integer', key: 'dataLayerVersion', value: '2' },
                { type: 'boolean', key: 'setDefaultValue', value: 'false' },
                { type: 'template', key: 'name', value: 'event_id' },
              ],
            },
          ],
        },
      },
    });

    expect(normalized.resources.find((resource) => resource.kind === 'variable')?.payload).toEqual(
      getGoogleTagManagerDesiredResources(manifest)[0]?.payload,
    );
  });
});
