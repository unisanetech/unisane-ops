import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const workspaceRoot = resolve(packageRoot, '../../..');
const fixtureRoot = resolve(workspaceRoot, '.tmp');
const cli = resolve(packageRoot, 'dist/cli.js');

function createProject(name, packageDocument = { name }) {
  mkdirSync(fixtureRoot, { recursive: true });
  const root = mkdtempSync(resolve(fixtureRoot, `${name}-`));
  writeFileSync(resolve(root, 'package.json'), `${JSON.stringify(packageDocument, null, 2)}\n`);
  return root;
}

function run(args, cwd) {
  return spawnSync(process.execPath, [cli, ...args], {
    cwd,
    encoding: 'utf8',
    env: {
      ...process.env,
      FORCE_COLOR: '0',
      NO_COLOR: '1',
    },
  });
}

test('plain projects use one init, connect, and aggregate check lifecycle', () => {
  const root = createProject('plain-growth', { name: 'plain-growth' });
  const initialized = run(
    [
      'ops',
      'init',
      '--growth',
      '--mode',
      'audit-only',
      '--environment',
      'development',
      '--yes',
      '--json',
    ],
    root,
  );
  assert.equal(initialized.status, 0, initialized.stderr || initialized.stdout);
  assert.equal(JSON.parse(initialized.stdout).command, 'core.ops-init');
  const source = readFileSync(resolve(root, 'unisane.config.ts'), 'utf8');
  assert.match(source, /defineUnisaneProject/);
  assert.doesNotMatch(source, /accessToken|refreshToken|clientSecret/);

  const beforeConnection = run(['check', '--json'], root);
  assert.equal(beforeConnection.status, 4, beforeConnection.stderr || beforeConnection.stdout);
  assert.equal(
    JSON.parse(beforeConnection.stdout)
      .result.findings.find((finding) => finding.code === 'growth.connection.google.missing')
      .nextAction.command.path.join(' '),
    'connect google',
  );

  const connected = run(
    [
      'connect',
      'google',
      '--environment',
      'development',
      '--secret-reference',
      'google-ci-oauth',
      '--search-console-site',
      'sc-domain:example.test',
      '--analytics-property',
      'properties/123',
      '--yes',
      '--json',
    ],
    root,
  );
  assert.equal(connected.status, 3, connected.stderr || connected.stdout);
  const connection = JSON.parse(connected.stdout);
  assert.equal(connection.result.credentialState, 'missing');
  assert.equal(connection.writeTargets.includes('secret-store'), false);

  const checked = run(['check', '--json'], root);
  assert.equal(checked.status, 4, checked.stderr || checked.stdout);
  const findings = JSON.parse(checked.stdout).result.findings;
  assert.equal(
    findings.some((finding) => finding.code === 'google.connection.missing'),
    true,
  );
  assert.equal(
    findings.some((finding) => finding.code === 'growth.resource.google.analytics.selected'),
    true,
  );

  const disconnected = run(
    [
      'disconnect',
      'google',
      '--environment',
      'development',
      '--connection',
      'google-primary',
      '--yes',
      '--json',
    ],
    root,
  );
  assert.equal(disconnected.status, 0, disconnected.stderr || disconnected.stdout);
  assert.equal(JSON.parse(disconnected.stdout).result.disconnected, true);
  const disconnectedSource = readFileSync(resolve(root, 'unisane.config.ts'), 'utf8');
  assert.doesNotMatch(disconnectedSource, /google-primary/);

  const afterDisconnect = run(['check', '--json'], root);
  assert.equal(afterDisconnect.status, 4, afterDisconnect.stderr || afterDisconnect.stdout);
  assert.equal(
    JSON.parse(afterDisconnect.stdout).result.findings.some(
      (finding) => finding.code === 'growth.connection.google.missing',
    ),
    true,
  );
});

