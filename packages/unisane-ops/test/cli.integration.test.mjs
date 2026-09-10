import { createRequire } from 'node:module';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkgRoot = resolve(__dirname, '..');
const cli = resolve(pkgRoot, 'dist/cli.js');
const packageVersion = JSON.parse(readFileSync(resolve(pkgRoot, 'package.json'), 'utf8')).version;
const workspaceNodeModules = resolve(pkgRoot, '../../../node_modules');

test('secondary connections preserve the existing provider default unless explicitly selected', async () => {
  const { selectDefaultConnectionId, selectsConnectedProviderAsDefault } =
    await import('../dist/handlers/connect.js');

  assert.equal(
    selectDefaultConnectionId('google-primary', 'google-gtm-writer', false),
    'google-primary',
  );
  assert.equal(
    selectDefaultConnectionId('google-primary', 'google-gtm-writer', true),
    'google-gtm-writer',
  );
  assert.equal(selectDefaultConnectionId(undefined, 'google-primary', false), 'google-primary');
  assert.equal(
    selectsConnectedProviderAsDefault('google-primary', 'google-gtm-writer', false),
    false,
  );
  assert.equal(
    selectsConnectedProviderAsDefault('google-primary', 'google-gtm-writer', true),
    true,
  );
});

function runCli(args, options = {}) {
  return spawnSync(process.execPath, [cli, ...args], {
    cwd: options.cwd ?? pkgRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      ...options.env,
      NODE_PATH: workspaceNodeModules,
      FORCE_COLOR: '0',
      NO_COLOR: '1',
    },
  });
}

function createPlainCloudFixture(options = {}) {
  const projectRoot = mkdtempSync(resolve(tmpdir(), 'unisane-plain-cloud-'));
  const accountProperty = options.accountId === null ? '' : "accountId: 'account_1',";
  const configPath = resolve(projectRoot, 'unisane.config.ts');
  const inventoryPath = resolve(projectRoot, 'inventory.json');
  writeFileSync(
    configPath,
    `export default {
  schemaVersion: 1,
  project: { id: 'sample-project' },
  environments: { dev: { production: false } },
  ops: {
    connections: {
      edge: {
        provider: 'cloudflare',
        ${accountProperty}
        credential: { source: 'env', name: 'CLOUDFLARE_API_TOKEN' }
      }
    },
    targets: {
      website: {
        provider: 'cloudflare',
        connection: 'edge',
        environments: {
          dev: {
            dns: {
              zones: { site: { name: 'example.test', zoneId: 'zone_1' } },
              records: {
                website: {
                  zone: 'site',
                  type: 'CNAME',
                  name: 'www.example.test',
                  content: 'target.example.test'
                }
              }
            }
          }
        }
      }
    }
  }
};\n`,
  );
  writeFileSync(
    inventoryPath,
    `${JSON.stringify(
      {
        schemaVersion: 1,
        kind: 'cloud.dns-inventory',
        provider: 'cloudflare',
        projectId: 'sample-project',
        targetId: 'website',
        environment: 'dev',
        connectionId: 'edge',
        generatedAt: '2026-07-24T10:00:00.000Z',
        account: {
          configuredAccountId: 'account_1',
          liveAccounts: [{ id: 'account_1', name: 'Example' }],
        },
        zones: [
          {
            key: 'site',
            id: 'zone_1',
            name: 'example.test',
            status: 'active',
            accountId: 'account_1',
            accountName: 'Example',
            configured: true,
          },
        ],
        records: options.records ?? [],
        errors: [],
      },
      null,
      2,
    )}\n`,
  );
  return { projectRoot, configPath, inventoryPath };
}

