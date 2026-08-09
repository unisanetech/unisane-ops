import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runDoctor } from '../dist/handlers/doctor.js';

const descriptor = {
  id: 'core.doctor',
  path: ['doctor'],
  handler: { exportPath: './handlers/doctor', exportName: 'runDoctor' },
  maximumEffect: 'read-network',
  writeTargets: [],
  artifactClasses: [],
  riskGuards: [],
  json: true,
};

function context(manifests = []) {
  return {
    argv: [],
    cwd: '/tmp/plain-ops-project',
    manifests,
    json: true,
    selection: { command: descriptor, packId: 'core' },
  };
}

test('core doctor reports Framework diagnostics as not selected in a generic Ops project', async () => {
  const result = await runDoctor(context());
  assert.equal(result.command, 'core.doctor');
  assert.equal(result.pack, 'core');
  assert.equal(result.status, 'ok');
  assert.deepEqual(result.result.components, [
    {
      id: 'framework',
      owner: '@unisane/devtools',
      status: 'not-selected',
      actualEffect: 'offline',
      report: null,
      diagnostics: [],
    },
  ]);
});

test('core doctor aggregates a selected Framework diagnostic without changing command ownership', async () => {
  const frameworkManifest = { packId: 'framework' };
  const result = await runDoctor(context([frameworkManifest]), [
    async () => ({
      id: 'framework',
      owner: '@unisane/devtools',
      status: 'failed',
      actualEffect: 'read-network',
      report: { status: 'error', exitCode: 1 },
      diagnostics: ['Framework project is not ready.'],
    }),
  ]);
  assert.equal(result.command, 'core.doctor');
  assert.equal(result.pack, 'core');
  assert.equal(result.status, 'failed');
  assert.equal(result.actualEffect, 'read-network');
  assert.deepEqual(result.result.components[0].report, { status: 'error', exitCode: 1 });
});
