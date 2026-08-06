import { describe, expect, it } from 'vitest';
import { readHostedGatewayProcessConfig, readHostedMigrationProcessConfig } from './config.js';

const gatewayEnvironment = {
  OPS_HOSTED_ROLE: 'gateway',
  OPS_HOSTED_OIDC_ISSUER: 'https://identity.example',
  OPS_HOSTED_OIDC_JWKS_URL: 'https://identity.example/.well-known/jwks.json',
} as const;

describe('hosted process configuration', () => {
  it('resolves the PostgreSQL connection from a deployment secret file', () => {
    const config = readHostedGatewayProcessConfig(
      {
        ...gatewayEnvironment,
        OPS_HOSTED_POSTGRES_URL_FILE: '/run/secrets/postgres-url',
      },
      (path) => {
        expect(path).toBe('/run/secrets/postgres-url');
        return 'postgresql://runtime:secret@postgres/ops\n';
      },
    );

    expect(config.OPS_HOSTED_POSTGRES_URL).toBe('postgresql://runtime:secret@postgres/ops');
    expect(config).not.toHaveProperty('OPS_HOSTED_POSTGRES_URL_FILE');
  });

  it('rejects missing or ambiguous PostgreSQL connection sources', () => {
    expect(() => readHostedGatewayProcessConfig(gatewayEnvironment, () => '')).toThrow();
    expect(() =>
      readHostedGatewayProcessConfig(
        {
          ...gatewayEnvironment,
          OPS_HOSTED_POSTGRES_URL: 'postgresql://runtime:secret@postgres/ops',
          OPS_HOSTED_POSTGRES_URL_FILE: '/run/secrets/postgres-url',
        },
        () => 'postgresql://runtime:secret@postgres/ops',
      ),
    ).toThrow();
  });

  it('requires distinct gateway and worker database roles as one grant pair', () => {
    expect(() =>
      readHostedMigrationProcessConfig({
        OPS_HOSTED_POSTGRES_URL: 'postgresql://localhost/ops',
        OPS_HOSTED_GATEWAY_DB_ROLE: 'ops_gateway',
      }),
    ).toThrow();
    expect(() =>
      readHostedMigrationProcessConfig({
        OPS_HOSTED_POSTGRES_URL: 'postgresql://localhost/ops',
        OPS_HOSTED_GATEWAY_DB_ROLE: 'ops_runtime',
        OPS_HOSTED_WORKER_DB_ROLE: 'ops_runtime',
      }),
    ).toThrow();
  });
});
