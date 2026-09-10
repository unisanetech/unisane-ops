import { describe, expect, it, vi } from 'vitest';
import { guideMetaResourceSelection, selectionResources } from './connection-resource-selection.js';

type Input = Parameters<typeof guideMetaResourceSelection>[0];
function input(): Input {
  return {
    projectId: 'store',
    environmentId: 'production',
    requiredServices: ['ads-insights', 'event-measurement'],
    interactive: true,
    selections: new Map(),
    previous: [],
    prompt: { isAvailable: () => true, choose: vi.fn(async ({ candidates }) => candidates[0]!) },
    discovery: {
      schemaVersion: 1,
      provider: 'meta',
      connectionId: 'meta-store',
      apiVersion: 'v25.0',
      observedAt: '2026-09-06T00:00:00Z',
      identity: { kind: 'system-user', subject: 'user-1', displayName: 'Store user' },
      grants: [],
      resourceLimitReached: false,
      areas: [
        { area: 'ad-accounts', state: 'ready', pageCount: 1, itemCount: 2, truncated: false },
      ],
      resources: [
        {
          resourceType: 'ad-account',
          resourceId: 'act_1',
          displayName: 'First account',
          services: ['ads-insights'],
          state: 'accessible',
        },
        {
          resourceType: 'ad-account',
          resourceId: 'act_2',
          displayName: 'Second account',
          services: ['ads-insights'],
          state: 'accessible',
        },
        {
          resourceType: 'pixel',
          resourceId: 'pixel-1',
          displayName: 'Store Pixel',
          services: ['event-measurement'],
          state: 'accessible',
        },
      ],
    },
  };
}

describe('guided Meta resource selection', () => {
  it('offers exact context, names and IDs and requires a choice even for one candidate', async () => {
    const value = input();
    const result = await guideMetaResourceSelection(value);
    expect(result.get('ad-account')).toBe('act_1');
    expect(result.get('pixel')).toBe('pixel-1');
    expect(value.selections.size).toBe(0);
    expect(value.prompt.choose).toHaveBeenCalledTimes(2);
    expect(value.prompt.choose).toHaveBeenLastCalledWith(
      expect.objectContaining({
        projectId: 'store',
        environmentId: 'production',
        service: 'event-measurement',
        complete: true,
        candidates: [
          expect.objectContaining({ displayName: 'Store Pixel', resourceId: 'pixel-1' }),
        ],
      }),
    );
  });
  it.each(['non-interactive', 'non-tty'] as const)('never prompts when %s', async (mode) => {
    const value = input();
    if (mode === 'non-interactive') value.interactive = false;
    else value.prompt.isAvailable = () => false;
    expect((await guideMetaResourceSelection(value)).size).toBe(0);
    expect(value.prompt.choose).not.toHaveBeenCalled();
  });
  it('retains exact flags and inaccessible previous selections without switching accounts', async () => {
    const value = input();
    value.selections = new Map([['pixel', 'pixel-1']]);
    value.previous = [
      {
        service: 'ads-insights',
        resourceType: 'ad-account',
        resourceId: 'old-account',
        displayName: 'Previous account',
        state: 'selected',
        observedAt: value.discovery.observedAt,
      },
    ];
    const selections = await guideMetaResourceSelection(value);
    expect(value.prompt.choose).not.toHaveBeenCalled();
    expect(selectionResources({ ...value, selections })).toContainEqual(
      expect.objectContaining({ resourceId: 'old-account', state: 'inaccessible' }),
    );
  });
  it('rejects an invalid explicit flag before offering another service', async () => {
    const value = input();
    value.selections = new Map([['ad-account', 'unknown']]);
    await expect(guideMetaResourceSelection(value)).rejects.toThrow('SELECTION_UNKNOWN');
    expect(value.prompt.choose).not.toHaveBeenCalled();
  });
  it.each(['cancel', 'unknown', 'wrong-service'] as const)(
    'rejects %s without mutating the selection map',
    async (mode) => {
      const value = input();
      value.prompt.choose = vi.fn(async () =>
        mode === 'cancel'
          ? null
          : { resourceType: 'pixel', resourceId: mode === 'unknown' ? 'unknown' : 'pixel-1' },
      );
      await expect(guideMetaResourceSelection(value)).rejects.toThrow(
        mode === 'cancel' ? 'SELECTION_CANCELLED' : 'SELECTION_INVALID',
      );
      expect(value.selections.size).toBe(0);
    },
  );
  it('offers only requested services and discloses incomplete discovery', async () => {
    const value = input();
    value.requiredServices = ['ads-insights'];
    value.discovery.resourceLimitReached = true;
    await guideMetaResourceSelection(value);
    expect(value.prompt.choose).toHaveBeenCalledTimes(1);
    expect(value.prompt.choose).toHaveBeenCalledWith(
      expect.objectContaining({ service: 'ads-insights', complete: false }),
    );
  });
  it('leaves empty discovery unresolved rather than inventing resources', async () => {
    const value = input();
    value.discovery.resources = [];
    expect((await guideMetaResourceSelection(value)).size).toBe(0);
    expect(value.prompt.choose).not.toHaveBeenCalled();
  });
  it('requires an exact flag for conflicting previous account selections', async () => {
    const value = input();
    value.previous = ['act_1', 'act_2'].map((resourceId) => ({
      service: 'ads-insights',
      resourceType: 'ad-account',
      resourceId,
      displayName: resourceId,
      state: 'selected',
      observedAt: value.discovery.observedAt,
    }));
    await expect(guideMetaResourceSelection(value)).rejects.toThrow('SELECTION_AMBIGUOUS');
    value.selections = new Map([
      ['ad-account', 'act_2'],
      ['pixel', 'pixel-1'],
    ]);
    expect((await guideMetaResourceSelection(value)).get('ad-account')).toBe('act_2');
  });
});
