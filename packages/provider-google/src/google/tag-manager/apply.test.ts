import { describe, expect, it, vi } from 'vitest';
import { getGoogleTagManagerDesiredResources } from '@unisane/growth/gtm';
import { applyGoogleTagManagerPlan } from './apply.js';

describe('GTM custom-template apply', () => {
  it('lowers the pinned tag type, recursive parameters, and built-in trigger without loss', async () => {
    const rawParameters = [
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
    ] as const;
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
          rawParameters,
          tagFiringOption: 'oncePerEvent',
          approval: { customTemplate: true },
        },
      ],
    } as const;
    const createTag = vi.fn(async ({ body }: { body: object }) => ({ tagId: '10', ...body }));
    const client = {
      resolveWorkspace: vi.fn(async () => ({
        path: 'accounts/1/containers/2/workspaces/3',
        workspaceId: '3',
        name: 'Default Workspace',
      })),
      syncWorkspace: vi.fn(async () => ({})),
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
      createTag,
      getWorkspaceStatus: vi.fn(async () => ({})),
    };
    const desiredResources = getGoogleTagManagerDesiredResources(manifest);

    const beforeWrite = vi.fn(async () => {});
    await applyGoogleTagManagerPlan({
      client: client as never,
      options: {
        manifest,
        environment: 'local',
        workspaceId: '3',
        desiredResources,
        syncBeforeApply: false,
        beforeWrite,
        plan: () => ({
          containerPath: 'accounts/1/containers/2',
          operations: [{ type: 'create_resource', kind: 'tag', slug: 'meta_page_view' }],
        }),
      },
    });

    expect(client.syncWorkspace).not.toHaveBeenCalled();
    expect(beforeWrite).toHaveBeenCalledTimes(1);
    expect(createTag).toHaveBeenCalledWith({
      workspacePath: 'accounts/1/containers/2/workspaces/3',
      body: {
        name: 'Meta PageView',
        type: 'cvt_2_7',
        parameter: rawParameters,
        firingTriggerId: ['2147479553'],
        tagFiringOption: 'oncePerEvent',
        paused: false,
      },
    });

    createTag.mockResolvedValueOnce({ tagId: '' });
    await expect(
      applyGoogleTagManagerPlan({
        client: client as never,
        options: {
          manifest,
          environment: 'local',
          workspaceId: '3',
          desiredResources,
          syncBeforeApply: false,
          beforeWrite,
          plan: () => ({
            containerPath: 'accounts/1/containers/2',
            operations: [{ type: 'create_resource', kind: 'tag', slug: 'meta_page_view' }],
          }),
        },
      }),
    ).rejects.toThrow('GTM_RESOURCE_ID_MISSING');
  });
});