function createPlainCloudResourceFixture() {
  const projectRoot = mkdtempSync(resolve(tmpdir(), 'unisane-plain-resources-'));
  mkdirSync(resolve(projectRoot, 'workers'), { recursive: true });
  writeFileSync(
    resolve(projectRoot, 'workers/async.js'),
    "export default { async fetch() { return new Response('ok'); } };\n",
  );
  writeFileSync(
    resolve(projectRoot, 'unisane.config.ts'),
    `export default {
  schemaVersion: 1,
  project: { id: 'sample-project' },
  environments: { dev: { production: false } },
  ops: {
    connections: {
      edge: {
        provider: 'cloudflare',
        accountId: 'account_1',
        credential: { source: 'env', name: 'CLOUDFLARE_API_TOKEN' }
      }
    },
    targets: {
      website: {
        provider: 'cloudflare',
        connection: 'edge',
        environments: {
          dev: {
            dns: {
              zones: { site: { name: 'example.test', zoneId: 'zone_1' } },
              records: {}
            },
            queues: {
              jobs: { name: 'sample-jobs', dlq: 'sample-jobs-dlq' }
            },
            workers: {
              async: {
                name: 'sample-async',
                script: { path: 'workers/async.js', mainModule: 'async.js' },
                routes: [{ zone: 'site', pattern: 'async.example.test/*' }],
                queues: { producers: ['jobs'], consumers: ['jobs'] },
                crons: ['*/10 * * * *'],
                vars: { MODE: 'async' },
                secrets: ['ASYNC_SECRET']
              }
            }
          }
        }
      }
    }
  }
};\n`,
  );
  writeFileSync(
    resolve(projectRoot, 'resource-inventory.json'),
    `${JSON.stringify(
      {
        schemaVersion: 1,
        kind: 'cloudflare.worker-inventory',
        provider: 'cloudflare',
        projectId: 'sample-project',
        targetId: 'website',
        environment: 'dev',
        connectionId: 'edge',
        generatedAt: '2026-07-25T10:00:00.000Z',
        account: {
          configuredAccountId: 'account_1',
          liveAccounts: [{ id: 'account_1', name: 'Example' }],
        },
        zones: [
          {
            key: 'site',
            id: 'zone_1',
            name: 'example.test',
            status: 'active',
            accountId: 'account_1',
            accountName: 'Example',
            configured: true,
          },
        ],
        queues: [
          {
            id: 'queue_1',
            name: 'sample-jobs',
            createdOn: null,
            modifiedOn: null,
            producersTotalCount: 1,
            consumersTotalCount: 1,
          },
        ],
        workers: [
          {
            id: 'sample-async',
            name: 'sample-async',
            createdOn: null,
            modifiedOn: null,
          },
        ],
        workerRoutes: [
          {
            id: 'route_1',
            zoneId: 'zone_1',
            zoneName: 'example.test',
            pattern: 'async.example.test/*',
            script: 'sample-async',
          },
        ],
        workerCronTriggers: [],
        errors: [],
      },
      null,
      2,
    )}\n`,
  );
  return { projectRoot };
}

test('retired Framework generate root fails closed', () => {
  const result = runCli(['generate', '--help']);
  assert.equal(result.status, 1, result.stderr || result.stdout);
  assert.match(result.stderr, /Unknown command: generate --help/);
});

test('retired Framework sync root fails closed', () => {
  const result = runCli(['sync', '--help']);
  assert.equal(result.status, 1, result.stderr || result.stdout);
  assert.match(result.stderr, /Unknown command: sync --help/);
});

test('canonical doctor help is owned by CLI core', () => {
  const result = runCli(['doctor', '--help']);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Run aggregate diagnostics selected for this project/);
});

test('canonical doctor does not synthesize another product diagnostic', () => {
  const projectRoot = mkdtempSync(resolve(tmpdir(), 'unisane-doctor-owner-'));
  const result = runCli(['doctor', '--json'], { cwd: projectRoot });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const output = JSON.parse(result.stdout);
  assert.equal(output.command, 'core.doctor');
  assert.equal(output.pack, 'core');
  assert.deepEqual(output.result.components, []);
});

test('retired create root fails closed in favor of create-unisane', () => {
  const result = runCli(['create', '--help']);
  assert.equal(result.status, 1, result.stderr || result.stdout);
  assert.match(result.stderr, /Unknown command: create --help/);
});

test('canonical status returns one structured JSON document', () => {
  const result = runCli(['status', '--json']);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const output = JSON.parse(result.stdout);
  assert.equal(output.command, 'core.status');
  assert.equal(output.maximumEffect, 'offline');
  assert.deepEqual(
    output.result.packs.map((pack) => pack.id),
    [
      'core',
      'cloud',
      'provider.cloudflare',
      'growth',
      ...(hasInstalledConsole() ? ['ops-console'] : []),
      'provider-aws',
      'provider-google',
      'provider-meta',
    ],
  );
});

test('canonical info reports CLI and project package versions in JSON', () => {
  const projectRoot = mkdtempSync(resolve(tmpdir(), 'unisane-info-'));
  writeFileSync(
    resolve(projectRoot, 'package.json'),
    `${JSON.stringify({
      dependencies: {
        '@unisane/platform': '^0.4.0',
        '@unisane/ops': '^0.1.0',
      },
      devDependencies: {
        '@unisane/devtools': '^0.4.0',
      },
    })}\n`,
  );

  const result = runCli(['info', '--json'], { cwd: projectRoot });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const output = JSON.parse(result.stdout);
  assert.equal(output.command, 'core.info');
  assert.equal(output.maximumEffect, 'offline');
  assert.deepEqual(output.result.cli, { name: '@unisane/ops', version: packageVersion });
  assert.deepEqual(output.result.project.packages, [
    { name: '@unisane/devtools', version: '^0.4.0', scope: 'devDependency' },
    { name: '@unisane/ops', version: '^0.1.0', scope: 'dependency' },
    { name: '@unisane/platform', version: '^0.4.0', scope: 'dependency' },
  ]);
});