test('Framework projects retain their default config and receive one named Ops block', () => {
  const root = createProject('framework-growth', {
    name: 'framework-growth',
    dependencies: {
      '@unisane/platform': 'workspace:*',
    },
  });
  writeFileSync(resolve(root, 'unisane.config.ts'), 'export default {};\n');
  const initialized = run(['ops', 'init', '--yes', '--json'], root);
  assert.equal(initialized.status, 0, initialized.stderr || initialized.stdout);
  const source = readFileSync(resolve(root, 'unisane.config.ts'), 'utf8');
  assert.match(source, /export default \{\};/);
  assert.match(source, /export const ops = defineUnisaneOps/);

  const added = run(
    ['add', 'growth', '--mode', 'audit-only', '--capability', 'seo', '--yes', '--json'],
    root,
  );
  assert.equal(added.status, 0, added.stderr || added.stdout);
  assert.deepEqual(JSON.parse(added.stdout).result.capabilities, ['seo']);
  assert.equal(
    readFileSync(resolve(root, 'unisane.config.ts'), 'utf8').match(/unisane-ops:framework:start/g)
      .length,
    1,
  );
});

test('non-interactive JSON init proposes intent but never writes without --yes', () => {
  const root = createProject('noninteractive-growth', { name: 'noninteractive-growth' });
  const proposed = run(
    [
      'ops',
      'init',
      '--growth',
      '--mode',
      'adopt-existing',
      '--environment',
      'production',
      '--production',
      '--json',
    ],
    root,
  );
  assert.equal(proposed.status, 3, proposed.stderr || proposed.stdout);
  const result = JSON.parse(proposed.stdout);
  assert.equal(result.status, 'attention');
  assert.equal(result.result.proposedMode, 'adopt-existing');
  assert.equal(result.result.writeRequired, true);
  assert.throws(() => readFileSync(resolve(root, 'unisane.config.ts'), 'utf8'));
});

test('new adoption writes the same canonical Growth intent through init', () => {
  const root = createProject('new-growth', { name: 'new-growth' });
  const initialized = run(['ops', 'init', '--growth', '--mode', 'new', '--yes', '--json'], root);
  assert.equal(initialized.status, 0, initialized.stderr || initialized.stdout);
  const source = readFileSync(resolve(root, 'unisane.config.ts'), 'utf8');
  assert.match(source, /"adoptionMode": "new"/);
  assert.match(source, /"capabilities": \[/);
});

test('bare init is rejected with distinct Ops and Framework guidance', () => {
  const result = run(['init'], packageRoot);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /unisane ops init/);
  assert.match(result.stderr, /create-unisane/);
});

test('the one-shot migrator converts retired intent without copying credentials', () => {
  const root = createProject('migrate-growth', { name: 'migrate-growth' });
  const initialized = run(['ops', 'init', '--yes', '--json'], root);
  assert.equal(initialized.status, 0, initialized.stderr || initialized.stdout);
  writeFileSync(
    resolve(root, 'retired-growth.mjs'),
    `export default {
      version: 1,
      platformId: 'migrate-growth',
      appId: 'migrate-growth',
      defaultEnvironment: 'production',
      environments: { production: { production: true } },
      paths: {
        eventRegistry: 'docs/marketing/events.json',
        conversionRegistry: 'docs/marketing/conversions.json',
        gtmManifest: 'docs/marketing/tag-manager.json'
      },
      providers: {
        ga4: { state: 'configured', accessTokenEnv: 'RETIRED_SECRET' },
        searchConsole: { state: 'configured' }
      }
    };\n`,
  );
  const migrated = run(
    ['ops', 'migrate', 'growth-config', '--input', 'retired-growth.mjs', '--yes', '--json'],
    root,
  );
  assert.equal(migrated.status, 3, migrated.stderr || migrated.stdout);
  const result = JSON.parse(migrated.stdout);
  assert.equal(result.result.growth.adoptionMode, 'migrate');
  assert.deepEqual(result.result.growth.capabilities, ['seo', 'analytics', 'tag-manager']);
  const source = readFileSync(resolve(root, 'unisane.config.ts'), 'utf8');
  assert.match(source, /"adoptionMode": "migrate"/);
  assert.doesNotMatch(source, /RETIRED_SECRET|accessTokenEnv/);
});

test('normal loading rejects retired Growth intent instead of activating a dual loader', () => {
  const root = createProject('retired-growth', { name: 'retired-growth' });
  writeFileSync(
    resolve(root, 'unisane.config.ts'),
    `export default {
      version: 1,
      platformId: 'retired-growth',
      environments: { production: { production: true } },
      providers: { ga4: { state: 'configured' } }
    };\n`,
  );
  const checked = run(['check', '--json'], root);
  assert.equal(checked.status, 1);
  assert.match(checked.stderr, /GROWTH_CONFIG_SCHEMA_RETIRED/);
});
