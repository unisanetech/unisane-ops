import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, test } from 'node:test';
import {
  defineUnisaneOps,
  defineUnisaneProject,
  loadUnisaneOpsConfig,
} from '../dist/config/index.js';

const fixtures = [];

afterEach(() => {
  while (fixtures.length > 0) rmSync(fixtures.pop(), { recursive: true, force: true });
});

function fixture(source, fileName = 'unisane.config.ts') {
  const projectRoot = mkdtempSync(path.join(tmpdir(), 'unisane-ops-config-'));
  fixtures.push(projectRoot);
  writeFileSync(path.join(projectRoot, fileName), source);
  return projectRoot;
}

function opsLiteral(projectId = 'sample-project') {
  return `{
    schemaVersion: 1,
    project: { id: '${projectId}' },
    environments: { development: { production: false } },
    connections: {},
    targets: {},
    capabilities: {}
  }`;
}

function projectLiteral(projectId = 'sample-project') {
  return `{
    schemaVersion: 1,
    project: { id: '${projectId}' },
    environments: { development: { production: false } },
    ops: { connections: {}, targets: {}, capabilities: {} }
  }`;
}

test('config builders materialize the canonical defaults', () => {
  assert.deepEqual(
    defineUnisaneOps({
      project: { id: 'ops-project' },
      environments: { development: {} },
    }),
    {
      schemaVersion: 1,
      project: { id: 'ops-project' },
      environments: { development: { production: false } },
      connections: {},
      targets: {},
      capabilities: {},
    },
  );
  assert.deepEqual(
    defineUnisaneProject({
      project: { id: 'standalone-project' },
      environments: { development: {} },
    }),
    {
      schemaVersion: 1,
      project: { id: 'standalone-project' },
      environments: { development: { production: false } },
      ops: { connections: {}, targets: {}, capabilities: {} },
    },
  );
});

test('loader accepts the standalone default project shape', async () => {
  const projectRoot = fixture(`export default ${projectLiteral('standalone-project')};\n`);
  const loaded = await loadUnisaneOpsConfig(projectRoot);
  assert.equal(loaded.projectRoot, projectRoot);
  assert.equal(loaded.config.project.id, 'standalone-project');
  assert.deepEqual(loaded.config.connections, {});
});

test('loader accepts only the exact named ops export beside a Framework default', async () => {
  const projectRoot = fixture(
    `export default { framework: true };\nexport const ops = ${opsLiteral('framework-project')};\n`,
  );
  const loaded = await loadUnisaneOpsConfig(projectRoot);
  assert.equal(loaded.config.project.id, 'framework-project');
});

test('loader rejects the retired default ops wrapper', async () => {
  const projectRoot = fixture(`export default { ops: ${opsLiteral()} };\n`);
  await assert.rejects(loadUnisaneOpsConfig(projectRoot));
});

test('loader rejects aliases and alternate config filenames', async () => {
  const aliasedRoot = fixture(
    `export default { framework: true };\nexport const operations = ${opsLiteral()};\n`,
  );
  await assert.rejects(loadUnisaneOpsConfig(aliasedRoot));

  const alternateRoot = fixture(
    `export default ${projectLiteral()};\n`,
    'unisane.ops.config.ts',
  );
  await assert.rejects(loadUnisaneOpsConfig(alternateRoot), /UNISANE_OPS_CONFIG_NOT_FOUND/);
});

test('loader rejects a standalone default combined with a named ops export', async () => {
  const projectRoot = fixture(
    `export default ${projectLiteral()};\nexport const ops = ${opsLiteral()};\n`,
  );
  await assert.rejects(loadUnisaneOpsConfig(projectRoot), /UNISANE_OPS_CONFIG_EXPORT_AMBIGUOUS/);
});