test('canonical info renders deterministic human output', () => {
  const projectRoot = mkdtempSync(resolve(tmpdir(), 'unisane-info-human-'));
  writeFileSync(
    resolve(projectRoot, 'package.json'),
    `${JSON.stringify({ dependencies: { '@unisane/platform': '^0.4.0' } })}\n`,
  );

  const result = runCli(['info'], { cwd: projectRoot });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(
    result.stdout,
    `Unisane Ops CLI ${packageVersion}\n\nInstalled Unisane packages:\n  @unisane/platform ^0.4.0 (dependency)\n`,
  );
});

test('canonical pack inspection exposes the validated static graph', () => {
  const result = runCli(['inspect', 'packs', '--json']);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const output = JSON.parse(result.stdout);
  assert.equal(output.command, 'core.inspect-packs');
  assert.equal(output.result.packs[1].packageName, '@unisane/cloud');
  assert.equal(output.result.packs[1].capabilities[0], 'cloud.dns');
  assert.equal(output.result.packs[2].packageName, '@unisane/provider-cloudflare');
  assert.equal(output.result.packs[2].commands[0].id, 'provider.cloudflare.connection.check');
  assert.equal(output.result.packs[3].packageName, '@unisane/growth');
  assert.equal(output.result.packs[3].commands[0].id, 'growth.root');
  const packsByName = new Map(output.result.packs.map((pack) => [pack.packageName, pack]));
  assert.equal(packsByName.has('@unisane/ops-console'), hasInstalledConsole());
  if (hasInstalledConsole())
    assert.equal(packsByName.get('@unisane/ops-console').commands[0].id, 'growth.console');
  assert.ok(packsByName.has('@unisane/provider-aws'));
  assert.ok(packsByName.has('@unisane/provider-google'));
  assert.equal(
    output.result.packs.some((pack) => pack.packageName === '@unisane/provider-meta'),
    true,
  );
  assert.equal(
    output.result.packs.some((pack) => pack.packageName === '@unisane/framework-ops'),
    false,
  );
});

test('root help exposes canonical capability and provider routing', () => {
  const result = runCli(['--help']);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Canonical commands:/);
  assert.match(result.stdout, /disconnect google/);
  assert.match(result.stdout, /connect meta/);
  assert.match(result.stdout, /disconnect meta/);
  assert.match(result.stdout, /connect cloudflare check/);
  assert.match(result.stdout, /cloud dns import/);
  assert.match(result.stdout, /provider cloudflare dns/);
  assert.doesNotMatch(result.stdout, /@unisane\/framework-ops/);
  assert.match(result.stdout, /Growth commands are contributed by @unisane\/growth/);
  assert.match(result.stdout, /provider aws/);
  assert.match(result.stdout, /provider google/);
  assert.doesNotMatch(result.stdout, /provider meta/);
});

test('canonical Growth namespace loads the Growth pack handler', () => {
  const result = runCli(['growth', '--help']);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /growth operations/i);
  assert.match(result.stdout, /marketing/);
  assert.match(result.stdout, /seo/);
});

test('canonical commands reject undeclared arguments', () => {
  const result = runCli(['status', '--unknown']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /OPS_CLI_ARGUMENT_UNKNOWN/);
});

