import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PackCommandContext } from '@unisane/ops-engine/pack';

const mocks = vi.hoisted(() => ({ auth: vi.fn(), approval: vi.fn(), serve: vi.fn() }));
vi.mock('@unisane/growth/console', () => ({
  runWithGrowthConsoleRuntime: (_runtime: unknown, _cwd: string, run: () => unknown) => run(),
  resolveGrowthConsoleAuthContext: mocks.auth,
  createGrowthConsoleCampaignPauseApprovalController: mocks.approval,
}));
vi.mock('./serve.js', () => ({ serveMarketingConsoleApp: mocks.serve }));
import { runGrowthConsole } from './handler.js';

const context = (argv: string[]) => ({
  cwd: '/tmp/console-environment-test', argv,
  selection: { command: { id: 'growth.console', maximumEffect: 'write' }, packId: 'ops-console' },
  runtime: { resolveBinding: vi.fn() },
}) as unknown as PackCommandContext;

beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockResolvedValue({ environmentId: 'local', googleAuth: {}, metaAuth: {} });
  mocks.approval.mockResolvedValue(null);
  mocks.serve.mockResolvedValue({
    url: 'http://127.0.0.1:4174', outputDirectory: '/tmp/console',
    readiness: { label: 'Needs attention' }, state: { platformId: 'test' }, assetPaths: [],
  });
});

describe('console environment selection', () => {
  it('uses the selected environment for account context, approval and console state', async () => {
    await runGrowthConsole(context(['--environment', 'local']));
    expect(mocks.auth).toHaveBeenCalledWith('local');
    expect(mocks.approval).toHaveBeenCalledWith(expect.objectContaining({ environmentId: 'local' }));
    expect(mocks.serve).toHaveBeenCalledWith(expect.objectContaining({ environmentId: 'local' }));
  });

  it('does not start a server or approval controller when environment selection fails', async () => {
    mocks.auth.mockRejectedValue(new Error('[GROWTH_ENVIRONMENT_REQUIRED] Select an environment.'));
    await expect(runGrowthConsole(context([]))).rejects.toThrow('GROWTH_ENVIRONMENT_REQUIRED');
    expect(mocks.approval).not.toHaveBeenCalled();
    expect(mocks.serve).not.toHaveBeenCalled();
  });
});
