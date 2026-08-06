import { describe, expect, it, vi } from 'vitest';
import type { PoolClient } from 'pg';
import { configurePostgresHostedReadRuntimeRoles } from './migrations.js';

describe('hosted PostgreSQL runtime role grants', () => {
  it('grants gateway admission and worker execution capabilities separately', async () => {
    const statements: string[] = [];
    const client = {
      query: vi.fn(async (statement: string) => {
        statements.push(statement);
        return statement.startsWith('SELECT rolname')
          ? {
              rowCount: 3,
              rows: [
                { rolname: 'ops_gateway' },
                { rolname: 'ops_worker' },
                { rolname: 'ops_scheduler' },
              ],
            }
          : { rowCount: 0, rows: [] };
      }),
      release: vi.fn(),
    } as unknown as PoolClient;

    await configurePostgresHostedReadRuntimeRoles(
      { connect: async () => client },
      {
        gatewayRole: 'ops_gateway',
        workerRole: 'ops_worker',
        schedulerRole: 'ops_scheduler',
      },
    );

    expect(statements.join('\n')).toContain(
      'GRANT SELECT, INSERT ON ops_hosted_read_job TO "ops_gateway"',
    );
    expect(statements.join('\n')).toContain(
      'GRANT SELECT, UPDATE ON ops_hosted_read_job, ops_hosted_read_dispatch TO "ops_worker"',
    );
    expect(statements.join('\n')).toContain(
      'GRANT SELECT, INSERT, UPDATE ON ops_hosted_read_schedule TO "ops_scheduler"',
    );
    expect(statements.join('\n')).toContain(
      'GRANT SELECT, INSERT, UPDATE ON ops_hosted_credential TO "ops_gateway"',
    );
    expect(statements.join('\n')).toContain(
      'GRANT INSERT ON ops_hosted_credential_version TO "ops_gateway"',
    );
    expect(statements.join('\n')).toContain(
      'GRANT SELECT ON ops_hosted_credential, ops_hosted_credential_version TO "ops_worker"',
    );
    expect(statements.join('\n')).not.toContain(
      'ops_hosted_credential, ops_hosted_credential_version TO "ops_scheduler"',
    );
    expect(statements.at(-1)).toBe('COMMIT');
    expect(client.release).toHaveBeenCalledOnce();
  });

  it('rejects unsafe or shared role names before connecting', async () => {
    const connect = vi.fn();
    await expect(
      configurePostgresHostedReadRuntimeRoles(
        { connect },
        {
          gatewayRole: 'ops-runtime',
          workerRole: 'ops_worker',
          schedulerRole: 'ops_scheduler',
        },
      ),
    ).rejects.toThrow('invalid');
    await expect(
      configurePostgresHostedReadRuntimeRoles(
        { connect },
        {
          gatewayRole: 'ops_runtime',
          workerRole: 'ops_runtime',
          schedulerRole: 'ops_scheduler',
        },
      ),
    ).rejects.toThrow('distinct');
    await expect(
      configurePostgresHostedReadRuntimeRoles(
        { connect },
        {
          gatewayRole: 'ops_gateway',
          workerRole: 'ops_worker',
          schedulerRole: 'ops_worker',
        },
      ),
    ).rejects.toThrow('distinct');
    expect(connect).not.toHaveBeenCalled();
  });
});