test('canonical Cloud DNS plan is offline and does not require the provider credential', () => {
  const projectRoot = mkdtempSync(resolve(tmpdir(), 'unisane-cloud-plan-'));
  writeFileSync(
    resolve(projectRoot, 'unisane.config.ts'),
    `export default {
  schemaVersion: 1,
  project: { id: 'sample-project' },
  environments: { dev: { production: false } },
  ops: {
    connections: {
      edge: {
        provider: 'cloudflare',
        accountId: 'account_1',
        credential: { source: 'env', name: 'CLOUDFLARE_API_TOKEN' }
      }
    },
    targets: {
      website: {
        provider: 'cloudflare',
        connection: 'edge',
        environments: {
          dev: {
            dns: {
              zones: { site: { name: 'example.test', zoneId: 'zone_1' } },
              records: {
                website: {
                  zone: 'site',
                  type: 'CNAME',
                  name: 'www.example.test',
                  content: 'target.example.test'
                }
              }
            }
          }
        }
      }
    }
  }
};\n`,
  );
  writeFileSync(
    resolve(projectRoot, 'inventory.json'),
    `${JSON.stringify(
      {
        schemaVersion: 1,
        kind: 'cloud.dns-inventory',
        provider: 'cloudflare',
        projectId: 'sample-project',
        targetId: 'website',
        environment: 'dev',
        connectionId: 'edge',
        generatedAt: new Date().toISOString(),
        account: {
          configuredAccountId: 'account_1',
          liveAccounts: [{ id: 'account_1', name: 'Example' }],
        },
        zones: [
          {
            key: 'site',
            id: 'zone_1',
            name: 'example.test',
            status: 'active',
            accountId: 'account_1',
            accountName: 'Example',
            configured: true,
          },
        ],
        records: [],
        errors: [],
      },
      null,
      2,
    )}\n`,
  );

  const result = runCli(['cloud', 'dns', 'plan', '--inventory', 'inventory.json', '--json'], {
    cwd: projectRoot,
    env: { CLOUDFLARE_API_TOKEN: '' },
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const output = JSON.parse(result.stdout);
  assert.equal(output.command, 'cloud.dns.plan');
  assert.equal(output.actualEffect, 'offline');
  assert.equal(output.result.summary.create, 1);
  assert.equal(output.artifacts.length, 1);
});

test('canonical Cloud DNS import works in a plain non-Framework project without credentials', () => {
  const fixture = createPlainCloudFixture({
    records: [
      {
        id: 'record_1',
        zoneId: 'zone_1',
        zoneName: 'example.test',
        type: 'A',
        name: 'api.example.test',
        content: '192.0.2.10',
        ttl: 300,
        proxied: false,
        comment: null,
        priority: null,
      },
    ],
  });
  const configBefore = readFileSync(fixture.configPath, 'utf8');
  const result = runCli(
    ['cloud', 'dns', 'import', '--inventory', 'inventory.json', '--zone', 'zone_1', '--json'],
    {
      cwd: fixture.projectRoot,
      env: { CLOUDFLARE_API_TOKEN: '' },
    },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const output = JSON.parse(result.stdout);
  assert.equal(output.command, 'cloud.dns.import');
  assert.equal(output.actualEffect, 'offline');
  assert.deepEqual(output.result.summary, { zones: 1, records: 1 });
  assert.match(output.artifacts[0], /\/imports\/cloud-dns-/);
  assert.equal(readFileSync(fixture.configPath, 'utf8'), configBefore);
});

test('expert Cloudflare DNS alias uses the canonical offline Cloud plan workflow', () => {
  const fixture = createPlainCloudFixture();
  const result = runCli(
    ['provider', 'cloudflare', 'dns', 'plan', '--inventory', 'inventory.json', '--json'],
    {
      cwd: fixture.projectRoot,
      env: { CLOUDFLARE_API_TOKEN: '' },
    },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const output = JSON.parse(result.stdout);
  assert.equal(output.command, 'provider.cloudflare.dns.plan');
  assert.equal(output.pack, 'cloud');
  assert.equal(output.actualEffect, 'offline');
  assert.equal(output.result.summary.create, 1);
});

test('plain non-Framework projects use canonical Queue, Worker, Cron, env, and readiness flows offline', () => {
  const fixture = createPlainCloudResourceFixture();
  const commands = [
    ['cloud', 'queues', 'plan', '--inventory', 'resource-inventory.json', '--json'],
    ['cloud', 'workers', 'plan', '--inventory', 'resource-inventory.json', '--json'],
    ['cloud', 'cron', 'plan', '--inventory', 'resource-inventory.json', '--json'],
    ['cloud', 'env', '--json'],
    ['cloud', 'check', '--json'],
    [
      'provider',
      'cloudflare',
      'queues',
      'plan',
      '--inventory',
      'resource-inventory.json',
      '--json',
    ],
  ];
  const expectedIds = [
    'cloud.queues.plan',
    'cloud.workers.plan',
    'cloud.cron.plan',
    'cloud.env',
    'cloud.check',
    'provider.cloudflare.queues.plan',
  ];

  commands.forEach((command, index) => {
    const result = runCli(command, {
      cwd: fixture.projectRoot,
      env: { CLOUDFLARE_API_TOKEN: '' },
    });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const output = JSON.parse(result.stdout);
    assert.equal(output.command, expectedIds[index]);
    assert.equal(output.actualEffect, 'offline');
  });
});

test('Cloudflare connection check is canonical before account selection and blocks without a token', () => {
  const fixture = createPlainCloudFixture({ accountId: null });
  const result = runCli(['connect', 'cloudflare', 'check', '--connection', 'edge', '--json'], {
    cwd: fixture.projectRoot,
    env: { CLOUDFLARE_API_TOKEN: '' },
  });

  assert.equal(result.status, 4, result.stderr || result.stdout);
  const output = JSON.parse(result.stdout);
  assert.equal(output.command, 'provider.cloudflare.connection.check');
  assert.equal(output.pack, 'provider.cloudflare');
  assert.equal(output.status, 'blocked');
  assert.match(output.diagnostics[0], /CLOUDFLARE_API_TOKEN_MISSING/);
});

function hasInstalledConsole() {
  try {
    createRequire(import.meta.url).resolve('@unisane/ops-console/pack-manifest');
    return true;
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') return false;
    throw error;
  }
}
